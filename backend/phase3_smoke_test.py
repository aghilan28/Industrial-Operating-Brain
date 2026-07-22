from fastapi.testclient import TestClient
from apps.main import app

client = TestClient(app)

for path in ["/api/v1/health/live"]:
    response = client.get(path)
    assert response.status_code == 200, f"Health check failed on {path}: {response.text}"
