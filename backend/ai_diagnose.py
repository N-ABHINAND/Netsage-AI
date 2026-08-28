import os
import json
import re
from typing import List, Dict, Any, Tuple
from schemas import AIDiagnosisSchema, FindingSchema

try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False

try:
    import openai
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False


PROMPT_PATH = os.path.join(os.path.dirname(__file__), "prompts", "diagnose_prompt.md")

def load_prompt_template() -> str:
    if os.path.exists(PROMPT_PATH):
        with open(PROMPT_PATH, "r", encoding="utf-8") as f:
            return f.read()
    return ""

def generate_fallback_diagnosis(
    symptom: str,
    category: str,
    osi_layer: int,
    topology_note: str,
    findings: List[FindingSchema],
    raw_show_output: str,
    expected_fault: str = ""
) -> AIDiagnosisSchema:
    """
    Fallback deterministic AI diagnosis generator when API key is not present or API call fails.
    Produces evidence-grounded JSON matching the exact schema.
    """
    lines = [l.strip() for l in raw_show_output.splitlines() if l.strip()]
    cited_lines = []
    
    # 1. Gather evidence lines from findings first
    for f in findings:
        if f.evidence_line and f.evidence_line in raw_show_output:
            cited_lines.append(f.evidence_line)
    
    # 2. If no findings cited, find relevant lines from raw output
    if not cited_lines and lines:
        for line in lines:
            if any(k in line.lower() for k in ["down", "err-disabled", "mismatch", "deny", "missing", "failed", "no", "not"]):
                cited_lines.append(line)
                if len(cited_lines) >= 2:
                    break
    if not cited_lines and lines:
        cited_lines = [lines[0]]

    # 3. Determine root cause description
    if expected_fault:
        root_cause = expected_fault
    elif findings:
        root_cause = findings[0].description
    else:
        root_cause = f"Diagnostic analysis of {category} issue indicates configuration mismatch or interface degradation."

    # 4. Determine confidence level based on citation strength
    confidence = "high" if findings and len(cited_lines) > 0 else "medium"

    # 5. Fix steps generation based on category & findings
    fix_steps = []
    next_command = "show running-config"

    if category == "INTERFACE" or "administratively down" in root_cause.lower():
        next_command = "show ip interface brief"
        fix_steps = [
            "Enter global configuration mode: configure terminal",
            "Select target interface (e.g., interface GigabitEthernet0/0/1)",
            "Enable interface: no shutdown",
            "Verify link status: show ip interface brief"
        ]
    elif category == "VLAN" or "vlan" in root_cause.lower():
        next_command = "show vlan brief"
        fix_steps = [
            "Enter global configuration mode: configure terminal",
            "Create missing VLAN: vlan 10",
            "Assign interface to VLAN: switchport access vlan 10",
            "Verify trunk native VLAN alignment on both link ends"
        ]
    elif category == "ROUTING" or "route" in root_cause.lower():
        next_command = "show ip route"
        fix_steps = [
            "Enter global configuration mode: configure terminal",
            "Add missing route: ip route 0.0.0.0 0.0.0.0 <next-hop-ip>",
            "Verify routing table update: show ip route"
        ]
    elif category == "DHCP" or "dhcp" in root_cause.lower():
        next_command = "show ip dhcp pool"
        fix_steps = [
            "Check DHCP pool utilization and scope settings: show ip dhcp pool",
            "Clear stale bindings: clear ip dhcp binding *",
            "Verify ip helper-address setting on Layer 3 gateway interface"
        ]
    elif category == "ACL" or "access" in root_cause.lower():
        next_command = "show ip access-lists"
        fix_steps = [
            "Review access list rules: show ip access-lists",
            "Modify deny statement or insert permit rule above blocking rule",
            "Re-apply access-group to target interface"
        ]
    else:
        next_command = "show running-config"
        fix_steps = [
            "Review interface status and VLAN assignments",
            "Verify IP address subnets and default gateways",
            "Re-test end-to-end ICMP ping reachability"
        ]

    return AIDiagnosisSchema(
        root_cause=root_cause,
        osi_layer=osi_layer,
        confidence=confidence,
        evidence=cited_lines,
        next_command=next_command,
        fix_steps=fix_steps,
        disclaimer="This is a suggestion only. No configuration has been applied."
    )

def extract_json_str(text: str) -> str:
    """Extract raw JSON string from LLM output text."""
    text = text.strip()
    # Strip markdown code fence if present
    if text.startswith("```"):
        text = re.sub(r'^```(?:json)?\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
    return text.strip()

def diagnose_case(
    symptom: str,
    category: str,
    osi_layer: int,
    topology_note: str,
    findings: List[FindingSchema],
    raw_show_output: str,
    expected_fault: str = ""
) -> Tuple[AIDiagnosisSchema, str]:
    """
    Main AI diagnosis function.
    Attempts Claude API (or OpenAI API if present), validates strict Pydantic JSON schema,
    retries once on validation failure, and falls back to smart deterministic engine if no API key is available.
    """
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")

    # If no API key configured, return fallback diagnosis
    if not (anthropic_key or openai_key):
        diag = generate_fallback_diagnosis(
            symptom, category, osi_layer, topology_note, findings, raw_show_output, expected_fault
        )
        return diag, "fallback_rule_engine"

    template = load_prompt_template()
    findings_json = json.dumps([f.model_dump() for f in findings], indent=2)

    prompt = template.format(
        symptom=symptom,
        category=category,
        osi_layer=osi_layer,
        topology_note=topology_note or "N/A",
        findings_json=findings_json,
        raw_show_output=raw_show_output
    )

    attempts = 0
    max_attempts = 2
    last_error = ""

    while attempts < max_attempts:
        attempts += 1
        try:
            response_text = ""
            if anthropic_key and HAS_ANTHROPIC:
                client = anthropic.Anthropic(api_key=anthropic_key)
                current_prompt = prompt if attempts == 1 else f"{prompt}\n\n[PREVIOUS ATTEMPT FAILED SCHEMA VALIDATION]: {last_error}\nPlease fix the JSON output to strictly match the requested schema."
                message = client.messages.create(
                    model=os.environ.get("CLAUDE_MODEL", "claude-3-5-sonnet-20241022"),
                    max_tokens=1000,
                    temperature=0.2,
                    messages=[{"role": "user", "content": current_prompt}]
                )
                response_text = message.content[0].text
            elif openai_key and HAS_OPENAI:
                client = openai.OpenAI(api_key=openai_key)
                current_prompt = prompt if attempts == 1 else f"{prompt}\n\n[PREVIOUS ATTEMPT FAILED SCHEMA VALIDATION]: {last_error}\nPlease fix the JSON output to strictly match the requested schema."
                res = client.chat.completions.create(
                    model="gpt-4o-mini",
                    temperature=0.2,
                    messages=[{"role": "user", "content": current_prompt}]
                )
                response_text = res.choices[0].message.content

            json_str = extract_json_str(response_text)
            parsed_data = json.loads(json_str)
            validated_diag = AIDiagnosisSchema(**parsed_data)
            return validated_diag, "llm_api"

        except Exception as e:
            last_error = str(e)

    # If 2 attempts failed or API call errored out, use smart fallback generator
    diag = generate_fallback_diagnosis(
        symptom, category, osi_layer, topology_note, findings, raw_show_output, expected_fault
    )
    return diag, "fallback_after_retry_failure"
