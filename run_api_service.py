import uvicorn

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

if __name__ == "__main__":
    uvicorn.run(
    "api_service.app.main:app",  # module:app
    host="0.0.0.0",
    port=8000,
    reload=True  # auto-reload on code changes (development mode)
    )