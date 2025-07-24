from typing import List, Dict, Tuple
from solar.access import public
from core.chunk import Chunk
from core.document import Document
from openai import OpenAI
import os
import uuid
import math

# Initialize OpenAI client
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Calculate cosine similarity between two vectors."""
    # Calculate dot product
    dot_product = sum(x * y for x, y in zip(a, b))
    
    # Calculate magnitudes
    magnitude_a = math.sqrt(sum(x * x for x in a))
    magnitude_b = math.sqrt(sum(x * x for x in b))
    
    # Avoid division by zero
    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0
    
    return dot_product / (magnitude_a * magnitude_b)

def search_similar_chunks(query_embedding: List[float], document_id: uuid.UUID, top_k: int = 5) -> List[Chunk]:
    """Find the most similar chunks to the query embedding."""
    # Get all chunks for the document
    results = Chunk.sql(
        "SELECT * FROM chunks WHERE document_id = %(document_id)s",
        {"document_id": str(document_id)}
    )
    
    if not results:
        return []
    
    # Calculate similarities
    chunk_similarities = []
    for result in results:
        chunk = Chunk(**result)
        similarity = cosine_similarity(query_embedding, chunk.embedding)
        chunk_similarities.append((chunk, similarity))
    
    # Sort by similarity and return top k
    chunk_similarities.sort(key=lambda x: x[1], reverse=True)
    return [chunk for chunk, _ in chunk_similarities[:top_k]]

def generate_embedding(text: str) -> List[float]:
    """Generate embedding for text using hash-based approach as fallback."""
    import hashlib
    import struct
    
    # Fallback hash-based embedding since OpenRouter doesn't have embedding models readily available
    dimension = 1536
    embeddings = []
    
    # Normalize text
    text = text.lower().strip()
    
    # Create embeddings by hashing text with different seeds
    for i in range(dimension // 32):  # 32 values per hash
        salted_text = f"{text}_{i}".encode('utf-8')
        hash_obj = hashlib.sha256(salted_text)
        hash_bytes = hash_obj.digest()
        
        # Convert bytes to floats
        for j in range(0, len(hash_bytes), 8):
            if len(embeddings) >= dimension:
                break
            chunk = hash_bytes[j:j+8]
            if len(chunk) == 8:
                # Convert to signed integer then normalize to [-1, 1]
                val = struct.unpack('q', chunk)[0]
                normalized = val / (2**63 - 1)  # Normalize to [-1, 1]
                embeddings.append(float(normalized))
    
    # Pad or trim to exact dimension
    while len(embeddings) < dimension:
        embeddings.append(0.0)
    
    return embeddings[:dimension]

@public
def chat_with_document(messages: List[Dict[str, str]], document_id: uuid.UUID) -> str:
    """Chat with a document using RAG (Retrieval Augmented Generation)."""
    try:
        # Get the latest user message
        user_message = None
        for message in reversed(messages):
            if message.get('role') == 'user':
                user_message = message.get('content', '')
                break
        
        if not user_message:
            return "I need a question to answer."
        
        # Generate embedding for the user's question
        query_embedding = generate_embedding(user_message)
        
        # Search for similar chunks
        similar_chunks = search_similar_chunks(query_embedding, document_id)
        
        if not similar_chunks:
            return "I couldn't find any relevant information in the document to answer your question."
        
        # Build context from similar chunks
        context_parts = []
        for chunk in similar_chunks:
            context_parts.append(f"[Page {chunk.page}] {chunk.content}")
        
        context = "\n\n".join(context_parts)
        
        # Build the system prompt
        system_prompt = f"""You are an AI assistant that answers questions based ONLY on the provided document context. 

Rules:
1. Only answer questions using information from the provided context
2. If the context doesn't contain enough information to answer the question, say so
3. Always cite the page number(s) where you found the information (e.g., "According to page 5..." or "(p. 12)")
4. Do not make up information or use knowledge outside of the provided context
5. Be concise and helpful

Context from the document:
{context}"""
        
        # Prepare messages for the chat completion
        chat_messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
        
        # Generate response
        response = client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=chat_messages,
            temperature=0.1,
            max_tokens=1000
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        return f"Sorry, I encountered an error while processing your question: {str(e)}"

@public
def get_document_info(document_id: uuid.UUID) -> Dict[str, str]:
    """Get basic information about a document for the chat interface."""
    try:
        # Get document
        doc_results = Document.sql(
            "SELECT * FROM documents WHERE id = %(document_id)s",
            {"document_id": str(document_id)}
        )
        
        if not doc_results:
            raise Exception(f"Document with ID {document_id} not found")
        
        document = Document(**doc_results[0])
        
        # Get chunk count
        chunk_results = Chunk.sql(
            "SELECT COUNT(*) as count FROM chunks WHERE document_id = %(document_id)s",
            {"document_id": str(document_id)}
        )
        
        chunk_count = chunk_results[0]['count'] if chunk_results else 0
        
        return {
            "title": document.title,
            "chunk_count": str(chunk_count),
            "created_at": document.created_at.isoformat()
        }
        
    except Exception as e:
        raise Exception(f"Error getting document info: {str(e)}")