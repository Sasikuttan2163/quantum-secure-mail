import sqlite3
import uuid
import secrets
import base64

# connect to database
conn = sqlite3.connect("keys.db")
# create a cursor
c = conn.cursor()

c.execute("""CREATE TABLE KEYS(
          key_id text,
          key text
          )
        """)

# commit the command and close the connection
conn.commit()
conn.close()

def generate_key(size_bits = 256):
    key_bytes = secrets.token_bytes(size_bits//8)
    key_b64 = base64.b64encode(key_bytes).decode('utf-8')
    key_id = str(uuid.uuid4())
    return key_id, key_b64