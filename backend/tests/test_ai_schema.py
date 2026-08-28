import os
import sys
import pytest
from pydantic import ValidationError

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from schemas import AIDiagnosisSchema

def test_valid_ai_schema():
    valid_data = {
        "root_cause": "GigabitEthernet0/0/1 is administratively down.",
        "osi_layer": 1,
        "confidence": "high",
        "evidence": ["GigabitEthernet0/0/1   192.168.2.1     YES manual administratively down   down"],
        "next_command": "show running-config interface GigabitEthernet0/0/1",
        "fix_steps": [
            "Enter global configuration mode: configure terminal",
            "Select interface: interface GigabitEthernet0/0/1",
            "Enable interface: no shutdown"
        ],
        "disclaimer": "This is a suggestion only. No configuration has been applied."
    }
    schema = AIDiagnosisSchema(**valid_data)
    assert schema.confidence == "high"
    assert schema.osi_layer == 1
    assert len(schema.evidence) == 1

def test_invalid_osi_layer():
    invalid_data = {
        "root_cause": "Test fault",
        "osi_layer": 9,  # invalid OSI layer
        "confidence": "high",
        "evidence": ["line 1"],
        "next_command": "show ip route",
        "fix_steps": ["step 1"]
    }
    with pytest.raises(ValidationError):
        AIDiagnosisSchema(**invalid_data)

def test_invalid_confidence_enum():
    invalid_data = {
        "root_cause": "Test fault",
        "osi_layer": 3,
        "confidence": "super_high",  # invalid enum
        "evidence": ["line 1"],
        "next_command": "show ip route",
        "fix_steps": ["step 1"]
    }
    with pytest.raises(ValidationError):
        AIDiagnosisSchema(**invalid_data)
