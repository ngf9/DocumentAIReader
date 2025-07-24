from solar import Table, ColumnDetails
from typing import List, Optional
from datetime import datetime
import uuid

class Chunk(Table):
    """Table for storing document chunks with embeddings for vector search."""
    __tablename__ = "chunks"
    
    id: uuid.UUID = ColumnDetails(default_factory=uuid.uuid4, primary_key=True)
    document_id: uuid.UUID  # Foreign key to documents table
    content: str  # The actual text content of the chunk
    page: int  # Page number this chunk appears on
    embedding: List[float]  # Vector embedding (1536 dimensions using hash-based approach)
    created_at: datetime = ColumnDetails(default_factory=datetime.now)