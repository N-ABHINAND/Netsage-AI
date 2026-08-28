import os
import sys
import json
import uuid
import datetime

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from db import init_db, get_db
from models import CaseModel, DiagnosisModel, ReviewModel, UserModel
from schemas import (
    CaseCreateSchema,
    CaseResponseSchema,
    DiagnosisResponseSchema,
    ReviewCreateSchema,
    ReviewResponseSchema,
    FindingSchema,
    DashboardStatsSchema,
    UserRegisterSchema,
    UserLoginSchema,
    UserResponseSchema,
    TokenResponseSchema
)
from rule_checker import RuleChecker
from ai_diagnose import diagnose_case
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="NetSage AI API",
    description="Packet Tracer AI Troubleshooting Assistant with Deterministic Rule Checking, Citation Enforcement, and Responsible AI Audit Logging",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rule_checker = RuleChecker()

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "NetSage AI", "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()}

# --- AUTHENTICATION ROUTES (JWT: EMAIL, USERNAME & PASSWORD) ---

@app.post("/api/auth/register", response_model=TokenResponseSchema, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserRegisterSchema, db: Session = Depends(get_db)):
    email_clean = user_data.email.strip().lower()
    username_clean = user_data.username.strip().lower()

    if not email_clean or not username_clean or not user_data.password:
        raise HTTPException(status_code=400, detail="Email, username, and password are required")

    # Check if email or username exists
    if db.query(UserModel).filter(UserModel.email == email_clean).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    if db.query(UserModel).filter(UserModel.username == username_clean).first():
        raise HTTPException(status_code=400, detail="This username is already taken")

    user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"
    new_user = UserModel(
        id=user_id,
        username=username_clean,
        email=email_clean,
        password_hash=hash_password(user_data.password),
        role=user_data.role or "Senior Network Engineer",
        created_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(data={"sub": new_user.id, "email": new_user.email, "username": new_user.username})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "role": new_user.role,
            "created_at": new_user.created_at.isoformat() if new_user.created_at else ""
        }
    }

@app.post("/api/auth/login", response_model=TokenResponseSchema)
def login_user(login_data: UserLoginSchema, db: Session = Depends(get_db)):
    identifier = login_data.username_or_email.strip().lower()
    if not identifier or not login_data.password:
        raise HTTPException(status_code=400, detail="Username/Email and password are required")

    user = db.query(UserModel).filter(
        (UserModel.email == identifier) | (UserModel.username == identifier)
    ).first()

    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username/email or password")

    token = create_access_token(data={"sub": user.id, "email": user.email, "username": user.username})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at.isoformat() if user.created_at else ""
        }
    }

