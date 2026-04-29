import re

RUSSIAN_LETTERS = list("АБВГДЕЁЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ")
TASK8_MAX_OPTIONS = 7
TASK8_MIN_CORRECT_OPTIONS = 2
TASK8_MAX_CORRECT_OPTIONS = 6
TASK2_PAIR_PICK_ATTEMPTS = 32
TASK2_PARTIAL_REFRESH_MAX_CANDIDATES = 180
TASK2_EXTRA_OPTION_FALLBACK = "Не относится ни к одному из персонажей"

SERVICE_TAGS = {
    "встречается", "используется", "можно найти", "относится", "принадлежит",
    "содержит", "можно заметить", "обозначается", "называется",
}
ROD_SINGLE_USE_IN_BLOCK11 = {"лирика", "пьеса", "поэма"}
NO_AUTHOR_TAGS = {"без автора", "без-автора", "без_автора", "безавтора"}

BLOCK11_KEYS = ["task11_1", "task11_2", "task11_3", "task11_4", "task11_5"]
ALL_TASK_KEYS = [
    "task1", "task2", "task3", "task4_1", "task4_2", "task5",
    "task6", "task7", "task8", "task9_1", "task9_2", "task10",
    "task11_1", "task11_2", "task11_3", "task11_4", "task11_5"
]

SERVICE_TAG_ALLOWED_KEYS = {"task3", "task6"}
CHARACTER_TAG_ALLOWED_KEYS = {"task2", "task5", "task11_1", "task11_2", "task11_3", "task11_4", "task11_5"}

HTML_TAG_PATTERN = re.compile(r"</?[a-z][\s\S]*>", re.IGNORECASE | re.UNICODE)
SPLIT_PATTERN = re.compile(r"[,\n;]+", re.UNICODE)
