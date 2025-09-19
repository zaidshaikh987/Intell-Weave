"""
app/routers/admin.py
- Admin/metrics endpoints (health, counts, cache flush, etc.).
"""
from fastapi import APIRouter

router = APIRouter()

@router.get("/metrics")
def metrics():
    # TODO: integrate Prometheus metrics
    return {"uptime": "unknown"}
