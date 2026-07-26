from fastapi import APIRouter, Query, Depends
from app.core.deps import get_current_user
from app.core.supabase import get_supabase_client
from app.core.audit_logger import audit_logger
from app.services.recommendation_engine import RecommendationEngine

router = APIRouter()


def _get_engine() -> RecommendationEngine:
    client = get_supabase_client()
    return RecommendationEngine(client)


@router.get(
    "/recommendations",
    summary="Get AI-powered job recommendations",
    description="Returns personalized job recommendations based on profile, skills, and semantic similarity.",
    responses={200: {"description": "Recommendations returned"}},
    tags=["Recommendations"],
)
async def get_recommendations(
    limit: int = Query(default=10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
):
    engine = _get_engine()
    recommendations = engine.get_recommendations(
        user_id=current_user["user_id"],
        limit=limit,
        include_reasons=False,
    )
    return {"success": True, "data": recommendations, "count": len(recommendations)}


@router.get(
    "/recommendations/reasons",
    summary="Get recommendations with detailed reasons",
    description="Returns job recommendations with match reasons, skill analysis, and learning suggestions.",
    responses={200: {"description": "Recommendations with reasons returned"}},
    tags=["Recommendations"],
)
async def get_recommendations_with_reasons(
    limit: int = Query(default=5, ge=1, le=20),
    current_user: dict = Depends(get_current_user),
):
    engine = _get_engine()
    recommendations = engine.get_recommendations(
        user_id=current_user["user_id"],
        limit=limit,
        include_reasons=True,
    )

    audit_logger.log_ai(
        "get_recommendations_detailed",
        current_user["user_id"],
        details={"count": len(recommendations)},
    )

    return {"success": True, "data": recommendations, "count": len(recommendations)}
