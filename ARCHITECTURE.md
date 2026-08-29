# NetSage AI — System Architecture & Data Flow Specification

[![GitHub Repository](https://img.shields.io/badge/GitHub-N--ABHINAND%2FNetsage--AI-181717?style=for-the-badge&logo=github)](https://github.com/N-ABHINAND/Netsage-AI)
[![Live Web Application](https://img.shields.io/badge/Live_App-https%3A%2F%2Fnetsage--ai--eost.onrender.com-brightgreen?style=for-the-badge&logo=render)](https://netsage-ai-eost.onrender.com)

---

## 1. High-Level Component Architecture

```mermaid
graph TB
    subgraph Client Layer
        Web[React + Vite Single Page Application]
        Mobile[Mobile / Responsive Browser View]
    end

    subgraph API Gateway & Security
        FastAPI[FastAPI Server - Port 8000 / Render]
        CORS[CORS Middleware]
        JWTAuth[JWT Token Verification /auth/me]
    end

    subgraph Core Processing Engines
        RuleEng[Deterministic Rule Checker\nbackend/rule_checker.py]
        AIEng[AI Diagnostic Engine\nbackend/ai_diagnose.py]
        SchemaVal[Pydantic v2 Schema Validator\nAIDiagnosisSchema]
    end

    subgraph External LLM Providers
        Claude[Anthropic Claude 3.5 Sonnet API]
        OpenAI[OpenAI GPT-4o Fallback]
        FallbackEngine[Local Deterministic Fallback Engine]
    end

    subgraph Persistence Layer
        SQLite[(SQLite Database\nbackend/netsage.db)]
        CasesTable[(Cases Table)]
        DiagnosesTable[(Diagnoses Table)]
        ReviewsTable[(Reviews Table)]
        UsersTable[(Users Table)]
    end

    Web -->|HTTPS / REST API| FastAPI
    Mobile -->|HTTPS / REST API| FastAPI
    FastAPI --> CORS
    CORS --> JWTAuth
    JWTAuth --> RuleEng
    RuleEng -->|Parsed Findings| AIEng
    AIEng -->|Prompt + Findings| Claude
    AIEng -->|Fallback Prompt| OpenAI
    AIEng -->|No API Key| FallbackEngine
    Claude --> SchemaVal
    OpenAI --> SchemaVal
    FallbackEngine --> SchemaVal
    SchemaVal -->|Validated JSON| FastAPI
    FastAPI --> SQLite
    SQLite --- CasesTable
    SQLite --- DiagnosesTable
    SQLite --- ReviewsTable
    SQLite --- UsersTable
```

---

## 2. Sequence Diagram: Case Intake to Review

```mermaid
sequenceDiagram
    autonumber
    actor Engineer as Senior Network Engineer
    participant FE as React Frontend
    participant API as FastAPI Backend
    participant RC as Deterministic Rule Checker
    participant AI as Claude AI Engine
    participant DB as SQLite Audit DB

    Engineer->>FE: Input Symptom & Paste Raw 'show' Output
    FE->>API: POST /api/cases (or /api/diagnose)
    API->>RC: check_all(raw_show_output, symptom, category)
    RC-->>API: Return Deterministic Findings (Rule IDs + Evidence Lines)
    API->>AI: diagnose_case(symptom, category, findings, raw_show_output)
    AI-->>API: Return Structured AIDiagnosisJSON
    API->>DB: Save Case & Diagnosis Record
    API-->>FE: Return CaseResponse & DiagnosisResponse
    FE-->>Engineer: Render Diagnosis with Cited Evidence Lines
    Engineer->>FE: Click 'Accept', 'Edit', or 'Reject' (with reason)
    FE->>API: POST /api/reviews/{diagnosis_id}
    API->>DB: Record Immutable Audit Log (Verdict + Timestamp)
    API-->>FE: Return Confirmation & Updated Calibration Stats
```

---

## 3. Database Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS {
        string id PK
        string username UK
        string email UK
        string password_hash
        string role
        datetime created_at
    }

    CASES {
        string id PK
        string category
        int osi_layer
        text symptom
        text topology_note
        text raw_show_output
        text expected_fault
        string severity
        string concept_tag
        datetime created_at
    }

    DIAGNOSES {
        string id PK
        string case_id FK
        text root_cause
        int osi_layer
        string confidence
        text evidence_json
        text next_command
        text fix_steps_json
        text disclaimer
        string status
        datetime created_at
    }

    REVIEWS {
        string id PK
        string case_id FK
        string diagnosis_id FK
        string user_id FK
        string verdict
        string reason
        text reviewer_note
        text edited_root_cause
        datetime timestamp
    }

    USERS ||--o{ REVIEWS : submits
    CASES ||--o{ DIAGNOSES : generates
    CASES ||--o{ REVIEWS : tracks
    DIAGNOSES ||--o{ REVIEWS : evaluated_by
```

---

## 4. Security & Authentication Architecture

- **Password Hashing**: Uses `passlib` with `bcrypt` rounds to ensure credential security.
- **JWT Tokens**: Signed using HMAC-SHA256 secret keys (`JWT_SECRET_KEY`) with 24-hour expiration (`ACCESS_TOKEN_EXPIRE_MINUTES = 1440`).
- **CORS Policies**: Explicit middleware allowing safe HTTP headers and cross-origin requests for deployed frontends.
- **API Guardrails**: Unauthenticated users can submit cases and evaluate diagnoses; authenticated sessions attach engineer user IDs to reviews for audit compliance.
