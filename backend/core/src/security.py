from __future__ import annotations

import hashlib

import bcrypt

_BCRYPT_MAX_PASSWORD_BYTES = 72
_PREHASH_PREFIX = "sha256$"


def _normalize_password(password: str) -> bytes:
    raw = password.encode("utf-8")
    if len(raw) <= _BCRYPT_MAX_PASSWORD_BYTES:
        return raw

    digest = hashlib.sha256(raw).hexdigest()
    return f"{_PREHASH_PREFIX}{digest}".encode("ascii")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Проверяет соответствие пароля хешу.
    Поддерживает нормализацию длинных паролей и legacy-откат для обрезанных паролей.
    
    Args:
        plain_password (str): Пароль в открытом виде.
        hashed_password (str): Хеш пароля из БД.
        
    Returns:
        bool: True, если пароль верен.
    """
    hash_bytes = hashed_password.encode("utf-8")
    normalized = _normalize_password(plain_password)

    try:
        if bcrypt.checkpw(normalized, hash_bytes):
            return True
    except ValueError:
        return False

    raw = plain_password.encode("utf-8")
    if len(raw) > _BCRYPT_MAX_PASSWORD_BYTES:
        truncated = raw[:_BCRYPT_MAX_PASSWORD_BYTES]
        try:
            return bcrypt.checkpw(truncated, hash_bytes)
        except ValueError:
            return False

    return False


def get_password_hash(password: str) -> str:
    """
    Генерирует bcrypt-хеш пароля.
    Предварительно нормализует пароль для обхода ограничений bcrypt на длину входа.
    
    Args:
        password (str): Пароль для хеширования.
        
    Returns:
        str: Сгенерированный хеш.
    """
    normalized = _normalize_password(password)
    return bcrypt.hashpw(normalized, bcrypt.gensalt()).decode("utf-8")
