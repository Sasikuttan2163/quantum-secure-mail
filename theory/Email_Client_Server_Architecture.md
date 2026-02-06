# Email Client Server Architecture

## Core Email Flow

1. **Sending:** The email client (eg, Gmail) sends the message to an outgoing server (eg, Google server) using SMTP (Simple Mail Transfer Protocol).
2. **DNS Lookup:** The sender's server (eg, Google server) performs a DNS lookup to fnd the MX (Mail Exchange) record of the recipient's domain (eg, @yahoo.com).
3. **Relay:** After DNS, the sender's server sends the mail to the External (Recipient's) Mail Server (eg, Yahoo server). The email travels through various routers and relay servers across the internet.
4. **Delivery:** The email arrives at the recipient's mail server. Here, it is filtered, and is stored in their mailbox until they retrieve it using IMAP or POP3.

> **Note:**
>
> - Autonomous Systems (AS): Large networks owned by ISPs or companies like Google/Yahoo. Between the sender's server and the recipient's server, the email travels via these AS's.
> - BGP (Border Gateway Protocol): The peering protocol responsible for finding the most efficient route between these autonomous systems based on real-time network conditions.

## Mail Retrieval Protocols

Two primary methods for accessing stored emails are compared.

- IMAP (Internet Message Access Protocol): Keep emails on the server, allowing synchronization and access across multiple devices.
- POP3 (Post Office Protocol 3): Downloads the email to a single device and typically removes it from the server.

## Setting up Email Server

1. Register a custom domain (example.com) for the emai server to use.
2. Set up a dedicated Linux VPS server (VPS from AWS, Linode or Digital Ocean).
3. Install software: Postfix or Exim (for SMTP) and Dovecot (for IMAP/POP3).
4. Configure DNS records: MX, SPF, DKIM, and DMARC (essential for deliverability and security).
5. Add Security (SpamAssassin and ClamAV for filtering out spam and viruses).
6. Webmail Setup: Use ROundCube for browser based inbox for managing emails like Gmail.

## High Level System Design

> Regular servers are not specialized for handling email processing. Email servers support protocols like SMTP, IMAP and POP3,which are not configured by regular servers. Email can experience delays due to network issues. Mail servers need queueing machanism to retry delivery if needed.

1. SMTP Servers: Handle the actual transfer of messages.
2. Mail Retrieval Servers: Manage email access with IMAP/POP3 access.
3. Mail Storage System: Stores massive amounts of data (estimated at 5.5 petabytes/year for 10 million users) securely and efficiently
4. Filtering Service: Uses Machine Learning (Naive Bayes, Logistic Regression) to block spam and viruses.
5. Authentication Service: Manages secure logins using OAuth 2.0 and hashing algorithms like bcrypt.
6. Web and Mobile Interfaces: Allow users to interact with their inox.
7. Database Systems: To store metadata, user profiles and email indexing information.

### SMTP Servers

These handle both outgoing and incoming emails. So, when an email is sent to an SMTP server, it uses a DNS resolver to find the recipient's Mail Exchange (MX) Record. THe MX records tell the server where to deliver the email. If there are multiple MX records, they are prioritized based on preference.

### Mail Retrieval Servers

Manage email access and retrieval with IMAP/POP3 access.

### Mail Storage Systems

Used to store massive amounts of email data, while making it secure and accessible. Use S3 or Cassandra.
