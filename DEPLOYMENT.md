# 🚀 Intell Weave Deployment Guide

Complete setup instructions for running Intell Weave in development and production environments.

## 📋 Prerequisites

### System Requirements
- **Python**: 3.10+
- **Node.js**: 18+
- **PostgreSQL**: 14+ (with pgvector extension)
- **Redis**: 6+
- **Docker**: 20+ (for containerized deployment)
- **Docker Compose**: 2.0+

### Hardware Recommendations
- **Development**: 8GB RAM, 4 CPU cores, 50GB storage
- **Production**: 16GB+ RAM, 8+ CPU cores, 200GB+ storage

## 🛠️ Development Setup

### 1. Clone and Setup Environment

```bash
# Clone the repository
git clone <your-repo-url>
cd Intell\ Weave

# Copy environment file
cp .env.example .env

# Edit .env file with your configuration
# Important: Change all default passwords and secrets!
```

### 2. Database Setup

```bash
# Start PostgreSQL (if not running)
# On Windows with PostgreSQL installed:
net start postgresql-x64-14

# Create database
createdb intell_weave

# Install pgvector extension
psql -d intell_weave -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Apply schema
psql -d intell_weave -f backend/app/models/sql_ddl.sql
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Download spaCy models
python -m spacy download en_core_web_sm
python -m spacy download es_core_news_sm  # Optional
python -m spacy download fr_core_news_sm  # Optional
python -m spacy download de_core_news_sm  # Optional

# Start Redis (if not running)
# On Windows: Start Redis service
# On macOS: brew services start redis
# On Linux: sudo systemctl start redis

# Start the backend server
uvicorn app.main:app --reload --port 8000 --app-dir app
```

### 4. Frontend Setup

```bash
# Open new terminal and navigate to project root
cd /path/to/Intell\ Weave

# Install Node.js dependencies
npm install

# Start development server
npm run dev
```

### 5. Verify Installation

1. **Backend API**: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Health Check: http://localhost:8000/healthz
   - Metrics: http://localhost:8000/metrics

2. **Frontend**: http://localhost:5173
   - All pages should load without errors
   - Chat functionality should work (if OpenAI key configured)

## 🐳 Production Deployment with Docker

### 1. Environment Configuration

```bash
# Copy and configure production environment
cp .env.example .env

# Edit .env with production values:
# - Strong passwords for all services
# - Production database URLs
# - OpenAI API key for AI features
# - Secure JWT secrets
```

### 2. Build and Deploy

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Initialize Database

```bash
# Wait for PostgreSQL to be ready, then initialize
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d intell_weave -c "CREATE EXTENSION IF NOT EXISTS vector;"

# The schema is automatically applied via init script
```

### 4. Access Services

- **Application**: http://localhost (via Nginx)
- **API**: http://localhost/api
- **Grafana Dashboard**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **MinIO Console**: http://localhost:9001

## 🔧 Configuration Guide

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `POSTGRES_PASSWORD` | PostgreSQL password | - | ✅ |
| `REDIS_PASSWORD` | Redis password | - | ✅ |
| `OPENAI_API_KEY` | OpenAI API key for AI features | - | ⚠️ |
| `JWT_SECRET_KEY` | JWT signing secret | - | ✅ |
| `MINIO_ROOT_USER` | MinIO admin username | minioadmin | ✅ |
| `MINIO_ROOT_PASSWORD` | MinIO admin password | - | ✅ |

### Security Configuration

1. **Change Default Passwords**: Update all default passwords in `.env`
2. **JWT Secret**: Use a strong, random JWT secret key
3. **CORS Origins**: Configure specific origins for production
4. **Rate Limiting**: Adjust rate limits in Nginx configuration
5. **SSL/TLS**: Configure SSL certificates for HTTPS

### Performance Tuning

1. **Database**: Adjust PostgreSQL settings for your workload
2. **Redis**: Configure memory limits and persistence
3. **Worker Processes**: Scale Celery workers based on CPU cores
4. **Caching**: Configure CDN for static assets

## 📊 Monitoring and Observability

### Grafana Dashboards

1. Access Grafana at http://localhost:3001
2. Login with admin/admin123 (change password!)
3. Import pre-configured dashboards:
   - System Metrics
   - Application Performance
   - NLP Processing Stats
   - User Engagement

### Key Metrics to Monitor

- **Response Time**: API endpoint latency
- **Error Rate**: 4xx/5xx error percentage
- **Throughput**: Requests per second
- **Resource Usage**: CPU, memory, disk
- **NLP Processing**: Processing time and queue length
- **Database**: Connection pool, query performance

### Alerts Configuration

Configure alerts for:
- High error rates (>5%)
- Slow response times (>2s)
- High resource usage (>85%)
- Service downtime
- Database connection issues

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check PostgreSQL status
   docker-compose -f docker-compose.prod.yml logs postgres
   
   # Verify connection
   docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -l
   ```

2. **NLP Models Not Loading**
   ```bash
   # Check if spaCy models are installed
   docker-compose -f docker-compose.prod.yml exec backend python -m spacy info
   
   # Download missing models
   docker-compose -f docker-compose.prod.yml exec backend python -m spacy download en_core_web_sm
   ```

3. **High Memory Usage**
   ```bash
   # Check memory usage
   docker stats
   
   # Restart services if needed
   docker-compose -f docker-compose.prod.yml restart backend
   ```

4. **Chat Not Working**
   - Verify OpenAI API key is set
   - Check backend logs for API errors
   - Ensure vector database is properly initialized

### Log Locations

- **Application Logs**: `./backend/logs/`
- **Nginx Logs**: Docker container logs
- **Database Logs**: Docker container logs
- **System Logs**: Check with `docker-compose logs`

## 🔄 Maintenance

### Regular Tasks

1. **Database Backup**
   ```bash
   # Backup database
   docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres intell_weave > backup.sql
   ```

2. **Update Dependencies**
   ```bash
   # Update Python packages
   pip install -r requirements.txt --upgrade
   
   # Update Node packages
   npm update
   ```

3. **Clean Up Storage**
   ```bash
   # Clean Docker images
   docker system prune -a
   
   # Clean old logs
   find ./backend/logs -name "*.log" -mtime +30 -delete
   ```

### Scaling

1. **Horizontal Scaling**: Add more backend/worker containers
2. **Database Scaling**: Configure read replicas
3. **Load Balancing**: Add multiple Nginx instances
4. **CDN**: Configure CloudFlare or AWS CloudFront

## 🚨 Security Checklist

- [ ] Changed all default passwords
- [ ] Configured strong JWT secrets
- [ ] Set up HTTPS with valid certificates
- [ ] Configured firewall rules
- [ ] Set up regular security updates
- [ ] Configured backup and disaster recovery
- [ ] Set up monitoring and alerting
- [ ] Reviewed and configured CORS origins
- [ ] Set up rate limiting
- [ ] Configured input validation

## 📞 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review application logs
3. Check GitHub issues
4. Contact the development team

---

**🎉 Congratulations!** Your Intell Weave platform is now ready for production use with advanced AI capabilities, comprehensive monitoring, and enterprise-grade security.
