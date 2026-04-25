import time
import pytest
from ..generator import generate_variant_runtime2

@pytest.mark.parametrize("iterations", [100])
def test_heavy_stress_with_stats(kb_payload, sample_payload, iterations):
    """
    Запускает тяжелый стресс-тест и выводит подробную статистику по ошибкам и производительности.
    """
    print(f"\n🚀 Запуск стресс-теста на {iterations} итераций...")
    
    start_time = time.time()
    success_count = 0
    errors_summary = {}

    for i in range(iterations):
        # Используем useSelected=False для максимальной рандомизации
        res = generate_variant_runtime2(kb_payload, {**sample_payload, "useSelected": False})
        evaluation = res.get("evaluation", {})
        
        if evaluation.get("ok"):
            success_count += 1
        else:
            for err in evaluation.get("errors", []):
                # Группируем ошибки по смыслу (отрезаем конкретику типа ID или названий)
                msg = err.split(":")[0] if ":" in err else err
                msg = msg.split(" (")[0] if " (" in msg else msg
                errors_summary[msg] = errors_summary.get(msg, 0) + 1
    
    duration = time.time() - start_time
    success_rate = (success_count / iterations) * 100
    avg_time = (duration / iterations) * 1000

    print("\n" + "="*50)
    print(f"📊 ИТОГИ СТРЕСС-ТЕСТА ({iterations} прогонов)")
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
    
    # Мы ожидаем, что даже при случайной генерации успех будет выше 90%
    # Если он ниже, значит правила слишком жесткие или данных мало.
    assert success_rate >= 90
