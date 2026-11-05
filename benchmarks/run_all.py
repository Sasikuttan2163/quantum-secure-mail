"""
Orchestrator: runs every benchmark stage and produces graphs.

Service policy:
  * If the KME (8000) / backend (8001) are already running, they are reused.
  * Otherwise a fully offline stack is started:
      - KME simulator on 8000
      - bench SMTP sink on 1025 + minimal IMAP server on 1143
      - backend on 8001 pointed at the local mail servers (env overrides only;
        .env is left untouched, and no real Gmail traffic is generated)

Run:  uv run python run_all.py
"""
import os
import socket
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BENCH = Path(__file__).resolve().parent

NO_PROXY_ENV = {
    "NO_PROXY": "127.0.0.1,localhost",
    "no_proxy": "127.0.0.1,localhost",
}


def port_open(port: int, host="127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        try:
            s.connect((host, port))
            return True
        except OSError:
            return False


def wait_port(port, timeout=30) -> bool:
    for _ in range(int(timeout * 4)):
        if port_open(port):
            return True
        time.sleep(0.25)
    return False


def spawn_services():
    """Returns (popen_list, mode) and optionally resets KME key store."""
    popens = []

    if not port_open(8000):
        # clean key store for a pristine, reproducible run
        ks = ROOT / "qkd-simulator" / "qkd_keys.json"
        if ks.exists():
            ks.unlink()
        env = os.environ | NO_PROXY_ENV
        p = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"],
            cwd=ROOT / "qkd-simulator", env=env,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        popens.append(("kme", p))
        assert wait_port(8000), "KME failed to start"

    local_mail = None
    if not port_open(8001):
        # backend needs SMTP sink + IMAP server first
        local_mail = subprocess.Popen(
            [sys.executable, str(BENCH / "local_mail_server.py")],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        popens.append(("mail_server", local_mail))
        assert wait_port(1025) and wait_port(1143), "local mail server failed to start"

        env = os.environ | NO_PROXY_ENV | {
            "SMTP_SERVER": "127.0.0.1", "SMTP_PORT": "1025", "SMTP_USE_TLS": "false",
            "SMTP_USERNAME": "", "SMTP_PASSWORD": "",
            "IMAP_SERVER": "127.0.0.1", "IMAP_PORT": "1143", "IMAP_USE_SSL": "false",
            "IMAP_USERNAME": "bench", "IMAP_PASSWORD": "bench",
        }
        p = subprocess.Popen(
            [sys.executable, "main.py"],
            cwd=ROOT / "backend", env=env,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        popens.append(("backend", p))
        assert wait_port(8001), "backend failed to start"

    mode = "offline-stack" if any(n == "backend" for n, _ in popens) else "reuse-running"
    return popens, mode


def main():
    popens, mode = spawn_services()
    print(f"service mode: {mode}", flush=True)
    try:
        subprocess.run([sys.executable, str(BENCH / "crypto_bench.py")], check=True, cwd=ROOT)
        subprocess.run([sys.executable, str(BENCH / "kme_bench.py")], check=True, cwd=ROOT)
        subprocess.run([sys.executable, str(BENCH / "api_bench.py")], check=True, cwd=ROOT)
        subprocess.run([sys.executable, str(BENCH / "make_graphs.py")], check=True, cwd=ROOT)
    finally:
        for name, p in popens:
            try:
                p.terminate()
                p.wait(timeout=5)
                print(f"stopped {name}", flush=True)
            except Exception:
                pass
    print("ALL DONE — see benchmarks/results and benchmarks/graphs", flush=True)


if __name__ == "__main__":
    main()
