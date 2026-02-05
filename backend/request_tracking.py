"""
Request Tracking Module for Casino Card Game API

Provides request ID generation and tracking for distributed tracing
and log correlation across services.

Features:
    - Unique request ID generation
    - Request ID propagation via headers
    - Logging context injection
    - Response header injection
"""

import uuid
import time
import logging
from typing import Callable, Optional
from contextvars import ContextVar
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

# Context variable for request ID (thread-safe)
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
    start_time = request_start_time_var.get()
    if start_time:
        return (time.time() - start_time) * 1000
    return None


class RequestTrackingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for request tracking and logging.
    
    Adds request ID to all requests and responses for tracing.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Get or generate request ID
        request_id = request.headers.get(REQUEST_ID_HEADER)
        correlation_id = request.headers.get(CORRELATION_ID_HEADER)
        
        if not request_id:
            request_id = generate_request_id()
        
        # Use correlation ID if provided, otherwise use request ID
        if not correlation_id:
            correlation_id = request_id
        
        # Set context variables
        request_id_var.set(request_id)
        request_start_time_var.set(time.time())
        
        # Log request start
        logger.info(
            f"Request started",
            extra={
                "request_id": request_id,
                "correlation_id": correlation_id,
                "method": request.method,
                "path": request.url.path,
                "client_ip": self._get_client_ip(request)
            }
        )
        
        try:
            # Process request
            response = await call_next(request)
            
            # Add tracking headers to response
            response.headers[REQUEST_ID_HEADER] = request_id
            response.headers[CORRELATION_ID_HEADER] = correlation_id
            
            # Log request completion
            duration = get_request_duration()
            logger.info(
                f"Request completed",
                extra={
                    "request_id": request_id,
                    "correlation_id": correlation_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": round(duration, 2) if duration else None
                }
            )
            
            return response
            
        except Exception as e:
            # Log request error
            duration = get_request_duration()
            logger.error(
                f"Request failed: {str(e)}",
                extra={
                    "request_id": request_id,
                    "correlation_id": correlation_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": round(duration, 2) if duration else None,
                    "error": str(e)
                }
            )
            raise
        
        finally:
            # Clear context
            request_id_var.set(None)
            request_start_time_var.set(None)
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request, handling proxies."""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "127.0.0.1"


class RequestIDFilter(logging.Filter):
    """
    Logging filter that adds request ID to log records.
    
    Usage:
        handler.addFilter(RequestIDFilter())
        formatter = logging.Formatter('%(request_id)s - %(message)s')
    """
    
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_request_id() or "no-request-id"
        return True


def setup_request_tracking_logging():
    """
    Configure logging to include request IDs.
    
    Call this during application startup.
    """
    # Add filter to root logger
    root_logger = logging.getLogger()
    request_filter = RequestIDFilter()
    
    for handler in root_logger.handlers:
        handler.addFilter(request_filter)
    
    logger.info("Request tracking logging configured")
