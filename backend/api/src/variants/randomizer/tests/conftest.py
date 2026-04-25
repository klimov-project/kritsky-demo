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
def kb_payload(debug_data):
    return debug_data.get("kb_payload")

@pytest.fixture(scope="session")
def sample_payload(debug_data):
    return debug_data.get("payload")
