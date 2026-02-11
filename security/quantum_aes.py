import requests
import base64
from Crypto.Cipher import AES

def aes_encryption(plaintext):

    # determine key length
    key_length = 256

    # get key and key_ID from qkd simulator
    api_url="http://localhost:8000/api/v1/keys/1001/enc_keys"
    get_keys = {
        "number": 1,
        "size": key_length
    }
    response = requests.post(api_url, json=get_keys)
    response = response.json()['keys'][0]
    key_ID = response['key_ID']
    key_b64 = response['key']
    key_bytes = base64.b64decode(key_b64)

    # Initialize AES using pycryptodome
    cipher = AES.new(key=key_bytes, mode=AES.MODE_CFB)
    nonce = cipher.iv
    
    # encrypt the data
    ciphertext = cipher.encrypt(plaintext.encode('utf-8'))
    ciphertext_b64 = base64.b64encode(ciphertext).decode('utf-8')

    return ciphertext_b64, nonce, key_ID

def aes_decryption(ciphertext, nonce, key_ID):

    # get key and key_ID from qkd simulator
    api_url="http://localhost:8000/api/v1/keys/1001/dec_keys"
    get_key_with_keyID = {
        "key_IDs": [
            {
                "key_ID": key_ID
            }
        ]
    }
    response = requests.post(api_url, json=get_key_with_keyID)
    response = response.json()['keys'][0]
    key_ID = response['key_ID']
    key_b64 = response['key']
    key_bytes = base64.b64decode(key_b64)

    # convert ciphertext to bytes
    ct_bytes = base64.b64decode(ciphertext)

    # Initialize AES using pycryptodome
    cipher = AES.new(key_bytes, AES.MODE_CFB, nonce)
    
    # perform decryption
    plaintext = cipher.decrypt(ct_bytes)

    return plaintext.decode('utf-8')