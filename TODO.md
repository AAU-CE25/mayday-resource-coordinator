# Project Improvement TODO List

## 🎯 Overall Assessment

Your project has a **solid foundation** with good separation of concerns (routes → logic → DAO). However, there are several improvements that would make it more maintainable, scalable, and production-ready.

---

## 🔴 Critical Issues

### 1. Duplicate Dependencies
You have TWO `requirements.txt` files with conflicting content:
- Root: `/requirements.txt` (detailed, pinned versions)
- API Service: `/api_service/requirements.txt` (minimal, unpinned)

**Problem**: Docker uses `api_service/requirements.txt` which is missing many dependencies.

**Fix**:
```bash
# Remove root requirements.txt or make it reference api_service
# Update api_service/requirements.txt with all dependencies
```

### 2. Session Management in DAOs
Each DAO method creates its own session, which is inefficient and prevents transactions:

```python
# Current (BAD)
def create_event(event_data: Event) -> Event:
    with Session(engine) as session:  # New session every call
        session.add(event_data)
        session.commit()
```

**Fix**: Use dependency injection for sessions:
```python
def create_event(event_data: Event, session: Session) -> Event:
    session.add(event_data)
    session.commit()
    session.refresh(event_data)
    return event_data
```

### 3. Missing .env File Documentation
README mentions `.env` but there's no `.env.example` file to guide setup.

### 4. No Database Migrations
You're using `create_all()` which doesn't handle schema changes properly.

---

## 🟡 Important Improvements

### 5. Project Structure

**Current issues**:
- `domain/` folder at root is unconventional
- Empty `core/` directory not being used effectively
- `clients/` directory exists but unclear purpose
- No proper configuration management

**Recommended structure**:
```
mayday-resource-coordinator/
├── api_service/
│   ├── app/
│   │   ├── api/              # All routes/endpoints
│   │   │   ├── deps.py       # Dependencies (get_session, auth, etc.)
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       └── endpoints/
│   │   │           ├── events.py
│   │   │           ├── users.py
│   │   │           └── ...
│   │   ├── core/
│   │   │   ├── config.py     # ✅ Already good
│   │   │   ├── security.py   # Auth/JWT logic
│   │   │   └── constants.py  # Status enums, etc.
│   │   ├── models/           # SQLModel database models
│   │   │   ├── __init__.py
│   │   │   ├── event.py
│   │   │   ├── user.py
│   │   │   └── ...
│   │   ├── schemas/          # Pydantic schemas (move from domain/)
│   │   │   ├── __init__.py
│   │   │   ├── event.py
│   │   │   ├── user.py
│   │   │   └── ...
│   │   ├── services/         # Business logic (rename from logic/)
│   │   │   ├── event_service.py
│   │   │   └── ...
│   │   ├── repositories/     # Data access (rename from data_access/)
│   │   │   ├── event_repo.py
│   │   │   └── ...
│   │   ├── db/
│   │   │   ├── base.py       # Import all models
│   │   │   ├── session.py    # Engine, get_session
│   │   │   └── init_db.py
│   │   ├── main.py           # ✅ FastAPI app
│   │   └── middleware/       # Custom middleware
│   ├── alembic/              # Database migrations
│   │   └── versions/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
├── suv_ui/
├── provisioning_service/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/                  # Deployment, setup scripts
├── docs/                     # Documentation
├── .env.example              # ⚠️ MISSING
├── docker-compose.yml
└── README.md
```

### 6. Models Should Be Split By Entity

**Current**: All models in one file (`models.py`)
**Better**: One model per file for clarity

### 7. Add Enums for Constants

```python
# In api_service/app/core/constants.py
from enum import Enum

class EventStatus(str, Enum):
    ACTIVE = "active"
    RESOLVED = "resolved"
    PENDING = "pending"

class UserRole(str, Enum):
    SUV = "SUV"
    VC = "VC"
    AUTHORITY = "AUTHORITY"

class ResourceStatus(str, Enum):
    AVAILABLE = "available"
    IN_USE = "in_use"
    DEPLETED = "depleted"
```

### 8. Missing Error Handling

No custom exception handlers or proper error responses.

