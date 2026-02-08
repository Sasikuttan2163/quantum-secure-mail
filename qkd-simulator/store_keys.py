import uuid
import secrets
import base64

key_store = {}

def generate_key(size_bits = 256):
    key_bytes = secrets.token_bytes(size_bits//8)
    key_b64 = base64.b64encode(key_bytes).decode('utf-8')
    key_id = str(uuid.uuid4())
    return key_id, key_b64