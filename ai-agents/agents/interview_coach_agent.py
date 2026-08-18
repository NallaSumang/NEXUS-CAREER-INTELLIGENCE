from fastapi import APIRouter, HTTPException
from models import InterviewPrepRequest
from config import call_llm
import json
from pathlib import Path

router = APIRouter()


@router.post("/generate-interview-prep")
async def generate_interview_prep(req: InterviewPrepRequest):
    prompt_path = Path(__file__).parent.parent / "prompts" / "interview_coach.txt"
    with open(prompt_path, "r") as f:
        template = f.read()

    prompt = (
        template.replace("{job_title}", req.jobTitle)
        .replace("{company}", req.company)
        .replace("{resume_json}", json.dumps(req.resumeJson))
        .replace("{required_skills}", json.dumps(req.requiredSkills))
    )

    try:
        response_text = await call_llm(prompt)
        return json.loads(response_text)
    except Exception as e:
        print(f"[interview_coach_agent] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Interview prep generation failed: {str(e)}")
