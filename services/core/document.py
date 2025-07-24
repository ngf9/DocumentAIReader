from solar import Table, ColumnDetails
from typing import Optional
from datetime import datetime
import uuid

class Document(Table):
    """Table for storing PDF documents metadata."""
    __tablename__ = "documents"
    
    id: uuid.UUID = ColumnDetails(default_factory=uuid.uuid4, primary_key=True)
    title: str
    pdf_path: str  # Path to PDF file in media bucket
    pdf_url: Optional[str] = None  # Presigned URL for frontend access (overridden at runtime)
    created_at: datetime = ColumnDetails(default_factory=datetime.now)
    is_public: Optional[bool] = None  # Whether document can be accessed via shareable link (backwards compatibility)
    share_token: Optional[str] = None  # Unique token for public sharing (backwards compatibility)