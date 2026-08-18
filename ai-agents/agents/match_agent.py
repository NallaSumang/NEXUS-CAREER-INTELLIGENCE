from fastapi import APIRouter, HTTPException
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
    prompt += '\n\nReturn JSON { "match_score": int, "missing_skills": [], "cover_letter": "string" }'

    try:
        response_text = await call_llm(prompt)
        return json.loads(response_text)
    except Exception as e:
        print(f"[match_agent] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Match computation failed: {str(e)}")
