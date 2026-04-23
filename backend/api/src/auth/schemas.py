from __future__ import annotations

import re

from pydantic import AliasChoices, BaseModel, EmailStr, Field, field_validator


MAX_NAME_LENGTH = 255
PHONE_DIGITS_RE = re.compile(r"\D+")


def _normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None


def _normalize_phone(value: str | None) -> str | None:
    normalized = _normalize_optional_text(value)
    if normalized is None:
        return None

    digits = PHONE_DIGITS_RE.sub("", normalized)
    if len(digits) == 10:
        digits = f"7{digits}"
    elif len(digits) == 11 and digits.startswith("8"):
        digits = f"7{digits[1:]}"

    if len(digits) != 11 or not digits.startswith("7"):
        raise ValueError("Введите телефон в формате +7 999 123 45 67")

    return f"+7 {digits[1:4]} {digits[4:7]} {digits[7:9]} {digits[9:11]}"


class PublicUser(BaseModel):
    id: int
    email: str
    name: str | None = None
    phone: str | None = None
    role: str = "user"
    isPro: bool = False
    isAdmin: bool = False
    isBlocked: bool = False
    paidDownloadCredits: int = 0


class AuthTokens(BaseModel):
    accessToken: str
    refreshToken: str


class RegisterPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str | None = Field(default=None, max_length=MAX_NAME_LENGTH)
    phone: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        return _normalize_optional_text(value)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        return _normalize_phone(value)


class LoginPayload(BaseModel):
    email: str
    password: str


class AdminLoginPayload(BaseModel):
    login: str | None = None
    password: str


class RefreshPayload(BaseModel):
    refreshToken: str


class UpdateProfilePayload(BaseModel):
    name: str | None = Field(default=None, max_length=MAX_NAME_LENGTH)
    phone: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        return _normalize_optional_text(value)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        return _normalize_phone(value)


class ChangePasswordPayload(BaseModel):
    oldPassword: str = Field(validation_alias=AliasChoices("oldPassword", "currentPassword"))
    newPassword: str = Field(min_length=6)

    @field_validator("oldPassword", "newPassword")
    @classmethod
    def validate_passwords(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Пароль не должен быть пустым")
        return normalized
