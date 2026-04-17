from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


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
    name: str | None = None
    phone: str | None = None


class LoginPayload(BaseModel):
    email: str
    password: str


class AdminLoginPayload(BaseModel):
    login: str | None = None
    password: str


class RefreshPayload(BaseModel):
    refreshToken: str


class UpdateProfilePayload(BaseModel):
    name: str | None = None
    phone: str | None = None


class ChangePasswordPayload(BaseModel):
    oldPassword: str
    newPassword: str = Field(min_length=6)
