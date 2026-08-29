# NetSage AI — Technical Documentation & Engineering Handbook

[![Live Web Application](https://img.shields.io/badge/Live_App-https%3A%2F%2Fnetsage--ai--eost.onrender.com-brightgreen?style=for-the-badge&logo=render)](https://netsage-ai-eost.onrender.com)
[![Build Status](https://img.shields.io/badge/Pytest-15%2F15_Passed-success?style=for-the-badge&logo=pytest)](file:///c:/Users/HP/Desktop/cisco/backend/tests)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](file:///c:/Users/HP/Desktop/cisco/LICENSE)

> **Guardrail Statement:**  
> *"NetSage AI can diagnose and recommend. It cannot configure a device. Every fix requires a human to read the evidence, agree with the reasoning, and apply the change themselves. Every rejection is logged and feeds back into how the team evaluates the model."*

---

## 🌐 Live Production Application
The application is live and deployed on Render cloud infrastructure:
- **Live Web Application**: [https://netsage-ai-eost.onrender.com](https://netsage-ai-eost.onrender.com)
- **Live Health Check API**: [https://netsage-ai-eost.onrender.com/api/health](https://netsage-ai-eost.onrender.com/api/health)

---

## 1. Executive Summary

**NetSage AI** is a senior network engineering troubleshooting assistant designed specifically for Cisco Packet Tracer labs and enterprise network operations. It bridges deterministic network state parsing with generative AI reasoning:

1. **Deterministic Rule Parsing** (100% hard facts, zero hallucination) extracts exact anomalies from raw Cisco `show` outputs.
2. **Claude AI Engine** converts output context into evidence-grounded diagnoses with mandatory line citations.
3. **Human-in-the-Loop Workflow** ensures zero autonomous configuration; senior engineers review, accept, edit, or reject recommendations.
4. **Responsible AI Calibration Dashboard** dynamically tracks model precision across confidence tiers to prevent model overconfidence.

---

## 2. Core Design Principles

| Principle | Description | Implementation |
| :--- | :--- | :--- |
| **1. Deterministic Before Probabilistic** | Python regex rule parsers run *before* LLM execution to extract structured facts. | `backend/rule_checker.py` |
| **2. Evidence-Backed Citation** | Diagnosis must cite exact line(s) from `show` output; uncited claims lower confidence score. | `backend/ai_diagnose.py` |
| **3. Human-in-the-Loop Always** | Recommendations are presented for manual review with mandatory reason codes on rejection. | `frontend/src/pages/DiagnosisReview.jsx` |
| **4. Immutable Audit Log** | All diagnoses, cited evidence, user verdicts, and notes are logged immutably into SQLite. | `backend/models.py` (`ReviewModel`) |
| **5. Confidence Calibration** | Real-time charts correlate model confidence with empirical agreement rates. | `frontend/src/components/CalibrationChart.jsx` |

---

## 3. Tech Stack & Architecture

### Backend Stack
- **Language**: Python 3.11 / 3.12
- **Framework**: FastAPI (Async REST API, OpenAPI 3.0, Swagger UI)
- **Database**: SQLite (`backend/netsage.db`), SQLAlchemy ORM
- **Validation**: Pydantic v2 schemas (`AIDiagnosisSchema`, `CaseResponseSchema`, etc.)
- **AI Engine**: Anthropic Claude API (`claude-3-5-sonnet-20241022`) / OpenAI fallback with smart deterministic engine fallback
- **Auth**: JWT Bearer Authentication (`auth.py`, Passlib bcrypt)

### Frontend Stack
- **Framework**: React 18 (Vite bundler)
- **Styling**: Tailwind CSS, Lucide React icons
- **Data Visualization**: Recharts (Calibration curves, verdict distribution, category breakdown)
- **Deployment**: Render Web Service (`render.yaml`, `build.sh`)

---

## 4. Subsystem Breakdown

### 4.1 Deterministic Rule Engine (`backend/rule_checker.py`)
Parses raw Cisco CLI outputs across 8 domain categories:

- **INTERFACE**: Admin down (`IF-ADMIN-DOWN-001`), err-disabled (`IF-ERR-DISABLED-002`), line protocol down (`IF-PHYSICAL-DOWN-003`), duplicate IP (`IP-DUP-001`).
- **VLAN & TRUNK**: Native VLAN mismatch (`TRUNK-NATIVE-001`), missing VLAN (`VLAN-MISSING-001`), subinterface dot1Q mismatch (`VLAN-ENCAP-MISMATCH-002`), voice VLAN missing (`VLAN-VOICE-MISSING-003`).
- **ROUTING**: Gateway of Last Resort missing (`RT-NO-DEFAULT-001`), passive interface suppressing updates (`RT-PASSIVE-IF-002`), MTU mismatch (`RT-MTU-MISMATCH-003`).
- **DHCP**: Pool exhaustion (`DHCP-EXHAUST-001`), IP helper-address missing (`DHCP-HELPER-MISSING-002`).
- **ACL**: Implicit deny blocking traffic (`ACL-DENY-001`), misconfigured ACL statement (`ACL-MISCONFIG-002`).
- **NAT**: Inside/outside interface missing (`NAT-IF-MISSING-001`), pool exhaustion (`NAT-POOL-EXHAUST-002`).
- **WIRELESS / DNS**: SSID mismatch (`WLAN-SSID-001`), DNS server unreachable (`DNS-UNREACHABLE-001`).

### 4.2 AI Diagnosis & Citation Engine (`backend/ai_diagnose.py`)
- Formats structured prompt with symptom, category, OSI layer, topology notes, rule engine findings, and raw show output.
- Enforces strict Pydantic JSON validation (`AIDiagnosisSchema`).
- Handles automatic schema retries if LLM response misses required fields.
- Uses smart fallback engine when API keys are unconfigured.

### 4.3 Responsible AI Review Logger (`backend/models.py`)
Stores complete audit log:
- `verdict`: `accepted`, `edited`, `rejected`
- `reason`: `wrong_root_cause`, `wrong_evidence`, `low_confidence_justified`, `other`
- `reviewer_note`: Custom feedback from senior engineer
- `edited_root_cause`: Engineer-corrected root cause text

---

## 5. Local Development & Deployment

### Quick Start (Local)

1. **Install Backend Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
2. **Seed Database**:
   ```bash
   python scripts/seed_db.py
   ```
3. **Run Backend API**:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```
4. **Run Frontend App**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Production Deployment (Render)
Render builds and runs NetSage AI automatically via `render.yaml` and `build.sh`:
- **Build Command**: `./build.sh` (installs Python dependencies, builds static React app, seeds SQLite DB)
- **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- **Live URL**: [https://netsage-ai-eost.onrender.com](https://netsage-ai-eost.onrender.com)
