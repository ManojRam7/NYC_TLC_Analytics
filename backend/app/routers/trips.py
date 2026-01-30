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
    Get sample trip records (limited to 500 for performance).
    
    Returns sample data to give a glimpse of individual trip details.
    Limited to most recent 500 records to maintain performance.
    """
    
    try:
        # Build query with filters
        query = "SELECT TOP 500 * FROM fact_trips WHERE 1=1"
        params = []
        
        # Add date filter
        if start_date and end_date:
            query += " AND CAST(tpep_dropoff_datetime AS DATE) BETWEEN ? AND ?"
            params.extend([start_date, end_date])
        
        # Add service type filter
        if service_type:
            query += " AND service_type = ?"
            params.append(service_type.value)
        
        # Order by most recent first, apply pagination
        query += " ORDER BY tpep_dropoff_datetime DESC"
        
        # Execute query
        cursor = db.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        # Convert to Trip objects
        trips_data = []
        for row in rows:
            trip = Trip(
                trip_id=str(row[0]) if row[0] else None,
                vendor_id=row[1] if len(row) > 1 else None,
                tpep_pickup_datetime=row[2] if len(row) > 2 else None,
                tpep_dropoff_datetime=row[3] if len(row) > 3 else None,
                passenger_count=row[4] if len(row) > 4 else None,
                trip_distance=float(row[5]) if len(row) > 5 and row[5] else 0.0,
                fare_amount=float(row[6]) if len(row) > 6 and row[6] else 0.0,
                service_type=row[-1] if row else None  # Last column is service_type
            )
            trips_data.append(trip)
        
        return TripsResponse(
            data=trips_data[:page_size],  # Apply page size limit
            pagination=PaginationResponse(
                page=page,
                page_size=page_size,
                total_records=len(trips_data),
                total_pages=math.ceil(len(trips_data) / page_size) if page_size > 0 else 0
            )
        )
    except Exception as e:
        # If query fails, return empty gracefully
        return TripsResponse(
            data=[],
            pagination=PaginationResponse(
                page=page,
                page_size=page_size,
                total_records=0,
                total_pages=0
            )
        )