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
        # Build query to get actual trip records from fact_trips table
        # Limited to first 500 records for performance (table has 159.5M records)
        where_clauses = ["1=1"]
        params = []
        
        # Add date filter
        if start_date and end_date:
            where_clauses.append("CAST(tpep_dropoff_datetime AS DATE) BETWEEN ? AND ?")
            params.extend([start_date, end_date])
        
        # Add service type filter
        if service_type:
            where_clauses.append("service_type = ?")
            params.append(service_type.value)
        
        where_sql = " AND ".join(where_clauses)
        
        # Get total count (approximate - limited to 500 for performance)
        count_query = f"SELECT COUNT(*) as total FROM (SELECT TOP 500 1 FROM fact_trips WHERE {where_sql}) AS t"
        total_records = db.execute_scalar(count_query, tuple(params))
        total_records = min(total_records if total_records else 0, 500)  # Cap at 500
        
        # Get actual trip records (limited to first 500)
        offset = (page - 1) * page_size
        query = f"""
            SELECT TOP 500
                trip_id,
                service_type,
                tpep_pickup_datetime as pickup_datetime,
                tpep_dropoff_datetime as dropoff_datetime,
                pickup_borough,
                pickup_zone,
                dropoff_borough,
                dropoff_zone,
                trip_distance,
                total_amount,
                CAST(DATEDIFF(SECOND, tpep_pickup_datetime, tpep_dropoff_datetime) AS INT) as trip_duration_sec
            FROM fact_trips 
            WHERE {where_sql}
            ORDER BY tpep_dropoff_datetime DESC
            OFFSET {offset} ROWS FETCH NEXT {page_size} ROWS ONLY
        """
        
        result = db.execute_query(query, tuple(params))
        
        # Convert to Trip objects
        trips_data = []
        for row in result:
            try:
                trip = Trip(
                    trip_id=int(row['trip_id']) if row['trip_id'] else 0,
                    service_type=row['service_type'],
                    pickup_datetime=row['pickup_datetime'],
                    dropoff_datetime=row['dropoff_datetime'],
                    pickup_borough=row.get('pickup_borough'),
                    pickup_zone=row.get('pickup_zone'),
                    dropoff_borough=row.get('dropoff_borough'),
                    dropoff_zone=row.get('dropoff_zone'),
                    trip_distance=float(row['trip_distance']) if row.get('trip_distance') else 0.0,
                    total_amount=float(row['total_amount']) if row.get('total_amount') else 0.0,
                    trip_duration_sec=int(row['trip_duration_sec']) if row.get('trip_duration_sec') else 0
                )
                trips_data.append(trip)
            except (KeyError, ValueError, TypeError) as e:
                print(f"Skipping row: {e}")
                continue
        
        return TripsResponse(
            data=trips_data,
            pagination=PaginationResponse(
                page=page,
                page_size=page_size,
                total_records=total_records,
                total_pages=math.ceil(total_records / page_size) if page_size > 0 else 0
            )
        )
    except Exception as e:
        print(f"Error fetching trips: {e}")
        import traceback
        traceback.print_exc()
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