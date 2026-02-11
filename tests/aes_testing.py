from security.quantum_aes import aes_encryption, aes_decryption

plaintext = "Hello darkness, my old friend! We've come to meet again."
ciphertext = aes_encryption(plaintext)
decrypted_plaintext = aes_decryption(ciphertext[0], ciphertext[1], ciphertext[2])

if (plaintext == decrypted_plaintext):
    print(True)
else:
    print(False)