**Add**:
```python
# api_service/app/core/exceptions.py
class AppException(Exception):
    """Base exception"""
    pass

class NotFoundError(AppException):
    """Resource not found"""
    pass

class UnauthorizedError(AppException):
    """Authentication failed"""
    pass
```

### 9. No Logging Configuration

Add structured logging:
```python
# api_service/app/core/logging.py
import logging
import sys

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)]
    )
```

### 10. Missing Database Migrations (Alembic)

**Critical for production!**

```bash
# Add to api_service/requirements.txt
alembic==1.13.0

# Initialize
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial schema"

# Apply
alembic upgrade head
```

### 11. Authentication Issues

- No refresh token implementation
- Password hashing in routes (should be in service layer)
- JWT configuration hardcoded

### 12. Testing Structure

**Current**: All tests in root `tests/`
**Better**: Mirror the app structure

```
tests/
├── conftest.py              # ✅ Good
├── unit/
│   ├── test_event_service.py
│   ├── test_user_service.py
│   └── ...
├── integration/
│   ├── test_event_api.py
│   └── ...
└── fixtures/
    └── test_data.py
```

### 13. Docker Compose Issues

```yaml
# compose.yaml issues:
# 1. Hardcoded image names (should use build args)
# 2. No health checks for app services
# 3. Missing restart policies for prod
# 4. No resource limits
```

### 14. Frontend/Backend Coupling

Hardcoded URLs in `main.py` CORS origins. Use environment variables:

```python
origins = settings.CORS_ORIGINS  # From config
```

### 15. Missing API Versioning

Routes should be versioned:
```python
# Current: /events
# Better: /api/v1/events

app.include_router(router, prefix="/api/v1")
```

### 16. No Health Checks

Add comprehensive health checks:
```python
@app.get("/health/live")
def liveness():
    return {"status": "alive"}

@app.get("/health/ready")
def readiness():
    return {
        "status": "ready",
        "database": check_database_health(),
        "version": settings.APP_VERSION
    }
```

### 17. Security Headers Missing

Add security middleware:
```python
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])
```

### 18. No Request ID Tracking

Add request ID middleware for tracing:
```python
import uuid
from starlette.middleware.base import BaseHTTPMiddleware

class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        request.state.request_id = str(uuid.uuid4())
        response = await call_next(request)
        response.headers["X-Request-ID"] = request.state.request_id
        return response
```

### 19. Provisioning Service Needs Work

- Terraform files are incomplete
- No proper error handling in Lambda
- Missing CloudWatch logs configuration
- No auto-cleanup mechanism

### 20. Documentation

**Missing**:
- API documentation (use FastAPI's built-in OpenAPI)
- Architecture diagrams
- Deployment guide
- Contributing guidelines
- API examples/Postman collection

---

## 🟢 What You're Doing Well

✅ Good separation: Routes → Logic → DAO  
✅ Using SQLModel (type-safe ORM)  
✅ FastAPI with Pydantic validation  
✅ Docker containerization  
✅ Test fixtures with pytest  
✅ Config management with pydantic-settings  
✅ GitHub Actions for CI/CD setup  
✅ Monorepo structure  

---

## 📋 Priority Action Items

### High Priority (Do First):
- [ ] 1. Consolidate requirements.txt files
- [ ] 2. Add `.env.example` file
- [ ] 3. Add Alembic for migrations
- [ ] 4. Fix session management in DAOs
- [ ] 5. Add proper error handling
- [ ] 6. Add logging configuration

### Medium Priority:
- [ ] 7. Restructure to recommended layout
- [ ] 8. Add enums for constants
- [ ] 9. Split models into separate files
- [ ] 10. Add API versioning
- [ ] 11. Implement refresh tokens
- [ ] 12. Add comprehensive health checks

### Low Priority (Nice to Have):
- [ ] 13. Add request ID tracking
- [ ] 14. Improve Docker Compose
- [ ] 15. Add security headers
- [ ] 16. Create API documentation
- [ ] 17. Add monitoring/observability

---

## 📝 Notes

- This project is on the `staging` branch
- Current pytest tests are failing (Exit Code: 1)
- AWS ECR deployment workflow is set up for releases
- Provisioning service for on-demand cloud sessions is planned
