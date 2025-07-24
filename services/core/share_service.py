from typing import Optional, Dict, Any
from uuid import UUID
import uuid
import secrets
from core.document import Document
from core.chat_session import ChatSession
from solar.access import public

@public
def create_shareable_link(document_id: UUID) -> Dict[str, str]:
    """Create a shareable link for a document."""
    # Get the document
    results = Document.sql(
        "SELECT * FROM documents WHERE id = %(document_id)s", 
        {"document_id": document_id}
    )
    
    if not results:
        raise ValueError("Document not found")
    
    document = Document(**results[0])
    
    # Generate share token if not exists
    if not document.share_token:
        share_token = secrets.token_urlsafe(32)
        
        # Update document with share token and make it public
        Document.sql(
            "UPDATE documents SET share_token = %(share_token)s, is_public = true WHERE id = %(document_id)s",
            {"share_token": share_token, "document_id": document_id}
        )
    else:
        share_token = document.share_token
        
        # Ensure it's marked as public
        Document.sql(
            "UPDATE documents SET is_public = true WHERE id = %(document_id)s",
            {"document_id": document_id}
        )
    
    return {
        "share_url": f"/shared/{share_token}",
        "share_token": share_token
    }

@public
def get_document_by_share_token(share_token: str) -> Optional[Document]:
    """Get a document by its share token."""
    results = Document.sql(
        "SELECT * FROM documents WHERE share_token = %(share_token)s AND is_public = true", 
        {"share_token": share_token}
    )
    
    if not results:
        return None
    
    return Document(**results[0])

@public
def create_chat_session(document_id: UUID) -> ChatSession:
    """Create a new chat session for a document."""
    session_token = secrets.token_urlsafe(32)
    
    session = ChatSession(
        document_id=document_id,
        session_token=session_token
    )
    session.sync()
    
    return session

@public
def get_chat_session(session_token: str) -> Optional[ChatSession]:
    """Get a chat session by its token."""
    results = ChatSession.sql(
        "SELECT * FROM chat_sessions WHERE session_token = %(session_token)s", 
        {"session_token": session_token}
    )
    
    if not results:
        return None
    
    return ChatSession(**results[0])

@public
def update_chat_session_activity(session_token: str) -> None:
    """Update the last activity timestamp for a chat session."""
    from datetime import datetime
    
    ChatSession.sql(
        "UPDATE chat_sessions SET last_activity = %(now)s WHERE session_token = %(session_token)s",
        {"now": datetime.now(), "session_token": session_token}
    )

@public
def revoke_share_access(document_id: UUID) -> bool:
    """Revoke public access to a document."""
    Document.sql(
        "UPDATE documents SET is_public = false WHERE id = %(document_id)s",
        {"document_id": document_id}
    )
    
    return True