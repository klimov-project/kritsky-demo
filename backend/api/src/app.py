from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from api.src.admin.router import router as admin_router
from api.src.auth.router import router as auth_router
from api.src.knowledge_base.router import router as knowledge_base_router
from api.src.knowledge_base.utils import warm_knowledge_base_cache_from_db
from api.src.shop.router import router as shop_router
from api.src.variants.router import router as variants_router
from api.src.variants.utils import warm_runtime_variant_payload_cache
from db.src.base import Base
from db.src.connect import engine


app = FastAPI(title="Kritsky API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    warm_knowledge_base_cache_from_db()
    warm_runtime_variant_payload_cache()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(knowledge_base_router)
app.include_router(auth_router)
app.include_router(shop_router)
app.include_router(variants_router)
app.include_router(admin_router)
