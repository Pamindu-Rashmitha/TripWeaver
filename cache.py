import os
import json
import logging
import time
import fnmatch
from typing import Optional, Any
import redis.asyncio as aioredis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("tripweaver.cache")

class RedisCache:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.redis: Optional[aioredis.Redis] = None
        self.use_fallback = False
        
        # In-memory fallback stores
        self._history_fallback: dict[str, list] = {}
        self._summary_fallback: dict[str, str] = {}
        self._api_fallback: dict[str, tuple[float, Any]] = {}  

    async def connect(self):
        logger.info(f"Connecting to Redis at {self.redis_url}...")
        try:
            self.redis = aioredis.from_url(self.redis_url, decode_responses=True)
            # Verify the connection using ping
            await self.redis.ping()
            self.use_fallback = False
            logger.info("Successfully connected to Redis cache.")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis cache. Using in-memory fallback. Error: {e}")
            self.redis = None
            self.use_fallback = True

    async def disconnect(self):
        if self.redis:
            logger.info("Disconnecting from Redis cache...")
            try:
                await self.redis.aclose()
            except Exception as e:
                logger.warning(f"Error disconnecting from Redis: {e}")
            finally:
                self.redis = None

    async def get_conversation_history(self, user_key: str) -> list:
        key = f"tw:chat:history:{user_key}"
        if self.use_fallback or not self.redis:
            return self._history_fallback.get(user_key, [])
        try:
            data = await self.redis.get(key)
            if data:
                return json.loads(data)
            return []
        except Exception as e:
            logger.warning(f"Redis get_conversation_history error: {e}. Falling back to in-memory.")
            return self._history_fallback.get(user_key, [])

    async def set_conversation_history(self, user_key: str, history: list):
        self._history_fallback[user_key] = history
        if self.use_fallback or not self.redis:
            return
        key = f"tw:chat:history:{user_key}"
        try:
            # 30-minute TTL = 1800 seconds
            await self.redis.set(key, json.dumps(history), ex=1800)
        except Exception as e:
            logger.warning(f"Redis set_conversation_history error: {e}.")

    async def get_conversation_summary(self, user_key: str) -> str:
        key = f"tw:chat:summary:{user_key}"
        if self.use_fallback or not self.redis:
            return self._summary_fallback.get(user_key, "")
        try:
            data = await self.redis.get(key)
            return data if data else ""
        except Exception as e:
            logger.warning(f"Redis get_conversation_summary error: {e}. Falling back to in-memory.")
            return self._summary_fallback.get(user_key, "")

    async def set_conversation_summary(self, user_key: str, summary: str):
        self._summary_fallback[user_key] = summary
        if self.use_fallback or not self.redis:
            return
        key = f"tw:chat:summary:{user_key}"
        try:
            # 30-minute TTL = 1800 seconds
            await self.redis.set(key, summary, ex=1800)
        except Exception as e:
            logger.warning(f"Redis set_conversation_summary error: {e}.")

    async def get_cached_response(self, cache_key: str) -> Optional[Any]:
        if self.use_fallback or not self.redis:
            if cache_key in self._api_fallback:
                expiry, data = self._api_fallback[cache_key]
                if expiry > time.time():
                    return data
                else:
                    del self._api_fallback[cache_key]
            return None
        try:
            data = await self.redis.get(cache_key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.warning(f"Redis get_cached_response error for {cache_key}: {e}. Checking fallback.")
            if cache_key in self._api_fallback:
                expiry, data = self._api_fallback[cache_key]
                if expiry > time.time():
                    return data
            return None

    async def set_cached_response(self, cache_key: str, data: Any, ttl: int):
        self._api_fallback[cache_key] = (time.time() + ttl, data)
        if self.use_fallback or not self.redis:
            return
        try:
            await self.redis.set(cache_key, json.dumps(data), ex=ttl)
        except Exception as e:
            logger.warning(f"Redis set_cached_response error for {cache_key}: {e}")

    async def invalidate_pattern(self, pattern: str):
        # Invalidate in fallback
        keys_to_del = [k for k in self._api_fallback if fnmatch.fnmatch(k, pattern)]
        for k in keys_to_del:
            self._api_fallback.pop(k, None)

        if self.use_fallback or not self.redis:
            return
        try:
            keys = []
            cursor = 0
            while True:
                cursor, scan_keys = await self.redis.scan(cursor, match=pattern, count=100)
                keys.extend(scan_keys)
                if cursor == 0:
                    break
            if keys:
                await self.redis.delete(*keys)
                logger.info(f"Invalidated {len(keys)} keys matching pattern: {pattern}")
        except Exception as e:
            logger.warning(f"Redis invalidate_pattern error for {pattern}: {e}")

# Global instance
redis_cache = RedisCache()
