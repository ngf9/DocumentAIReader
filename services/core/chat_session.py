from solar import Table, ColumnDetails
from typing import Optional
from datetime import datetime
import uuid

class ChatSession(Table):
    """Table for storing individual chat sessions with documents."""
    __tablename__ = "chat_sessions"
    
    id: uuid.UUID = ColumnDetails(default_factory=uuid.uuid4, primary_key=True)
    document_id: uuid.UUID  # References Document.id
    session_token: str  # Unique token to identify this chat session
    created_at: datetime = ColumnDetails(default_factory=datetime.now)
    last_activity: datetime = ColumnDetails(default_factory=datetime.now)