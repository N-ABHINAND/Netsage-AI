# NetSage AI — Packet Tracer AI Troubleshooting Assistant

> **Guardrail Statement:**  
> *"NetSage AI can diagnose and recommend. It cannot configure a device. Every fix requires a human to read the evidence, agree with the reasoning, and apply the change themselves. Every rejection is logged and feeds back into how the team evaluates the model."*

NetSage AI is a senior network engineer troubleshooting assistant designed specifically for Packet Tracer labs. It combines **deterministic rule parsing** (no LLM, 100% facts) with **Claude AI line-citation diagnosis**, human-in-the-loop approval, and an immutable **Responsible AI Calibration Dashboard**.

---

## Non-Negotiable Design Principles

1. **Deterministic Before Probabilistic**: Python regex rule parser runs first and extracts structured facts (`findings`) from raw `show` output.
2. **Evidence-Backed Citation**: AI must cite the exact line(s) of output that support its diagnosis. Uncited claims force lower confidence.
3. **Human-in-the-Loop Always**: AI only produces JSON recommendations. Reviewer marks Accepted / Edited / Rejected with mandatory reasons.
4. **Auditability Over Cleverness**: Immutable SQLite audit log (`reviews`) records every diagnosis, cited line, verdict, and timestamp.
5. **Confidence Calibration**: Visualizes whether high-confidence answers are actually accepted more often than low-confidence ones.

---

## Tech Stack

- **Backend**: Python 3.11, FastAPI, SQLite (`backend/netsage.db`), SQLAlchemy, Pydantic v2, Pytest
- **Deterministic Engine**: Pure Python (`backend/rule_checker.py`), zero AI dependency
- **AI Layer**: Anthropic Claude API (`backend/ai_diagnose.py`) with strict JSON Pydantic validation & smart fallback engine
- **Frontend**: React, Vite, Tailwind CSS, Lucide React, Recharts
- **Dataset**: `data/cases.csv` (32 hand-crafted Packet Tracer scenarios across 8 categories)

---
