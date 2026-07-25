from fastapi import APIRouter
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
    response_text = await call_llm(prompt)

    try:
        data = json.loads(response_text)
        return data
    except Exception as e:
        return {"error": str(e), "raw": response_text}
