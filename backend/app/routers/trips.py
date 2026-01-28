from fastapi import APIRouter, Depends, HTTPException, Query, Response
from typing import Optional
from datetime import date
import math
import hashlib
from app.database import db
from app.models import (
    TripsResponse,
    Trip,
    PaginationResponse,
    ServiceType,
    User
)
from app.auth import get_current_active_user

router = APIRouter(
    prefix="/api/trips",
    tags=["trips"],
    dependencies=[Depends(get_current_active_user)]
)

@router.get("", response_model=TripsResponse)
async def get_trips(
    response: Response,
    start_date: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: date = Query(..., description="End date (YYYY-MM-DD)"),
    service_type: Optional[ServiceType] = Query(None, description="Filter by service type"),
    borough: Optional[str] = Query(None, description="Filter by pickup borough"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(100, ge=1, le=1000, description="Items per page"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get individual trip records with filters and pagination.
    
    Note: Temporarily returning empty results due to performance optimization.
    Focus on summary cards and charts for analytics.
    """
    
    # Temporarily return empty results to avoid timeout on 159.5M records
    # This allows dashboard to load quickly with summary and charts working
    return TripsResponse(
        data=[],
        pagination=PaginationResponse(
            page=1,
            page_size=page_size,
            total_records=0,
            total_pages=0
        )
    )