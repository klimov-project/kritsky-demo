from ..tasks import (
    _build_task8_options,
    _rotate_rod_layout,
    _generate_rod_layout
)
from ..tokens import (
    _build_id_exclusion_set,
    _build_identifier_exclusion_set,
)
from ..context import SelectionContext

def test_task8_option_filtering():
    ctx = SelectionContext()
    ctx.used_term_tokens.add("эпитет")
    
    q = {
        "options": [
            {"term": "Метафора", "isCorrect": True, "isActive": True},
            {"term": "Эпитет", "isCorrect": False, "isActive": True}, # Должен быть отфильтрован
            {"term": "Сравнение", "isCorrect": False, "isActive": True}
        ]
    }
    
    options = _build_task8_options(q, ctx)
    terms = [o["term"].lower() for o in options]
    assert "эпитет" not in terms
    assert "метафора" in terms
    # Пул используемых терминов должен обновиться выбранными опциями
    assert any(t in ctx.used_term_tokens for t in ["метафора", "сравнение"])

def test_exclusions_parsing():
    id_set = _build_id_exclusion_set(["task-1", " Task-2 ", ""])
    assert "task-1" in id_set and "task-2" in id_set
    assert "" not in id_set
    
    term_set = _build_identifier_exclusion_set(["Метафора", "Эпитет"])
    assert "метафора" in term_set and "эпитет" in term_set

def test_rod_layout_rotation():
    layout = ["лирика", "пьеса", "проза"]
    rotated = _rotate_rod_layout(layout)
    assert rotated == ["пьеса", "проза", "лирика"]
    
    rotated2 = _rotate_rod_layout(rotated)
    assert rotated2 == ["проза", "лирика", "пьеса"]

def test_rod_layout_generation():
    layout = _generate_rod_layout()
    assert len(layout) == 5
    assert layout.count("проза") == 2
    assert "лирика" in layout
    assert "пьеса" in layout
    assert "поэма" in layout
