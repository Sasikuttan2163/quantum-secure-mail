"""
KME (QKD Key Management Entity) benchmark.

Measures the ETSI GS QKD 014 REST interface of the KME simulator:
  * /enc_keys response time as requested key size grows (bits) and number of keys grows
  * /dec_keys response time
  * sustained key-generation throughput (keys/sec)
  * /status round trip

The KME must be running on 127.0.0.1:8000.
Run:  uv run python kme_bench.py
"""
import time
import base64

import httpx

from common import stats, save_json, save_csv, KME_URL


def kme_alive() -> bool:
    try:
        r = httpx.post(f"{KME_URL}/api/v1/keys/BENCH_SAE/enc_keys",
                       json={"number": 1, "size": 256}, timeout=5.0)
        return r.status_code == 200
    except Exception:
        return False


def bench_enc_keys_latency(sizes=(128, 256, 384, 512), counts=(1, 2, 5, 10, 16), trials=15):
    """enc_keys response time vs (key size bits, number of keys)."""
    rows = []
    for size in sizes:
        for number in counts:
            lats = []
            ok = 0
            for _ in range(trials):
                t0 = time.perf_counter()
                try:
                    r = httpx.post(f"{KME_URL}/api/v1/keys/BENCH_SAE/enc_keys",
                                   json={"number": number, "size": size}, timeout=10.0)
                    dt = (time.perf_counter() - t0) * 1000
                    if r.status_code == 200:
                        ok += 1
                    lats.append(dt)
                except Exception:
                    lats.append((time.perf_counter() - t0) * 1000)
            s = stats(lats)
            rows.append({
                "key_size_bits": size,
                "key_count": number,
                "n": s["n"], "mean_ms": s["mean"], "median_ms": s["median"],
                "p95_ms": s["p95"], "min_ms": s["min"], "max_ms": s["max"], "stdev_ms": s["stdev"],
                "success_rate_pct": round(100 * ok / trials, 1),
            })
            print(f"enc_keys size={size} count={number}: mean={s['mean']}ms", flush=True)
    return rows


def bench_dec_keys_latency(trials=15):
    """Request 1 key then retrieve it back via /dec_keys, timing retrieval."""
    lats = []
    ok = 0
    key_ids = []
    for _ in range(trials):
        r = httpx.post(f"{KME_URL}/api/v1/keys/BENCH_SAE/enc_keys",
                       json={"number": 1, "size": 256}, timeout=10.0)
        key_id = r.json()["keys"][0]["key_ID"]
        key_ids.append(key_id)
        t0 = time.perf_counter()
        r = httpx.post(f"{KME_URL}/api/v1/keys/BENCH_SAE/dec_keys",
                       json={"key_IDs": [{"key_ID": key_id}]}, timeout=10.0)
        dt = (time.perf_counter() - t0) * 1000
        if r.status_code == 200:
            ok += 1
        lats.append(dt)
    return {"dec_keys": stats(lats), "success_rate_pct": round(100 * ok / trials, 1)}


def bench_throughput(duration_s=10.0):
    """Sustained keys/sec generation until latency degrades."""
    sent = 0
    lat = []
    t_end = time.perf_counter() + duration_s
    while time.perf_counter() < t_end:
        t0 = time.perf_counter()
        httpx.post(f"{KME_URL}/api/v1/keys/BENCH_THROUGHPUT/enc_keys",
                   json={"number": 1, "size": 256}, timeout=10.0)
        lat.append((time.perf_counter() - t0) * 1000)
        sent += 1
    return {
        "duration_s": duration_s,
        "keys_generated": sent,
        "keys_per_sec": round(sent / duration_s, 2),
        "latency_stats": stats(lat),
    }


def bench_key_size_delivery(max_key_count=64):
    """
    How quickly can the KME deliver n bytes of true-OTP key material?
    The simulator caps per-request key size at 512 bits and 10 keys/request,
    so delivering 1 KiB of pad takes ceil(KiB*8/512) requests of 10 keys each:
    here we measure batches needed for 256B, 1KiB, 4KiB, 16KiB of key material.
    """
    rows = []
    for nbytes in (256, 1024, 4096, 16384):
        keys_needed = -(-nbytes // 64)  # 64 bytes = 512 bits max per key
        per_req = min(10, max(1, keys_needed))
        t0 = time.perf_counter()
        got = 0
        total_bytes = 0
        while got < keys_needed:
            n = min(10, keys_needed - got)
            r = httpx.post(f"{KME_URL}/api/v1/keys/BENCH_SAE/enc_keys",
                           json={"number": n, "size": 512}, timeout=30.0)
            got += len(r.json()["keys"])
            total_bytes += n * 64
        dt = (time.perf_counter() - t0) * 1000
        rows.append({
            "key_material_bytes": nbytes,
            "keys_needed": keys_needed,
            "requests_needed": -(-keys_needed // 10),
            "delivered_bytes": total_bytes,
            "mean_ms": round(dt, 3),
        })
        print(f"deliver {nbytes}B key material: {dt:.1f}ms ({rows[-1]['requests_needed']} requests)", flush=True)
    return rows


def main():
    if not kme_alive():
        print("KME not reachable on 127.0.0.1:8000 — start the simulator first.")
        raise SystemExit(1)

    enc = bench_enc_keys_latency()
    save_json("kme_enc_keys", enc)
    save_csv("kme_enc_keys", enc, list(enc[0].keys()))

    dec = bench_dec_keys_latency()
    save_json("kme_dec_keys", dec)

    thr = bench_throughput(10.0)
    save_json("kme_throughput", thr)

    size = bench_key_size_delivery()
    save_json("kme_key_delivery", size)
    save_csv("kme_key_delivery", size, list(size[0].keys()))

    print("KME bench complete:", {"keys_per_sec": thr["keys_per_sec"]}, flush=True)


if __name__ == "__main__":
    main()
