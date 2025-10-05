import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",  # module:app
        host="127.0.0.1",
        port=8000,
        reload=True  # auto-reload on code changes (development mode)
    )
