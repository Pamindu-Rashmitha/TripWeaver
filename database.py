import os
import logging
from typing import List, Dict, Optional
from supabase import create_client, Client

logger = logging.getLogger("tripweaver.database")

class SupabaseDB:
    def __init__(self):
        url: str = os.environ.get("SUPABASE_URL", "")
        key: str = os.environ.get("SUPABASE_KEY", "")
        
        self.client: Optional[Client] = None
        if url and key:
            try:
                self.client = create_client(url, key)
                logger.info("Successfully connected to Supabase.")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
        else:
            logger.warning("SUPABASE_URL or SUPABASE_KEY not found. Supabase features will be disabled.")

    def is_enabled(self) -> bool:
        return self.client is not None

    def get_conversations(self, user_id: str) -> List[Dict]:
        if not self.is_enabled():
            return []
        try:
            response = self.client.table("conversations").select("*").eq("user_id", user_id).order("updated_at", desc=True).execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching conversations: {e}")
            return []

    def create_conversation(self, user_id: str, title: str = "New Chat") -> Optional[str]:
        if not self.is_enabled():
            return None
        try:
            data = {"user_id": user_id, "title": title}
            response = self.client.table("conversations").insert(data).execute()
            if response.data and len(response.data) > 0:
                return response.data[0].get("id")
        except Exception as e:
            logger.error(f"Error creating conversation: {e}")
        return None

    def delete_conversation(self, conversation_id: str, user_id: str) -> bool:
        if not self.is_enabled():
            return False
        try:
            response = self.client.table("conversations").delete().eq("id", conversation_id).eq("user_id", user_id).execute()
            return len(response.data) > 0
        except Exception as e:
            logger.error(f"Error deleting conversation: {e}")
            return False

    def get_messages(self, conversation_id: str) -> List[Dict]:
        if not self.is_enabled():
            return []
        try:
            response = self.client.table("messages").select("*").eq("conversation_id", conversation_id).order("created_at", desc=False).execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching messages: {e}")
            return []

    def add_message(self, conversation_id: str, role: str, content: str):
        if not self.is_enabled():
            return
        try:
            data = {"conversation_id": conversation_id, "role": role, "content": content}
            self.client.table("messages").insert(data).execute()
            
            # Update conversation's updated_at timestamp
            import datetime
            now = datetime.datetime.now(datetime.timezone.utc).isoformat()
            self.client.table("conversations").update({"updated_at": now}).eq("id", conversation_id).execute()
        except Exception as e:
            logger.error(f"Error adding message to Supabase: {e}")

# Global instance
db = SupabaseDB()
