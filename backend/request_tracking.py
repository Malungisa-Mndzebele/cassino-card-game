"""
Request Tracking Module for Casino Card Game API

Provides request ID generation and tracking for distributed tracing
and log correlation across services.
"""

import uuid
import time
import logging
from typing import Callable, Optional
from contextvars import ContextVar
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

# Context variables for request tracking (thread-safe)
request_id_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)
request_start_time_var: ContextVar[Optional[float]] = ContextVar("request_start_time", default=None)

# Header names
REQUEST_ID_HEADER = "X-Request-ID"
CORRELATION_ID_HEADER = "X-Correlation-ID"


def generate_request_id() -> str:
    """Generate a unique request ID."""
    return str(uuid.uuid4())


def get_request_id() -> Optional[str]:
    """Get the current request ID from context."""
    return request_id_var.get()


def get_request_duration() -> Optional[float]:
    """Get the duration of the current request in milliseconds."""
    if start_time := request_start_time_var.get():
        return (time.time() - start_time) * 1000
    return None


def _get_client_ip(request: Request) -> str:
    """Extract client IP from request, handling proxies."""
    if forwarded := request.headers.get("X-Forwarded-For"):
        return forwarded.split(",")[0].strip()
    if real_ip := request.headers.get("X-Real-IP"):
        return real_ip
    return request.client.host if request.client else "127.0.0.1"


class RequestTrackingMiddleware(BaseHTTPMiddleware):
    """Middleware for request tracking and logging."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get(REQUEST_ID_HEADER) or generate_request_id()
        correlation_id = request.headers.get(CORRELATION_ID_HEADER) or request_id
        
        request_id_var.set(request_id)
        request_start_time_var.set(time.time())
        
        log_context = {
            "request_id": request_id,
            "correlation_id": correlation_id,
            "method": request.method,
            "path": request.url.path,
        }
        
        logger.info("Request started", extra={**log_context, "client_ip": _get_client_ip(request)})
        
        try:
            response = await call_next(request)
            response.headers[REQUEST_ID_HEADER] = request_id
            response.headers[CORRELATION_ID_HEADER] = correlation_id
            
            duration = get_request_duration()
            logger.info(
                "Request completed",
                extra={**log_context, "status_code": response.status_code, "duration_ms": round(duration, 2) if duration else None}
            )
            return response
            
        except Exception as e:
            duration = get_request_duration()
            logger.error(
                f"Request failed: {e}",
                extra={**log_context, "duration_ms": round(duration, 2) if duration else None, "error": str(e)}
            )
            raise
        finally:
            request_id_var.set(None)
            request_start_time_var.set(None)


class RequestIDFilter(logging.Filter):
    """Logging filter that adds request ID to log records."""
    
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_request_id() or "no-request-id"
        return True


def setup_request_tracking_logging():
    """Configure logging to include request IDs."""
    root_logger = logging.getLogger()
    request_filter = RequestIDFilter()
    
    for handler in root_logger.handlers:
        handler.addFilter(request_filter)
    
    logger.info("Request tracking logging configured")
