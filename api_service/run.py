import uvicorn

def run():
    uvicorn.run(
        "app.main:app",  # module:app
        host="0.0.0.0",
        port=8000,
        reload=True  # auto-reload on code changes (development mode)
    )
