from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from api.src.admin.router import router as admin_router
from api.src.auth.router import router as auth_router
from api.src.knowledge_base.router import router as knowledge_base_router
from api.src.knowledge_base.utils import warm_knowledge_base_cache_from_db
from api.src.shop.router import router as shop_router
from api.src.variants.router import router as variants_router
from api.src.variants.folders_router import router as folder_router
from api.src.variants.router import warm_runtime_variant_payload_cache
from db.src.base import Base
from db.src.connect import engine


from contextlib import asynccontextmanager
import asyncio


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    warm_knowledge_base_cache_from_db()
    warm_runtime_variant_payload_cache()
    
    # Start background variant pool refill
    from api.src.variants.router import _refill_variant_pool_loop_v2
    pool_task = asyncio.create_task(_refill_variant_pool_loop_v2())
    
    yield
    
    # Shutdown
    pool_task.cancel()
    try:
        await pool_task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="Kritsky API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(knowledge_base_router)
app.include_router(auth_router)
app.include_router(shop_router)
app.include_router(variants_router)
app.include_router(folder_router)
app.include_router(admin_router)
