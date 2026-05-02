import json
import os
import pytest

@pytest.fixture(scope="session")
def project_root():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # from backend/api/src/shop/tests up to project root
    return os.path.abspath(os.path.join(current_dir, "../../../../../"))

@pytest.fixture(scope="session")
def kb_payload(project_root):
    kb_path = os.path.join(project_root, "clean.json")
    if not os.path.exists(kb_path):
        pytest.skip("clean.json not found")
        
    with open(kb_path, "r", encoding="utf-8") as f:
        content = f.read().strip()
        if content.endswith("(1 row)"):
            content = content[:-7].strip()
        return json.loads(content)
