"""
Main FastAPI Backend for Quantum Secure Email Client
Handles email sending with quantum-secure encryption
"""
import httpx
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from models import (
    SendEmailRequest,
    SendEmailResponse,
    SecurityLevel,
    QKDKeyRequest,
    QKDKeyResponse,
    FetchEmailsRequest,
    FetchEmailsResponse,
    EmailData,
    DecryptEmailRequest,
    DecryptEmailResponse
)
from encryption import encrypt_message, format_encrypted_email_body, parse_encrypted_email_body, decrypt_message
from email_sender import email_sender
from email_receiver import email_receiver
from config import config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    logger.info("=" * 60)
    logger.info("Quantum Email Backend Starting...")
    logger.info("=" * 60)
    logger.info(f"QKD KME URL: {config.QKD_KME_URL}")
    logger.info(f"SMTP Server: {config.SMTP_SERVER}:{config.SMTP_PORT}")
    logger.info(f"Backend listening on: {config.BACKEND_HOST}:{config.BACKEND_PORT}")
    logger.info("=" * 60)
    
    # Verify SMTP connection (optional, for debugging)
    # email_sender.verify_connection()
    
    yield
    
    # Shutdown
    logger.info("Quantum Email Backend Shutting Down...")


# Initialize FastAPI app
app = FastAPI(
    title="Quantum Secure Email Backend",
    description="Backend API for quantum-secure email transmission using QKD",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Add exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error("=" * 60)
    logger.error("VALIDATION ERROR")
    logger.error(f"Request URL: {request.url}")
    logger.error(f"Request method: {request.method}")
    logger.error(f"Request body: {await request.body()}")
    logger.error(f"Validation errors: {exc.errors()}")
    logger.error("=" * 60)
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )


async def fetch_qkd_key(slave_sae_id: str, key_size: int = 256) -> tuple[str, str]:
    """
    Fetch encryption key from QKD Key Management Entity (KME).
    
    Args:
        slave_sae_id: The receiver's SAE identifier
        key_size: Size of the key in bits (default: 256)
    
    Returns:
        Tuple of (key_id, key)
    
    Raises:
        HTTPException: If key retrieval fails
    """
    try:
        logger.info(f"Requesting QKD key from {config.QKD_KME_URL}")
        
        async with httpx.AsyncClient() as client:
            request_data = QKDKeyRequest(number=1, size=key_size)
            
            response = await client.post(
                f"{config.QKD_KME_URL}/api/v1/keys/{slave_sae_id}/enc_keys",
                json=request_data.model_dump(),
                timeout=10.0
            )
            
            response.raise_for_status()
            
            qkd_response = QKDKeyResponse(**response.json())
            
            if not qkd_response.keys:
                raise HTTPException(
                    status_code=500,
                    detail="No keys returned from QKD KME"
                )
            
            key_data = qkd_response.keys[0]
            logger.info(f"Successfully obtained QKD key: {key_data.key_ID}")
            
            return key_data.key_ID, key_data.key
    
    except httpx.HTTPError as e:
        logger.error(f"Failed to fetch QKD key: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"QKD KME service unavailable: {str(e)}"
        )
    
    except Exception as e:
        logger.error(f"Unexpected error fetching QKD key: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch encryption key: {str(e)}"
        )


@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "service": "Quantum Secure Email Backend",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "send": "/send - POST: Send quantum-encrypted email",
            "health": "/health - GET: Health check"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "qkd_kme_url": config.QKD_KME_URL,
        "smtp_server": f"{config.SMTP_SERVER}:{config.SMTP_PORT}"
    }


@app.post("/send", response_model=SendEmailResponse)
async def send_email(request: SendEmailRequest):
    """
    Send a quantum-encrypted email.
    
    This endpoint:
    1. Fetches a quantum key from the QKD KME
    2. Encrypts the email body using the specified security level
    3. Sends the encrypted email via SMTP
    
    Args:
        request: SendEmailRequest containing email details
    
    Returns:
        SendEmailResponse with success status and metadata
    
    Raises:
        HTTPException: If any step fails
    """
    logger.info("=" * 60)
    logger.info(f"Processing email send request")
    
    # Use SMTP_USERNAME as default sender if from_email not provided
    from_email = request.from_email or config.SMTP_USERNAME
    
    logger.info(f"From: {from_email}")
    logger.info(f"To: {request.to}")
    logger.info(f"Subject: {request.subject}")
    logger.info(f"Security Level: {request.security_level.value}")
    logger.info(f"QKD KME URL: {config.QKD_KME_URL}")
    logger.info("=" * 60)
    
    try:
        # Step 1: Fetch QKD key (unless security level is L4)
        if request.security_level == SecurityLevel.L4:
            # No encryption needed
            logger.info("Security level L4: Skipping encryption")
            key_id = "NONE"
            key = ""
            encrypted_body = request.body
            metadata = None
        else:
            # Fetch quantum key from KME
            logger.info("Fetching quantum key from KME...")
            key_id, key = await fetch_qkd_key(
                slave_sae_id=config.QKD_SLAVE_SAE_ID,
                key_size=config.DEFAULT_KEY_SIZE
            )
            
            # Step 2: Encrypt the email body
            logger.info(f"Encrypting message with security level {request.security_level.value}")
            encrypted_data, metadata = encrypt_message(
                plaintext=request.body,
                key=key,
                key_id=key_id,
                security_level=request.security_level,
                sender_sae_id=config.QKD_MASTER_SAE_ID,
                receiver_sae_id=config.QKD_SLAVE_SAE_ID
            )
            
            # Format the encrypted email body with metadata
            encrypted_body = format_encrypted_email_body(encrypted_data, metadata)
            logger.info("Message encrypted successfully")
        
        # Step 3: Send email via SMTP
        logger.info("Sending email via SMTP...")
        success = email_sender.send_email(
            from_email=from_email,
            to_email=request.to,
            subject=request.subject,
            body=encrypted_body,
            metadata=metadata
        )
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to send email via SMTP"
            )
        
        logger.info("Email sent successfully!")
        logger.info("=" * 60)
        
        return SendEmailResponse(
            success=True,
            message="Email sent successfully with quantum encryption",
            key_id=key_id,
            security_level=request.security_level.value,
            recipient=request.to
        )
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send email: {str(e)}"
        )