@app.get("/api/auth/me", response_model=UserResponseSchema)
def get_current_user_profile(current_user: Optional[UserModel] = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return UserResponseSchema(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        created_at=current_user.created_at.isoformat() if current_user.created_at else ""
    )

# --- CASE INTAKE ROUTES ---

@app.get("/api/cases", response_model=List[CaseResponseSchema])
def list_cases(
    category: Optional[str] = None,
    osi_layer: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(CaseModel)
    if category:
        query = query.filter(CaseModel.category == category.upper())
    if osi_layer:
        query = query.filter(CaseModel.osi_layer == osi_layer)
    
    cases = query.order_by(CaseModel.id.asc()).all()
    
    result = []
    for c in cases:
        result.append(CaseResponseSchema(
            id=c.id,
            category=c.category,
            osi_layer=c.osi_layer,
            symptom=c.symptom,
            topology_note=c.topology_note or "",
            raw_show_output=c.raw_show_output,
            expected_fault=c.expected_fault or "",
            severity=c.severity or "MEDIUM",
            concept_tag=c.concept_tag or "",
            created_at=c.created_at.isoformat() if c.created_at else ""
        ))
    return result

@app.get("/api/cases/{case_id}", response_model=CaseResponseSchema)
def get_case(case_id: str, db: Session = Depends(get_db)):
    c = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")
    
    return CaseResponseSchema(
        id=c.id,
        category=c.category,
        osi_layer=c.osi_layer,
        symptom=c.symptom,
        topology_note=c.topology_note or "",
        raw_show_output=c.raw_show_output,
        expected_fault=c.expected_fault or "",
        severity=c.severity or "MEDIUM",
        concept_tag=c.concept_tag or "",
        created_at=c.created_at.isoformat() if c.created_at else ""
    )

@app.post("/api/cases", response_model=CaseResponseSchema, status_code=status.HTTP_201_CREATED)
def create_case(case_data: CaseCreateSchema, db: Session = Depends(get_db)):
    case_id = case_data.id or f"CUSTOM-{uuid.uuid4().hex[:6].upper()}"
    existing = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if existing:
        case_id = f"CUSTOM-{uuid.uuid4().hex[:6].upper()}"

    db_case = CaseModel(
        id=case_id,
        category=case_data.category.upper(),
        osi_layer=case_data.osi_layer,
        symptom=case_data.symptom,
        topology_note=case_data.topology_note,
        raw_show_output=case_data.raw_show_output,
        expected_fault=case_data.expected_fault or "Custom User Submitted Case",
        severity=case_data.severity or "MEDIUM",
        concept_tag=case_data.concept_tag or "custom"
    )
    db.add(db_case)
    db.commit()
    db.refresh(db_case)

    return CaseResponseSchema(
        id=db_case.id,
        category=db_case.category,
        osi_layer=db_case.osi_layer,
        symptom=db_case.symptom,
        topology_note=db_case.topology_note or "",
        raw_show_output=db_case.raw_show_output,
        expected_fault=db_case.expected_fault or "",
        severity=db_case.severity or "MEDIUM",
        concept_tag=db_case.concept_tag or "",
        created_at=db_case.created_at.isoformat() if db_case.created_at else ""
    )

# --- DETERMINISTIC RULE CHECK & DIAGNOSIS ROUTE ---

@app.post("/api/cases/{case_id}/diagnose", response_model=DiagnosisResponseSchema)
def diagnose_case_endpoint(case_id: str, db: Session = Depends(get_db)):
    case_obj = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")

    # Step 1: Run deterministic rule checker
    raw_findings = rule_checker.check_all(
        raw_output=case_obj.raw_show_output,
        symptom=case_obj.symptom,
        category=case_obj.category
    )
    findings = [FindingSchema(**f.to_dict()) for f in raw_findings]

    # Step 2: Run AI diagnosis with line citation grounding & Pydantic validation
    ai_diag, provider_mode = diagnose_case(
        symptom=case_obj.symptom,
        category=case_obj.category,
        osi_layer=case_obj.osi_layer,
        topology_note=case_obj.topology_note or "",
        findings=findings,
        raw_show_output=case_obj.raw_show_output,
        expected_fault=case_obj.expected_fault or ""
    )

    # Step 3: Save Diagnosis in SQLite
    diag_id = f"DIAG-{uuid.uuid4().hex[:8].upper()}"
    db_diag = DiagnosisModel(
        id=diag_id,
        case_id=case_obj.id,
        root_cause=ai_diag.root_cause,
        osi_layer=ai_diag.osi_layer,
        confidence=ai_diag.confidence,
        evidence_json=json.dumps(ai_diag.evidence),
        next_command=ai_diag.next_command,
        fix_steps_json=json.dumps(ai_diag.fix_steps),
        disclaimer=ai_diag.disclaimer,
        status="pending_review"
    )
    db.add(db_diag)
    db.commit()
    db.refresh(db_diag)

    return DiagnosisResponseSchema(
        id=db_diag.id,
        case_id=db_diag.case_id,
        root_cause=db_diag.root_cause,
        osi_layer=db_diag.osi_layer,
        confidence=db_diag.confidence,
        evidence=json.loads(db_diag.evidence_json),
        next_command=db_diag.next_command,
        fix_steps=json.loads(db_diag.fix_steps_json),
        disclaimer=db_diag.disclaimer,
        status=db_diag.status,
        created_at=db_diag.created_at.isoformat() if db_diag.created_at else "",
        findings=findings
    )

# --- HUMAN REVIEW LOOP ROUTE ---

@app.post("/api/cases/{case_id}/review", response_model=ReviewResponseSchema)
def submit_human_review(
    case_id: str,
    review_data: ReviewCreateSchema,
    diagnosis_id: Optional[str] = Query(None),
    current_user: Optional[UserModel] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    case_obj = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")

    # Find target diagnosis or latest pending diagnosis
    if diagnosis_id:
        diag = db.query(DiagnosisModel).filter(DiagnosisModel.id == diagnosis_id).first()
    else:
        diag = db.query(DiagnosisModel).filter(
            DiagnosisModel.case_id == case_id
        ).order_by(DiagnosisModel.created_at.desc()).first()

    if not diag:
        raise HTTPException(status_code=404, detail="Diagnosis not found for this case. Run diagnosis first.")

    # Validate rejection mandatory reason field requirement (Section 7)
    if review_data.verdict == "rejected" and not review_data.reason:
        raise HTTPException(status_code=422, detail="Mandatory reason field required when rejecting a diagnosis.")

    # Update diagnosis status
    diag.status = review_data.verdict
    if review_data.verdict == "edited" and review_data.edited_root_cause:
        diag.root_cause = review_data.edited_root_cause

    # Create immutable Responsible AI Review Log entry
    review_id = f"REV-{uuid.uuid4().hex[:8].upper()}"
    db_review = ReviewModel(
        id=review_id,
        case_id=case_id,
        diagnosis_id=diag.id,
        user_id=current_user.id if current_user else None,
        verdict=review_data.verdict,
        reason=review_data.reason,
        reviewer_note=review_data.reviewer_note,
        edited_root_cause=review_data.edited_root_cause
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)

    return ReviewResponseSchema(
        id=db_review.id,
        case_id=db_review.case_id,
        diagnosis_id=db_review.diagnosis_id,
        verdict=db_review.verdict,
        reason=db_review.reason,
        reviewer_note=db_review.reviewer_note,
        edited_root_cause=db_review.edited_root_cause,
        timestamp=db_review.timestamp.isoformat() if db_review.timestamp else ""
    )

# --- DASHBOARD STATS ROUTE ---

def format_ts(ts):
    if not ts:
        return ""
    if isinstance(ts, str):
        return ts
    try:
        return ts.strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        return str(ts)

@app.get("/api/dashboard/stats", response_model=DashboardStatsSchema)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_cases = db.query(CaseModel).count()
    total_diagnoses = db.query(DiagnosisModel).count()
    total_reviews = db.query(ReviewModel).count()

    accepted_count = db.query(ReviewModel).filter(ReviewModel.verdict == "accepted").count()
    edited_count = db.query(ReviewModel).filter(ReviewModel.verdict == "edited").count()
    rejected_count = db.query(ReviewModel).filter(ReviewModel.verdict == "rejected").count()

    agreement_rate = round((accepted_count / total_reviews * 100), 1) if total_reviews > 0 else 0.0

    # Category breakdown
    categories = ["VLAN", "DHCP", "DNS", "ROUTING", "ACL", "NAT", "WIRELESS", "INTERFACE"]
    category_breakdown = []
    for cat in categories:
        cnt = db.query(CaseModel).filter(CaseModel.category == cat).count()
        category_breakdown.append({"category": cat, "count": cnt})

    verdict_breakdown = [
        {"verdict": "Accepted", "count": accepted_count},
        {"verdict": "Edited", "count": edited_count},
        {"verdict": "Rejected", "count": rejected_count}
    ]

    # Confidence Calibration Data (Section 8 requirement)
    conf_buckets = ["high", "medium", "low"]
    calibration_data = []
    for conf in conf_buckets:
        diag_ids = [d.id for d in db.query(DiagnosisModel).filter(DiagnosisModel.confidence == conf).all()]
        if not diag_ids:
            calibration_data.append({
                "confidence": conf.capitalize(),
                "total_cases": 0,
                "accepted_count": 0,
                "acceptance_rate": 0.0
            })
            continue

        conf_reviews = db.query(ReviewModel).filter(ReviewModel.diagnosis_id.in_(diag_ids)).all()
        c_total = len(conf_reviews)
        c_accepted = sum(1 for r in conf_reviews if r.verdict == "accepted")
        c_rate = round((c_accepted / c_total * 100), 1) if c_total > 0 else 0.0

        calibration_data.append({
            "confidence": conf.capitalize(),
            "total_cases": c_total,
            "accepted_count": c_accepted,
            "acceptance_rate": c_rate
        })

    # Recent Audit Log Entries
    recent_reviews_db = db.query(ReviewModel).order_by(ReviewModel.timestamp.desc()).limit(20).all()
    recent_reviews = []
    for r in recent_reviews_db:
        case_obj = db.query(CaseModel).filter(CaseModel.id == r.case_id).first()
        diag_obj = db.query(DiagnosisModel).filter(DiagnosisModel.id == r.diagnosis_id).first()
        recent_reviews.append({
            "id": r.id,
            "case_id": r.case_id,
            "category": case_obj.category if case_obj else "N/A",
            "symptom": case_obj.symptom if case_obj else "N/A",
            "diagnosis_root_cause": diag_obj.root_cause if diag_obj else "N/A",
            "confidence": diag_obj.confidence if diag_obj else "N/A",
            "verdict": r.verdict,
            "reason": r.reason or "-",
            "reviewer_note": r.reviewer_note or "",
            "timestamp": format_ts(r.timestamp)
        })

    return {
        "total_cases": total_cases,
        "total_diagnoses": total_diagnoses,
        "total_reviews": total_reviews,
        "agreement_rate": agreement_rate,
        "category_breakdown": category_breakdown,
        "verdict_breakdown": verdict_breakdown,
        "calibration_data": calibration_data,
        "recent_reviews": recent_reviews
    }

# --- USER HISTORY ROUTE ---

@app.get("/api/user-history")
def get_user_history(
    email: Optional[str] = None,
    username: Optional[str] = None,
    current_user: Optional[UserModel] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_user_id = None
    target_email = None

    if current_user:
        target_user_id = current_user.id
        target_email = current_user.email
    elif email:
        target_email = email.strip().lower()
        u = db.query(UserModel).filter(UserModel.email == target_email).first()
        if u:
            target_user_id = u.id
    elif username:
        u = db.query(UserModel).filter(UserModel.username == username.strip().lower()).first()
        if u:
            target_user_id = u.id
            target_email = u.email

    query = db.query(ReviewModel).order_by(ReviewModel.timestamp.desc())

    if target_user_id:
        query = query.filter(ReviewModel.user_id == target_user_id)
    elif target_email:
        query = query.filter(ReviewModel.reviewer_note.ilike(f"%{target_email}%"))
    else:
        return []

    reviews = query.all()

    user_history = []
    for r in reviews:
        case_obj = db.query(CaseModel).filter(CaseModel.id == r.case_id).first()
        diag_obj = db.query(DiagnosisModel).filter(DiagnosisModel.id == r.diagnosis_id).first()
        
        user_history.append({
            "review_id": r.id,
            "case_id": r.case_id,
            "category": case_obj.category if case_obj else "N/A",
            "osi_layer": case_obj.osi_layer if case_obj else 0,
            "symptom": case_obj.symptom if case_obj else "N/A",
            "topology_note": case_obj.topology_note if case_obj else "",
            "diagnosis_root_cause": diag_obj.root_cause if diag_obj else "N/A",
            "confidence": diag_obj.confidence if diag_obj else "N/A",
            "next_command": diag_obj.next_command if diag_obj else "",
            "verdict": r.verdict,
            "reason": r.reason or "-",
            "reviewer_note": r.reviewer_note or "",
            "timestamp": format_ts(r.timestamp)
        })

    return user_history

# --- FRONTEND STATIC FILE SERVING FOR PRODUCTION (RENDER DEPLOYMENT) ---
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API route not found")
        target_file = os.path.join(frontend_dist, full_path)
        if full_path and os.path.exists(target_file) and os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
