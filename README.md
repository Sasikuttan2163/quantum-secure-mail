# Quantum Secure Email Client

Desktop email client that integrates Quantum Key Distribution (QKD) with standard email protocols. Compatible with Gmail, Yahoo, and other SMTP/IMAP providers.

Platform: Windows/Linux (Electron + React)

## Quick Start

Requirements:
- Python 3.12+
- Node.js 18+
- Gmail account with App Password

Setup:

```bash
cd backend && pip install -r requirements.txt
cd ../quantum-mail-frontend && npm install
cd ..
```

## Features

Implemented:
- 4 security levels: One-Time Pad, AES-CFB, Kyber-512, plaintext
- QKD integration using ETSI GS QKD 014 REST API
- SMTP sending and IMAP receiving
- Auto-decryption when opening emails
- Native Electron desktop app

In progress:
- Attachment encryption
- Multi-recipient support
- Contact management

## Security Levels

### L1 - One-Time Pad

- Algorithm: XOR with QKD key
- Key source: Quantum Key Distribution
- Format: `ENCRYPTED:L1:[base64_ciphertext]:[key_id]`
- Key size must equal message size

### L2 - AES-CFB

- Algorithm: AES-256-CFB
- Key source: QKD-derived 32-byte key
- Format: `ENCRYPTED:L2:[base64_iv]:[base64_ciphertext]:[key_id]`
- Recommended for general use

### L3 - Kyber-512

- Algorithm: Kyber-512 + AES-256-CFB hybrid
- Key source: Post-quantum cryptography
- Format: `ENCRYPTED:L3:[base64_kyber_ct]:[base64_aes_ct]:[base64_iv]`
- Independent of QKD

### L4 - None

- No encryption
- Plaintext only
- For testing purposes


## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Electron + React) - Port 3000                │
│  • Compose emails with security level selection         │
│  • Fetch and display inbox                              │
│  • Auto-decrypt encrypted emails on click               │
└─────────────────┬───────────────────────────────────────┘
                  │ IPC Bridge
┌─────────────────▼───────────────────────────────────────┐
│  Backend (FastAPI) - Port 8001                          │
│  • POST /send - Encrypt and send via SMTP               │
│  • POST /fetch - Retrieve emails via IMAP               │
│  • POST /decrypt - Decrypt with QKD key                 │
└─────────────────┬───────────────────────────────────────┘
                  │ REST API
┌─────────────────▼───────────────────────────────────────┐
│  QKD Simulator - Port 8000                              │
│  • GET /enc_keys - Provide encryption keys              │
│  • GET /dec_keys - Provide decryption keys              │
│  • ETSI GS QKD 014 compatible                           │
└─────────────────────────────────────────────────────────┘
           ▲                          ▼
           └──────────────────────────┘
           Gmail SMTP (587) / IMAP (993)
```

## Project Structure

```
quantum-email-client/
├── .env
├── test_integration.sh
├── stop_services.sh
├── logs/
├── backend/
│   ├── main.py
│   ├── encryption.py
│   ├── email_sender.py
│   ├── email_receiver.py
│   ├── config.py
│   ├── models.py
│   └── requirements.txt
├── qkd-simulator/
│   ├── main.py
│   ├── models.py
│   └── store_keys.py
└── quantum-mail-frontend/
    ├── electron/
    │   ├── main.js
    │   ├── preload.js
    │   └── ipc-handlers.js
    └── src/
        ├── store/
        └── components/
```

## Configuration

Create a `.env` file:

```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your.email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx

IMAP_SERVER=imap.gmail.com
IMAP_PORT=993
IMAP_USERNAME=your.email@gmail.com
IMAP_PASSWORD=xxxx xxxx xxxx xxxx

QKD_KME_URL=http://127.0.0.1:8000
QKD_SOURCE_KME_ID=KME_001
QKD_TARGET_KME_ID=KME_002
QKD_KEY_SIZE=32
```

To get a Gmail App Password:
1. Visit https://myaccount.google.com/apppasswords
2. Select "Mail" and generate password
3. Use the generated password in your `.env` file

## Testing

Start all services:

```bash
./test_integration.sh
```

This starts the QKD simulator (port 8000), backend (port 8001), and frontend.

Workflow:
1. Click "Compose" to create an email
2. Enter recipient, subject, and body
3. Select security level
4. Click "Send"
5. Click "Inbox" to fetch emails
6. Click an encrypted email to auto-decrypt and read

Stop services:

```bash
./stop_services.sh
```

Direct API testing:

```bash
curl -X POST http://localhost:8001/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "subject": "Test",
    "body": "Hello",
    "security_level": 2
  }'

curl -X POST http://localhost:8001/fetch \
  -H "Content-Type: application/json" \
  -d '{"folder": "INBOX", "limit": 10}'

curl http://localhost:8000/api/v1/keys/enc_keys
```

## Development

Run services individually:

QKD Simulator:
```bash
cd qkd-simulator
python main.py
```

Backend:
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

Frontend:
```bash
cd quantum-mail-frontend
npm start
```

## Security Notes

- Use Gmail App Passwords only
- QKD simulator is for development, not production

Encrypted emails include custom headers:

```
X-QuMail-Version: 1.0
X-QuMail-Security-Level: L2
X-QuMail-Key-ID: key_12345
```

## Troubleshooting

Backend not starting:
```bash
lsof -i:8001
tail -f logs/backend.log
cat .env
```

Email not sending:
- Verify Gmail App Password
- Check backend logs for SMTP errors

Email not decrypting:
- Check QKD simulator is running on port 8000
- Verify key_ID matches an available key
- Check browser console for errors

Frontend not opening:
```bash
cd quantum-mail-frontend
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

Frontend connection errors:
The code uses `127.0.0.1` to force IPv4 connections. Verify with:
```bash
curl http://127.0.0.1:8001/health
```

## Implementation Status

Core features implemented:
- User authentication GUI
- Email composition GUI
- Inbox viewing
- Message reading
- Attachment detection (encryption TODO)
- Python backend for encryption/decryption
- Key manager integration
- SMTP sending and IMAP retrieval
- ETSI GS QKD 014 REST interface
- Multiple security levels
- Modular architecture
- Gmail/Yahoo compatibility
- Windows/Linux support
- One-Time Pad (L1), AES-256 (L2), Kyber-512 (L3)
- Auto-decryption

Planned features:
- Attachment encryption
- Multi-recipient support (To/CC/BCC)
- Contact management with public keys
- Automatic key rotation
- Persistent storage (SQLite)
- Full-text search
- Digital signatures

## License

Educational/Research Project
