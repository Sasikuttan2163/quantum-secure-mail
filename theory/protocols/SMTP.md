# SMTP

## What is SMTP?

SMTP is an application layer protocol that is used to send and transfer email between servers.

## How does SMTP Work?

- **SMTP connection opened:** SMTP uses TCP as its transport protocol. So, a TCP connection is established between client and serverrrr. Next, the email client initializes the process with the "hello" command (HELO/EHLO).
- **Email data transferred:** The client sends the server a series of commands along with the actual email content: email header (including destination and subject), email body and other components.
- **Mail Transfer Agent (MTA):** The server runs a program called a Mail Transfer Agent (MTA).
