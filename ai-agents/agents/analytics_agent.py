from fastapi import APIRouter
from models import AnalyticsRequest
from config import call_llm
import json
from pathlib import Path

router = APIRouter()


@router.post("/generate-insights")
async def generate_insights(req: AnalyticsRequest):
    prompt_path = Path(__file__).parent.parent / "prompts" / "analytics.txt"
    with open(prompt_path, "r") as f:
        template = f.read()

    prompt = template.replace(
        "{application_history}", json.dumps(req.applicationHistory)
    )
    response_text = await call_llm(prompt)

    try:
        data = json.loads(response_text)
        return data
    except Exception as e:
        return {"error": str(e), "raw": response_text}
