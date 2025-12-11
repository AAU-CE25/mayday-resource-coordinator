# Mayday Resource Coordinator

Full-stack emergency coordination platform with a FastAPI backend, an admin dashboard (Next.js), and a mobile-first SUV volunteer app (Next.js). Infrastructure is provisioned for AWS ECS/ECR with Terraform.

## Services
- `api_service`: FastAPI for events, volunteers, resources, locations, auth, stats, health.
- `frontend`: Admin/dashboard UI (Next.js, port 3000).
- `suv_ui`: Mobile-first volunteer UI (Next.js, port 3030).
- `db`: Postgres (compose) or the Terraform-managed Postgres service in AWS.

## Environment
Create `.env` and `.env.docker` at repo root (compose reads them). Critical variables:
```
POSTGRES_USER=youruser
POSTGRES_PASSWORD=yourpass
POSTGRES_DB=db
POSTGRES_HOST=db
POSTGRES_PORT=5432
SECRET_KEY=your-dev-secret
ENVIRONMENT=development
DEBUG=true
```
For frontends, set at build/runtime:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
PORT=3030          # suv_ui only
```

## Running locally (Docker)
```bash
docker compose up --build
```
Exposes: API `http://localhost:8000`, admin UI `http://localhost:3000/dashboard`, SUV UI `http://localhost:3030`, Postgres on 5432.

## Running locally (without Docker)
Backend:
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Option A: entry script
python run_api_service.py
# Option B: direct uvicorn
uvicorn api_service.app.main:app --reload --host 0.0.0.0 --port 8000
```
Admin UI:
```bash
cd frontend
npm install
npm run dev  # http://localhost:3000
```
SUV UI:
```bash
cd suv_ui
npm install
npm run dev  # http://localhost:3030
```

## Implementation overview
- Backend: layered architecture (routes → logic → DAO → DB) with SQLModel, JWT auth (roles: SUV, VC, AUTHORITY), health at `/health`, stats at `/stats/`.
- Frontends: Next.js apps; API base URL injected via `NEXT_PUBLIC_API_URL`.
- Infra: `infra/terraform` provisions VPC/ALB/ECS/Postgres/services; `infra/terraform-ecr` manages ECR repos separately; IAM policies for GitHub Actions live in `infra/iam-policies`.

## Key endpoints (API)
- Auth: `POST /auth/register`, `POST /auth/login`
- Users: CRUD at `/users`
- Events: `/events`, `/events/ingest`
- Volunteers: `/volunteers`, `/volunteers/active`
- Resources: `/resources/needed`, `/resources/available`
- Locations: `/locations`
- Stats/Health: `/stats`, `/health`

## Testing
```bash
pytest tests -q
```
CI runs on pushes/PRs to `main` and `staging` (`.github/workflows/tests.yml`).

## Deployment (AWS, summary)
1) Deploy ECR stack: `infra/terraform-ecr` (keeps images persistent).  
2) Build/push images to ECR (see `infra/scripts`).  
3) Deploy main stack: `infra/terraform` (`terraform init/plan/apply`).  
Outputs include ALB URLs and service endpoints.

