import uuid
import secrets
import base64
import json
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Path to persistent key storage
KEY_STORE_FILE = Path(__file__).parent / "qkd_keys.json"

key_store = {}

def load_keys():
    """Load keys from JSON file on startup"""
    global key_store
    try:
        if KEY_STORE_FILE.exists():
            with open(KEY_STORE_FILE, 'r') as f:
                loaded_data = json.load(f)
                key_store.clear()  # Clear existing dict
                key_store.update(loaded_data)  # Update with loaded data
                logger.info(f"Loaded {len(key_store)} keys from persistent storage")
                logger.info(f"Available key IDs: {list(key_store.keys())}")
        else:
            key_store.clear()
            logger.info("No existing key storage found, starting fresh")
    except Exception as e:
        logger.error(f"Failed to load keys: {e}")
        key_store.clear()

def save_keys():
    """Save keys to JSON file for persistence"""
    try:
        logger.info(f"Saving {len(key_store)} keys to {KEY_STORE_FILE}")
        logger.debug(f"Key IDs being saved: {list(key_store.keys())}")
        with open(KEY_STORE_FILE, 'w') as f:
            json.dump(key_store, f, indent=2)
        logger.info(f"Successfully saved keys to persistent storage")
    except Exception as e:
        logger.error(f"Failed to save keys: {e}")

def generate_key(size_bits = 256):
    key_bytes = secrets.token_bytes(size_bits//8)
    key_b64 = base64.b64encode(key_bytes).decode('utf-8')
    key_id = str(uuid.uuid4())
    return key_id, key_b64