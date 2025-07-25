# Auto-generated by Lumenary
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union, Literal, Annotated, Tuple, Set, Any

from datetime import datetime, date, time, timedelta
from uuid import UUID
import uuid

class TokenExchangeRequest(BaseModel):
    client_id: str
    grant_type: str
    code: Optional[str] = None
    code_verifier: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 3600

class TokenValidationRequest(BaseModel):
    token: str
    
class LogoutResponse(BaseModel):
    success: bool = True

# Import user-defined models that we need for input/response models
from core.document import Document
from core.chunk import Chunk
from core.chat_session import ChatSession

UploadAndProcessPdfOutputSchema = Document
class BodyPdfServiceGetDocument(BaseModel):
  document_id: uuid.UUID

GetDocumentOutputSchema = Document
ListDocumentsOutputSchema = List[Document]
class BodyChatServiceChatWithDocument(BaseModel):
  messages: List[Dict[str, str]]
  document_id: uuid.UUID

ChatWithDocumentOutputSchema = str
class BodyChatServiceGetDocumentInfo(BaseModel):
  document_id: uuid.UUID

GetDocumentInfoOutputSchema = Dict[str, str]
class BodyShareServiceCreateShareableLink(BaseModel):
  document_id: UUID

CreateShareableLinkOutputSchema = Dict[str, str]
class BodyShareServiceGetDocumentByShareToken(BaseModel):
  share_token: str

GetDocumentByShareTokenOutputSchema = Optional[Document]
class BodyShareServiceCreateChatSession(BaseModel):
  document_id: UUID

CreateChatSessionOutputSchema = ChatSession
class BodyShareServiceGetChatSession(BaseModel):
  session_token: str

GetChatSessionOutputSchema = Optional[ChatSession]
class BodyShareServiceUpdateChatSessionActivity(BaseModel):
  session_token: str

class BodyShareServiceRevokeShareAccess(BaseModel):
  document_id: UUID

RevokeShareAccessOutputSchema = bool
class BodySharedChatServiceChatWithSharedDocument(BaseModel):
  session_token: str
  message: str

ChatWithSharedDocumentOutputSchema = Dict[str, Any]
class BodySharedChatServiceGetSharedChatHistory(BaseModel):
  session_token: str

GetSharedChatHistoryOutputSchema = List[Dict[str, Any]]
    