# NetSage AI — Packet Tracer AI Troubleshooting Assistant

[![GitHub Repository](https://img.shields.io/badge/GitHub-N--ABHINAND%2FNetsage--AI-181717?style=for-the-badge&logo=github)](https://github.com/N-ABHINAND/Netsage-AI)
[![Live Web Application](https://img.shields.io/badge/Live_App-https%3A%2F%2Fnetsage--ai--eost.onrender.com-brightgreen?style=for-the-badge&logo=render)](https://netsage-ai-eost.onrender.com)
[![Build Status](https://img.shields.io/badge/Pytest-15%2F15_Passed-success?style=for-the-badge&logo=pytest)](file:///c:/Users/HP/Desktop/cisco/backend/tests)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](file:///c:/Users/HP/Desktop/cisco/LICENSE)

> **Guardrail Statement:**  
> *"NetSage AI can diagnose and recommend. It cannot configure a device. Every fix requires a human to read the evidence, agree with the reasoning, and apply the change themselves. Every rejection is logged and feeds back into how the team evaluates the model."*

NetSage AI is a senior network engineer troubleshooting assistant designed specifically for Cisco Packet Tracer labs and enterprise network operations. It combines **deterministic rule parsing** (100% hard facts, zero LLM hallucination) with **Claude AI line-citation diagnosis**, mandatory human-in-the-loop approval, and an immutable **Responsible AI Calibration Dashboard**.

---

## 🌐 Project Links & Resources

- **GitHub Repository**: [https://github.com/N-ABHINAND/Netsage-AI](https://github.com/N-ABHINAND/Netsage-AI)
- **Live Production Application**: [https://netsage-ai-eost.onrender.com](https://netsage-ai-eost.onrender.com)
- **Interactive OpenAPI / Swagger Documentation**: [https://netsage-ai-eost.onrender.com/docs](https://netsage-ai-eost.onrender.com/docs)

---

## 📚 Complete Project Documentation Hub

All detailed technical specifications, architectural diagrams, project plans, workflow metrics, and API references are available in the [`docs/`](file:///c:/Users/HP/Desktop/cisco/docs) directory:

- 📘 **[Engineering Handbook & Tech Specs](file:///c:/Users/HP/Desktop/cisco/docs/DOCUMENTATION.md)** — Complete architecture, component breakdown, design principles, tech stack, and setup guides.
- 🗺️ **[Strategic Project Plan & Roadmap](file:///c:/Users/HP/Desktop/cisco/docs/PROJECT_PLAN.md)** — Core objectives, 5-phase execution timeline, feature Gantt chart, and Q4/2027 roadmap.
- 📈 **[Workflow Progress & System Metrics](file:///c:/Users/HP/Desktop/cisco/docs/WORKFLOW_PROGRESS.md)** — Step-by-step operational workflow, feature status matrix, 15/15 unit test metrics, and 32 seed case breakdown.
- 🏗️ **[System Architecture & Data Flow](file:///c:/Users/HP/Desktop/cisco/docs/ARCHITECTURE.md)** — High-level architecture, sequence diagrams, SQLite ERD schema, and JWT security model.
- 🔌 **[RESTful API Reference](file:///c:/Users/HP/Desktop/cisco/docs/API_REFERENCE.md)** — Comprehensive API reference with paths, JSON schemas, request/response models, and cURL commands.

---

## ⚙️ Core Design Principles

1. **Deterministic Before Probabilistic**: Python regex rule parser runs first and extracts structured facts (`findings`) from raw `show` output.
2. **Evidence-Backed Citation**: AI must cite the exact line(s) of output that support its diagnosis. Uncited claims force lower confidence.
3. **Human-in-the-Loop Always**: AI only produces JSON recommendations. Reviewer marks Accepted / Edited / Rejected with mandatory reason codes.
4. **Auditability Over Cleverness**: Immutable SQLite audit log (`reviews`) records every diagnosis, cited line, verdict, and timestamp.
5. **Confidence Calibration**: Visualizes whether high-confidence answers are actually accepted more often than low-confidence ones.

---

## 🚀 Tech Stack

- **Backend**: Python 3.11 / 3.12, FastAPI, SQLite (`backend/netsage.db`), SQLAlchemy, Pydantic v2, Pytest
- **Deterministic Engine**: Pure Python (`backend/rule_checker.py`), zero AI dependency
- **AI Layer**: Anthropic Claude API (`backend/ai_diagnose.py`) with strict JSON Pydantic validation & smart fallback engine
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Recharts
- **Dataset**: `data/cases.csv` (32 hand-crafted Packet Tracer scenarios across 8 categories)
- **Deployment**: Render Cloud Web Service (`render.yaml`, `build.sh`)

---

## ⚡ Quick Start (Run Locally)

### 1. Seed Database
```bash
python scripts/seed_db.py
```

### 2. Run Backend API
```bash
uvicorn backend.main:app --reload --port 8000
```

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Unit Tests

```bash
python -m pytest backend/tests/
```

All 15 unit tests pass cleanly covering deterministic rule checkers, native VLAN mismatches, interface admin down states, DHCP pool exhaustion, JWT auth flow, and strict Pydantic AI schema validations.
