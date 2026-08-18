from fastapi import APIRouter, HTTPException
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

    try:
        response_text = await call_llm(prompt)
        return json.loads(response_text)
    except Exception as e:
        print(f"[analytics_agent] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Analytics generation failed: {str(e)}")
