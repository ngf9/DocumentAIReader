from typing import List, Dict, Any, Optional
from uuid import UUID
from core.chat_session import ChatSession
from core.document import Document
from core.chunk import Chunk
# Note: We don't need to store chat messages for shared sessions
from solar.access import public
import openai
import os

# Initialize OpenAI client
client = openai.OpenAI(api_key=os.getenv("OPENROUTER_API_KEY"), base_url="https://openrouter.ai/api/v1")

@public
def chat_with_shared_document(session_token: str, message: str) -> Dict[str, Any]:
    """Chat with a shared document using a session token."""
    # Get the chat session
    session_results = ChatSession.sql(
        "SELECT * FROM chat_sessions WHERE session_token = %(session_token)s", 
        {"session_token": session_token}
    )
    
    if not session_results:
        raise ValueError("Invalid session token")
    
    session = ChatSession(**session_results[0])
    
    # Get the document
    doc_results = Document.sql(
        "SELECT * FROM documents WHERE id = %(document_id)s AND is_public = true", 
        {"document_id": session.document_id}
    )
    
    if not doc_results:
        raise ValueError("Document not found or not public")
    
    document = Document(**doc_results[0])
    
    # Update session activity
    from datetime import datetime
    ChatSession.sql(
        "UPDATE chat_sessions SET last_activity = %(now)s WHERE session_token = %(session_token)s",
        {"now": datetime.now(), "session_token": session_token}
    )
    
    # Get relevant chunks for the document
    chunk_results = Chunk.sql(
        "SELECT * FROM chunks WHERE document_id = %(document_id)s ORDER BY page_number, chunk_index", 
        {"document_id": session.document_id}
    )
    
    chunks = [Chunk(**chunk) for chunk in chunk_results]
    
    # Find most relevant chunks (simple approach for now)
    relevant_chunks = chunks[:5]  # Take first 5 chunks as context
    context = "\n\n".join([chunk.content for chunk in relevant_chunks])
    
    # Create the prompt
    prompt = f"""You are an AI assistant helping users understand a document titled "{document.title}". 
    
Here is relevant content from the document:
{context}

User question: {message}

Please provide a helpful answer based on the document content. If the information isn't in the provided content, say so."""
    
    try:
        # Get response from OpenAI
        response = client.chat.completions.create(
            model="anthropic/claude-3.5-sonnet",
            messages=[
                {"role": "system", "content": "You are a helpful AI assistant that answers questions about documents."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content
        
        # Store the chat message (will implement storage later if needed)
        # For now, just return the response without storing chat history
        
        return {
            "response": ai_response,
            "session_token": session_token,
            "document_title": document.title
        }
        
    except Exception as e:
        print(f"Error in chat completion: {e}")
        return {
            "response": "I apologize, but I'm having trouble processing your question right now. Please try again.",
            "session_token": session_token,
            "document_title": document.title
        }

@public
def get_shared_chat_history(session_token: str) -> List[Dict[str, Any]]:
    """Get chat history for a shared session."""
    # Verify session exists
    session_results = ChatSession.sql(
        "SELECT * FROM chat_sessions WHERE session_token = %(session_token)s", 
        {"session_token": session_token}
    )
    
    if not session_results:
        return []
    
    session = ChatSession(**session_results[0])
    
    # For now, return empty history - can implement storage later if needed
    return []