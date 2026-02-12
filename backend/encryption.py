"""
Encryption module for quantum-secure email
This module contains actual encryption implementations for various security levels.
"""
import base64
import json
import hashlib
from typing import Tuple
from Crypto.Cipher import AES
from kyber_py.kyber import Kyber512

from models import SecurityLevel, EncryptionMetadata


def encrypt_message(
    plaintext: str,
    key: str,
    key_id: str,
    security_level: SecurityLevel,
    sender_sae_id: str,
    receiver_sae_id: str
) -> Tuple[str, EncryptionMetadata]:
    """
    Encrypt a message using the specified security level.
    
    Args:
        plaintext: The message to encrypt
        key: The encryption key from QKD KME (base64-encoded)
        key_id: The key identifier
        security_level: The security level (L1, L2, L3, L4)
        sender_sae_id: Sender SAE identifier
        receiver_sae_id: Receiver SAE identifier
    
    Returns:
        Tuple of (encrypted_message, metadata)
    """
    
    metadata = EncryptionMetadata(
        key_id=key_id,
        security_level=security_level.value,
        sender_sae_id=sender_sae_id,
        receiver_sae_id=receiver_sae_id
    )
    
    if security_level == SecurityLevel.L1:
        # L1: One-Time Pad using QKD keys
        encrypted = _encrypt_otp(plaintext, key)
        metadata.algorithm_info = "OTP (One-Time Pad)"
        
    elif security_level == SecurityLevel.L2:
        # L2: Quantum-aided AES-256-CFB
        encrypted, nonce = _encrypt_aes_cfb(plaintext, key)
        metadata.algorithm_info = "AES-256-CFB (Quantum-aided)"
        metadata.nonce = nonce
        
    elif security_level == SecurityLevel.L3:
        # L3: Post-Quantum Cryptography (Kyber-512 + QKD)
        encrypted, nonce, kyber_c, kyber_sk = _encrypt_pqc(plaintext, key)
        metadata.algorithm_info = "Kyber-512 + QKD (Hybrid Post-Quantum)"
        metadata.nonce = nonce
        metadata.kyber_ciphertext = kyber_c
        metadata.kyber_secret_key = kyber_sk
        
    elif security_level == SecurityLevel.L4:
        # L4: No encryption
        encrypted = plaintext
        metadata.algorithm_info = "None (Plaintext)"
    
    else:
        raise ValueError(f"Unsupported security level: {security_level}")
    
    return encrypted, metadata
    
    return encrypted, metadata


