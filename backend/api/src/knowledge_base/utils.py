from __future__ import annotations

from typing import Any

from sqlalchemy.exc import IntegrityError

from db.src.connect import init_session
from db.src.models import KnowledgeBaseState

from .schemas import KnowledgeBaseResponse


BLOCK3_KEYS = ("task11_1", "task11_2_3", "task11_4", "task11_5")
LEGACY_QUESTION_FIELDS = frozenset({"relatesTo", "uses"})


def _empty_block3() -> dict[str, list[dict[str, Any]]]:
    return {key: [] for key in BLOCK3_KEYS}


def _default_settings() -> dict[str, Any]:
    return {
        "variantTexts": {
            "part1Intro": "Прочитайте приведённый ниже фрагмент художественного произведения и выполните задания 1–3, 4.1 или 4.2 (на выбор) и задание 5.",
            "part1QuestionsIntro": "Ответами к заданиям 1–3 являются одно-два слова или последовательность цифр.",
            "part1Task4Lead": "При написании развёрнутых ответов на задания 4 и 5 соблюдайте нормы письменной речи, приводите конкретные примеры из текста.",
            "part1Criteria": "При выполнении заданий 4 и 5 используйте термины, приводите примеры из текста и избегайте фактических ошибок. Объём ответа — 5–10 предложений.",
            "part1Task5Lead": "Дайте аргументированный связный ответ на вопрос задания.",
            "part2Intro": "Прочитайте приведённое ниже стихотворение и выполните задания 6–8, 9.1 или 9.2 (на выбор) и задание 10.",
            "part2QuestionsIntro": "Ответами к заданиям 6–8 являются одно-два слова или последовательность цифр.",
            "part2Task9Lead": "При написании развёрнутых ответов на задания 9 и 10 не искажайте авторскую позицию, приводите конкретные примеры из текста произведений, соблюдайте нормы письменной речи.",
            "part2Task9Criteria": "Выберите ОДНО из заданий: 9.1 или 9.2. Напишите прямой связный ответ: сформулируйте утверждение, аргументируйте его и приведите примеры из стихотворения.",
            "part2Task10Lead": "Дайте аргументированный связный ответ на вопрос задания 10: укажите произведение для сопоставления и подтвердите выводы примерами.",
            "part3Intro": "Выберите одну из пяти тем сочинений (11.1–11.5) и напишите развёрнутый ответ.",
        }
    }


def _strip_legacy_question_fields(value: Any) -> Any:
    if isinstance(value, list):
        return [_strip_legacy_question_fields(item) for item in value]

    if isinstance(value, dict):
        return {
            key: _strip_legacy_question_fields(item)
            for key, item in value.items()
            if key not in LEGACY_QUESTION_FIELDS
        }

    return value


def _normalize_block3(value: Any) -> dict[str, list[dict[str, Any]]]:
    normalized = _empty_block3()
    if not isinstance(value, dict):
        return normalized

    for key in BLOCK3_KEYS:
        entries = value.get(key)
        if isinstance(entries, list):
            normalized[key] = [
                _strip_legacy_question_fields(entry)
                for entry in entries
                if isinstance(entry, dict)
            ]

    return normalized


def _normalize_settings(value: Any) -> dict[str, Any]:
    defaults = _default_settings()
    if not isinstance(value, dict):
        return defaults

    variant_texts = value.get("variantTexts")
    if not isinstance(variant_texts, dict):
        variant_texts = {}

    return {
        "variantTexts": {
            "part1Intro": variant_texts.get("part1Intro") if isinstance(variant_texts.get("part1Intro"), str) else defaults["variantTexts"]["part1Intro"],
            "part1QuestionsIntro": variant_texts.get("part1QuestionsIntro") if isinstance(variant_texts.get("part1QuestionsIntro"), str) else defaults["variantTexts"]["part1QuestionsIntro"],
            "part1Task4Lead": variant_texts.get("part1Task4Lead") if isinstance(variant_texts.get("part1Task4Lead"), str) else defaults["variantTexts"]["part1Task4Lead"],
            "part1Criteria": variant_texts.get("part1Criteria") if isinstance(variant_texts.get("part1Criteria"), str) else defaults["variantTexts"]["part1Criteria"],
            "part1Task5Lead": variant_texts.get("part1Task5Lead") if isinstance(variant_texts.get("part1Task5Lead"), str) else defaults["variantTexts"]["part1Task5Lead"],
            "part2Intro": variant_texts.get("part2Intro") if isinstance(variant_texts.get("part2Intro"), str) else defaults["variantTexts"]["part2Intro"],
            "part2QuestionsIntro": variant_texts.get("part2QuestionsIntro") if isinstance(variant_texts.get("part2QuestionsIntro"), str) else defaults["variantTexts"]["part2QuestionsIntro"],
            "part2Task9Lead": variant_texts.get("part2Task9Lead") if isinstance(variant_texts.get("part2Task9Lead"), str) else defaults["variantTexts"]["part2Task9Lead"],
            "part2Task9Criteria": variant_texts.get("part2Task9Criteria") if isinstance(variant_texts.get("part2Task9Criteria"), str) else defaults["variantTexts"]["part2Task9Criteria"],
            "part2Task10Lead": variant_texts.get("part2Task10Lead") if isinstance(variant_texts.get("part2Task10Lead"), str) else defaults["variantTexts"]["part2Task10Lead"],
            "part3Intro": variant_texts.get("part3Intro") if isinstance(variant_texts.get("part3Intro"), str) else defaults["variantTexts"]["part3Intro"],
        },
        "weeklyVariant": value.get("weeklyVariant") if isinstance(value.get("weeklyVariant"), dict) else None,
        "weeklyPins": value.get("weeklyPins") if isinstance(value.get("weeklyPins"), dict) else None,
    }


