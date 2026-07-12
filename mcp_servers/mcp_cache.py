import os
import json
import logging
import time
import fnmatch
import hashlib
from typing import Optional, Any
import redis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mcp.cache")

class McpCache:
    def __init__(self, server_name: str):
        self.server_name = server_name
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.redis: Optional[redis.Redis] = None
        self.use_fallback = False
        
        # In-memory sync fallback
        self._fallback_store: dict[str, tuple[float, Any]] = {}
        
        try:
            self.redis = redis.from_url(self.redis_url, decode_responses=True)
            self.redis.ping()
            logger.info(f"[{self.server_name}] Connected to Redis cache.")
        except Exception as e:
            logger.warning(f"[{self.server_name}] Redis unavailable, using sync fallback. Error: {e}")
            self.redis = None
            self.use_fallback = True

    def make_key(self, tool_name: str, *args, **kwargs) -> str:
        # Create a deterministic parameter hash
        try:
            params_str = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True)
        except Exception:
            params_str = str(args) + str(kwargs)
        param_hash = hashlib.md5(params_str.encode("utf-8")).hexdigest()
        return f"tw:mcp:{self.server_name}:{tool_name}:{param_hash}"

    def get_cached(self, key: str) -> Optional[Any]:
        if self.use_fallback or not self.redis:
            if key in self._fallback_store:
                expiry, data = self._fallback_store[key]
                if expiry > time.time():
                    return data
                else:
                    del self._fallback_store[key]
            return None
        try:
            data = self.redis.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.warning(f"[{self.server_name}] Redis get error for {key}: {e}. Checking fallback.")
            if key in self._fallback_store:
                expiry, data = self._fallback_store[key]
                if expiry > time.time():
                    return data
            return None

    def set_cached(self, key: str, data: Any, ttl: int):
        self._fallback_store[key] = (time.time() + ttl, data)
        if self.use_fallback or not self.redis:
            return
        try:
            self.redis.set(key, json.dumps(data), ex=ttl)
        except Exception as e:
            logger.warning(f"[{self.server_name}] Redis set error for {key}: {e}")

    def invalidate(self, pattern: str):
        # Invalidate in fallback
        keys_to_del = [k for k in self._fallback_store if fnmatch.fnmatch(k, pattern)]
        for k in keys_to_del:
            self._fallback_store.pop(k, None)

        if self.use_fallback or not self.redis:
            return
        try:
            keys = []
            cursor = 0
            while True:
                cursor, scan_keys = self.redis.scan(cursor, match=pattern, count=100)
                keys.extend(scan_keys)
                if cursor == 0:
                    break
            if keys:
                self.redis.delete(*keys)
                logger.info(f"[{self.server_name}] Invalidated {len(keys)} keys matching pattern: {pattern}")
        except Exception as e:
            logger.warning(f"[{self.server_name}] Redis invalidate error for {pattern}: {e}")
