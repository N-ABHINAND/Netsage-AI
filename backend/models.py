import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from db import Base

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

class CaseModel(Base):
    __tablename__ = "cases"

    id = Column(String, primary_key=True, index=True)
    category = Column(String, index=True)
    osi_layer = Column(Integer)
    symptom = Column(Text)
    topology_note = Column(Text)
    raw_show_output = Column(Text)
    expected_fault = Column(Text)
    severity = Column(String)
    concept_tag = Column(String)
    created_at = Column(DateTime, default=utc_now)

    diagnoses = relationship("DiagnosisModel", back_populates="case", cascade="all, delete-orphan")
    reviews = relationship("ReviewModel", back_populates="case", cascade="all, delete-orphan")

class DiagnosisModel(Base):
    __tablename__ = "diagnoses"

    id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.id"))
    root_cause = Column(Text)
    osi_layer = Column(Integer)
    confidence = Column(String)  # high, medium, low
    evidence_json = Column(Text)  # JSON array of quoted lines
    next_command = Column(Text)
    fix_steps_json = Column(Text)  # JSON array of strings
    disclaimer = Column(Text, default="This is a suggestion only. No configuration has been applied.")
    status = Column(String, default="pending_review")  # pending_review, accepted, edited, rejected, needs_manual_review
    created_at = Column(DateTime, default=utc_now)

    case = relationship("CaseModel", back_populates="diagnoses")
    reviews = relationship("ReviewModel", back_populates="diagnosis", cascade="all, delete-orphan")

class ReviewModel(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.id"))
    diagnosis_id = Column(String, ForeignKey("diagnoses.id"))
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    verdict = Column(String)  # accepted, edited, rejected
    reason = Column(String, nullable=True)  # wrong_root_cause, wrong_evidence, low_confidence_justified, other
    reviewer_note = Column(Text, nullable=True)
    edited_root_cause = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=utc_now)

    case = relationship("CaseModel", back_populates="reviews")
    diagnosis = relationship("DiagnosisModel", back_populates="reviews")
    user = relationship("UserModel", back_populates="reviews")

class UserModel(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="Senior Network Engineer")
    created_at = Column(DateTime, default=utc_now)

    reviews = relationship("ReviewModel", back_populates="user", cascade="all, delete-orphan")
