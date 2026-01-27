from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import date
import math
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
    
    Note: For performance, limit date range to 30 days or less.
    """
    
    # Validate date range
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="start_date must be before end_date")
    
    # Build query
    where_clauses = ["pickup_date BETWEEN ? AND ?", "is_valid = 1"]
    params = [start_date, end_date]
    
    if service_type:
        where_clauses.append("service_type = ?")
        params.append(service_type.value)
    
    if borough:
        where_clauses.append("pickup_borough = ?")
        params.append(borough)
    
    where_sql = " AND ".join(where_clauses)
    
    # Get total count
    count_query = f"""
        SELECT COUNT(*) 
        FROM fact_trip 
        WHERE {where_sql}
    """
    total_records = db.execute_scalar(count_query, tuple(params))
    
    if total_records == 0:
        return TripsResponse(
            data=[],
            pagination=PaginationResponse(
                page=page,
                page_size=page_size,
                total_records=0,
                total_pages=0
            )
        )
    
    # Calculate pagination
    total_pages = math.ceil(total_records / page_size)
    offset = (page - 1) * page_size
    
    # Get paginated data
    data_query = f"""
        SELECT 
            trip_id,
            service_type,
            pickup_datetime,
            dropoff_datetime,
            pickup_borough,
            pickup_zone,
            dropoff_borough,
            dropoff_zone,
            trip_distance,
            total_amount,
            trip_duration_sec
        FROM fact_trip
        WHERE {where_sql}
        ORDER BY pickup_datetime DESC
        OFFSET ? ROWS
        FETCH NEXT ? ROWS ONLY
    """
    
    results = db.execute_query(data_query, tuple(params + [offset, page_size]))
    
    # Convert to response model
    trips = [Trip(**row) for row in results]
    
    return TripsResponse(
        data=trips,
        pagination=PaginationResponse(
            page=page,
            page_size=page_size,
            total_records=total_records,
            total_pages=total_pages
        )
    )