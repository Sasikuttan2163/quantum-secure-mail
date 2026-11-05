"""
Self-contained development mail server used ONLY for offline benchmarking.

It emulates the two protocol servers the backend normally talks to:
  * an SMTP sink on 127.0.0.1:1025 (accepts messages, stores them in memory)
  * a minimal IMAP server on 127.0.0.1:1143 (serves the stored messages)

This lets the full /send -> /fetch -> /decrypt chain be measured end-to-end
without Gmail credentials. When real SMTP/IMAP credentials exist in .env the
benchmark orchestrator can skip this server and use the live providers instead.

Only the handful of IMAP commands the backend uses are implemented:
LOGIN, SELECT, SEARCH ALL/UNSEEN, FETCH <n> (RFC822), LOGOUT, NOOP.
RFC822 raw messages are returned byte-for-byte, so all custom
X-Quantum-* headers survive the round trip.
"""
import socket
import socketserver
import threading

SMTP_HOST, SMTP_PORT = "127.0.0.1", 1025
IMAP_HOST, IMAP_PORT = "127.0.0.1", 1143

# Shared message store: list of raw RFC822 bytes, IMAP sequence number = index+1
MESSAGES = []
LOCK = threading.Lock()


class SMTPHandler(socketserver.StreamRequestHandler):
    def _send(self, line: str):
        self.wfile.write((line + "\r\n").encode())

    def handle(self):
        self._send("220 bench-mail-server SMTP")
        while True:
            line = self.rfile.readline()
            if not line:
                return
            cmd = line.decode(errors="replace").strip().upper()
            if cmd.startswith("EHLO") or cmd.startswith("HELO"):
                self.wfile.write(b"250-bench\r\n250 OK\r\n")
            elif cmd.startswith("MAIL") or cmd.startswith("RCPT"):
                self._send("250 OK")
            elif cmd.startswith("DATA"):
                self._send("354 End data with <CR><LF>.<CR><LF>")
                data = bytearray()
                while True:
                    raw = self.rfile.readline()
                    if not raw or raw.rstrip(b"\r\n") == b".":
                        break
                    # dot-stuffing reversal (RFC 5321)
                    if raw.startswith(b".."):
                        raw = raw[1:]
                    data.extend(raw)
                with LOCK:
                    MESSAGES.append(bytes(data))
                self._send("250 OK queued")
            elif cmd.startswith("QUIT"):
                self._send("221 Bye")
                return
            elif cmd.startswith("NOOP") or cmd.startswith("RSET"):
                self._send("250 OK")
            else:
                self._send("250 OK")  # permissive: keep benchmarks running


class IMAPHandler(socketserver.StreamRequestHandler):
    def _send(self, line: str):
        self.wfile.write((line + "\r\n").encode())

    def handle(self):
        self._send("* OK bench IMAP4 server ready")
        while True:
            line = self.rfile.readline()
            if not line:
                return
            text = line.decode(errors="replace").rstrip("\r\n")
            parts = text.split(" ")
            tag = parts[0]
            cmd = parts[1].upper() if len(parts) > 1 else ""
            arg = parts[2] if len(parts) > 2 else ""

            if cmd == "CAPABILITY":
                self._send("* CAPABILITY IMAP4rev1")
                self._send(f"{tag} OK CAPABILITY completed")
            elif cmd == "LOGIN":
                self._send(f"{tag} OK LOGIN completed")
            elif cmd == "SELECT" or cmd == "EXAMINE":
                with LOCK:
                    n = len(MESSAGES)
                self._send("* FLAGS (\\Seen \\Answered \\Flagged \\Draft)")
                self._send(f"* {n} EXISTS")
                self._send("* 0 RECENT")
                self._send("* OK [UIDVALIDITY 1] UIDs valid")
                self._send(f"{tag} OK [READ-ONLY] {cmd} completed")
            elif cmd == "SEARCH":
                # search criteria in remaining args; "ALL" -> 1..n
                with LOCK:
                    n = len(MESSAGES)
                    seqs = " ".join(str(i + 1) for i in range(n)) if n else ""
                self._send(f"* SEARCH {seqs}".rstrip())
                self._send(f"{tag} OK SEARCH completed")
            elif cmd == "FETCH":
                seq = int(arg)
                want = parts[-1].strip("()")  # e.g. (RFC822)
                with LOCK:
                    if 1 <= seq <= len(MESSAGES):
                        raw = MESSAGES[seq - 1]
                        exists = True
                    else:
                        exists = False
                if not exists:
                    self._send(f"{tag} OK FETCH completed (no such message)")
                    continue
                self.wfile.write(
                    f"* {seq} FETCH (RFC822 {{{len(raw)}}}\r\n".encode()
                )
                self.wfile.write(raw)
                self.wfile.write(b")\r\n")
                self._send(f"{tag} OK FETCH completed")
            elif cmd == "NOOP":
                self._send(f"{tag} OK NOOP completed")
            elif cmd == "IDLE":
                self._send("+ idling")
                self.rfile.readline()
                self._send(f"{tag} OK IDLE terminated")
            elif cmd == "LOGOUT":
                self._send("* BYE")
                self._send(f"{tag} OK LOGOUT completed")
                return
            else:
                self._send(f"{tag} BAD unknown command {cmd}")


def main():
    marked_read_only = socketserver.ThreadingTCPServer
    marked_read_only.allow_reuse_address = True

    smtp_server = marked_read_only((SMTP_HOST, SMTP_PORT), SMTPHandler)
    imap_server = marked_read_only((IMAP_HOST, IMAP_PORT), IMAPHandler)
    threads = [
        threading.Thread(target=smtp_server.serve_forever, daemon=True),
        threading.Thread(target=imap_server.serve_forever, daemon=True),
    ]
    for t in threads:
        t.start()
    print(f"bench-mail-server: SMTP {SMTP_HOST}:{SMTP_PORT}, IMAP {IMAP_HOST}:{IMAP_PORT}", flush=True)
    try:
        while True:
            threading.Event().wait(3600)
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
