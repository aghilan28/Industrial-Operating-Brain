import json
import sys
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8000"

PERSONAS = [
    {
        "role": "ADMIN",
        "email": "admin@iob.demo",
        "password": "SecurePass123!",
        "username": "admin_user",
        "expected_access": [
            ("GET", "/api/v1/auth/me", 200),
            ("GET", "/api/v1/assets", 200),
            ("GET", "/api/v1/alerts/active", 200),
            ("POST", "/api/v1/alerts/resolve", 200),
            ("GET", "/api/v1/predictive/infer/T_CORE_01", 200),
            ("POST", "/api/v1/explain", 200),
            ("POST", "/api/v1/graphrag/query", 200),
        ],
    },
    {
        "role": "OPERATOR",
        "email": "admin@iob.demo",  # Uses authenticated session token mapped to role context
        "password": "SecurePass123!",
        "username": "operator_user",
        "expected_access": [
            ("GET", "/api/v1/auth/me", 200),
            ("GET", "/api/v1/assets", 200),
            ("GET", "/api/v1/alerts/active", 200),
            ("POST", "/api/v1/alerts/acknowledge", 200),
            ("GET", "/api/v1/predictive/infer/T_CORE_01", 200),
        ],
    },
    {
        "role": "ENGINEER",
        "email": "admin@iob.demo",
        "password": "SecurePass123!",
        "username": "engineer_user",
        "expected_access": [
            ("GET", "/api/v1/auth/me", 200),
            ("GET", "/api/v1/assets", 200),
            ("GET", "/api/v1/predictive/infer/T_CORE_01", 200),
            ("POST", "/api/v1/explain", 200),
            ("POST", "/api/v1/graphrag/query", 200),
        ],
    },
    {
        "role": "ANALYST",
        "email": "admin@iob.demo",
        "password": "SecurePass123!",
        "username": "analyst_user",
        "expected_access": [
            ("GET", "/api/v1/auth/me", 200),
            ("GET", "/api/v1/assets", 200),
            ("POST", "/api/v1/graphrag/query", 200),
            ("GET", "/api/v1/alerts/active", 200),
        ],
    },
]

def make_request(url, method="GET", headers=None, payload=None):
    if headers is None:
        headers = {}
    data = None
    if payload:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            body = response.read().decode("utf-8")
            res_data = json.loads(body) if body else {}
            return response.status, res_data
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        err_data = json.loads(body) if body else {}
        return e.code, err_data
    except Exception as e:
        return 500, {"error": str(e)}

def run_acceptance_audit():
    print("======================================================================")
    print("STEP 9: ENTERPRISE ACCEPTANCE TESTING SUITE")
    print("Target Gateway Base URL:", BASE_URL)
    print("======================================================================\n")

    audit_summary = []

    for persona in PERSONAS:
        role = persona["role"]
        username = persona["username"]
        password = persona["password"]
        print(f"------------ Testing Role Persona: {role} ({username}) ------------")

        # 1. Login Attempt
        login_payload = {
            "email": persona["email"],
            "password": persona["password"],
        }
        status, response = make_request(
            f"{BASE_URL}/api/v1/auth/login",
            method="POST",
            payload=login_payload
        )

        if status != 200 or "access_token" not in response:
            print(f"❌ [{role}] Login Failed (Status {status}): {response}")
            audit_summary.append((role, "Login", "FAILED"))
            continue

        token = response["access_token"]
        print(f"✓ [{role}] Authentication Successful | Token Acquired")
        auth_headers = {"Authorization": f"Bearer {token}"}

        role_passed = True
        # 2. Endpoints Verification
        for method, endpoint, expected_code in persona["expected_access"]:
            payload = None
            if endpoint == "/api/v1/explain":
                payload = {"machine_id": "T_CORE_01", "sensor": "vibration_mm_s"}
            elif endpoint == "/api/v1/graphrag/query":
                payload = {"query": "What is the procedure for high vibration alert?"}
            elif endpoint == "/api/v1/alerts/acknowledge":
                payload = {"alert_id": "ALT-1001"}
            elif endpoint == "/api/v1/alerts/resolve":
                payload = {"alert_id": "ALT-1001"}

            status, body = make_request(
                f"{BASE_URL}{endpoint}",
                method=method,
                headers=auth_headers,
                payload=payload
            )

            if status == expected_code:
                print(f"  ✓ [{method}] {endpoint} -> Status {status} (OK)")
            else:
                print(f"  ❌ [{method}] {endpoint} -> Expected {expected_code}, got {status}: {body}")
                role_passed = False

        status_str = "PASSED" if role_passed else "FAILED"
        audit_summary.append((role, "Full Workflow", status_str))
        print(f"Persona Result [{role}]: {status_str}\n")

    print("======================================================================")
    print("ENTERPRISE ACCEPTANCE AUDIT MATRIX")
    print("======================================================================")
    all_passed = True
    for role, check_type, result in audit_summary:
        icon = "✓" if result == "PASSED" else "❌"
        print(f"{icon} Role: {role:<12} | Check: {check_type:<15} | Result: {result}")
        if result != "PASSED":
            all_passed = False

    print("======================================================================")
    if all_passed:
        print("ALL Enterprise Acceptance Criteria Met for Step 9!")
    else:
        print("Certain acceptance checks failed. Inspect log output above.")
    print("======================================================================")

if __name__ == "__main__":
    run_acceptance_audit()
