from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api import deps
from app.core.security import create_access_token, create_refresh_token
from app.schemas.auth import Token, UserLogin, UserRead
from app.services.users import UserService

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session=Depends(deps.get_session),
):
    service = UserService(session)
    user = await service.authenticate(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect email or password")

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=Token)
async def refresh(current_user=Depends(deps.get_current_user)):
    access_token = create_access_token(str(current_user.id))
    refresh_token = create_refresh_token(str(current_user.id))
    return Token(access_token=access_token, refresh_token=refresh_token)


@router.get("/me", response_model=UserRead)
async def read_current_user(current_user=Depends(deps.get_current_user)):
    return current_user
