import copy
import time
import pytest
from ..generator import (
    generate_variant_runtime2,
    refresh_task_runtime2,
    generate_block_standalone2
)
from ..constants import ALL_TASK_KEYS

def test_full_generation(kb_payload, sample_payload):
    # Отключаем useSelected для проверки рандома
    res = generate_variant_runtime2(kb_payload, {**sample_payload, "useSelected": False})
    assert "variant" in res
    assert res["evaluation"]["ok"] is True
    
    variant = res["variant"]
    assert "task1" in variant
    assert "task6" in variant
    assert "task11_1" in variant

def test_refresh_task_logic(kb_payload, sample_payload):
    res = generate_variant_runtime2(kb_payload, {**sample_payload, "useSelected": False})
    variant = res["variant"]
    
    # Тестируем обновление одного задания
    task_to_refresh = "task1"
    old_task = variant.get(task_to_refresh)
    
    refresh_res = refresh_task_runtime2(kb_payload, {
        "variant": copy.deepcopy(variant), 
        "taskKey": task_to_refresh
    })
    
    assert refresh_res["evaluation"]["ok"] is True
    new_task = refresh_res["variant"].get(task_to_refresh)
    assert new_task is not None

def test_standalone_blocks(kb_payload):
    for block in ["block1", "block2", "block3"]:
        res = generate_block_standalone2(kb_payload, {"block": block})
        assert "tasks" in res
        assert len(res["tasks"]) > 0

@pytest.mark.parametrize("iterations", [50])
def test_generation_stress(kb_payload, sample_payload, iterations):
    success_count = 0
    for i in range(iterations):
        res = generate_variant_runtime2(kb_payload, {**sample_payload, "useSelected": False})
        if res["evaluation"]["ok"]:
            success_count += 1
    
    # Допускаем небольшой процент ошибок из-за дублей в самой БД (город/место), 
    # но в целом успех должен быть высоким (>95%)
    success_rate = (success_count / iterations) * 100
    print(f"\nStress test success rate: {success_rate}%")
    assert success_rate >= 95
