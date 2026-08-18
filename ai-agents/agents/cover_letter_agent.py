from fastapi import APIRouter, HTTPException
from models import CoverLetterRequest
from config import call_llm
import json
from pathlib import Path

router = APIRouter()


@router.post("/generate-cover-letter")
async def generate_cover_letter(req: CoverLetterRequest):
    prompt_path = Path(__file__).parent.parent / "prompts" / "cover_letter.txt"
    with open(prompt_path, "r") as f:
        template = f.read()

    prompt = (
        template.replace("{job_title}", req.jobTitle)
        .replace("{company}", req.company)
        .replace("{tone}", req.tone)
        .replace("{resume_json}", json.dumps(req.resumeJson))
        .replace("{job_description}", req.jobDescription)
    )

    try:
        response_text = await call_llm(prompt)
        return json.loads(response_text)
    except Exception as e:
        print(f"[cover_letter_agent] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Cover letter generation failed: {str(e)}")
