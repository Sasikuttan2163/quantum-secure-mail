# Quantum Secure Email Client

Desktop email client that integrates Quantum Key Distribution (QKD) with standard email protocols that's compatible with Gmail, Yahoo, and other SMTP and IMAP providers.

Platform: Windows/Linux (Electron + React)

## Running the project

Requirements:
- Python 3.12+
- Node.js 18+
- Gmail account with App Password

## Features

Implemented:
- 4 security levels implemented: One-Time Pad, AES-CFB, Kyber-512 and plaintext
- QKD integration based off ETSI GS QKD 014 REST API
- SMTP for sending emails and IMAP support for receiving
- Emails automatically decrypted when opened
- Native Electron desktop app
- No email cache

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


## Implementation Status

Core features implemented:
- User authentication GUI
- Email composition GUI
- Inbox viewing
- Message reading
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
