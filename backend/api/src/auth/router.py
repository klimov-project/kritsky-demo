from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from core.src.security import get_password_hash, verify_password
from db.src.connect import ainit_session
from db.src.models import Subscription, User

from .schemas import (
    PublicUser,
    AuthTokens,
    RegisterPayload,
    LoginPayload,
    AdminLoginPayload,
    RefreshPayload,
    UpdateProfilePayload,
    ChangePasswordPayload,
)
from .utils import (
    ADMIN_LOGIN,
    ADMIN_PASSWORD,
    AuthenticatedUser,
    TokenPrincipal,
    build_auth_response,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_access_principal,
    get_current_user,
    get_user_by_email,
    is_admin_email,
    _to_public_user,
    _admin_stub_user,
)


router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/me", response_model=PublicUser)
async def get_me(principal: TokenPrincipal = Depends(get_access_principal)) -> PublicUser:
    """
    Получение данных текущего авторизованного пользователя.
    
    Args:
        principal (TokenPrincipal): JWT principal текущей сессии.
        
    Returns:
        PublicUser: Публичные данные пользователя.
    """
    if principal.role == "admin":
        return _admin_stub_user()

    auth = await get_current_user(principal)
    public_user = _to_public_user(auth.user)

    # Fetch latest active subscription expiry
    now = datetime.now(timezone.utc)
    async with ainit_session() as session:
        result = await session.execute(
            select(Subscription.dateOfExpire)
            .where(
                Subscription.userId == auth.user.id,
                Subscription.dateOfExpire.isnot(None),
                Subscription.dateOfExpire > now,
            )
            .order_by(Subscription.dateOfExpire.desc())
            .limit(1)
        )
        expires_at = result.scalar_one_or_none()
    public_user.subscriptionExpiresAt = expires_at
    return public_user


@router.post("/register")
async def register(payload: RegisterPayload) -> dict:
    """
    Регистрация нового пользователя в системе.
    Проверяет уникальность email, хеширует пароль и создает запись в БД.
    Автоматически выдает токены доступа после успешной регистрации.
    
    Args:
        payload (RegisterPayload): Данные для регистрации (email, пароль, имя).
        
    Returns:
        dict: Токены авторизации и данные созданного пользователя.
    """
    async with ainit_session() as session:
        existing_user = await get_user_by_email(payload.email, session)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким email уже зарегистрирован",
            )

        user = User(
            email=payload.email.lower(),
            password=get_password_hash(payload.password),
            name=payload.name,
            phone=payload.phone,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        return build_auth_response(
            sub=str(user.id),
            role="user",
            user=_to_public_user(user).model_dump(),
        )


@router.post("/login")
async def login(payload: LoginPayload) -> dict:
    """
    Авторизация пользователя по email и паролю.
    Проверяет учетные данные и возвращает пару JWT токенов.
    Блокирует вход, если аккаунт пользователя деактивирован.
    
    Args:
        payload (LoginPayload): Email и пароль.
        
    Returns:
        dict: Токены авторизации и профиль пользователя.
    """
    async with ainit_session() as session:
        user = await get_user_by_email(payload.email, session)
        if not user or not verify_password(payload.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный email или пароль",
            )

        if getattr(user, "is_blocked", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ваш аккаунт заблокирован",
            )

        return build_auth_response(
            sub=str(user.id),
            role="user",
            user=_to_public_user(user).model_dump(),
        )


@router.post("/admin/login")
async def admin_login(payload: AdminLoginPayload) -> dict:
    """
    Авторизация в панели администратора.
    Использует статический пароль администратора.
    """
    if payload.login != ADMIN_LOGIN or payload.password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль администратора",
        )

    return build_auth_response(
        sub=ADMIN_LOGIN,
        role="admin",
        user=_admin_stub_user().model_dump(),
    )


@router.post("/refresh")
async def refresh_tokens(payload: RefreshPayload) -> dict:
    """
    Обновление пары токенов по валидному refresh токену.
    """
    principal = decode_token(payload.refreshToken, expected_type="refresh")

    if principal.role == "admin":
        return build_auth_response(
            sub=ADMIN_LOGIN,
            role="admin",
            user=_admin_stub_user().model_dump(),
        )

    async with ainit_session() as session:
        try:
            user_id = int(principal.sub)
        except ValueError as error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token subject",
            ) from error

        user = await session.get(User, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

        if getattr(user, "is_blocked", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ваш аккаунт заблокирован",
            )

        return build_auth_response(
            sub=str(user.id),
            role="user",
            user=_to_public_user(user).model_dump(),
        )


@router.put("/profile", response_model=PublicUser)
async def update_profile(
    payload: UpdateProfilePayload,
    auth: AuthenticatedUser = Depends(get_current_user),
) -> PublicUser:
    """
    Обновление персональных данных в профиле пользователя.
    Позволяет изменить имя и телефон.
    
    Args:
        payload (UpdateProfilePayload): Новые данные профиля.
        auth (AuthenticatedUser): Текущий пользователь.
        
    Returns:
        PublicUser: Обновленные публичные данные.
    """
    async with ainit_session() as session:
        user = await session.get(User, auth.user.id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        if payload.name is not None:
            user.name = payload.name
        if payload.phone is not None:
            user.phone = payload.phone

        await session.commit()
        await session.refresh(user)
        return _to_public_user(user)


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordPayload,
    auth: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    async with ainit_session() as session:
        user = await session.get(User, auth.user.id)
        if not user or not verify_password(payload.oldPassword, user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Неверный старый пароль",
            )

        user.password = get_password_hash(payload.newPassword)
        await session.commit()
        return {"ok": True}
