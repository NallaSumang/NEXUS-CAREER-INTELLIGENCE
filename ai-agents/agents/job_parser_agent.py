from fastapi import APIRouter
from models import JobParseRequest
from config import call_llm
import json

router = APIRouter()

@router.post("/parse-job")
async def parse_job(req: JobParseRequest):
    with open("prompts/job_parse.txt", "r") as f:
        template = f.read()
    
    prompt = template.replace("{job_description}", req.description)
    response_text = await call_llm(prompt)
    
    try:
        data = json.loads(response_text)
        data['tokens'] = len(req.description.split())
        return data
    except Exception as e:
        return {"error": str(e), "raw": response_text}
