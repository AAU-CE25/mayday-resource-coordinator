"""
Event broadcaster for Server-Sent Events (SSE)
Simple pub/sub system to broadcast changes to connected clients
"""
import asyncio
from typing import Any, Dict, List
import json
from datetime import datetime

class EventBroadcaster:
    """Simple event broadcaster for SSE"""
    
    def __init__(self):
        self.listeners: List[asyncio.Queue] = []
    
    def subscribe(self) -> asyncio.Queue:
        """Subscribe to events - returns a queue that will receive events"""
        queue = asyncio.Queue()
        self.listeners.append(queue)
        return queue
    
    def unsubscribe(self, queue: asyncio.Queue):
        """Unsubscribe from events"""
        if queue in self.listeners:
            self.listeners.remove(queue)
    
    async def broadcast(self, event_type: str, data: Dict[str, Any]):
        """Broadcast an event to all subscribers"""
        event_data = {
            "type": event_type,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
        
        # Remove closed queues
        self.listeners = [q for q in self.listeners if not q._closed]
        
        # Broadcast to all active listeners
        for queue in self.listeners:
            try:
                await queue.put(event_data)
            except Exception as e:
                print(f"Error broadcasting to queue: {e}")

# Global broadcaster instance
broadcaster = EventBroadcaster()
