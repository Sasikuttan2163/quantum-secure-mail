"""
SMTP Email Sender Module
Handles sending encrypted emails via SMTP
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from config import config
from models import EncryptionMetadata

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EmailSender:
    """Handles SMTP email sending operations"""
    
    def __init__(
        self,
        smtp_server: Optional[str] = None,
        smtp_port: Optional[int] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        use_tls: bool = True
    ):
        """
        Initialize the EmailSender with SMTP configuration.
        
        Args:
            smtp_server: SMTP server address (defaults to config)
            smtp_port: SMTP server port (defaults to config)
            username: SMTP authentication username (defaults to config)
            password: SMTP authentication password (defaults to config)
            use_tls: Whether to use TLS encryption (defaults to True)
        """
        self.smtp_server = smtp_server or config.SMTP_SERVER
        self.smtp_port = smtp_port or config.SMTP_PORT
        self.username = username or config.SMTP_USERNAME
        self.password = password or config.SMTP_PASSWORD
        self.use_tls = use_tls
        
        logger.info(f"EmailSender initialized with server: {self.smtp_server}:{self.smtp_port}")
    
    def send_email(
        self,
        from_email: str,
        to_email: str,
        subject: str,
        body: str,
        metadata: Optional[EncryptionMetadata] = None
    ) -> bool:
        """
        Send an email via SMTP.
        
        Args:
            from_email: Sender email address
            to_email: Recipient email address
            subject: Email subject
            body: Email body (can be encrypted)
            metadata: Optional encryption metadata to include in headers
        
        Returns:
            True if email was sent successfully, False otherwise
        
        Raises:
            Exception: If email sending fails
        """
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add custom headers if metadata is provided
            if metadata:
                msg[config.EMAIL_ENCRYPTION_HEADER] = "true"
                msg[config.EMAIL_KEY_ID_HEADER] = metadata.key_id
                msg[config.EMAIL_SECURITY_LEVEL_HEADER] = metadata.security_level
            
            # Attach the body
            msg.attach(MIMEText(body, 'plain'))
            
            # Connect to SMTP server and send
            logger.info(f"Connecting to SMTP server {self.smtp_server}:{self.smtp_port}")
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                if self.use_tls:
                    logger.info("Starting TLS")
                    server.starttls()
                
                # Login if credentials are provided
                if self.username and self.password:
                    logger.info(f"Logging in as {self.username}")
                    server.login(self.username, self.password)
                
                # Send email
                logger.info(f"Sending email from {from_email} to {to_email}")
                server.send_message(msg)
                logger.info("Email sent successfully")
            
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP Authentication failed: {e}")
            raise Exception(f"SMTP Authentication failed: {e}")
        
        except smtplib.SMTPException as e:
            logger.error(f"SMTP error occurred: {e}")
            raise Exception(f"SMTP error: {e}")
        
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            raise Exception(f"Failed to send email: {e}")
    
    def verify_connection(self) -> bool:
        """
        Verify that SMTP connection can be established.
        
        Returns:
            True if connection is successful, False otherwise
        """
        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=10) as server:
                server.ehlo()
                if self.use_tls:
                    server.starttls()
                    server.ehlo()
                
                if self.username and self.password:
                    server.login(self.username, self.password)
                
                logger.info("SMTP connection verified successfully")
                return True
        
        except Exception as e:
            logger.error(f"SMTP connection verification failed: {e}")
            return False


# Singleton instance
email_sender = EmailSender()
