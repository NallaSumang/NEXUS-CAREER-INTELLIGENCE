import os
import json
import re
from pathlib import Path
from dotenv import load_dotenv

# Resolve the .env file from the monorepo root (2 levels up from ai-agents/)
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

AI_PROVIDER = os.getenv("AI_PROVIDER", "openai").lower()

# ── Groq Model Fallback Chain ─────────────────────────────────────────────────
# Verified against this account's available models via GET /v1/models.
# Tried in order. If a model is decommissioned/unavailable the engine
# automatically rolls to the next — zero manual intervention needed.
# Override the entire chain by setting GROQ_MODEL env var (comma-separated).
_DEFAULT_GROQ_CHAIN = [
    "groq/compound",        # Primary  — Groq flagship, strong JSON, agentic
    "qwen/qwen3.6-27b",     # Fallback 1 — Qwen, excellent structured output
    "groq/compound-mini",   # Fallback 2 — lighter, faster
    "openai/gpt-oss-20b",   # Fallback 3 — last resort
]

_env_override = os.getenv("GROQ_MODEL", "")
GROQ_MODEL_CHAIN: list[str] = (
    [m.strip() for m in _env_override.split(",") if m.strip()]
    if _env_override
    else _DEFAULT_GROQ_CHAIN
)

# Convenience alias — first model in chain (used for logging)
GROQ_MODEL = GROQ_MODEL_CHAIN[0]


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


def _is_model_unavailable(e: Exception) -> bool:
    """
    Detect Groq model-level errors (decommissioned / not found / too large).
    Uses the structured API error code from the response body — NOT broad
    text matching — so auth errors ("API key does not exist") are never
    misclassified as model errors and get propagated immediately.
    """
    # Primary: check structured error code from response body (openai SDK exposes this)
    body = getattr(e, "body", None) or {}
    if isinstance(body, dict):
        code = body.get("error", {}).get("code", "")
        if code in ("model_not_found", "model_decommissioned", "request_too_large"):
            return True

    # Secondary: tight keyword match — only specific model error phrases
    msg = str(e).lower()
    return "model_decommissioned" in msg or "model_not_found" in msg or "request_too_large" in msg or "413" in msg



async def _call_groq_fallback(prompt: str, json_mode: bool) -> str:
    """
    Groq call with automatic model fallback chain.
    Tries each model in GROQ_MODEL_CHAIN in order.
    Falls through to the next if the current one is unavailable/decommissioned.
    Raises RuntimeError only when the entire chain is exhausted.
    """
    from openai import AsyncOpenAI

    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        raise RuntimeError(
            "GROQ_API_KEY is not set. "
            "Add it to your Render environment variables."
        )

    client = AsyncOpenAI(
        api_key=groq_key,
        base_url="https://api.groq.com/openai/v1",
        timeout=55.0,
    )

    last_error: Exception | None = None

    for model in GROQ_MODEL_CHAIN:
        try:
            print(f"[Groq] Trying model: {model}")
            response = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"} if json_mode else None,
                temperature=0.1,
            )
            print(f"[Groq] ✅ Success with model: {model}")
            return response.choices[0].message.content

        except Exception as e:
            if _is_model_unavailable(e):
                print(f"[Groq] ⚠️  Model {model} unavailable — trying next in chain...")
                last_error = e
                continue  # roll to next model
            raise  # non-model error (auth, rate-limit, network) → propagate immediately

    raise RuntimeError(
        f"All Groq models in the fallback chain are unavailable. "
        f"Last error: {last_error}. "
        f"Chain tried: {GROQ_MODEL_CHAIN}"
    )


async def call_llm(prompt: str, json_mode: bool = True) -> str:
    """
    Unified LLM call. Enforces JSON mode at the API level.
    Strips markdown fences from the response before returning.
    Automatically falls back to Groq if OpenAI quota is exhausted.
    Groq calls use the full model fallback chain.
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
                print("[Fallback] OpenAI quota exceeded — switching to Groq chain")
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
            asyncio.get_running_loop().run_in_executor(
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
