# Quantum Secure Email Client

A quantum-secure email client that integrates Quantum Key Distribution (QKD) with existing email infrastructure for enhanced security.

## Architecture Overview

This project consists of three main components:

1. **QKD Simulator** (`qkd-simulator/`) - Simulates a Quantum Key Management Entity (KME) based on ETSI GS QKD 014
2. **Backend** (`backend/`) - FastAPI service that handles email encryption and SMTP sending
3. **Frontend** (to be implemented) - User interface for composing and reading emails

## Features

- 🔐 **Multi-Level Security**:
  - **L1**: One-Time Pad using QKD keys (maximum security)
  - **L2**: Quantum-aided AES-256-GCM (default, balanced)
  - **L3**: Post-Quantum Cryptography (Kyber-1024)
  - **L4**: No encryption (testing/compatibility)

- 📧 **Email Compatibility**: Works with standard email providers (Gmail, Yahoo, etc.)
- 🔑 **QKD Integration**: Fetches quantum keys from KME via REST APIs
- 🛡️ **Transport Independence**: Encryption at application layer, SMTP/IMAP unchanged

## Project Structure

```
quantum-email-client/
├── backend/
│   ├── main.py              # FastAPI application with /send endpoint
│   ├── email_sender.py      # SMTP email sending module
│   ├── encryption.py        # Encryption functions (placeholders)
│   ├── models.py            # Pydantic models for API
│   └── config.py            # Configuration settings
├── qkd-simulator/
│   ├── main.py              # QKD KME simulator
│   ├── models.py            # QKD API models
│   └── store_keys.py        # In-memory key storage
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## Setup Instructions

### Prerequisites

- Python 3.12+
- SMTP server access (Gmail, Yahoo, etc.)
- For Gmail: [App Password](https://support.google.com/accounts/answer/185833) required

### Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd /home/sasikuttan/dev/crypto/project/quantum-email-client
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables** (create a `.env` file or export):
   ```bash
   # SMTP Configuration (Gmail example)
   export SMTP_SERVER="smtp.gmail.com"
   export SMTP_PORT="587"
   export SMTP_USERNAME="your-email@gmail.com"
   export SMTP_PASSWORD="your-app-password"
   export SMTP_USE_TLS="true"
   
   # QKD KME Configuration
   export QKD_KME_URL="http://localhost:8000"
   export QKD_MASTER_SAE_ID="SENDER_SAE"
   export QKD_SLAVE_SAE_ID="RECEIVER_SAE"
   
   # Backend Configuration
   export BACKEND_HOST="0.0.0.0"
   export BACKEND_PORT="8001"
   ```

   **For Gmail Users**: 
   - Enable 2-factor authentication
   - Generate an [App Password](https://myaccount.google.com/apppasswords)
   - Use the app password in `SMTP_PASSWORD`

### Running the Services

**Terminal 1 - Start QKD Simulator (KME)**:
```bash
cd qkd-simulator
python main.py
# Runs on http://localhost:8000
```

**Terminal 2 - Start Email Backend**:
```bash
cd backend
python main.py
# Runs on http://localhost:8001
```

## API Endpoints

### Backend Service (Port 8001)

#### Health Check
```bash
curl http://localhost:8001/health
```

#### Send Encrypted Email
```bash
curl -X POST http://localhost:8001/send \
  -H "Content-Type: application/json" \
  -d '{
    "from": "sender@gmail.com",
    "to": "recipient@gmail.com",
    "subject": "Quantum Encrypted Test",
    "body": "This is a test of quantum-secure email encryption!",
    "security_level": "L2"
  }'
```

### QKD Simulator (Port 8000)

#### Get KME Status
```bash
curl http://localhost:8000/api/v1/keys/RECEIVER_SAE/status
```

#### Request Encryption Keys
```bash
curl -X POST http://localhost:8000/api/v1/keys/RECEIVER_SAE/enc_keys \
  -H "Content-Type: application/json" \
  -d '{
    "number": 1,
    "size": 256
  }'
```

## Testing Examples

### Example 1: Send Email with L2 Security (AES-256-GCM)

```bash
curl -X POST http://localhost:8001/send \
  -H "Content-Type: application/json" \
  -d '{
    "from": "your-email@gmail.com",
    "to": "recipient@gmail.com",
    "subject": "Quantum Secure Message - L2",
    "body": "This message is encrypted with quantum-aided AES-256-GCM",
    "security_level": "L2"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Email sent successfully with quantum encryption",
  "key_id": "generated-key-id",
  "security_level": "L2",
  "recipient": "recipient@gmail.com"
}
```

### Example 2: Send Email with L1 Security (One-Time Pad)

```bash
curl -X POST http://localhost:8001/send \
  -H "Content-Type: application/json" \
  -d '{
    "from": "your-email@gmail.com",
    "to": "recipient@gmail.com",
    "subject": "Maximum Security Message",
    "body": "This uses one-time pad encryption with QKD keys",
    "security_level": "L1"
  }'
