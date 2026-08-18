from fastapi import APIRouter, HTTPException
from models import JobParseRequest
from config import call_llm
import json
from pathlib import Path

router = APIRouter()


@router.post("/parse-job")
async def parse_job(req: JobParseRequest):
    prompt_path = Path(__file__).parent.parent / "prompts" / "job_parse.txt"
    with open(prompt_path, "r") as f:
        template = f.read()

    prompt = template.replace("{job_description}", req.description)

    try:
        response_text = await call_llm(prompt)
        data = json.loads(response_text)
        data["tokens"] = len(req.description.split())
        return data
    except Exception as e:
        print(f"[job_parser_agent] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Job parsing failed: {str(e)}")
