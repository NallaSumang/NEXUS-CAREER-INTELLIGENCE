from fastapi import APIRouter
from models import MatchRequest
from config import call_llm
import json
from pathlib import Path

router = APIRouter()


@router.post("/compute-match")
async def compute_match(req: MatchRequest):
    prompt_path = Path(__file__).parent.parent / "prompts" / "match_score.txt"
    with open(prompt_path, "r") as f:
        template = f.read()

    prompt = template.replace("{resume_json}", json.dumps(req.resumeJson)).replace(
        "{job_requirements}", json.dumps(req.jobRequirements)
    )

    # Force the format from the new prompt
    prompt += '\n\nReturn JSON { "match_score": int, "missing_skills": [], "cover_letter": "string" }'

    response_text = await call_llm(prompt)

    try:
        data = json.loads(response_text)
        return data
    except Exception as e:
        return {"error": str(e), "raw": response_text}
