import pytest
from ..generator import generate_variant_runtime2
from ..validator import evaluate_variant_rules2

def test_single_variant_validation(kb_payload, sample_payload):
    """
    Генерирует 1 вариант и прогоняет его через полный набор правил валидации.
    """
    # Мы отключаем useSelected для проверки случайной генерации
    res = generate_variant_runtime2(kb_payload, {**sample_payload, "useSelected": False})
    
    assert "variant" in res, "Вариант не сгенерирован"
    evaluation = res.get("evaluation", {})
    
    # Делаем явную проверку через evaluate_variant_rules2
    variant = res["variant"]
    eval_res = evaluate_variant_rules2(variant)
    
    # Выводим ошибки, если они есть, чтобы было видно в отчете
    if not eval_res["ok"]:
        print("\n[!] Обнаружены ошибки при валидации варианта:")
        for err in eval_res["errors"]:
            print(f" - {err}")
            
    assert eval_res["ok"] is True, f"Валидация не пройдена: {eval_res['errors']}"
