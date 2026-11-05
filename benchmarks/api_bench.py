"""
API benchmark: exercises the live backend over HTTP (127.0.0.1:8001) and the
mail servers (SMTP 1025 / IMAP 1143 local, or real Gmail when configured).

Collects:
  * REST round-trip time for /health, /fetch, /send, /decrypt (per level)
  * stage breakdown of /send from the backend-instrumented timings:
        key_request_ms (KME /enc_keys) -> encryption_ms -> smtp_ms
  * stage breakdown of /decrypt: fetch_ms (IMAP) -> key_retrieval_ms -> decrypt_ms
  * end-to-end send->fetch->decrypt success rate
  * throughput under concurrent load (messages/sec on /send)

Run:  uv run python api_bench.py
"""
import time
import random
import string
import concurrent.futures

import httpx

from common import stats, save_json, save_csv, fmt_row, BACKEND_URL

RECIPIENT = "bench-recipient@example.com"
BODY_1KB = "".join(random.choices(string.ascii_letters + "0123456789 .,\n", k=1024))
BODY_2KB = "".join(random.choices(string.ascii_letters + "0123456789 .,\n", k=2048))


def client() -> httpx.Client:
    return httpx.Client(base_url=BACKEND_URL, timeout=60.0)


def send_email(c, level, body=None, subject=None):
    payload = {
        "to": RECIPIENT,
        "subject": subject or f"BENCH {level}",
        "body": body or BODY_1KB,
        "security_level": level,
    }
    resp = c.post("/send", json=payload)
    resp.raise_for_status()
    return resp.json()


def fetch_latest_id(c, level=None):
    r = c.post("/fetch", json={"folder": "INBOX", "limit": 5})
    r.raise_for_status()
    emails = r.json()["emails"]
    if level:
        for e in emails:
            if str(e.get("security_level")) == level:
                e["id"] = e["id"]
                return e
        return None
    return emails[0] if emails else None


def bench_roundtrips(n=30):
    """REST round-trip time for each endpoint (happy path)."""
    results = {}
    c = client()

    lats = []
    for _ in range(n):
        t0 = time.perf_counter()
        c.get("/health").raise_for_status()
        lats.append((time.perf_counter() - t0) * 1000)
    results["health"] = stats(lats)

    lats = []
    statuses = []
    for _ in range(n):
        t0 = time.perf_counter()
        r = c.post("/send", json={"to": RECIPIENT, "subject": "RTT-L4", "body": BODY_1KB, "security_level": "L4"})
        lats.append((time.perf_counter() - t0) * 1000)
        statuses.append(r.status_code)
    results["send"] = stats(lats)
    results["send_success"] = statuses.count(200) / n * 100

    lats = []
    for _ in range(n):
        t0 = time.perf_counter()
        r = c.post("/fetch", json={"folder": "INBOX", "limit": 5})
        r.raise_for_status()
        lats.append((time.perf_counter() - t0) * 1000)
    results["fetch"] = stats(lats)

    # /decrypt per encrypted level, reusing one fetched message each
    for level in ("L1", "L2", "L3"):
        email = fetch_latest_id(c, level)
        if not email:
            send_email(c, level)
            email = fetch_latest_id(c, level)
        if not email:
            results[f"decrypt_{level}"] = {"error": "no encrypted message found"}
            continue
        lats = []
        for _ in range(n):
            t0 = time.perf_counter()
            r = c.post("/decrypt", json={"email_id": email["id"], "folder": "INBOX"})
            r.raise_for_status()
            lats.append((time.perf_counter() - t0) * 1000)
        results[f"decrypt_{level}"] = stats(lats)

    save_json("api_roundtrip", results)
    print("roundtrips:", flush=True)
    for k, v in results.items():
        print(" ", k, v if not isinstance(v, dict) else v["mean"], flush=True)
    return results


def bench_send_stages(trials=12):
    """Stage decomposition of /send per security level (2 KiB bodies)."""
    rows = []
    c = client()
    for level in ("L1", "L2", "L3", "L4"):
        for i in range(trials):
            t0 = time.perf_counter()
            data = send_email(c, level, body=BODY_2KB, subject=f"STAGE {level} #{i}")
            rtt = (time.perf_counter() - t0) * 1000
            t = data.get("timings") or {}
            rows.append({
                "level": level,
                "trial": i,
                "rtt_ms": round(rtt, 3),
                "key_request_ms": t.get("key_request_ms", 0.0),
                "encryption_ms": t.get("encryption_ms", 0.0),
                "smtp_ms": t.get("smtp_ms", 0.0),
                "total_ms": t.get("total_ms", round(rtt, 3)),
            })
        print(f"send stages {level} done", flush=True)
    save_json("api_send_stages_raw", rows)
    save_csv("api_send_stages_raw", rows, list(rows[0].keys()))

    agg = []
    for level in ("L1", "L2", "L3", "L4"):
        sel = [r for r in rows if r["level"] == level]
        agg.append({
            "level": level,
            "key_request_ms": round(sum(r["key_request_ms"] for r in sel) / len(sel), 3),
            "encryption_ms": round(sum(r["encryption_ms"] for r in sel) / len(sel), 3),
            "smtp_ms": round(sum(r["smtp_ms"] for r in sel) / len(sel), 3),
            "total_ms": round(sum(r["total_ms"] for r in sel) / len(sel), 3),
            "http_rtt_ms": round(sum(r["rtt_ms"] for r in sel) / len(sel), 3),
        })
    save_json("api_send_stages_summary", agg)
    save_csv("api_send_stages_summary", agg, list(agg[0].keys()))
    print(agg, flush=True)
    return agg


