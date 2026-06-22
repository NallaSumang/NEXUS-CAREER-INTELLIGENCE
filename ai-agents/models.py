from pydantic import BaseModel
from typing import Dict, Any, List, Optional

class ResumeParseRequest(BaseModel):
    text: str

class JobParseRequest(BaseModel):
    description: str

class MatchRequest(BaseModel):
    resumeJson: Dict[str, Any]
    jobRequirements: Dict[str, Any]

class CoverLetterRequest(BaseModel):
    resumeJson: Dict[str, Any]
    jobTitle: str
    company: str
    jobDescription: str
    tone: Optional[str] = "professional"

class InterviewPrepRequest(BaseModel):
    resumeJson: Dict[str, Any]
    jobTitle: str
    company: str
    requiredSkills: List[str]

class AnalyticsRequest(BaseModel):
    applicationHistory: List[Dict[str, Any]]
    aiHistory: Optional[List[Dict[str, Any]]] = []