```

### Example 3: Send Email with L3 Security (Post-Quantum)

```bash
curl -X POST http://localhost:8001/send \
  -H "Content-Type: application/json" \
  -d '{
    "from": "your-email@gmail.com",
    "to": "recipient@gmail.com",
    "subject": "Post-Quantum Secure",
    "body": "Protected with Kyber-1024 post-quantum cryptography",
    "security_level": "L3"
  }'
```

### Example 4: Send Plaintext Email (L4 - No Encryption)

```bash
curl -X POST http://localhost:8001/send \
  -H "Content-Type: application/json" \
  -d '{
    "from": "your-email@gmail.com",
    "to": "recipient@gmail.com",
    "subject": "Test Message",
    "body": "This is sent without encryption for testing",
    "security_level": "L4"
  }'
```

## Testing with Python

You can also test using Python's `requests` library:

```python
import requests

payload = {
    "from": "your-email@gmail.com",
    "to": "recipient@gmail.com",
    "subject": "Quantum Test",
    "body": "Testing quantum encryption!",
    "security_level": "L2"
}

response = requests.post(
    "http://localhost:8001/send",
    json=payload
)

print(response.json())
```

## Encrypted Email Format

When you send an encrypted email, the recipient will receive a message in this format:

```
-----BEGIN QUANTUM ENCRYPTED MESSAGE-----
[ENCRYPTED-DATA-HERE]
-----END QUANTUM ENCRYPTED MESSAGE-----

-----BEGIN QUANTUM METADATA-----
{
  "key_id": "key-identifier",
  "security_level": "L2",
  "sender_sae_id": "SENDER_SAE",
  "receiver_sae_id": "RECEIVER_SAE",
  "algorithm_info": "AES-256-GCM (Quantum-aided)"
}
-----END QUANTUM METADATA-----
```

## Configuration Options

All configuration can be set via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_SERVER` | SMTP server address | smtp.gmail.com |
| `SMTP_PORT` | SMTP server port | 587 |
| `SMTP_USERNAME` | SMTP authentication username | - |
| `SMTP_PASSWORD` | SMTP authentication password | - |
| `SMTP_USE_TLS` | Use TLS encryption | true |
| `QKD_KME_URL` | QKD KME service URL | http://localhost:8000 |
| `QKD_MASTER_SAE_ID` | Sender SAE identifier | SENDER_SAE |
| `QKD_SLAVE_SAE_ID` | Receiver SAE identifier | RECEIVER_SAE |
| `BACKEND_HOST` | Backend listen address | 0.0.0.0 |
| `BACKEND_PORT` | Backend listen port | 8001 |

## Troubleshooting

### Gmail Authentication Issues

If you get "Username and Password not accepted":
1. Enable 2-factor authentication on your Google account
2. Generate an App Password at https://myaccount.google.com/apppasswords
3. Use the 16-character app password (no spaces)

### QKD KME Connection Failed

Ensure the QKD simulator is running:
```bash
curl http://localhost:8000/api/v1/keys/TEST/status
```

### Port Already in Use

Change the port in environment variables:
```bash
export BACKEND_PORT="8002"
```

## Development Status

### ✅ Completed
- QKD KME simulator with ETSI-style APIs
- Backend FastAPI service with `/send` endpoint
- Multi-level security support (L1-L4)
- SMTP integration with major providers
- Configuration management

### 🚧 Pending Implementation
- Actual cryptographic implementations (currently placeholders)
- IMAP receiver for reading encrypted emails
- Message decryption functionality
- GUI frontend (Windows desktop client)
- Key synchronization between sender and receiver

## Security Levels Detail

| Level | Method | Security | Performance | Use Case |
|-------|--------|----------|-------------|----------|
| L1 | One-Time Pad | Maximum (theoretical) | Low (key = data length) | Ultra-sensitive data |
| L2 | AES-256-GCM + QKD | Very High | High | Default for most use |
| L3 | Kyber-1024 PQC | High (quantum-resistant) | Medium | Future-proofing |
| L4 | None | None | Maximum | Testing/debugging |

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

## Next Steps

1. **Implement actual encryption**: Replace placeholder functions in `backend/encryption.py`
2. **Build IMAP receiver**: Create module to fetch and decrypt emails
3. **Develop GUI**: Windows desktop application for user interface
4. **Key Management**: Implement proper key lifecycle and cleanup
5. **Testing**: Add unit tests and integration tests

## License

[Your License Here]

## Contributors

[Your Name/Team]

---

For questions or issues, please refer to the `AGENTS.md` file for architectural details.