def bench_decrypt_stages(trials=10):
    """Stage decomposition of /decrypt per security level."""
    rows = []
    c = client()
    ids = {}
    for level in ("L1", "L2", "L3"):
        email = fetch_latest_id(c, level)
        if not email:
            send_email(c, level, subject=f"DECSTAGE {level}")
            email = fetch_latest_id(c, level)
        ids[level] = email["id"]

    for level, eid in ids.items():
        for i in range(trials):
            t0 = time.perf_counter()
            r = c.post("/decrypt", json={"email_id": eid, "folder": "INBOX"})
            rtt = (time.perf_counter() - t0) * 1000
            r.raise_for_status()
            data = r.json()
            t = data.get("timings") or {}
            rows.append({
                "level": level, "trial": i, "rtt_ms": round(rtt, 3),
                "fetch_ms": t.get("fetch_ms", 0.0),
                "key_retrieval_ms": t.get("key_retrieval_ms", 0.0),
                "decrypt_ms": t.get("decrypt_ms", 0.0),
                "total_ms": t.get("total_ms", 0.0),
            })
        print(f"decrypt stages {level} done", flush=True)
    save_json("api_decrypt_stages_raw", rows)
    save_csv("api_decrypt_stages_raw", rows, list(rows[0].keys()))

    agg = []
    for level in ("L1", "L2", "L3"):
        sel = [r for r in rows if r["level"] == level]
        agg.append({
            "level": level,
            "fetch_ms": round(sum(r["fetch_ms"] for r in sel) / len(sel), 3),
            "key_retrieval_ms": round(sum(r["key_retrieval_ms"] for r in sel) / len(sel), 3),
            "decrypt_ms": round(sum(r["decrypt_ms"] for r in sel) / len(sel), 3),
            "total_ms": round(sum(r["total_ms"] for r in sel) / len(sel), 3),
            "http_rtt_ms": round(sum(r["rtt_ms"] for r in sel) / len(sel), 3),
        })
    save_json("api_decrypt_stages_summary", agg)
    save_csv("api_decrypt_stages_summary", agg, list(agg[0].keys()))
    print(agg, flush=True)
    return agg


def bench_e2e_success(trials=5):
    """send -> fetch -> decrypt round-trip correctness per level."""
    c = client()
    results = {}
    for level in ("L1", "L2", "L3", "L4"):
        ok = 0
        for i in range(trials):
            marker = f"E2E {level} marker-{i} {random.randint(0, 10**9)}"
            send_email(c, level, body=marker, subject=f"E2E {level} #{i}")
            email = fetch_latest_id(c, level) if level != "L4" else fetch_latest_id(c)
            if not email:
                continue
            r = c.post("/decrypt", json={"email_id": email["id"], "folder": "INBOX"})
            if r.status_code == 200 and r.json().get("decrypted_body") == marker:
                ok += 1
        results[level] = {"success": ok, "trials": trials,
                          "success_rate_pct": round(100 * ok / trials, 2)}
        print(f"e2e {level}: {results[level]['success_rate_pct']}%", flush=True)
    save_json("api_e2e_success", results)
    return results


def bench_load(concurrency_levels=(1, 2, 4, 8, 16), msgs_per_level=20):
    """Load test: concurrent POST /send of 1 KiB Level-2 emails."""
    c = client()
    rows = []
    for conc in concurrency_levels:
        lats = []
        failures = 0
        t_start = time.perf_counter()

        def worker(i):
            t0 = time.perf_counter()
            try:
                send_email(c, "L2", body=BODY_1KB, subject=f"LOAD c{conc} #{i}")
                return (time.perf_counter() - t0) * 1000
            except Exception:
                return None

        with concurrent.futures.ThreadPoolExecutor(max_workers=conc) as ex:
            futs = [ex.submit(worker, i) for i in range(msgs_per_level)]
            for f in futs:
                r = f.result()
                if r is None:
                    failures += 1
                else:
                    lats.append(r)
        wall = time.perf_counter() - t_start
        s = stats(lats) if lats else {"mean": 0, "p95": 0, "median": 0, "n": 0}
        rows.append({
            "concurrency": conc,
            "messages": msgs_per_level,
            "failures": failures,
            "wall_s": round(wall, 3),
            "msgs_per_sec": round(msgs_per_level / wall, 2),
            "latency_mean_ms": s["mean"],
            "latency_median_ms": s.get("median", 0),
            "latency_p95_ms": s["p95"],
        })
        print(f"load c={conc}: {rows[-1]['msgs_per_sec']} msg/s", flush=True)
    save_json("api_load", rows)
    save_csv("api_load", rows, list(rows[0].keys()))
    return rows


def main():
    bench_roundtrips(30)
    bench_send_stages(12)
    bench_decrypt_stages(10)
    bench_e2e_success(5)
    bench_load()
    print("API bench complete", flush=True)


if __name__ == "__main__":
    main()
