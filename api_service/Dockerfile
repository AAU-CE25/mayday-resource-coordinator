# ---------- Base image ----------
FROM python:3.11-slim

# ---------- Set working directory ----------
WORKDIR /app/

# ---------- Install system dependencies ----------
RUN apt-get update \
    && apt-get install -y --no-install-recommends

# ---------- Copy dependencies ----------
COPY api_service/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# ---------- Copy source code ----------
# We assume build context is the project root!
COPY api_service ./api_service
COPY domain ./domain

# ---------- Expose FastAPI port ----------
EXPOSE 8000

# ---------- Run FastAPI app ----------
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
