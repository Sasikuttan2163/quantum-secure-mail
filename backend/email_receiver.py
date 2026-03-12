"""
IMAP Email Receiver Module
Handles fetching and decrypting emails via IMAP
"""
import imaplib
import email
from email.header import decode_header
from email.utils import parsedate_to_datetime, parseaddr
from datetime import datetime
import logging
from typing import List, Dict, Optional
from config import config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EmailReceiver:
    """Handles IMAP email receiving operations"""
    
    def __init__(
        self,
        imap_server: Optional[str] = None,
        imap_port: Optional[int] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        use_ssl: bool = True
    ):
        """
        Initialize the EmailReceiver with IMAP configuration.
        
        Args:
            imap_server: IMAP server address
            imap_port: IMAP server port (993 for SSL, 143 for non-SSL)
            username: IMAP authentication username
            password: IMAP authentication password
            use_ssl: Whether to use SSL encryption
        """
        self.imap_server = imap_server or config.IMAP_SERVER
        self.imap_port = imap_port or config.IMAP_PORT
        self.username = username or config.IMAP_USERNAME
        self.password = password or config.IMAP_PASSWORD
        self.use_ssl = use_ssl
        self.connection = None
        self._folder_cache = None
        
        logger.info(f"EmailReceiver initialized with server: {self.imap_server}:{self.imap_port}")
    
    def connect(self) -> bool:
        """
        Connect to IMAP server.
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            if self.use_ssl:
                self.connection = imaplib.IMAP4_SSL(self.imap_server, self.imap_port)
            else:
                self.connection = imaplib.IMAP4(self.imap_server, self.imap_port)
            
            self.connection.login(self.username, self.password)
            logger.info("Connected to IMAP server successfully")
            
            # Cache folder list for mapping
            self._folder_cache = None
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to IMAP server: {e}")
            return False
    
    def _get_folder_list(self) -> List[str]:
        """Get and cache the list of available folders"""
        if self._folder_cache is not None:
            return self._folder_cache
        
        if not self.connection:
            return []
        
        try:
            status, folders = self.connection.list()
            if status == 'OK':
                folder_list = []
                for folder in folders:
                    folder_str = folder.decode() if isinstance(folder, bytes) else folder
                    # Extract folder name from IMAP LIST response
                    # Format: '(\\Flags) "/" "FolderName"' or '(\\Flags) "/" FolderName'
                    parts = folder_str.split('"')
                    if len(parts) >= 3:
                        folder_list.append(parts[-2])
                    else:
                        # Handle unquoted folder names
                        parts = folder_str.split(' ')
                        if len(parts) >= 3:
                            folder_list.append(' '.join(parts[2:]))
                
                self._folder_cache = folder_list
                logger.info(f"Available folders: {folder_list}")
                return folder_list
        except Exception as e:
            logger.error(f"Failed to list folders: {e}")
        
        return []
    
    def _map_folder_name(self, folder: str) -> str:
        """
        Map common folder names to provider-specific folder names.
        
        Args:
            folder: Generic folder name (INBOX, SENT, DRAFTS, TRASH)
        
        Returns:
            Provider-specific folder name
        """
        folder_upper = folder.upper()
        
        # INBOX is standard
        if folder_upper == 'INBOX':
            return 'INBOX'
        
        # Get available folders
        available_folders = self._get_folder_list()
        
        # Gmail-specific mapping
        gmail_mappings = {
            'SENT': ['[Gmail]/Sent Mail', 'Sent'],
            'DRAFTS': ['[Gmail]/Drafts', 'Drafts'],
            'TRASH': ['[Gmail]/Trash', 'Trash'],
            'SPAM': ['[Gmail]/Spam', 'Spam'],
            'STARRED': ['[Gmail]/Starred'],
        }
        
        # Other common mappings
        common_mappings = {
            'SENT': ['Sent', 'Sent Messages', 'Sent Items'],
            'DRAFTS': ['Drafts', 'Draft'],
            'TRASH': ['Trash', 'Deleted', 'Deleted Messages'],
            'SPAM': ['Spam', 'Junk'],
        }
        
        # Try Gmail mappings first if it looks like Gmail
        if 'gmail' in self.imap_server.lower():
            if folder_upper in gmail_mappings:
                for candidate in gmail_mappings[folder_upper]:
                    if candidate in available_folders:
                        logger.info(f"Mapped {folder} to {candidate}")
                        return candidate
        
        # Try common mappings
        if folder_upper in common_mappings:
            for candidate in common_mappings[folder_upper]:
                if candidate in available_folders:
                    logger.info(f"Mapped {folder} to {candidate}")
                    return candidate
        
        # Return original folder name as fallback
        return folder

    def _format_mailbox_name(self, mailbox: str) -> str:
        """Format mailbox name for IMAP commands, quoting special names safely."""
        if any(char in mailbox for char in [' ', '[', ']', '"']):
            escaped = mailbox.replace('\\', '\\\\').replace('"', '\\"')
            return f'"{escaped}"'
        return mailbox
    
    def disconnect(self):
        """Disconnect from IMAP server"""
        if self.connection:
            try:
                self.connection.logout()
                logger.info("Disconnected from IMAP server")
            except Exception as e:
                logger.error(f"Error during disconnect: {e}")
    
    def list_folders(self) -> List[str]:
        """
        List all available IMAP folders.
        
        Returns:
            List of folder names
        """
        if not self.connection:
            raise Exception("Not connected to IMAP server")
        
        try:
            status, folders = self.connection.list()
            if status == 'OK':
                folder_list = []
                for folder in folders:
                    # Parse folder name from response
                    folder_str = folder.decode() if isinstance(folder, bytes) else folder
                    # Extract folder name (format: '(\\Flags) "/" "FolderName"')
                    parts = folder_str.split('"')
                    if len(parts) >= 3:
                        folder_list.append(parts[-2])
                return folder_list
            return []
        except Exception as e:
            logger.error(f"Failed to list folders: {e}")
            return []
    
    def fetch_emails(
        self,
        folder: str = 'INBOX',
        limit: int = 50,
        unread_only: bool = False
    ) -> List[Dict]:
        """
        Fetch emails from specified folder.
        
        Args:
            folder: IMAP folder name (default: INBOX)
            limit: Maximum number of emails to fetch
            unread_only: If True, fetch only unread emails
        
        Returns:
            List of email dictionaries with metadata
        """
        if not self.connection:
            if not self.connect():
                raise Exception("Failed to connect to IMAP server")
        
        # Map folder name to provider-specific name
        actual_folder = self._map_folder_name(folder)
        logger.info(f"Fetching from folder: {actual_folder}")
        
        try:
            # Select folder
            logger.info(f"Attempting to select folder: {actual_folder}")
            mailbox_name = self._format_mailbox_name(actual_folder)

            # Use readonly mode to avoid permission issues
            status, messages = self.connection.select(mailbox_name, readonly=True)

            # Fallback: retry unquoted mailbox in case server expects raw names
            if status != 'OK' and mailbox_name != actual_folder:
                logger.warning(
                    f"Quoted mailbox select failed for '{actual_folder}', retrying unquoted"
                )
                status, messages = self.connection.select(actual_folder, readonly=True)
            
            if status != 'OK':
                logger.error(f"Failed to select folder '{actual_folder}': status={status}, messages={messages}")
                return []
            
            logger.info(f"Successfully selected folder: {actual_folder}")
            
            # Search for emails
            search_criteria = 'UNSEEN' if unread_only else 'ALL'
            status, message_ids = self.connection.search(None, search_criteria)
            
            if status != 'OK':
                return []
            
            # Get message IDs
            msg_id_list = message_ids[0].split()
            
            # Limit results
            msg_id_list = msg_id_list[-limit:] if len(msg_id_list) > limit else msg_id_list
            
            emails = []
            for msg_id in reversed(msg_id_list):  # Newest first
                try:
                    email_data = self._fetch_email_by_id(msg_id)
                    if email_data:
                        emails.append(email_data)
                except Exception as e:
                    logger.error(f"Failed to fetch email {msg_id}: {e}")
                    continue
            
            logger.info(f"Fetched {len(emails)} emails from {actual_folder}")
            return emails
            
        except Exception as e:
            logger.error(f"Failed to fetch emails: {e}")
            raise
    
    def _fetch_email_by_id(self, msg_id: bytes) -> Optional[Dict]:
        """
        Fetch a single email by ID and parse it.
        
        Args:
            msg_id: Email message ID
        
        Returns:
            Dictionary containing email data
        """
        try:
            # Fetch email
            status, msg_data = self.connection.fetch(msg_id, '(RFC822)')
            
            if status != 'OK':
                return None
            
            # Parse email
            raw_email = msg_data[0][1]
            email_message = email.message_from_bytes(raw_email)
            
            # Extract headers
            subject = self._decode_header(email_message['Subject'])
            
            # Parse email addresses to extract name and email components
            from_addr = self._parse_email_address(email_message['From'] or "")
            to_addr = self._parse_email_address(email_message['To'] or "")
            
            # Parse date from RFC 2822 format to ISO format
            # Email headers use RFC 2822 format (e.g., "Mon, 10 Feb 2026 14:35:22 +0530")
            # We convert to ISO format for consistent frontend parsing
            date_str = email_message['Date']
            try:
                date_obj = parsedate_to_datetime(date_str)
                date = date_obj.isoformat()
            except Exception as e:
                logger.warning(f"Failed to parse date '{date_str}': {e}")
                date = datetime.now().isoformat()
            
            message_id = email_message['Message-ID']
            
            # Check for quantum encryption headers
            is_encrypted = email_message.get(config.EMAIL_ENCRYPTION_HEADER) == 'true'
            key_id = email_message.get(config.EMAIL_KEY_ID_HEADER)
            security_level = email_message.get(config.EMAIL_SECURITY_LEVEL_HEADER)
            
            # Extract body
            body = self._extract_body(email_message)
            
            # Build email data
            email_data = {
                'id': msg_id.decode(),
                'message_id': message_id,
                'from': from_addr,
                'to': to_addr,
                'subject': subject,
                'date': date,
                'body': body,
                'is_encrypted': is_encrypted,
                'key_id': key_id,
                'security_level': security_level,
                'folder': 'inbox',  # Will be updated by caller
            }
            
            return email_data
            
        except Exception as e:
            logger.error(f"Error parsing email: {e}")
            return None
    
    def _decode_header(self, header_value: str) -> str:
        """Decode email header (handles encoded subjects)"""
        if not header_value:
            return ""
        
        decoded_parts = decode_header(header_value)
        decoded_string = ""
        
        for part, encoding in decoded_parts:
            if isinstance(part, bytes):
                decoded_string += part.decode(encoding or 'utf-8', errors='ignore')
            else:
                decoded_string += part
        
        return decoded_string
    
    def _parse_email_address(self, address_string: str) -> Dict[str, str]:
        """
        Parse email address string into name and email components.
        
        Args:
            address_string: Email string like "John Doe <john@example.com>" or "john@example.com"
        
        Returns:
            Dict with 'name' and 'email' keys
        """
        try:
            name, email_addr = parseaddr(address_string)
            
            # If no name provided, use the email username as name
            if not name:
                name = email_addr.split('@')[0] if email_addr else "Unknown"
            
            return {
                'name': name or "Unknown",
                'email': email_addr or "unknown@example.com"
            }
        except Exception as e:
            logger.warning(f"Failed to parse email address '{address_string}': {e}")
            return {
                'name': "Unknown",
                'email': address_string or "unknown@example.com"
            }
    
    def _extract_body(self, email_message) -> str:
        """
        Extract email body from message.
        
        Args:
            email_message: Parsed email message object
        
        Returns:
            Email body as string
        """
        body = ""
        
        if email_message.is_multipart():
            for part in email_message.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition", ""))
                
                # Skip attachments
                if "attachment" in content_disposition:
                    continue
                
                # Get text/plain or text/html
                if content_type == "text/plain" or content_type == "text/html":
                    try:
                        body = part.get_payload(decode=True).decode()
                        break
                    except Exception:
                        continue
        else:
            # Not multipart
            try:
                body = email_message.get_payload(decode=True).decode()
            except Exception:
                body = email_message.get_payload()
        
        return body
    
    def get_email_by_id(self, folder: str, msg_id: str) -> Optional[Dict]:
        """
        Fetch a specific email by ID.
        
        Args:
            folder: IMAP folder name
            msg_id: Email message ID
        
        Returns:
            Email dictionary or None
        """
        if not self.connection:
            if not self.connect():
                raise Exception("Failed to connect to IMAP server")
        
        try:
            # Map and select folder safely
            actual_folder = self._map_folder_name(folder)
            mailbox_name = self._format_mailbox_name(actual_folder)

            status, messages = self.connection.select(mailbox_name, readonly=True)
            if status != 'OK' and mailbox_name != actual_folder:
                status, messages = self.connection.select(actual_folder, readonly=True)

            if status != 'OK':
                logger.error(
                    f"Failed to select folder '{actual_folder}' for message {msg_id}: "
                    f"status={status}, messages={messages}"
                )
                return None
            
            # Fetch email
            email_data = self._fetch_email_by_id(msg_id.encode())
            if email_data:
                email_data['folder'] = actual_folder
            
            return email_data
            
        except Exception as e:
            logger.error(f"Failed to get email: {e}")
            return None


# Singleton instance
email_receiver = EmailReceiver()
