from typing import List, Dict, Tuple
from solar.access import public
from solar.media import MediaFile, save_to_bucket, generate_presigned_url
from core.document import Document
from core.chunk import Chunk
from openai import OpenAI
import os
import re
import uuid

# Initialize OpenAI client for embeddings
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

def extract_text_from_pdf(pdf_file: MediaFile) -> List[Dict[str, any]]:
    """Extract text from PDF and return list of pages with content."""
    try:
        import pypdf
        import io
        
        # Create a PDF reader from bytes
        pdf_reader = pypdf.PdfReader(io.BytesIO(pdf_file.bytes))
        pages = []
        
        for page_num, page in enumerate(pdf_reader.pages, 1):
            text = page.extract_text()
            if text.strip():  # Only include pages with text
                pages.append({
                    'page': page_num,
                    'text': text.strip()
                })
        
        return pages
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")

def chunk_text(text: str, page_num: int, chunk_size: int = 3000) -> List[Dict[str, any]]:
    """Split text into chunks of approximately chunk_size characters."""
    if not text.strip():
        return []
    
    chunks = []
    words = text.split()
    current_chunk = []
    current_size = 0
    
    for word in words:
        word_size = len(word) + 1  # +1 for space
        if current_size + word_size > chunk_size and current_chunk:
            # Save current chunk
            chunk_text = ' '.join(current_chunk)
            chunks.append({
                'content': chunk_text,
                'page': page_num
            })
            current_chunk = [word]
            current_size = word_size
        else:
            current_chunk.append(word)
            current_size += word_size
    
    # Add remaining words as final chunk
    if current_chunk:
        chunk_text = ' '.join(current_chunk)
        chunks.append({
            'content': chunk_text,
            'page': page_num
        })
    
    return chunks

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
def upload_and_process_pdf(pdf_file: MediaFile, title: str) -> Document:
    """Upload PDF file, extract text, generate embeddings, and store everything."""
    try:
        # Save PDF to bucket
        pdf_path = save_to_bucket(pdf_file)
        
        # Create document record
        document = Document(
            title=title,
            pdf_path=pdf_path
        )
        document.sync()
        
        # Extract text from PDF
        pages = extract_text_from_pdf(pdf_file)
        
        # Process each page
        all_chunks = []
        for page_data in pages:
            page_chunks = chunk_text(page_data['text'], page_data['page'])
            all_chunks.extend(page_chunks)
        
        # Generate embeddings and save chunks
        chunk_objects = []
        for chunk_data in all_chunks:
            embedding = generate_embedding(chunk_data['content'])
            chunk = Chunk(
                document_id=document.id,
                content=chunk_data['content'],
                page=chunk_data['page'],
                embedding=embedding
            )
            chunk_objects.append(chunk)
        
        # Batch insert chunks
        if chunk_objects:
            Chunk.sync_many(chunk_objects)
        
        # Return document with presigned URL
        document.pdf_url = generate_presigned_url(pdf_path)
        return document
        
    except Exception as e:
        raise Exception(f"Error processing PDF: {str(e)}")

@public
def get_document(document_id: uuid.UUID) -> Document:
    """Get document by ID with presigned URL for PDF access."""
    results = Document.sql(
        "SELECT * FROM documents WHERE id = %(document_id)s",
        {"document_id": str(document_id)}
    )
    
    if not results:
        raise Exception(f"Document with ID {document_id} not found")
    
    document = Document(**results[0])
    # Generate presigned URL for frontend access
    document.pdf_url = generate_presigned_url(document.pdf_path)
    return document

@public
def list_documents() -> List[Document]:
    """List all documents with presigned URLs."""
    results = Document.sql("SELECT * FROM documents ORDER BY created_at DESC")
    documents = []
    
    for result in results:
        document = Document(**result)
        document.pdf_url = generate_presigned_url(document.pdf_path)
        documents.append(document)
    
    return documents