def _ensure_task2_property_ids(works: list[dict[str, Any]]) -> list[dict[str, Any]]:
    for work in works:
        if not isinstance(work, dict):
            continue
        common_tasks = work.get("commonTasks")
        if not isinstance(common_tasks, dict):
            continue
        task2_list = common_tasks.get("task2")
        if not isinstance(task2_list, list):
            continue
        for question in task2_list:
            if not isinstance(question, dict):
                continue
            pairs = question.get("pairs")
            if not isinstance(pairs, list):
                continue
            for pair in pairs:
                if not isinstance(pair, dict):
                    continue
                pair_id = str(pair.get("id") or "").strip()
                if not pair_id:
                    continue
                props_len = max(
                    len(pair.get("properties") or []),
                    len(pair.get("phrases") or []),
                    len(pair.get("characteristics") or []),
                )
                if props_len == 0:
                    continue
                existing = pair.get("propertyIds")
                ids = list(existing) if isinstance(existing, list) else []
                while len(ids) < props_len:
                    ids.append("")
                for i in range(props_len):
                    if not (ids[i] if isinstance(ids[i], str) else "").strip():
                        ids[i] = f"{pair_id}:{i}"
                pair["propertyIds"] = ids
    return works


def _normalize_payload(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        return {
            "works": [],
            "poets": [],
            "block3": _empty_block3(),
            "settings": _default_settings(),
        }

    works = value.get("works")
    poets = value.get("poets")

    raw_works = [
        _strip_legacy_question_fields(entry)
        for entry in works
        if isinstance(entry, dict)
    ] if isinstance(works, list) else []

    return {
        "works": _ensure_task2_property_ids(raw_works),
        "poets": [
            _strip_legacy_question_fields(entry)
            for entry in poets
            if isinstance(entry, dict)
        ] if isinstance(poets, list) else [],
        "block3": _normalize_block3(value.get("block3")),
        "settings": _normalize_settings(value.get("settings")),
    }


def _to_response(record: KnowledgeBaseState) -> KnowledgeBaseResponse:
    normalized_payload = _normalize_payload(record.payload)
    return KnowledgeBaseResponse(
        works=normalized_payload["works"],
        poets=normalized_payload["poets"],
        block3=normalized_payload["block3"],
        settings=normalized_payload["settings"],
        updatedAt=record.updatedAt,
    )


def _get_or_create_state() -> KnowledgeBaseState:
    with init_session() as session:
        state = session.get(KnowledgeBaseState, 1)
        if state is None:
            state = KnowledgeBaseState(
                id=1,
                payload={
                    "works": [],
                    "poets": [],
                    "block3": _empty_block3(),
                    "settings": _default_settings(),
                },
            )
            session.add(state)
            try:
                session.commit()
                session.refresh(state)
                return state
            except IntegrityError:
                session.rollback()
                state = session.get(KnowledgeBaseState, 1)
                if state is None:
                    raise

        # Pre-load the payload while the session is active
        _ = state.payload
        return state


def warm_knowledge_base_cache_from_db() -> None:
    """
    Прогрев кэша базы знаний из БД при старте приложения.
    """
    try:
        _get_or_create_state()
    except Exception:
        pass
