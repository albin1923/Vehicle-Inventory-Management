from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.api import deps
from app.models.branch import Branch
from app.schemas.branch import BranchCreate, BranchRead

router = APIRouter()


@router.get("/", response_model=list[BranchRead])
async def list_branches(session=Depends(deps.get_session)):
    result = await session.execute(select(Branch).order_by(Branch.updated_at.desc(), Branch.name.asc()))
    return list(result.scalars().all())


@router.post("/", response_model=BranchRead, status_code=status.HTTP_201_CREATED)
async def create_branch(payload: BranchCreate, session=Depends(deps.get_session)):
    exists = await session.execute(select(Branch).where(Branch.code == payload.code))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Branch code already exists")

    branch = Branch(**payload.model_dump())
    session.add(branch)
    await session.flush()
    return branch
