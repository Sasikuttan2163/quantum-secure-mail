"""
Pydantic models for API requests and responses
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Dict, Any, Union
from enum import Enum


class EmailAddress(BaseModel):
    """Model for an email address with optional display name"""
    name: str = Field(..., description="Display name")
    email: str = Field(..., description="Email address")
    
    model_config = ConfigDict(from_attributes=True)


class SecurityLevel(str, Enum):
    """Security levels for encryption"""
    L1 = "L1"  # One-Time Pad using QKD keys
    L2 = "L2"  # Quantum-aided AES-256-GCM
    L3 = "L3"  # Post-Quantum Cryptography (Kyber-1024)
    L4 = "L4"  # No encryption


class SendEmailRequest(BaseModel):
    """Request model for sending an email"""
    to: EmailStr = Field(..., description="Recipient email address")
    from_email: Optional[EmailStr] = Field(None, description="Sender email address (defaults to SMTP_USERNAME)", alias="from")
    subject: str = Field(..., description="Email subject")
    body: str = Field(..., description="Email body content")
    security_level: SecurityLevel = Field(
        default=SecurityLevel.L2,
        description="Security level for encryption (L1, L2, L3, L4)"
    )
    
    model_config = ConfigDict(populate_by_name=True)


class SendEmailResponse(BaseModel):
    """Response model for email sending"""
    success: bool
    message: str
    key_id: Optional[str] = None
    security_level: str
    recipient: str


class QKDKeyRequest(BaseModel):
    """Request model for QKD key retrieval"""
    number: int = Field(default=1, description="Number of keys requested")
    size: int = Field(default=256, description="Key size in bits")


class QKDKey(BaseModel):
    """Model for a single QKD key"""
    key_ID: str
    key: str


class QKDKeyResponse(BaseModel):
    """Response model from QKD KME"""
    keys: List[QKDKey]


class EncryptionMetadata(BaseModel):
    """Metadata to be embedded in encrypted email"""
    key_id: str
    security_level: str
    sender_sae_id: str
    receiver_sae_id: str
    algorithm_info: Optional[str] = None
    nonce: Optional[str] = None  # For AES modes, base64-encoded
    kyber_ciphertext: Optional[str] = None  # For PQC, base64-encoded
    kyber_secret_key: Optional[str] = None  # For PQC, base64-encoded


class FetchEmailsRequest(BaseModel):
    """Request model for fetching emails"""
    folder: str = Field(default="INBOX", description="IMAP folder to fetch from")
    limit: int = Field(default=50, description="Maximum number of emails to fetch")
    unread_only: bool = Field(default=False, description="Fetch only unread emails")


class EmailData(BaseModel):
    """Model for email data"""
    id: str
    message_id: Optional[str] = None
    from_addr: Union[EmailAddress, Dict[str, str]] = Field(..., alias="from")
    to: Union[EmailAddress, Dict[str, str]]
    subject: str
    date: str
    body: str
    is_encrypted: bool
    key_id: Optional[str] = None
    security_level: Optional[str] = None
    folder: str
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class FetchEmailsResponse(BaseModel):
    """Response model for fetching emails"""
    success: bool
    emails: List[EmailData]
    count: int


class DecryptEmailRequest(BaseModel):
    """Request model for decrypting an email"""
    email_id: str = Field(..., description="Email ID from IMAP")
    folder: str = Field(default="INBOX", description="IMAP folder")


class DecryptEmailResponse(BaseModel):
    """Response model for decrypted email"""
    success: bool
    email: Optional[EmailData] = None
    decrypted_body: Optional[str] = None
    error: Optional[str] = None
