import time
import pytest
from ...randomizer import generate_variant_runtime

@pytest.mark.parametrize("iterations", [10])
def test_heavy_stress_original(kb_payload, sample_payload, iterations):
    """
    Запускает стресс-тест для оригинального (V1) рандомайзера.
    """
    print(f"\n🚀 Запуск стресс-теста V1 на {iterations} итераций...")
    
    start_time = time.time()
    success_count = 0
    errors_summary = {}

    for i in range(iterations):
        res = generate_variant_runtime(kb_payload, {**sample_payload, "useSelected": False})
        evaluation = res.get("evaluation", {})
        
        if evaluation.get("ok"):
            success_count += 1
        else:
            for err in evaluation.get("errors", []):
                msg = err.split(":")[0] if ":" in err else err
                msg = msg.split(" (")[0] if " (" in msg else msg
                errors_summary[msg] = errors_summary.get(msg, 0) + 1
    
    duration = time.time() - start_time
    success_rate = (success_count / iterations) * 100
    avg_time = (duration / iterations) * 1000

    print("\n" + "="*50)
    print(f"📊 ИТОГИ СТРЕСС-ТЕСТА V1 ({iterations} прогонов)")
    print("="*50)
    print(f"⏱️  Общее время: {duration:.2f} сек")
    print(f"⚡ Среднее время на вариант: {avg_time:.1f} мс")
    print(f"✅ Успешно: {success_count}/{iterations} ({success_rate:.1f}%)")
    
    if errors_summary:
        print("\n❌ СТАТИСТИКА НАРУШЕНИЙ ПРАВИЛ:")
        sorted_errors = sorted(errors_summary.items(), key=lambda x: x[1], reverse=True)
        for msg, count in sorted_errors:
            print(f"  - {msg}: {count} раз")
    
    print("="*50)
    assert success_rate >= 0 # Просто выводим статы
