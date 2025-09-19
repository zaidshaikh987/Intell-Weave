"""
app/core/monitoring.py
- Prometheus metrics, health checks, and observability setup.
"""
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response
import time
import psutil
import logging
from typing import Dict, Any
from datetime import datetime
import structlog

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Prometheus Metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)

REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

ACTIVE_CONNECTIONS = Gauge(
    'active_connections',
    'Number of active connections'
)

# Application-specific metrics
ARTICLES_PROCESSED = Counter(
    'articles_processed_total',
    'Total articles processed',
    ['source', 'status']
)

NLP_PROCESSING_TIME = Histogram(
    'nlp_processing_duration_seconds',
    'NLP processing duration in seconds',
    ['operation']
)

CREDIBILITY_SCORES = Histogram(
    'credibility_scores',
    'Distribution of credibility scores',
    buckets=[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
)

CHAT_INTERACTIONS = Counter(
    'chat_interactions_total',
    'Total chat interactions',
    ['type', 'status']
)

RECOMMENDATION_ACCURACY = Gauge(
    'recommendation_accuracy',
    'Current recommendation system accuracy'
)

# System metrics
SYSTEM_CPU_USAGE = Gauge('system_cpu_usage_percent', 'System CPU usage percentage')
SYSTEM_MEMORY_USAGE = Gauge('system_memory_usage_percent', 'System memory usage percentage')
SYSTEM_DISK_USAGE = Gauge('system_disk_usage_percent', 'System disk usage percentage')

class MetricsCollector:
    """Collect and expose application metrics."""
    
    def __init__(self):
        self.start_time = time.time()
    
    def record_request(self, method: str, endpoint: str, status_code: int, duration: float):
        """Record HTTP request metrics."""
        REQUEST_COUNT.labels(method=method, endpoint=endpoint, status_code=status_code).inc()
        REQUEST_DURATION.labels(method=method, endpoint=endpoint).observe(duration)
    
    def record_article_processing(self, source: str, status: str):
        """Record article processing metrics."""
        ARTICLES_PROCESSED.labels(source=source, status=status).inc()
    
    def record_nlp_processing(self, operation: str, duration: float):
        """Record NLP processing metrics."""
        NLP_PROCESSING_TIME.labels(operation=operation).observe(duration)
    
    def record_credibility_score(self, score: float):
        """Record credibility score distribution."""
        CREDIBILITY_SCORES.observe(score)
    
    def record_chat_interaction(self, interaction_type: str, status: str):
        """Record chat interaction metrics."""
        CHAT_INTERACTIONS.labels(type=interaction_type, status=status).inc()
    
    def update_system_metrics(self):
        """Update system resource metrics."""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            SYSTEM_CPU_USAGE.set(cpu_percent)
            
            # Memory usage
            memory = psutil.virtual_memory()
            SYSTEM_MEMORY_USAGE.set(memory.percent)
            
            # Disk usage
            disk = psutil.disk_usage('/')
            disk_percent = (disk.used / disk.total) * 100
            SYSTEM_DISK_USAGE.set(disk_percent)
            
        except Exception as e:
            logger.error("Failed to update system metrics", error=str(e))
    
    def get_metrics(self) -> str:
        """Get Prometheus metrics in text format."""
        self.update_system_metrics()
        return generate_latest()

# Global metrics collector
metrics_collector = MetricsCollector()

class HealthChecker:
    """Application health checking."""
    
    def __init__(self):
        self.checks = {}
    
    def register_check(self, name: str, check_func):
        """Register a health check function."""
        self.checks[name] = check_func
    
    async def check_database(self) -> Dict[str, Any]:
        """Check database connectivity."""
        try:
            from ..core.db import get_db
            db = next(get_db())
            
            # Simple query to test connection
            result = db.execute("SELECT 1").scalar()
            
            return {
                "status": "healthy" if result == 1 else "unhealthy",
                "response_time_ms": 0,  # Would measure actual time
                "details": "Database connection successful"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "response_time_ms": 0,
                "details": f"Database connection failed: {str(e)}"
            }
    
    async def check_redis(self) -> Dict[str, Any]:
        """Check Redis connectivity."""
        try:
            from ..core.security import redis_client
            
            start_time = time.time()
            redis_client.ping()
            response_time = (time.time() - start_time) * 1000
            
            return {
                "status": "healthy",
                "response_time_ms": response_time,
                "details": "Redis connection successful"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "response_time_ms": 0,
                "details": f"Redis connection failed: {str(e)}"
            }
    
    async def check_nlp_models(self) -> Dict[str, Any]:
        """Check NLP models availability."""
        try:
            from ..services.nlp import nlp
            
            # Test basic NLP functionality
            start_time = time.time()
            result = nlp.analyze("Test text for health check")
            response_time = (time.time() - start_time) * 1000
            
            return {
                "status": "healthy" if result else "unhealthy",
                "response_time_ms": response_time,
                "details": "NLP models loaded and functional"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "response_time_ms": 0,
                "details": f"NLP models check failed: {str(e)}"
            }
    
    async def check_system_resources(self) -> Dict[str, Any]:
        """Check system resource usage."""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Define thresholds
            cpu_threshold = 90
            memory_threshold = 90
            disk_threshold = 90
            
            issues = []
            if cpu_percent > cpu_threshold:
                issues.append(f"High CPU usage: {cpu_percent}%")
            if memory.percent > memory_threshold:
                issues.append(f"High memory usage: {memory.percent}%")
            if (disk.used / disk.total * 100) > disk_threshold:
                issues.append(f"High disk usage: {disk.used / disk.total * 100:.1f}%")
            
            status = "unhealthy" if issues else "healthy"
            details = "; ".join(issues) if issues else "System resources within normal limits"
            
            return {
                "status": status,
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "disk_percent": disk.used / disk.total * 100,
                "details": details
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "details": f"System resource check failed: {str(e)}"
            }
    
    async def get_health_status(self) -> Dict[str, Any]:
        """Get overall health status."""
        checks = {
            "database": await self.check_database(),
            "redis": await self.check_redis(),
            "nlp_models": await self.check_nlp_models(),
            "system_resources": await self.check_system_resources()
        }
        
        # Determine overall status
        all_healthy = all(check["status"] == "healthy" for check in checks.values())
        overall_status = "healthy" if all_healthy else "unhealthy"
        
        return {
            "status": overall_status,
            "timestamp": datetime.utcnow().isoformat(),
            "uptime_seconds": time.time() - metrics_collector.start_time,
            "checks": checks
        }

# Global health checker
health_checker = HealthChecker()

class PerformanceMonitor:
    """Monitor application performance."""
    
    def __init__(self):
        self.request_times = []
        self.error_counts = {}
    
    def record_request_time(self, endpoint: str, duration: float):
        """Record request processing time."""
        self.request_times.append({
            "endpoint": endpoint,
            "duration": duration,
            "timestamp": time.time()
        })
        
        # Keep only last 1000 requests
        if len(self.request_times) > 1000:
            self.request_times = self.request_times[-1000:]
    
    def record_error(self, error_type: str):
        """Record error occurrence."""
        self.error_counts[error_type] = self.error_counts.get(error_type, 0) + 1
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics."""
        if not self.request_times:
            return {"message": "No performance data available"}
        
        recent_times = [r["duration"] for r in self.request_times[-100:]]
        
        return {
            "avg_response_time": sum(recent_times) / len(recent_times),
            "min_response_time": min(recent_times),
            "max_response_time": max(recent_times),
            "total_requests": len(self.request_times),
            "error_counts": self.error_counts,
            "p95_response_time": sorted(recent_times)[int(len(recent_times) * 0.95)] if recent_times else 0
        }

# Global performance monitor
performance_monitor = PerformanceMonitor()

def setup_logging():
    """Setup application logging configuration."""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Set specific log levels
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("transformers").setLevel(logging.WARNING)

class AlertManager:
    """Manage system alerts and notifications."""
    
    def __init__(self):
        self.alert_thresholds = {
            "cpu_usage": 85,
            "memory_usage": 85,
            "disk_usage": 85,
            "error_rate": 5,  # errors per minute
            "response_time": 2.0  # seconds
        }
        self.active_alerts = {}
    
    def check_alerts(self):
        """Check for alert conditions."""
        alerts = []
        
        try:
            # Check system resources
            cpu_percent = psutil.cpu_percent()
            memory_percent = psutil.virtual_memory().percent
            
            if cpu_percent > self.alert_thresholds["cpu_usage"]:
                alerts.append({
                    "type": "high_cpu_usage",
                    "severity": "warning",
                    "message": f"CPU usage is {cpu_percent}%",
                    "threshold": self.alert_thresholds["cpu_usage"]
                })
            
            if memory_percent > self.alert_thresholds["memory_usage"]:
                alerts.append({
                    "type": "high_memory_usage",
                    "severity": "warning",
                    "message": f"Memory usage is {memory_percent}%",
                    "threshold": self.alert_thresholds["memory_usage"]
                })
            
            # Check performance metrics
            perf_stats = performance_monitor.get_performance_stats()
            if isinstance(perf_stats, dict) and "avg_response_time" in perf_stats:
                if perf_stats["avg_response_time"] > self.alert_thresholds["response_time"]:
                    alerts.append({
                        "type": "high_response_time",
                        "severity": "warning",
                        "message": f"Average response time is {perf_stats['avg_response_time']:.2f}s",
                        "threshold": self.alert_thresholds["response_time"]
                    })
            
        except Exception as e:
            logger.error("Alert checking failed", error=str(e))
        
        return alerts
    
    def send_alert(self, alert: Dict[str, Any]):
        """Send alert notification (placeholder for actual implementation)."""
        logger.warning("ALERT", alert=alert)
        # In production, this would send to Slack, email, PagerDuty, etc.

# Global alert manager
alert_manager = AlertManager()

def create_metrics_response() -> Response:
    """Create Prometheus metrics response."""
    metrics_data = metrics_collector.get_metrics()
    return Response(content=metrics_data, media_type=CONTENT_TYPE_LATEST)
