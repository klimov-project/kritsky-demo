import pytest
from ..generator import refresh_all_block11_runtime2
from ..constants import BLOCK11_KEYS

def test_refresh_block11_preserves_pinned_tasks():
    # Setup dummy KB
    kb = {
        "block3": {
            "task11_1": [{"id": "t1", "rods": ["лирика"], "isActive": True}],
            "task11_2_3": [{"id": "t2", "rods": ["пьеса"], "isActive": True}, {"id": "t3", "rods": ["поэма"], "isActive": True}],
            "task11_4": [{"id": "t4", "rods": ["проза"], "isActive": True}],
            "task11_5": [{"id": "t5", "rods": ["проза"], "isActive": True}],
        }
    }
    
    # Current variant
    variant = {
        "task11_1": {"id": "old_t1"},
        "task11_2": {"id": "old_t2"},
        "task11_3": {"id": "old_t3"},
        "task11_4": {"id": "old_t4"},
        "task11_5": {"id": "old_t5"},
        "_rodLayout": ["лирика", "пьеса", "поэма", "проза", "проза"],
        "_rodLayoutStep": 0
    }
    
    # Pin task11_1
    pinned = {"task11_1": {"id": "old_t1", "rods": ["лирика"]}}
    
    payload = {
        "variant": variant,
        "pinnedBlock3Tasks": pinned,
        "block11RodPreference": {
            "task11_1": "пьеса",
            "task11_2": "поэма",
            "task11_3": "проза",
            "task11_4": "проза",
            "task11_5": "лирика" # Note: лирика in 11.5 is forbidden by constraint, but we'll see how it's handled
        }
    }
    
    result = refresh_all_block11_runtime2(kb, payload)
    new_variant = result["variant"]
    
    # Check that task11_1 is PRESERVED even though rod changed in preference
    # (Pinned tasks take priority over rod layout in the backend now)
    assert new_variant["task11_1"]["id"] == "old_t1"
    
    # Check that rod layout step incremented
    assert new_variant["_rodLayoutStep"] == 1

def test_refresh_block11_uses_frontend_rod_preference():
    kb = {
        "block3": {
            "task11_1": [{"id": "t1", "rods": ["проза"], "isActive": True}],
            "task11_2_3": [{"id": "t2", "rods": ["проза"], "isActive": True}],
            "task11_4": [{"id": "t4", "rods": ["проза"], "isActive": True}],
            "task11_5": [{"id": "t5", "rods": ["проза"], "isActive": True}],
        }
    }
    variant = {
        "_rodLayout": ["лирика", "пьеса", "поэма", "проза", "проза"],
        "_rodLayoutStep": 0
    }
    
    # Frontend wants all PROSE (unlikely but good for testing sync)
    pref = {k: "проза" for k in BLOCK11_KEYS}
    
    payload = {
        "variant": variant,
        "block11RodPreference": pref
    }
    
    result = refresh_all_block11_runtime2(kb, payload)
    assert result["variant"]["_rodLayout"] == ["проза"] * 5
    assert result["variant"]["_rodLayoutStep"] == 1
