if __name__ == "__main__":
    from api.src.app import app
    import uvicorn

    uvicorn.run(app=app)