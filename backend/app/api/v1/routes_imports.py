from __future__ import annotations

from io import BytesIO

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.api import deps
from app.schemas.import_job import ImportJobCreate, ImportJobRead
from app.services.imports import ImportService

router = APIRouter()


@router.get("/jobs", response_model=list[ImportJobRead])
async def list_import_jobs(session=Depends(deps.get_session)):
    service = ImportService(session)
    jobs = await service.list_recent()
    return jobs


@router.post("/upload", response_model=ImportJobRead)
async def upload_import(
    file: UploadFile = File(...),
    branch_id: int | None = Form(default=None),
    sheet_name: str | None = Form(default=None),
    session=Depends(deps.get_session),
):
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")
    service = ImportService(session)
    payload = ImportJobCreate(source_filename=file.filename, branch_id=branch_id, sheet_name=sheet_name)
    try:
        job = await service.queue_import(payload=payload, file_buffer=BytesIO(contents), uploaded_by_id=None)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return job
