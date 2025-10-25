from __future__ import annotations

from app.tasks import celery_app


@celery_app.task
def process_import_job(job_id: int) -> None:
    # TODO: Implement import processing pipeline
    return None
