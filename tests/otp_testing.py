from security.one_time_pad import otp_encryption, otp_decryption

plaintext = "Video killed the radio star"
encryppted_response = otp_encryption(plaintext)
ciphertext = encryppted_response[0]
key_ID = encryppted_response[1]
decrypted_plaintext = otp_decryption(ciphertext, key_ID)

if (plaintext == decrypted_plaintext):
    print(True)
else:
    print(False)