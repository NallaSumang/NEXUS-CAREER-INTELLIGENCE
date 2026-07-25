import os
import json
import re
from pathlib import Path
from dotenv import load_dotenv

# Resolve the .env file from the monorepo root (2 levels up from ai-agents/)
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

AI_PROVIDER = os.getenv("AI_PROVIDER", "openai").lower()


def strip_markdown(text: str) -> str:
    """Strip markdown code fences that LLMs sometimes add despite instructions."""
    text = re.sub(r"```json\s*", "", text, flags=re.MULTILINE | re.IGNORECASE)
    text = re.sub(r"```\s*", "", text, flags=re.MULTILINE)
    return text.strip()


async def call_llm(prompt: str, json_mode: bool = True) -> str:
    """
    Unified LLM call. Enforces JSON mode at the API level.
    Strips markdown fences from the response before returning.
    """
    if json_mode:
        prompt += "\n\nRespond ONLY with valid JSON. No markdown fences. No preamble."

    if AI_PROVIDER == "openai":
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"} if json_mode else None,
        )
        result = response.choices[0].message.content

    elif AI_PROVIDER == "groq":
        from openai import AsyncOpenAI

        client = AsyncOpenAI(
            api_key=os.getenv("GROQ_API_KEY"), base_url="https://api.groq.com/openai/v1"
        )
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"} if json_mode else None,
            temperature=0.1,
        )
        result = response.choices[0].message.content

    else:
        # Gemini fallback
        import google.generativeai as genai

        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-1.5-flash")
        generation_config = (
            {"response_mime_type": "application/json"} if json_mode else {}
        )
        response = model.generate_content(prompt, generation_config=generation_config)
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