def _encrypt_otp(plaintext: str, key: str) -> str:
    """
    One-Time Pad encryption using QKD key
    
    The key must be at least as long as the plaintext for true OTP security.
    Uses XOR operation between plaintext bytes and key bytes.
    
    Args:
        plaintext: The message to encrypt
        key: Base64-encoded QKD key
    
    Returns:
        Base64-encoded ciphertext
    """
    # Convert plaintext to bytes
    pt_bytes = plaintext.encode('utf-8')
    pt_length = len(pt_bytes)
    
    # Decode the QKD key
    key_bytes = base64.b64decode(key)
    
    # Ensure key is long enough (for true OTP, key must equal data length)
    if len(key_bytes) < pt_length:
        # Repeat key if necessary (note: this weakens OTP security)
        key_bytes = (key_bytes * ((pt_length // len(key_bytes)) + 1))[:pt_length]
    
    # XOR operation
    ciphertext_bytes = bytes([pt_bytes[i] ^ key_bytes[i] for i in range(pt_length)])
    
    # Return base64-encoded ciphertext
    return base64.b64encode(ciphertext_bytes).decode('utf-8')


def _encrypt_aes_cfb(plaintext: str, key: str) -> Tuple[str, str]:
    """
    AES-256-CFB encryption using QKD key
    
    Uses AES in CFB (Cipher Feedback) mode with the QKD key.
    
    Args:
        plaintext: The message to encrypt
        key: Base64-encoded QKD key (256 bits)
    
    Returns:
        Tuple of (base64-encoded ciphertext, base64-encoded nonce)
    """
    # Decode the QKD key
    key_bytes = base64.b64decode(key)
    
    # Initialize AES cipher in CFB mode
    cipher = AES.new(key=key_bytes, mode=AES.MODE_CFB)
    nonce = cipher.iv
    
    # Encrypt the data
    ciphertext = cipher.encrypt(plaintext.encode('utf-8'))
    ciphertext_b64 = base64.b64encode(ciphertext).decode('utf-8')
    nonce_b64 = base64.b64encode(nonce).decode('utf-8')
    
    return ciphertext_b64, nonce_b64


def _encrypt_pqc(plaintext: str, key: str) -> Tuple[str, str, str, str]:
    """
    Post-Quantum Cryptography encryption using Kyber-512 + QKD hybrid
    
    Combines QKD key with Kyber-512 post-quantum key exchange for hybrid security.
    
    Args:
        plaintext: The message to encrypt
        key: Base64-encoded QKD key (128 bits minimum)
    
    Returns:
        Tuple of (ciphertext_b64, nonce_b64, kyber_ciphertext_b64, kyber_secret_key_b64)
    """
    # Generate Kyber-512 keys
    pk, sk = Kyber512.keygen()
    ck_key, c = Kyber512.encaps(pk)
    
    # Decode QKD key
    qk_key_bytes = base64.b64decode(key)
    
    # Combine QKD key with Kyber key using hash
    combined_key = qk_key_bytes + ck_key
    final_session_key = hashlib.sha256(combined_key).digest()
    
    # Initialize AES cipher with combined key
    cipher = AES.new(key=final_session_key, mode=AES.MODE_CFB)
    nonce = cipher.iv
    
    # Encrypt the data
    ciphertext = cipher.encrypt(plaintext.encode('utf-8'))
    ciphertext_b64 = base64.b64encode(ciphertext).decode('utf-8')
    nonce_b64 = base64.b64encode(nonce).decode('utf-8')
    
    # Encode Kyber components
    kyber_c_b64 = base64.b64encode(c).decode('utf-8')
    kyber_sk_b64 = base64.b64encode(sk).decode('utf-8')
    
    return ciphertext_b64, nonce_b64, kyber_c_b64, kyber_sk_b64


def decrypt_message(
    ciphertext: str,
    key: str,
    metadata: EncryptionMetadata
) -> str:
    """
    Decrypt a message using the provided key and metadata.
    
    Args:
        ciphertext: The encrypted message (base64-encoded)
        key: The decryption key from QKD KME (base64-encoded)
        metadata: Encryption metadata
    
    Returns:
        Decrypted plaintext message
    """
    security_level = SecurityLevel(metadata.security_level)
    
    if security_level == SecurityLevel.L1:
        # L1: One-Time Pad decryption
        return _decrypt_otp(ciphertext, key)
        
    elif security_level == SecurityLevel.L2:
        # L2: AES-256-CFB decryption
        if not metadata.nonce:
            raise ValueError("Nonce is required for AES-CFB decryption")
        return _decrypt_aes_cfb(ciphertext, key, metadata.nonce)
        
    elif security_level == SecurityLevel.L3:
        # L3: Post-Quantum decryption
        if not metadata.nonce or not metadata.kyber_ciphertext or not metadata.kyber_secret_key:
            raise ValueError("Kyber parameters are required for PQC decryption")
        return _decrypt_pqc(
            ciphertext,
            key,
            metadata.nonce,
            metadata.kyber_ciphertext,
            metadata.kyber_secret_key
        )
        
    elif security_level == SecurityLevel.L4:
        # L4: No encryption
        return ciphertext
    
    else:
        raise ValueError(f"Unsupported security level: {security_level}")


def _decrypt_otp(ciphertext: str, key: str) -> str:
    """
    One-Time Pad decryption.
    
    Args:
        ciphertext: Base64-encoded ciphertext
        key: Base64-encoded QKD key
    
    Returns:
        Decrypted plaintext
    """
    # Decode ciphertext and key
    ct_bytes = base64.b64decode(ciphertext)
    key_bytes = base64.b64decode(key)
    ct_length = len(ct_bytes)
    
    # Ensure key is long enough
    if len(key_bytes) < ct_length:
        key_bytes = (key_bytes * ((ct_length // len(key_bytes)) + 1))[:ct_length]
    
    # XOR operation (same as encryption)
    plaintext_bytes = bytes([ct_bytes[i] ^ key_bytes[i] for i in range(ct_length)])
    
    return plaintext_bytes.decode('utf-8')


def _decrypt_aes_cfb(ciphertext: str, key: str, nonce: str) -> str:
    """
    AES-256-CFB decryption.
    
    Args:
        ciphertext: Base64-encoded ciphertext
        key: Base64-encoded QKD key
        nonce: Base64-encoded nonce/IV
    
    Returns:
        Decrypted plaintext
    """
    # Decode components
    ct_bytes = base64.b64decode(ciphertext)
    key_bytes = base64.b64decode(key)
    nonce_bytes = base64.b64decode(nonce)
    
    # Initialize AES cipher
    cipher = AES.new(key_bytes, AES.MODE_CFB, nonce_bytes)
    
    # Decrypt
    plaintext = cipher.decrypt(ct_bytes)
    
    return plaintext.decode('utf-8')


def _decrypt_pqc(
    ciphertext: str,
    qk_key: str,
    nonce: str,
    kyber_c: str,
    kyber_sk: str
) -> str:
    """
    Post-Quantum Cryptography decryption using Kyber-512 + QKD hybrid.
    
    Args:
        ciphertext: Base64-encoded ciphertext
        qk_key: Base64-encoded QKD key
        nonce: Base64-encoded nonce/IV
        kyber_c: Base64-encoded Kyber ciphertext
        kyber_sk: Base64-encoded Kyber secret key
    
    Returns:
        Decrypted plaintext
    """
    # Decode components
    ct_bytes = base64.b64decode(ciphertext)
    qk_key_bytes = base64.b64decode(qk_key)
    nonce_bytes = base64.b64decode(nonce)
    c = base64.b64decode(kyber_c)
    sk = base64.b64decode(kyber_sk)
    
    # Regenerate Kyber shared secret
    ck_key = Kyber512.decaps(sk, c)
    
    # Combine keys
    combined_key = qk_key_bytes + ck_key
    final_session_key = hashlib.sha256(combined_key).digest()
    
    # Initialize AES cipher
    cipher = AES.new(final_session_key, AES.MODE_CFB, nonce_bytes)
    
    # Decrypt
    plaintext = cipher.decrypt(ct_bytes)
    
    return plaintext.decode('utf-8')


def format_encrypted_email_body(encrypted_data: str, metadata: EncryptionMetadata) -> str:
    """
    Format the encrypted message and metadata into the email body.
    
    The format allows the receiver to extract both the encrypted content
    and the metadata needed for decryption.
    
    Args:
        encrypted_data: The encrypted message
        metadata: Associated encryption metadata
    
    Returns:
        Formatted email body with encrypted content and metadata
    """
    metadata_dict = {
        "key_id": metadata.key_id,
        "security_level": metadata.security_level,
        "sender_sae_id": metadata.sender_sae_id,
        "receiver_sae_id": metadata.receiver_sae_id,
        "algorithm_info": metadata.algorithm_info
    }
    
    # Add optional fields if they exist
    if metadata.nonce:
        metadata_dict["nonce"] = metadata.nonce
    if metadata.kyber_ciphertext:
        metadata_dict["kyber_ciphertext"] = metadata.kyber_ciphertext
    if metadata.kyber_secret_key:
        metadata_dict["kyber_secret_key"] = metadata.kyber_secret_key
    
    metadata_json = json.dumps(metadata_dict, indent=2)
    
    email_body = f"""
-----BEGIN QUANTUM ENCRYPTED MESSAGE-----
{encrypted_data}
-----END QUANTUM ENCRYPTED MESSAGE-----

-----BEGIN QUANTUM METADATA-----
{metadata_json}
-----END QUANTUM METADATA-----
"""
    
    return email_body


def parse_encrypted_email_body(email_body: str) -> Tuple[str, EncryptionMetadata]:
    """
    Parse encrypted email body to extract ciphertext and metadata.
    
    Args:
        email_body: The formatted email body
    
    Returns:
        Tuple of (encrypted_data, metadata)
    
    Raises:
        ValueError: If email body format is invalid
    """
    import re
    
    # Extract encrypted message
    encrypted_match = re.search(
        r'-----BEGIN QUANTUM ENCRYPTED MESSAGE-----\s*(.+?)\s*-----END QUANTUM ENCRYPTED MESSAGE-----',
        email_body,
        re.DOTALL
    )
    if not encrypted_match:
        raise ValueError("Could not find encrypted message in email body")
    
    encrypted_data = encrypted_match.group(1).strip()
    
    # Extract metadata
    metadata_match = re.search(
        r'-----BEGIN QUANTUM METADATA-----\s*(.+?)\s*-----END QUANTUM METADATA-----',
        email_body,
        re.DOTALL
    )
    if not metadata_match:
        raise ValueError("Could not find metadata in email body")
    
    metadata_json = metadata_match.group(1).strip()
    metadata_dict = json.loads(metadata_json)
    
    # Create EncryptionMetadata object
    metadata = EncryptionMetadata(**metadata_dict)
    
    return encrypted_data, metadata
