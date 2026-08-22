from fastapi import FastAPI

app = FastAPI(title="Napkin API", docs_url=None, redoc_url=None)


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok"}

