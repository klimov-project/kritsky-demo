from ..tokens import (
    _extract_author_tokens,
    _extract_theme_tokens,
    _extract_term_tokens,
    _normalize_rod,
    _extract_rod_tokens,
    _is_exclusive_question
)

def test_token_extraction():
    # Автор
    q1 = {"authorId": "Пушкин", "tags": "автор:Гоголь"}
    authors = _extract_author_tokens(q1)
    assert "пушкин" in authors and "гоголь" in authors
    
    # Темы
    q2 = {"theme1Id": "ThemeA", "tags": "тема:ThemeB"}
    themes = _extract_theme_tokens(q2, "key")
    assert "themea" in themes and "themeb" in themes
    
    # Термины
    q3 = {"termId": "TermX", "options": [{"termId": "TermY"}]}
    terms = _extract_term_tokens(q3, "key")
    assert "termx" in terms and "termy" in terms

def test_rod_normalization():
    assert _normalize_rod("лирическое") == "лирика"
    assert _normalize_rod("Пьеса") == "пьеса"
    assert _normalize_rod("прозаический") == "проза"
    
    q = {"rodId": "Лирика", "tags": "род:Пьеса"}
    rods = _extract_rod_tokens(q)
    assert "лирика" in rods and "пьеса" in rods

def test_exclusive_questions():
    assert _is_exclusive_question({"special": True}) == True
    assert _is_exclusive_question({"tags": "искл вопрос"}) == True
    assert _is_exclusive_question({"tags": "тег спец вопрос"}) == True
    assert _is_exclusive_question({"tags": "просто тег"}) == False
