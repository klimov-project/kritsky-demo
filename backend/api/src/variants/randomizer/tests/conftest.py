import json
import os
import pytest

@pytest.fixture(scope="session")
def project_root():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(current_dir, "../../../../../../"))

@pytest.fixture(scope="session")
def debug_data(project_root):
    dump_path = os.path.join(project_root, "backend/debug_dump.json")
    if not os.path.exists(dump_path):
        pytest.skip("debug_dump.json not found")
    
    with open(dump_path, "r", encoding="utf-8") as f:
        return json.load(f)

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

@pytest.fixture(scope="session")
def sample_payload(debug_data):
    return debug_data.get("payload")
