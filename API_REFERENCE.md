# NetSage AI — RESTful API Specification

[![GitHub Repo](https://img.shields.io/badge/GitHub-N--ABHINAND%2FNetsage--AI-181717?style=for-the-badge&logo=github)](https://github.com/N-ABHINAND/Netsage-AI)
[![Live Base URL](https://img.shields.io/badge/Live_Base_URL-https%3A%2F%2Fnetsage--ai--eost.onrender.com-brightgreen?style=for-the-badge&logo=render)](https://netsage-ai-eost.onrender.com)

Interactive Swagger UI documentation is available at:
- **Production Swagger UI**: [https://netsage-ai-eost.onrender.com/docs](https://netsage-ai-eost.onrender.com/docs)
- **Local Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Base URLs
- **Local Development**: `http://localhost:8000/api`
- **Production Server**: `https://netsage-ai-eost.onrender.com/api`

---

## 1. System Health Check

### `GET /api/health`
Returns system status, service identity, and current UTC timestamp.

**Response (200 OK)**:
```json
{
  "status": "ok",
  "app": "NetSage AI",
  "timestamp": "2026-08-29T10:33:53.998049+00:00"
}
```

---

## 2. Authentication Endpoints (`/api/auth/*`)

### `POST /api/auth/register`
Registers a new network engineer account and returns JWT access token.

**Request Body**:
```json
{
  "email": "engineer@cisco.lab",
  "username": "cisco_pro",
  "password": "SecurePassword123!",
  "role": "Senior Network Engineer"
}
```

**Response (201 Created)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "USR-A1B2C3D4",
    "username": "cisco_pro",
    "email": "engineer@cisco.lab",
    "role": "Senior Network Engineer",
    "created_at": "2026-08-29T10:00:00+00:00"
  }
}
```

### `POST /api/auth/login`
Authenticates existing user with username/email and password.

**Request Body**:
```json
{
  "username_or_email": "cisco_pro",
  "password": "SecurePassword123!"
}
```

---

## 3. Case Intake Endpoints (`/api/cases/*`)

### `GET /api/cases`
Lists all cases. Supports optional query parameters for filtering: `category` (e.g., `INTERFACE`, `VLAN`, `ROUTING`, `DHCP`, `ACL`, `NAT`, `WIRELESS`, `DNS`) and `osi_layer` (1 to 7).

**Example cURL**:
```bash
curl -X GET "https://netsage-ai-eost.onrender.com/api/cases?category=INTERFACE"
```

### `POST /api/cases`
Creates a custom network intake case.

**Request Body**:
```json
{
  "category": "INTERFACE",
  "osi_layer": 1,
  "symptom": "GigabitEthernet0/0/1 link is down, host cannot reach default gateway",
  "topology_note": "Core Router R1 connected to Switch SW1",
  "raw_show_output": "GigabitEthernet0/0/1 is administratively down, line protocol is down",
  "expected_fault": "Interface is shut down",
  "severity": "HIGH",
  "concept_tag": "interface_status"
}
```

---

## 4. AI Diagnosis Engine (`/api/diagnose/*`)

### `POST /api/diagnose/{case_id}`
Runs deterministic rule checkers followed by AI diagnosis with evidence line citations for a stored case.

**Example cURL**:
```bash
curl -X POST "https://netsage-ai-eost.onrender.com/api/diagnose/CASE-INT-001"
```

**Response (200 OK)**:
```json
{
  "id": "DIAG-7F8A9B0C",
  "case_id": "CASE-INT-001",
  "root_cause": "Interface GigabitEthernet0/0/1 is administratively shut down.",
  "osi_layer": 1,
  "confidence": "high",
  "evidence": [
    "GigabitEthernet0/0/1 is administratively down, line protocol is down"
  ],
  "next_command": "show ip interface brief",
  "fix_steps": [
    "Enter global configuration mode: configure terminal",
    "Select target interface: interface GigabitEthernet0/0/1",
    "Enable interface: no shutdown",
    "Verify link status: show ip interface brief"
  ],
  "disclaimer": "This is a suggestion only. No configuration has been applied.",
  "status": "pending_review",
  "created_at": "2026-08-29T10:15:00+00:00",
  "findings": [
    {
      "rule_id": "IF-ADMIN-DOWN-001",
      "description": "Interface GigabitEthernet0/0/1 is administratively down.",
      "evidence_line": "GigabitEthernet0/0/1 is administratively down, line protocol is down",
      "severity": "HIGH"
    }
  ]
}
```

---

## 5. Human-in-the-Loop Review (`/api/reviews/*`)

### `POST /api/reviews/{diagnosis_id}`
Submits human engineer audit verdict (`accepted`, `edited`, `rejected`) with mandatory reason code if rejected.

**Request Body (Accepted)**:
```json
{
  "verdict": "accepted"
}
```

**Request Body (Rejected with Reason)**:
```json
{
  "verdict": "rejected",
  "reason": "wrong_evidence",
  "reviewer_note": "Cited line did not show exact interface mismatch."
}
```

---

## 6. Calibration Dashboard (`/api/dashboard/stats`)

### `GET /api/dashboard/stats`
Returns aggregated Responsible AI stats, agreement rate, category breakdowns, verdict distributions, and calibration data points for Recharts visualization.

**Example Response**:
```json
{
  "total_cases": 32,
  "total_diagnoses": 18,
  "total_reviews": 14,
  "agreement_rate": 85.71,
  "category_breakdown": [
    {"category": "INTERFACE", "count": 4},
    {"category": "VLAN", "count": 4}
  ],
  "verdict_breakdown": [
    {"verdict": "accepted", "count": 12},
    {"verdict": "edited", "count": 1},
    {"verdict": "rejected", "count": 1}
  ],
  "calibration_data": [
    {"confidence": "high", "accepted": 10, "total": 11, "rate": 90.9},
    {"confidence": "medium", "accepted": 2, "total": 3, "rate": 66.7}
  ],
  "recent_reviews": []
}
```
