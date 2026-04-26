from ..context import SelectionContext, _can_select_question

def test_selection_logic():
    ctx = SelectionContext()
    ctx.used_author_tokens.add("пушкин")
    
    # 1. Проверка автора (конфликт)
    q_bad = {"authorId": "Пушкин"}
    assert _can_select_question(q_bad, "task1", ctx) == False
    
    # 2. Проверка тега без-автора (исключение)
    q_wa = {"authorId": "Пушкин", "withoutAuthor": True}
    assert _can_select_question(q_wa, "task1", ctx) == True
    
    # 3. Проверка тем
    ctx.used_theme_tokens.add("любовь")
    q_theme = {"tags": "тема:Любовь"}
    assert _can_select_question(q_theme, "task1", ctx) == False
    
    # 4. Проверка тега персонажа (лимит 1 на вариант)
    ctx.character_tag_count = 1
    q_char = {"tags": "тег персонаж"}
    assert _can_select_question(q_char, "task1", ctx) == False

def test_context_copy():
    ctx = SelectionContext()
    ctx.used_author_tokens.add("пушкин")
    ctx.character_tag_count = 5
    
    ctx2 = ctx.copy()
    assert "пушкин" in ctx2.used_author_tokens
    assert ctx2.character_tag_count == 5
    
    # Mutation check
    ctx2.used_author_tokens.add("лермонтов")
    assert "лермонтов" not in ctx.used_author_tokens
