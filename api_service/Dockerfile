# ---------- Base image ----------
FROM python:3.11-slim

# ---------- Set working directory ----------
WORKDIR /application

# ---------- Install dependencies ----------
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# ---------- Copy project ----------
COPY . .

# ---------- Expose FastAPI port ----------
EXPOSE 8000

# ---------- Command to run FastAPI ----------
# Use uvicorn to start the server
CMD ["python3", "run.py"]
