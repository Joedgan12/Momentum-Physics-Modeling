"""
backend/middleware/error_handler.py
Centralized error handling and request tracking
"""

import logging
import uuid
from datetime import datetime
from flask import request, jsonify, g
import traceback


class ErrorHandler:
    """Centralized error handling for API"""
    
    def __init__(self, app):
        self.app = app
        self.logger = self._setup_logger()
        self._register_error_handlers()
    
    def _setup_logger(self):
        """Setup request/error logging."""
        logger = logging.getLogger('momentum_api')
        logger.setLevel(logging.INFO)
        
        # File handler
        handler = logging.FileHandler('backend/logs/api.log')
        handler.setLevel(logging.INFO)
        
        # Formatting
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - [%(request_id)s] - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
        return logger
    
    def _register_error_handlers(self):
        """Register Flask error handlers."""
        
        @self.app.before_request
        def before_request():
            """Attach request ID and timestamp to all requests."""
            g.request_id = str(uuid.uuid4())[:8]
            g.request_start_time = datetime.utcnow()
            g.request_user_ip = request.remote_addr
        
        @self.app.after_request
        def after_request(response):
            """Log all requests."""
            if hasattr(g, 'request_id'):
                duration = (datetime.utcnow() - g.request_start_time).total_seconds()
                self.logger.info(
                    f"{request.method} {request.path} - Status: {response.status_code} - "
                    f"Duration: {duration:.2f}s - IP: {g.request_user_ip}"
                )
            return response
        
        # 400 Bad Request
        @self.app.errorhandler(400)
        def bad_request(error):
            return self._error_response("Bad Request", 400, str(error))
        
        # 404 Not Found
        @self.app.errorhandler(404)
        def not_found(error):
            return self._error_response("Endpoint not found", 404)
        
        # 405 Method Not Allowed
        @self.app.errorhandler(405)
        def method_not_allowed(error):
            return self._error_response("Method not allowed", 405)
        
        # 429 Too Many Requests
        @self.app.errorhandler(429)
        def rate_limit_exceeded(error):
            self.logger.warning(f"Rate limit exceeded: {g.request_user_ip}")
            return self._error_response("Rate limit exceeded", 429)
        
        # 500 Internal Server Error
        @self.app.errorhandler(500)
        def internal_error(error):
            self.logger.error(f"Internal error: {str(error)}\n{traceback.format_exc()}")
            return self._error_response("Internal server error", 500)
        
        # Custom validation errors
        @self.app.errorhandler(ValueError)
        def handle_value_error(error):
            return self._error_response(str(error), 400)
    
    def _error_response(self, message: str, status_code: int, details: str = None) -> tuple:
        """Format error response."""
        response_data = {
            "ok": False,
            "error": message,
            "request_id": getattr(g, 'request_id', 'unknown')
        }
        
        if details:
            response_data["details"] = details
        
        return jsonify(response_data), status_code
    
    def log_error(self, error_type: str, message: str, context: dict = None):
        """Log custom errors."""
        log_msg = f"[{error_type}] {message}"
        if context:
            log_msg += f" - Context: {context}"
        self.logger.error(log_msg)
