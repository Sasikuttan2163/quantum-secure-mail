import requests
import base64
from kyber_py.kyber import Kyber512
import hashlib
from Crypto.Cipher import AES

def crystal_kyber_encryption(plaintext):

    # generate keys from crystal kyber
    pk, sk = Kyber512.keygen()
    ck_key, c = Kyber512.encaps(pk)

    # generate key from qkd simulator
    key_length = 128
    api_url="http://localhost:8000/api/v1/keys/1001/enc_keys"
    get_keys = {
        "number": 1,
        "size": key_length
    }
    response = requests.post(api_url, json=get_keys)
    response = response.json()['keys'][0]
    qk_key_ID = response['key_ID']
    qk_key_b64 = response['key']
    qk_key_bytes = base64.b64decode(qk_key_b64)

    combined_key = qk_key_bytes + ck_key
    final_session_key = hashlib.sha256(combined_key).digest()

    # Initialize AES using pycryptodome
    cipher = AES.new(key=final_session_key, mode=AES.MODE_CFB)
    nonce = cipher.iv
    
    # encrypt the data
    ciphertext = cipher.encrypt(plaintext.encode('utf-8'))
    ciphertext_b64 = base64.b64encode(ciphertext).decode('utf-8')

    return ciphertext_b64, nonce, qk_key_ID, sk, c

def crystal_kyber_decryption(ciphertext_b64, nonce, qk_key_ID, sk, c):

    # regenerate crystal kyber key
    ck_key = Kyber512.decaps(sk, c)

    # get key and key_ID from qkd simulator
    api_url="http://localhost:8000/api/v1/keys/1001/dec_keys"
    get_key_with_keyID = {
        "key_IDs": [
            {
                "key_ID": qk_key_ID
            }
        ]
    }
    response = requests.post(api_url, json=get_key_with_keyID)
    response = response.json()['keys'][0]
    qk_key_b64 = response['key']
    qk_key_bytes = base64.b64decode(qk_key_b64)

    # find combined key
    combined_key = qk_key_bytes + ck_key
    final_session_key = hashlib.sha256(combined_key).digest()

    # convert ciphertext to bytes
    ct_bytes = base64.b64decode(ciphertext_b64)

    # Initialize AES using pycryptodome
    cipher = AES.new(final_session_key, AES.MODE_CFB, nonce)
    
    # perform decryption
    plaintext = cipher.decrypt(ct_bytes)

    return plaintext.decode('utf-8')