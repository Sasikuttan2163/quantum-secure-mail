"""
Pydantic models for API requests and responses
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from enum import Enum


class SecurityLevel(str, Enum):
    """Security levels for encryption"""
    L1 = "L1"  # One-Time Pad using QKD keys
    L2 = "L2"  # Quantum-aided AES-256-GCM
    L3 = "L3"  # Post-Quantum Cryptography (Kyber-1024)
    L4 = "L4"  # No encryption


class SendEmailRequest(BaseModel):
    """Request model for sending an email"""
    to: EmailStr = Field(..., description="Recipient email address")
    from_email: EmailStr = Field(..., description="Sender email address", alias="from")
    subject: str = Field(..., description="Email subject")
    body: str = Field(..., description="Email body content")
    security_level: SecurityLevel = Field(
        default=SecurityLevel.L2,
        description="Security level for encryption (L1, L2, L3, L4)"
    )
    
    class Config:
        populate_by_name = True


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
