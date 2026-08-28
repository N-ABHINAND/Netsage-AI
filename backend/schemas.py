from typing import List, Optional, Literal
from pydantic import BaseModel, Field

# 1. Finding model (from rule checker)
class FindingSchema(BaseModel):
    rule_id: str
    description: str
    evidence_line: str
    severity: str

# 2. Strict AI Diagnosis schema (Section 6 requirement)
class AIDiagnosisSchema(BaseModel):
    root_cause: str = Field(..., description="Root cause description backed by evidence")
    osi_layer: int = Field(..., ge=1, le=7, description="OSI Layer between 1 and 7")
    confidence: Literal["high", "medium", "low"] = Field(..., description="Confidence level based on citation strength")
    evidence: List[str] = Field(..., description="Exact line(s) quoted from raw_show_output")
    next_command: str = Field(..., description="What command the engineer should run to verify")
    fix_steps: List[str] = Field(..., description="Ordered list of remediation steps")
    disclaimer: str = Field(
        default="This is a suggestion only. No configuration has been applied.",
        description="Responsible AI warning statement"
    )

# 3. API request & response schemas
class CaseCreateSchema(BaseModel):
    id: Optional[str] = None
    category: str
    osi_layer: int
    symptom: str
    topology_note: Optional[str] = ""
    raw_show_output: str
    expected_fault: Optional[str] = ""
    severity: Optional[str] = "MEDIUM"
    concept_tag: Optional[str] = "custom"

from pydantic import BaseModel, Field, ConfigDict

class CaseResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    category: str
    osi_layer: int
    symptom: str
    topology_note: str
    raw_show_output: str
    expected_fault: str
    severity: str
    concept_tag: str
    created_at: str

class DiagnosisResponseSchema(BaseModel):
    id: str
    case_id: str
    root_cause: str
    osi_layer: int
    confidence: str
    evidence: List[str]
    next_command: str
    fix_steps: List[str]
    disclaimer: str
    status: str
    created_at: str
    findings: List[FindingSchema] = []

class ReviewCreateSchema(BaseModel):
    verdict: Literal["accepted", "edited", "rejected"]
    reason: Optional[Literal["wrong_root_cause", "wrong_evidence", "low_confidence_justified", "other"]] = None
    reviewer_note: Optional[str] = None
    edited_root_cause: Optional[str] = None

class ReviewResponseSchema(BaseModel):
    id: str
    case_id: str
    diagnosis_id: str
    verdict: str
    reason: Optional[str]
    reviewer_note: Optional[str]
    edited_root_cause: Optional[str]
    timestamp: str

class DashboardStatsSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_cases: int
    total_diagnoses: int
    total_reviews: int
    agreement_rate: float
    category_breakdown: List[dict]
    verdict_breakdown: List[dict]
    calibration_data: List[dict]
    recent_reviews: List[dict]

# 4. Auth Schemas (Email, Username & Password JWT Auth)
class UserRegisterSchema(BaseModel):
    email: str
    username: str
    password: str
    role: Optional[str] = "Senior Network Engineer"

class UserLoginSchema(BaseModel):
    username_or_email: str
    password: str

class UserResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    email: str
    role: str
    created_at: str

class TokenResponseSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponseSchema
