from security.crystal_kyber import crystal_kyber_encryption, crystal_kyber_decryption

plaintext = "The answer my friend is blowing in the wind, the answer is blowing in the wind."
encrypted = crystal_kyber_encryption(plaintext)

ciphertext_b64, nonce, qk_key_ID, sk, c = encrypted

decrypted_plaintext = crystal_kyber_decryption(ciphertext_b64, nonce, qk_key_ID, sk, c)

if (plaintext == decrypted_plaintext):
    print(True)
else:
    print(False)