import os
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

# This service is only called by the Node.js backend (server-to-server).
# allow_origins=["*"] + allow_credentials=True is invalid per RFC 6454 and
# rejected by browsers. Since no browser ever hits this directly, credentials
# are unnecessary — set to False to be standards-compliant.
_node_origin = os.getenv("NODE_SERVICE_URL", "http://localhost:5000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[_node_origin, "http://localhost:5000", "http://127.0.0.1:5000"],
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type", "Authorization"],
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
