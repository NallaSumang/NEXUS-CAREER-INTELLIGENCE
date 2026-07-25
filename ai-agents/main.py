from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from agents import (
    resume_agent,
    job_parser_agent,
    match_agent,
    cover_letter_agent,
    interview_coach_agent,
    analytics_agent,
)

app = FastAPI(title="AI Microservice")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume_agent.router, prefix="/agents", tags=["Resume"])
app.include_router(job_parser_agent.router, prefix="/agents", tags=["Job"])
app.include_router(match_agent.router, prefix="/agents", tags=["Match"])
app.include_router(cover_letter_agent.router, prefix="/agents", tags=["Cover Letter"])
app.include_router(
    interview_coach_agent.router, prefix="/agents", tags=["Interview Coach"]
)
app.include_router(analytics_agent.router, prefix="/agents", tags=["Analytics"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
