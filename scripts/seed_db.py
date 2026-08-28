import os
import sys
import csv
import json
import uuid
import datetime
import random

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_dir)

from db import init_db, SessionLocal
from models import CaseModel, DiagnosisModel, ReviewModel, UserModel
from rule_checker import RuleChecker
from ai_diagnose import diagnose_case
from schemas import FindingSchema
from auth import hash_password

def seed_database():
    print("Initializing NetSage AI SQLite Database...")
    init_db()
    db = SessionLocal()

    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "cases.csv"))
    if not os.path.exists(csv_path):
        print(f"Error: dataset CSV not found at {csv_path}")
        return

    # Clear existing data for clean re-seeding
    db.query(ReviewModel).delete()
    db.query(DiagnosisModel).delete()
    db.query(CaseModel).delete()
    db.query(UserModel).delete()
    db.commit()

    # Seed Demo Accounts for JWT Login
    demo_users = [
        UserModel(
            id="USR-DEMO001",
            username="alex_mercer",
            email="alex.mercer@net-labs.com",
            password_hash=hash_password("password123"),
            role="Senior Network Engineer",
            created_at=datetime.datetime.now(datetime.timezone.utc)
        ),
        UserModel(
            id="USR-DEMO002",
            username="sarah_jenkins",
            email="s.jenkins@network.com",
            password_hash=hash_password("password123"),
            role="Lead Security & VLAN Specialist",
            created_at=datetime.datetime.now(datetime.timezone.utc)
        )
    ]
    for u in demo_users:
        db.add(u)
    db.commit()

    rule_checker = RuleChecker()

    print("Importing cases from cases.csv...")
    cases_added = 0
    diagnoses_added = 0
    reviews_added = 0

    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            case_id = row["case_id"]
            raw_show = row["raw_show_output"].replace("\\n", "\n")
            
            db_case = CaseModel(
                id=case_id,
                category=row["category"].upper(),
                osi_layer=int(row["osi_layer"]),
                symptom=row["symptom"],
                topology_note=row["topology_note"],
                raw_show_output=raw_show,
                expected_fault=row["expected_fault"],
                severity=row["severity"],
                concept_tag=row["concept_tag"],
                created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=random.randint(1, 10))
            )
            db.add(db_case)
            cases_added += 1

            # Step 2: Generate Rule findings & Diagnosis
            raw_findings = rule_checker.check_all(
                raw_output=raw_show,
                symptom=row["symptom"],
                category=row["category"]
            )
            findings = [FindingSchema(**f.to_dict()) for f in raw_findings]

            ai_diag, _ = diagnose_case(
                symptom=row["symptom"],
                category=row["category"],
                osi_layer=int(row["osi_layer"]),
                topology_note=row["topology_note"],
                findings=findings,
                raw_show_output=raw_show,
                expected_fault=row["expected_fault"]
            )

            diag_id = f"DIAG-{uuid.uuid4().hex[:8].upper()}"
            db_diag = DiagnosisModel(
                id=diag_id,
                case_id=case_id,
                root_cause=ai_diag.root_cause,
                osi_layer=ai_diag.osi_layer,
                confidence=ai_diag.confidence,
                evidence_json=json.dumps(ai_diag.evidence),
                next_command=ai_diag.next_command,
                fix_steps_json=json.dumps(ai_diag.fix_steps),
                disclaimer=ai_diag.disclaimer,
                status="pending_review",
                created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=random.randint(1, 48))
            )
            db.add(db_diag)
            diagnoses_added += 1

            # Step 3: Seed realistic human reviews for calibration demonstration
            # High confidence: 85% Accepted, 10% Edited, 5% Rejected
            # Medium confidence: 60% Accepted, 25% Edited, 15% Rejected
            # Low confidence: 40% Accepted, 20% Edited, 40% Rejected
            rand_val = random.random()
            if ai_diag.confidence == "high":
                if rand_val < 0.85:
                    verdict, reason, note = "accepted", None, "Verified evidence line; fix confirmed accurate."
                elif rand_val < 0.95:
                    verdict, reason, note = "edited", None, "Clarified remediation step for intermediate engineer."
                else:
                    verdict, reason, note = "rejected", "wrong_root_cause", "Ambiguous trunk setting; needed manual Packet Tracer inspection."
            elif ai_diag.confidence == "medium":
                if rand_val < 0.65:
                    verdict, reason, note = "accepted", None, "Correct root cause identified."
                elif rand_val < 0.85:
                    verdict, reason, note = "edited", None, "Updated command syntax for IOS XE."
                else:
                    verdict, reason, note = "rejected", "wrong_evidence", "Evidence line quoted was incomplete."
            else:  # low confidence
                if rand_val < 0.40:
                    verdict, reason, note = "accepted", None, "High risk case correctly flagged."
                elif rand_val < 0.60:
                    verdict, reason, note = "edited", None, "Adjusted root cause hypothesis."
                else:
                    verdict, reason, note = "rejected", "low_confidence_justified", "Confidence low as expected; manually resolved in PT."

            db_diag.status = verdict
            review_id = f"REV-{uuid.uuid4().hex[:8].upper()}"
            db_review = ReviewModel(
                id=review_id,
                case_id=case_id,
                diagnosis_id=diag_id,
                verdict=verdict,
                reason=reason,
                reviewer_note=note,
                edited_root_cause=ai_diag.root_cause if verdict == "edited" else None,
                timestamp=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=random.randint(10, 500))
            )
            db.add(db_review)
            reviews_added += 1

    db.commit()
    db.close()

    print(f"Seeding completed successfully!")
    print(f"   - Cases created: {cases_added}")
    print(f"   - Diagnoses created: {diagnoses_added}")
    print(f"   - Responsible AI Reviews logged: {reviews_added}")

if __name__ == "__main__":
    seed_database()
