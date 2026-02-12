"""
Configuration settings for the Quantum Email Backend
"""
import os
from pathlib import Path
from typing import Optional

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    # Load .env from project root (parent directory of backend)
    env_path = Path(__file__).parent.parent / '.env'
    load_dotenv(env_path)
except ImportError:
    # python-dotenv not installed, will use system environment variables
    pass


class Config:
    """Configuration class for email and QKD settings"""
    
    # SMTP Configuration
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    
    # IMAP Configuration
    IMAP_SERVER: str = os.getenv("IMAP_SERVER", "imap.gmail.com")
    IMAP_PORT: int = int(os.getenv("IMAP_PORT", "993"))
    IMAP_USERNAME: str = os.getenv("IMAP_USERNAME", "")
    IMAP_PASSWORD: str = os.getenv("IMAP_PASSWORD", "")
    IMAP_USE_SSL: bool = os.getenv("IMAP_USE_SSL", "true").lower() == "true"
    
    # QKD KME Configuration
    # Use 127.0.0.1 instead of localhost to force IPv4 (avoids ::1 IPv6 connection issues)
    QKD_KME_URL: str = os.getenv("QKD_KME_URL", "http://127.0.0.1:8000")
    QKD_MASTER_SAE_ID: str = os.getenv("QKD_MASTER_SAE_ID", "SENDER_SAE")
    QKD_SLAVE_SAE_ID: str = os.getenv("QKD_SLAVE_SAE_ID", "RECEIVER_SAE")
    
    # Backend API Configuration
    BACKEND_HOST: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8001"))
    
    # Security Settings
    DEFAULT_KEY_SIZE: int = 256  # bits
    DEFAULT_SECURITY_LEVEL: str = "L2"  # L1, L2, L3, L4
    
    # Email Settings
    EMAIL_ENCRYPTION_HEADER: str = "X-Quantum-Encryption"
    EMAIL_KEY_ID_HEADER: str = "X-Quantum-Key-ID"
    EMAIL_SECURITY_LEVEL_HEADER: str = "X-Quantum-Security-Level"
    

config = Config()
