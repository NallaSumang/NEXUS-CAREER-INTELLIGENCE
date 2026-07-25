from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os

router = APIRouter()


# ── Pydantic Schemas for Strict JSON Typing ──────────────────────────────────
class AnalysisRequest(BaseModel):
    text: str
    metadata: dict


class SkillMetrics(BaseModel):
    technical_skills: List[str]
    soft_skills: List[str]
    experience_years: float


class ResumeAnalysisResponse(BaseModel):
    candidate_name: Optional[str] = "Unknown"
    metrics: SkillMetrics
    fit_score: int
    raw_summary: str
    recommended_roles: List[str]
    tokens: Optional[int] = 0


# ── The Route Handler ────────────────────────────────────────────────────────
@router.post("/parse-resume", response_model=ResumeAnalysisResponse)
async def parse_resume(payload: AnalysisRequest):
    try:
        raw_resume_text = payload.text

        system_prompt = """
        You are an elite Campus Placement Technical Recruiter and Career Strategist. 
        Your objective is to analyze raw, unstructured resume text extracted from a PDF and output a highly accurate, structured evaluation of the candidate.

        RULES OF ENGAGEMENT:
        1. NO HALLUCINATIONS: If a piece of information is missing, do not invent it. Use "Unknown" or empty arrays.
        2. STRICT TYPING: Your output must strictly adhere to the provided JSON schema.
        3. SCORING METRIC (fit_score: 0-100): Evaluate based on quantified achievements, skill density, and clarity.
        4. BRUTAL HONESTY (raw_summary): Provide a 2-3 sentence candid, actionable assessment of the candidate's market readiness.
        5. ROLE MATCHING: Suggest 2-3 specific roles they are actually qualified for based on the text.
        """

        provider = os.getenv("AI_PROVIDER", "openai").lower()

        if provider == "openai":
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

            # Use native Structured Outputs (beta.chat.completions.parse)
            response = await client.beta.chat.completions.parse(
                model="gpt-4o-2024-08-06",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": f"Analyze the following resume text:\n\n{raw_resume_text}",
                    },
                ],
                response_format=ResumeAnalysisResponse,
            )

            parsed_data = response.choices[0].message.parsed

            # Approximate token count for DB tracking
            parsed_data.tokens = len(raw_resume_text.split())
            return parsed_data

        elif provider == "gemini":
            # Fallback for Gemini if OpenAI is unavailable
            import google.generativeai as genai
            import json

            genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
            model = genai.GenerativeModel("gemini-1.5-flash")

            prompt = f"{system_prompt}\n\nAnalyze the following resume text and respond ONLY with valid JSON matching this exact schema:\n{ResumeAnalysisResponse.model_json_schema()}\n\n{raw_resume_text}"

            response = await model.generate_content_async(
                prompt, generation_config={"response_mime_type": "application/json"}
            )

            import re

            clean_text = re.sub(
                r"```json\s*", "", response.text, flags=re.MULTILINE | re.IGNORECASE
            )
            clean_text = re.sub(r"```\s*", "", clean_text, flags=re.MULTILINE)

            data_dict = json.loads(clean_text)
            parsed_data = ResumeAnalysisResponse(**data_dict)
            parsed_data.tokens = len(raw_resume_text.split())
            return parsed_data

        elif provider == "groq":
            from openai import AsyncOpenAI
            import json

            client = AsyncOpenAI(
                api_key=os.getenv("GROQ_API_KEY"),
                base_url="https://api.groq.com/openai/v1",
            )

            # Groq does NOT support OpenAI's beta.parse() structured outputs.
            # We must use json_object mode with an explicit schema example.
            schema_prompt = system_prompt + """

You MUST respond with ONLY a valid JSON object. No markdown, no explanation.
The JSON MUST have exactly these keys at the top level:
{
  "candidate_name": "string or Unknown",
  "metrics": {
    "technical_skills": ["skill1", "skill2"],
    "soft_skills": ["skill1", "skill2"],
    "experience_years": 0.0
  },
  "fit_score": 0,
  "raw_summary": "string",
  "recommended_roles": ["role1", "role2"]
}

Every key is REQUIRED. Do NOT omit "metrics" or "recommended_roles".
The "metrics" key MUST be a nested object with "technical_skills", "soft_skills", and "experience_years".
"""

            response = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": schema_prompt},
                    {
                        "role": "user",
                        "content": f"Analyze the following resume text:\n\n{raw_resume_text}",
                    },
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
            )

            content = response.choices[0].message.content
            data_dict = json.loads(content)

            # Defensive: ensure nested metrics exists
            if "metrics" not in data_dict:
                data_dict["metrics"] = {
                    "technical_skills": data_dict.pop("technical_skills", []),
                    "soft_skills": data_dict.pop("soft_skills", []),
                    "experience_years": data_dict.pop("experience_years", 0.0),
                }
            if "recommended_roles" not in data_dict:
                data_dict["recommended_roles"] = data_dict.pop("roles", [])

            parsed_data = ResumeAnalysisResponse(**data_dict)
            parsed_data.tokens = len(raw_resume_text.split())
            return parsed_data

        else:
            raise ValueError(f"Unsupported AI Provider: {provider}")

    except Exception as e:
        print(f"[AI Engine Error] {str(e)}")
        raise HTTPException(status_code=500, detail=f"LLM Engine Fault: {str(e)}")
