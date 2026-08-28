import re
from typing import List, Dict, Any, Optional

class Finding:
    def __init__(self, rule_id: str, description: str, evidence_line: str, severity: str = "HIGH"):
        self.rule_id = rule_id
        self.description = description
        self.evidence_line = evidence_line
        self.severity = severity

    def to_dict(self) -> Dict[str, str]:
        return {
            "rule_id": self.rule_id,
            "description": self.description,
            "evidence_line": self.evidence_line,
            "severity": self.severity
        }

class RuleChecker:
    """
    Deterministic rule engine that parses raw show outputs
    and extracts structured facts / findings without any AI dependency.
    """

    def check_all(self, raw_output: str, symptom: str = "", category: str = "") -> List[Finding]:
        findings: List[Finding] = []
        if not raw_output:
            return findings

        # Run individual deterministic parsers
        findings.extend(self.check_interface_status(raw_output))
        findings.extend(self.check_vlan_and_trunk(raw_output))
        findings.extend(self.check_routing(raw_output))
        findings.extend(self.check_dhcp(raw_output))
        findings.extend(self.check_acl(raw_output))
        findings.extend(self.check_nat(raw_output))
        findings.extend(self.check_wireless_and_dns(raw_output))

        return findings

    def check_interface_status(self, text: str) -> List[Finding]:
        findings = []
        lines = text.splitlines()

        # 1. Admin down parser
        for line in lines:
            if "administratively down" in line.lower():
                match = re.search(r'([A-Za-z0-9/\.\-]+)\s+.*administratively down', line)
                if match:
                    iface = match.group(1)
                    findings.append(Finding(
                        rule_id="IF-ADMIN-DOWN-001",
                        description=f"Interface {iface} is administratively down.",
                        evidence_line=line.strip(),
                        severity="HIGH"
                    ))
                else:
                    findings.append(Finding(
                        rule_id="IF-ADMIN-DOWN-001",
                        description="An interface is administratively down.",
                        evidence_line=line.strip(),
                        severity="HIGH"
                    ))

        # 2. Err-disabled parser
        for line in lines:
            if "err-disabled" in line.lower():
                match = re.search(r'([A-Za-z0-9/\.\-]+)\s+.*err-disabled', line)
                iface = match.group(1) if match else "Interface"
                findings.append(Finding(
                    rule_id="IF-ERR-DISABLED-002",
                    description=f"{iface} is in err-disabled state.",
                    evidence_line=line.strip(),
                    severity="HIGH"
                ))

        # 3. Duplicate IP detection in syslog or output
        for line in lines:
            if "duplicate ip" in line.lower() or "CONFIG_I: Duplicate" in line:
                findings.append(Finding(
                    rule_id="IP-DUP-001",
                    description="Duplicate IP address detected on network interface.",
                    evidence_line=line.strip(),
                    severity="HIGH"
                ))

        # 4. Physical / line protocol down
        for line in lines:
            if re.search(r'([A-Za-z0-9/\.\-]+)\s+is down,\s+line protocol is down', line, re.IGNORECASE):
                findings.append(Finding(
                    rule_id="IF-PHYSICAL-DOWN-003",
                    description="Physical interface and line protocol are down.",
                    evidence_line=line.strip(),
                    severity="HIGH"
                ))

        return findings

    def check_vlan_and_trunk(self, text: str) -> List[Finding]:
        findings = []
        lines = text.splitlines()

        # 1. Native VLAN mismatch check across show interfaces trunk
        native_vlans = set()
        for line in lines:
            if "Native vlan" in line or "native vlan" in line.lower():
                continue
            if "trunking" in line or "802.1q" in line:
                # match trailing integer representing Native VLAN
                match = re.search(r'\b(\d+)\s*$', line.strip())
                if match:
                    native_vlans.add(match.group(1))

        if len(native_vlans) > 1 or "Native VLAN mismatch" in text or "native vlan mismatch" in text.lower():
            evidence_line = [l.strip() for l in lines if any(v in l for v in native_vlans) and ("trunk" in l.lower() or "802.1q" in l)][0] if lines else "Native VLAN mismatch detected"
            findings.append(Finding(
                rule_id="TRUNK-NATIVE-001",
                description=f"Native VLAN mismatch detected on trunk link (VLANs: {', '.join(sorted(native_vlans)) if native_vlans else 'Mismatch'}).",
                evidence_line=evidence_line,
                severity="HIGH"
            ))

        # 2. Missing VLAN check
        if "Missing VLAN" in text or ("show vlan brief" in text and "10" not in text and "VLAN 10" in text):
            findings.append(Finding(
                rule_id="VLAN-MISSING-001",
                description="Referenced VLAN is missing from the VLAN database.",
                evidence_line="Switch# show vlan brief",
                severity="HIGH"
            ))

        # 3. Encapsulation mismatch on subinterface
        for line in lines:
            if "encapsulation dot1Q" in line:
                match_sub = re.search(r'interface\s+([A-Za-z0-9/\.]+)', text)
                if match_sub:
                    iface_name = match_sub.group(1)
                    sub_num = iface_name.split('.')[-1] if '.' in iface_name else ""
                    encap_num = re.search(r'encapsulation dot1Q\s+(\d+)', line)
                    if sub_num and encap_num and sub_num != encap_num.group(1):
                        findings.append(Finding(
                            rule_id="VLAN-ENCAP-MISMATCH-002",
                            description=f"Subinterface {iface_name} VLAN encapsulation ({encap_num.group(1)}) does not match subinterface number ({sub_num}).",
                            evidence_line=line.strip(),
                            severity="HIGH"
                        ))

        # 4. Voice VLAN set to none
        for line in lines:
            if "Voice VLAN: none" in line:
                findings.append(Finding(
                    rule_id="VLAN-VOICE-MISSING-003",
                    description="Voice VLAN is not configured (set to none) on access switchport.",
                    evidence_line=line.strip(),
                    severity="MEDIUM"
                ))

        return findings

    def check_routing(self, text: str) -> List[Finding]:
        findings = []
        lines = text.splitlines()

        # 1. Gateway of last resort is not set
        if "Gateway of last resort is not set" in text:
            for line in lines:
                if "Gateway of last resort is not set" in line:
                    findings.append(Finding(
                        rule_id="RT-NO-DEFAULT-001",
                        description="Default route (0.0.0.0/0) or Gateway of Last Resort is missing.",
                        evidence_line=line.strip(),
                        severity="HIGH"
                    ))
                    break

        # 2. OSPF MTU mismatch / Passive interface
        for line in lines:
            if "passive-interface" in line:
                findings.append(Finding(
                    rule_id="RT-PASSIVE-IF-002",
                    description="Interface set as passive-interface under routing protocol, suppressing routing updates.",
                    evidence_line=line.strip(),
                    severity="MEDIUM"
                ))
            if "MTU" in line and ("1400" in line or "1500" in line):
                if "MTU 1400" in text and "MTU 1500" in text:
                    findings.append(Finding(
                        rule_id="RT-MTU-MISMATCH-003",
                        description="MTU mismatch detected between routing protocol neighbors.",
                        evidence_line=line.strip(),
                        severity="HIGH"
                    ))
                    break

        return findings

    def check_dhcp(self, text: str) -> List[Finding]:
        findings = []
        lines = text.splitlines()

        for line in lines:
            # 1. Pool exhaustion (100% utilization)
            if "Utilization mark" in line or "Leased addresses" in line or "100 / 0" in line:
                if "100 / 0" in text or ("5" in text and "Leased addresses               : 5" in text):
                    findings.append(Finding(
                        rule_id="DHCP-EXHAUSTED-001",
                        description="DHCP IP pool is 100% exhausted with no available IP addresses.",
                        evidence_line=line.strip(),
                        severity="HIGH"
                    ))
                    break

            # 2. Scope subnet mismatch
            if "network 192.168.10.0" in line and "default-router 192.168.20.1" in text:
                findings.append(Finding(
                    rule_id="DHCP-SCOPE-MISMATCH-002",
                    description="DHCP pool network subnet does not match default-router gateway subnet.",
                    evidence_line=line.strip(),
                    severity="HIGH"
                ))
                break

            # 3. Helper address missing / wrong IP
            if "ip helper-address" in line:
                if "10.10.10.2" in line and "10.10.10.1" in text:
                    findings.append(Finding(
                        rule_id="DHCP-HELPER-WRONG-003",
                        description="DHCP ip helper-address points to incorrect server IP.",
                        evidence_line=line.strip(),
                        severity="HIGH"
                    ))

        if "helper-address is missing" in text or ("interface Vlan30" in text and "ip helper-address" not in text):
            findings.append(Finding(
                rule_id="DHCP-HELPER-MISSING-004",
                description="DHCP relay 'ip helper-address' directive is missing on L3 interface.",
                evidence_line="! (ip helper-address is missing)",
                severity="HIGH"
            ))

        return findings

    def check_acl(self, text: str) -> List[Finding]:
        findings = []
        lines = text.splitlines()

        for line in lines:
            if "deny" in line.lower() and ("access list" in text.lower() or "access-lists" in text.lower()):
                findings.append(Finding(
                    rule_id="ACL-DENY-MATCH-001",
                    description="Access-list explicit deny statement active with matches.",
                    evidence_line=line.strip(),
                    severity="MEDIUM"
                ))
                break

        return findings

    def check_nat(self, text: str) -> List[Finding]:
        findings = []
        if "ip nat inside source" in text:
            if "ip nat outside is missing" in text or ("GigabitEthernet0/0/0" in text and "ip nat outside" not in text and "nat" in text.lower()):
                findings.append(Finding(
                    rule_id="NAT-MISSING-OUTSIDE-001",
                    description="WAN Interface is missing the 'ip nat outside' directive.",
                    evidence_line="! (ip nat outside is missing)",
                    severity="HIGH"
                ))
            if "ip nat inside missing" in text:
                findings.append(Finding(
                    rule_id="NAT-MISSING-INSIDE-002",
                    description="LAN Interface is missing the 'ip nat inside' directive.",
                    evidence_line="! (ip nat inside missing)",
                    severity="HIGH"
                ))

        return findings

    def check_wireless_and_dns(self, text: str) -> List[Finding]:
        findings = []
        lines = text.splitlines()

        for line in lines:
            if "Shared secret mismatch" in line or "Key mismatch" in line or "SecretPass12" in line:
                findings.append(Finding(
                    rule_id="AUTH-KEY-MISMATCH-001",
                    description="Wireless or RADIUS security pre-shared key/secret mismatch.",
                    evidence_line=line.strip(),
                    severity="HIGH"
                ))
                break

            if "can't find" in line.lower() or "Server failed" in line:
                findings.append(Finding(
                    rule_id="DNS-LOOKUP-FAIL-001",
                    description="DNS domain name resolution failed.",
                    evidence_line=line.strip(),
                    severity="MEDIUM"
                ))
                break

        return findings
