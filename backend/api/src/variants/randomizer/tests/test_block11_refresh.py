import copy
import pytest
from ..generator import (
    generate_variant_runtime2,
    refresh_task_runtime2,
    refresh_all_block11_runtime2
)
from ..constants import BLOCK11_KEYS
from ..tokens import _extract_rod_tokens

def test_single_task_refresh_preserves_rod_layout(kb_payload, sample_payload):
    # Generate initial variant
    res = generate_variant_runtime2(kb_payload, {**sample_payload, "useSelected": False})
    variant = res["variant"]
    
    # Check if we have rod layout
    original_layout = variant.get("_rodLayout")
    assert original_layout is not None, "Variant must have _rodLayout"
    original_exclusive_slot = variant.get("_exclusiveSlot")
    
    # Refresh task 11.2
    task_to_refresh = "task11_2"
    refresh_res = refresh_task_runtime2(kb_payload, {
        "variant": copy.deepcopy(variant), 
        "taskKey": task_to_refresh
    })
    
    new_variant = refresh_res["variant"]
    
    # 1. Rod layout and exclusive slot should be exactly the same
    assert new_variant.get("_rodLayout") == original_layout
    assert new_variant.get("_exclusiveSlot") == original_exclusive_slot
    
    # 2. The task itself should be updated (or at least valid)
    new_task = new_variant.get(task_to_refresh)
    assert new_task is not None
    
    # 3. The new task should match the rod from the layout
    expected_rod = original_layout[1]
    task_rods = _extract_rod_tokens(new_task)
    if not task_rods:
        task_rods = ["проза"]
    assert expected_rod in task_rods, f"Expected rod {expected_rod} in {task_rods}"

def test_refresh_all_block11_rotates_rod_layout(kb_payload, sample_payload):
    res = generate_variant_runtime2(kb_payload, {**sample_payload, "useSelected": False})
    variant = res["variant"]
    
    original_layout = variant.get("_rodLayout")
    assert original_layout is not None
    
    # Call refresh_all_block11_runtime2
    refresh_res = refresh_all_block11_runtime2(kb_payload, {"variant": copy.deepcopy(variant)})
    new_variant = refresh_res["variant"]
    new_layout = new_variant.get("_rodLayout")
    
    assert new_layout is not None
    assert new_layout != original_layout, "Rod layout should have changed after refresh_all"
    
    # The new layout is a cyclic shift, but we also enforce that slot 4 is not 'лирика'
    # So it might not be a perfect shift, but it should definitely be a valid layout
    assert new_layout[4] != "лирика", "Slot 11.5 cannot have 'лирика'"

def test_refresh_all_block11_full_cycle(kb_payload, sample_payload):
    res = generate_variant_runtime2(kb_payload, {**sample_payload, "useSelected": False})
    variant = res["variant"]
    
    original_layout = variant.get("_rodLayout")
    current_variant = variant
    
    # Do 5 refreshes
    for i in range(5):
        refresh_res = refresh_all_block11_runtime2(kb_payload, {"variant": current_variant})
        current_variant = refresh_res["variant"]
        layout = current_variant.get("_rodLayout")
        
        # Check constraints
        assert layout[4] != "лирика", "Slot 11.5 cannot have 'лирика'"
        
        # The step should increment
        step = current_variant.get("_rodLayoutStep")
        if i < 4:
            assert step == i + 1
        else:
            # On the 5th rotation, step resets to 0 and we get a completely new layout
            assert step == 0
