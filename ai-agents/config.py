import os
import json
import re
from pathlib import Path
from dotenv import load_dotenv

# Resolve the .env file from the monorepo root (2 levels up from ai-agents/)
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

AI_PROVIDER = os.getenv("AI_PROVIDER", "openai").lower()
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")


def strip_markdown(text: str) -> str:
    """Strip markdown code fences that LLMs sometimes add despite instructions."""
    text = re.sub(r"```json\s*", "", text, flags=re.MULTILINE | re.IGNORECASE)
    text = re.sub(r"```\s*", "", text, flags=re.MULTILINE)
    return text.strip()


def _is_quota_error(e: Exception) -> bool:
    """Detect OpenAI 429 insufficient_quota errors."""
    msg = str(e).lower()
    return "insufficient_quota" in msg or (
        "429" in msg and ("quota" in msg or "billing" in msg)
    )


async def _call_groq_fallback(prompt: str, json_mode: bool) -> str:
    """Direct Groq call used as fallback when OpenAI quota is exhausted."""
    from openai import AsyncOpenAI

    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        raise RuntimeError(
            "OpenAI quota exceeded and GROQ_API_KEY is not set. "
            "Add GROQ_API_KEY to your environment variables to enable the Groq fallback."
        )

    print(f"[Fallback] OpenAI quota exceeded — switching to Groq ({GROQ_MODEL})")
    client = AsyncOpenAI(
        api_key=groq_key,
        base_url="https://api.groq.com/openai/v1",
        timeout=55.0,
    )
    response = await client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"} if json_mode else None,
        temperature=0.1,
    )
    return response.choices[0].message.content


async def call_llm(prompt: str, json_mode: bool = True) -> str:
    """
    Unified LLM call. Enforces JSON mode at the API level.
    Strips markdown fences from the response before returning.
    Automatically falls back to Groq if OpenAI quota is exhausted.
    """
    if json_mode:
        prompt += "\n\nRespond ONLY with valid JSON. No markdown fences. No preamble."

    result = None

    if AI_PROVIDER == "openai":
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"), timeout=55.0)
        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"} if json_mode else None,
            )
            result = response.choices[0].message.content
        except Exception as e:
            if _is_quota_error(e):
                result = await _call_groq_fallback(prompt, json_mode)
            else:
                raise

    elif AI_PROVIDER == "groq":
        result = await _call_groq_fallback(prompt, json_mode)

    else:
        # Gemini fallback
        import asyncio
        import google.generativeai as genai

        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-1.5-flash")
        generation_config = (
            {"response_mime_type": "application/json"} if json_mode else {}
        )
        # Gemini SDK is sync — run in thread pool with a 55s timeout
        response = await asyncio.wait_for(
            asyncio.get_event_loop().run_in_executor(
                None,
                lambda: model.generate_content(prompt, generation_config=generation_config),
            ),
            timeout=55.0,
        )
        result = response.text

    # Always strip markdown regardless of provider
    result = strip_markdown(result)

    # Validate it's parseable JSON before returning
    if json_mode:
        try:
            json.loads(result)
        except json.JSONDecodeError as e:
            raise ValueError(
                f"LLM returned invalid JSON: {e}\nRaw output: {result[:500]}"
            )

    return result