@app.post("/fetch", response_model=FetchEmailsResponse)
async def fetch_emails(request: FetchEmailsRequest):
    """
    Fetch emails from IMAP server.
    
    Args:
        request: FetchEmailsRequest containing folder and filters
    
    Returns:
        FetchEmailsResponse with list of emails
    """
    logger.info("=" * 60)
    logger.info(f"Fetching emails from {request.folder}")
    logger.info(f"Limit: {request.limit}, Unread only: {request.unread_only}")
    logger.info("=" * 60)
    
    try:
        # Fetch emails from IMAP
        emails = email_receiver.fetch_emails(
            folder=request.folder,
            limit=request.limit,
            unread_only=request.unread_only
        )
        
        # Convert to EmailData models
        email_list = []
        for email_data in emails:
            try:
                email_obj = EmailData(
                    id=email_data['id'],
                    message_id=email_data.get('message_id'),
                    from_addr=email_data['from'],
                    to=email_data['to'],
                    subject=email_data['subject'],
                    date=email_data['date'],
                    body=email_data['body'],
                    is_encrypted=email_data.get('is_encrypted', False),
                    key_id=email_data.get('key_id'),
                    security_level=email_data.get('security_level'),
                    folder=email_data['folder']
                )
                email_list.append(email_obj)
            except Exception as e:
                logger.error(f"Failed to parse email: {e}")
                continue
        
        logger.info(f"Successfully fetched {len(email_list)} emails")
        logger.info("=" * 60)
        
        return FetchEmailsResponse(
            success=True,
            emails=email_list,
            count=len(email_list)
        )
        
    except Exception as e:
        logger.error(f"Failed to fetch emails: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch emails: {str(e)}"
        )


@app.post("/decrypt", response_model=DecryptEmailResponse)
async def decrypt_email(request: DecryptEmailRequest):
    """
    Decrypt an encrypted email using QKD keys.
    
    This endpoint:
    1. Fetches the email by ID from IMAP
    2. Extracts encryption metadata from email body
    3. Retrieves the decryption key from QKD KME
    4. Decrypts the email body
    
    Args:
        request: DecryptEmailRequest with email ID and folder
    
    Returns:
        DecryptEmailResponse with decrypted content
    """
    logger.info("=" * 60)
    logger.info(f"Decrypting email: {request.email_id}")
    logger.info("=" * 60)
    
    try:
        # Fetch email by ID
        email_data = email_receiver.get_email_by_id(request.folder, request.email_id)
        
        if not email_data:
            raise HTTPException(
                status_code=404,
                detail="Email not found"
            )
        
        # Check if email is encrypted
        if not email_data.get('is_encrypted'):
            # Return as-is, no decryption needed
            return DecryptEmailResponse(
                success=True,
                email=EmailData(**{
                    'id': email_data['id'],
                    'message_id': email_data.get('message_id'),
                    'from': email_data['from'],
                    'to': email_data['to'],
                    'subject': email_data['subject'],
                    'date': email_data['date'],
                    'body': email_data['body'],
                    'is_encrypted': False,
                    'folder': email_data['folder']
                }),
                decrypted_body=email_data['body']
            )
        
        # Parse encrypted email body
        logger.info("Parsing encrypted email body...")
        encrypted_data, metadata = parse_encrypted_email_body(email_data['body'])
        
        logger.info(f"Security level: {metadata.security_level}")
        logger.info(f"Key ID: {metadata.key_id}")
        
        # Retrieve decryption key from QKD KME
        logger.info("Retrieving decryption key from KME...")
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{config.QKD_KME_URL}/api/v1/keys/{config.QKD_MASTER_SAE_ID}/dec_keys",
                json={
                    "key_IDs": [{"key_ID": metadata.key_id}]
                },
                timeout=10.0
            )
            
            response.raise_for_status()
            qkd_response = QKDKeyResponse(**response.json())
            
            if not qkd_response.keys:
                raise HTTPException(
                    status_code=404,
                    detail="Decryption key not found in KME"
                )
            
            key = qkd_response.keys[0].key
            logger.info(f"Successfully retrieved decryption key")
        
        # Decrypt the message
        logger.info("Decrypting message...")
        decrypted_body = decrypt_message(encrypted_data, key, metadata)
        logger.info("Message decrypted successfully")
        logger.info("=" * 60)
        
        return DecryptEmailResponse(
            success=True,
            email=EmailData(
                id=email_data['id'],
                message_id=email_data.get('message_id'),
                from_addr=email_data['from'],
                to=email_data['to'],
                subject=email_data['subject'],
                date=email_data['date'],
                body=email_data['body'],
                is_encrypted=True,
                key_id=metadata.key_id,
                security_level=metadata.security_level,
                folder=email_data['folder']
            ),
            decrypted_body=decrypted_body
        )
        
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Failed to decrypt email: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to decrypt email: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=config.BACKEND_HOST,
        port=config.BACKEND_PORT,
        reload=True
    )
