from __future__ import annotations

import inspect
import io
from pathlib import Path
from typing import AsyncGenerator, Optional, Tuple

import asyncio
from aiohttp import ClientSession
from miniopy_async import Minio

from core.config import SETTINGS
from core.src.repos.abc import AbcS3Client


class MinioS3Client(AbcS3Client):
    """
    Конкретная реализация AbcS3Client на базе miniopy_async.
    Поддерживает:
    - обычные операции (put/get/delete/buckets)
    - Range-стриминг через aget_object_range
    """
    
    def __init__(self) -> None:
        self._client: Optional[Minio] = None
        self._session: Optional[ClientSession] = None
        self._owns_session: bool = False

    async def _ensure_client(self) -> Minio:
        """Ленивая инициализация клиента при первом использовании."""
        if self._client is None:
            self._session = ClientSession()
            self._owns_session = True
            
            self._client = Minio(
                SETTINGS.MINIO_ENDPOINT,
                access_key=SETTINGS.MINIO_ACCESS_KEY,
                secret_key=SETTINGS.MINIO_SECRET_KEY,
                secure=SETTINGS.MINIO_SECURE,
            )
            
            if hasattr(self._client, '_http'):
                self._client._http = self._session
                
        return self._client

    async def __aenter__(self) -> "MinioS3Client":
        await self._ensure_client()
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        await self.aclose()

    async def abucket_exists(self, bucket: Path) -> bool:
        client = await self._ensure_client()
        return await client.bucket_exists(self._normalize_bucket(bucket))

    async def acreate_bucket(self, bucket: Path) -> None:
        client = await self._ensure_client()
        await client.make_bucket(self._normalize_bucket(bucket))

    async def abuckets(self):
        client = await self._ensure_client()
        buckets = await client.list_buckets()
        return [Path(b.name) for b in buckets]

    async def adelete_bucket(self, bucket: Path) -> None:
        client = await self._ensure_client()
        bname = self._normalize_bucket(bucket)
        objects = await client.list_objects(bname, recursive=True)

        from miniopy_async.deleteobjects import DeleteObject
        to_delete = [DeleteObject(obj.object_name) for obj in objects]

        if to_delete:
            await client.remove_objects(bname, to_delete)

        await client.remove_bucket(bname)

    async def aput_object(
        self, 
        bucket: Path, 
        name: str, 
        data: io.BytesIO, 
        length: int,
        content_type: str = "application/octet-stream"
    ) -> None:
        client = await self._ensure_client()
        bname = self._normalize_bucket(bucket)
        
        if not await client.bucket_exists(bname):
            await client.make_bucket(bname)

        await client.put_object(bname, name, data, length, content_type=content_type)

    async def aget_object(self, bucket: Path, name: str) -> io.BytesIO:
        """
        Возврат объекта целиком с гарантированным закрытием соединения.
        """
        client = await self._ensure_client()
        bname = self._normalize_bucket(bucket)
        resp = await client.get_object(bname, name)
        
        try:
            data = await resp.read()
            return io.BytesIO(data)
        finally:
            if hasattr(resp, 'close') and not resp.closed:
                await resp.close()
            elif hasattr(resp, 'release'):
                await resp.release()

    async def adelete_object(self, bucket: Path, name: str) -> None:
        client = await self._ensure_client()
        await client.remove_object(self._normalize_bucket(bucket), name)

    async def aget_object_range(
        self,
        bucket: Path,
        name: str,
        start: int,
        end: Optional[int],
        chunk_size: int = 1024 * 1024,
    ) -> Tuple[AsyncGenerator[bytes, None], int, int]:
        """
        Возвращает: (stream_generator, length, total_length)
        
        Стрим автоматически закрывает соединение при завершении или ошибке.
        """
        client = await self._ensure_client()
        bname = self._normalize_bucket(bucket)
        stat = await client.stat_object(bname, name)
        total_len = stat.size
        
        if start is None:
            start = 0
        if start < 0:
            start = 0

        if end is None or end >= total_len:
            end = total_len - 1

        if start > end:
            raise ValueError("Invalid bytes range")

        length = end - start + 1
        resp = await client.get_object(
            bname,
            name,
            offset=start,
            length=length,
        )

        async def stream():
            """
            Безопасный стрим с гарантированным закрытием response.
            """
            try:
                async for chunk in resp.content.iter_chunked(chunk_size):
                    yield chunk
            except (asyncio.CancelledError, GeneratorExit):
                pass
            except Exception:
                raise
            finally:
                try:
                    if hasattr(resp, 'close') and not resp.closed:
                        await resp.close()
                    elif hasattr(resp, 'release'):
                        await resp.release()
                except Exception:
                    pass

        return stream(), length, total_len

    def _normalize_bucket(self, bucket: Path) -> str:
        name = bucket.as_posix().strip("/")
        if getattr(SETTINGS, "TEST", False):
            name = f"test-bucket--{name}"
        return name

    async def aclose(self) -> None:
        """
        Корректное закрытие всех соединений.
        """
        if self._client:
            if hasattr(self._client, 'close'):
                try:
                    result = self._client.close()
                    if inspect.isawaitable(result):
                        await result
                except Exception:
                    pass
            
            if hasattr(self._client, '_http') and self._client._http:
                try:
                    if hasattr(self._client._http, 'close'):
                        close_result = self._client._http.close()
                        if inspect.isawaitable(close_result):
                            await close_result
                except Exception:
                    pass

        if self._session and self._owns_session and not self._session.closed:
            try:
                await self._session.close()
                await asyncio.sleep(0.25)
            except Exception:
                pass

        self._client = None
        self._session = None
