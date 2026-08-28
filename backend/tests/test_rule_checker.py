import os
import sys
import csv
import pytest

# Add backend root to path for test imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from rule_checker import RuleChecker, Finding

def test_interface_admin_down():
    checker = RuleChecker()
    raw = """R1# show ip interface brief
Interface              IP-Address      OK? Method Status                  Protocol
GigabitEthernet0/0/0   192.168.1.1     YES manual up                      up      
GigabitEthernet0/0/1   192.168.2.1     YES manual administratively down   down"""
    
    findings = checker.check_all(raw)
    assert len(findings) >= 1
    admin_down_finding = next((f for f in findings if f.rule_id == "IF-ADMIN-DOWN-001"), None)
    assert admin_down_finding is not None
    assert "GigabitEthernet0/0/1" in admin_down_finding.description
    assert "administratively down" in admin_down_finding.evidence_line

def test_native_vlan_mismatch():
    checker = RuleChecker()
    raw = """Switch-1# show interfaces trunk
Port        Mode         Encapsulation  Status        Native vlan
Gi0/1       on           802.1q         trunking      10

Switch-2# show interfaces trunk
Port        Mode         Encapsulation  Status        Native vlan
Gi0/1       on           802.1q         trunking      99"""

    findings = checker.check_all(raw)
    vlan_finding = next((f for f in findings if f.rule_id == "TRUNK-NATIVE-001"), None)
    assert vlan_finding is not None
    assert "Native VLAN mismatch" in vlan_finding.description

def test_missing_default_route():
    checker = RuleChecker()
    raw = """Branch-R1# show ip route
Codes: C - connected, S - static, R - RIP, M - mobile, B - BGP
Gateway of last resort is not set

     192.168.20.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.20.0/24 is directly connected, GigabitEthernet0/0/1"""

    findings = checker.check_all(raw)
    rt_finding = next((f for f in findings if f.rule_id == "RT-NO-DEFAULT-001"), None)
    assert rt_finding is not None
    assert "Default route" in rt_finding.description

def test_dhcp_exhausted():
    checker = RuleChecker()
    raw = """R1# show ip dhcp pool LAN-POOL
Pool LAN-POOL :
 Utilization mark (High/Low)    : 100 / 0
 Subnet size (Maximum/Current)  : 5 / 5
 Total addresses                : 5
 Leased addresses               : 5"""

    findings = checker.check_all(raw)
    dhcp_finding = next((f for f in findings if f.rule_id == "DHCP-EXHAUSTED-001"), None)
    assert dhcp_finding is not None
    assert "exhausted" in dhcp_finding.description

def test_err_disabled():
    checker = RuleChecker()
    raw = """Switch-1# show ip interface brief
GigabitEthernet0/2     unassigned      YES unset  err-disabled            down"""

    findings = checker.check_all(raw)
    err_finding = next((f for f in findings if f.rule_id == "IF-ERR-DISABLED-002"), None)
    assert err_finding is not None
    assert "err-disabled" in err_finding.description

def test_all_cases_from_csv():
    """Ensure rule checker executes cleanly against all 32 cases in cases.csv."""
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/cases.csv"))
    assert os.path.exists(csv_path)

    checker = RuleChecker()
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        case_count = 0
        for row in reader:
            case_count += 1
            raw_output = row["raw_show_output"].replace("\\n", "\n")
            findings = checker.check_all(raw_output, symptom=row["symptom"], category=row["category"])
            # Each case should be checkable without errors
            assert isinstance(findings, list)

        assert case_count >= 30
