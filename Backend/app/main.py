"""
FastAPI application factory.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api import decisions, runs, workflow, council


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    
    application = FastAPI(
        title=settings.app_name,
        description="SIMORGH Platform — AI-powered decision council for business intelligence",
        version="0.3.0",  # Updated for Phase 3 - Council Execution
        debug=settings.debug,
    )
    
    # CORS middleware for frontend communication
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include routers
    application.include_router(decisions.router, prefix="/api/decisions", tags=["decisions"])
    application.include_router(runs.router, prefix="/api/runs", tags=["runs"])
    application.include_router(workflow.router, prefix="/api/runs", tags=["workflow"])
    application.include_router(council.router, prefix="/api/runs", tags=["council"])
    
    @application.get("/health")
    def health_check():
        return {"status": "healthy", "environment": settings.environment}
    
    return application


app = create_application()
