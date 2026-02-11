import requests
import base64

def otp_encryption(plaintext):

    # determine key length
    pt_bytes = plaintext.encode('utf-8')
    pt_length = len(pt_bytes)
    key_length = pt_length*8

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

    # encode the plaintext
    ciphertext_bytes = bytes([pt_bytes[i] ^ key_bytes[i] for i in range(pt_length)])
    ciphertext_b64 = base64.b64encode(ciphertext_bytes).decode('utf-8')

    return ciphertext_b64, key_ID

def otp_decryption(ciphertext, key_ID):

    # determine key length
    ct_bytes = base64.b64decode(ciphertext)
    ct_length = len(ct_bytes)

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

    # obtain the plaintext from the ciphertext
    plaintext_bytes = bytes([ct_bytes[i] ^ key_bytes[i] for i in range(ct_length)])
    plaintext = plaintext_bytes.decode('utf-8')

    return plaintext