"""
Crypto-layer benchmark: measures the actual cryptography per security level.

Covered metrics (offline, in-process, reproducible):
  * encryption / decryption wall time and CPU time per level, per message size
  * key-material consumption: actual bytes of QKD key consumed vs message size
  * ciphertext + metadata size (transport overhead %)
  * encrypt->decrypt round-trip correctness over N trials
  * peak memory (tracemalloc) of encryption
  * primitive micro-benchmarks: AES-256, Kyber-512, XOR/OTP

Run:  uv run python crypto_bench.py
"""
import base64
import os
import sys
import time
import random
import secrets
import hashlib
import tracemalloc
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent / "backend"))
sys.path.append(str(Path(__file__).resolve().parent.parent / "security"))

from Crypto.Cipher import AES
from kyber_py.kyber import Kyber512

from encryption import encrypt_message, decrypt_message, format_encrypted_email_body
from models import SecurityLevel, EncryptionMetadata
from common import stats, save_json, save_csv, fmt_row

SIZES = [128, 1024, 4096, 16384, 65536, 262144]
TRIALS_BY_SIZE = [20, 20, 20, 20, 10, 5]
LEVELS = {(l, m): None for l in ("L1", "L2", "L3", "L4") for m in ["main"]}


def make_key_for(level: str, plaintext: str) -> str:
    """
    Produce base64 QKD key material as the KME would.

    L1 true OTP requires a message-length key (32-bit quantum key exchange
    would deliver it in 32-byte chunks; here we synth the required length).
    L2/L3 use the 32-byte key the backend actually requests today.
    """
    pt_len = len(plaintext.encode())
    if level == "L1":
        nbytes = pt_len
    else:
        nbytes = 32
    return base64.b64encode(secrets.token_bytes(max(nbytes, 1))).decode()


def run_encrypt_decrypt(level: str, plaintext: str):
    key = make_key_for(level, plaintext)
    key_used = len(base64.b64decode(key))

    tracemalloc.start()
    t0 = time.perf_counter()
    c0 = time.process_time()
    encrypted, metadata = encrypt_message(
        plaintext=plaintext, key=key, key_id="BENCH_KEY",
        security_level=SecurityLevel(level),
        sender_sae_id="SENDER_SAE", receiver_sae_id="RECEIVER_SAE",
    )
    wall_enc = (time.perf_counter() - t0) * 1000
    cpu_enc = (time.process_time() - c0) * 1000
    peak_mem_kb = tracemalloc.get_traced_memory()[1] / 1024
    tracemalloc.stop()

    body = format_encrypted_email_body(encrypted, metadata)

    t0 = time.perf_counter()
    c0 = time.process_time()
    decrypted = decrypt_message(encrypted, key, metadata)
    wall_dec = (time.perf_counter() - t0) * 1000
    cpu_dec = (time.process_time() - c0) * 1000

    correct = decrypted == plaintext
    return {
        "level": level,
        "plaintext_bytes": len(plaintext.encode()),
        "key_material_bytes": key_used,
        "ideal_otp_key_bytes": len(plaintext.encode()) if level == "L1" else key_used,
        "ciphertext_b64_bytes": len(encrypted),
        "email_body_bytes": len(body),
        "overhead_pct": round((len(body) - len(plaintext.encode())) / max(len(plaintext.encode()), 1) * 100, 2),
        "enc_wall_ms": wall_enc,
        "enc_cpu_ms": cpu_enc,
        "dec_wall_ms": wall_dec,
        "dec_cpu_ms": cpu_dec,
        "peak_mem_kb": peak_mem_kb,
        "correct": correct,
    }


def bench_per_level_per_size():
    rows = []
    for level in ("L1", "L2", "L3", "L4"):
        for size, trials in zip(SIZES, TRIALS_BY_SIZE):
            for i in range(trials):
                # random printable text; sizes tuned per character
                pt = "".join(random.choices("abcdefghijklmnopqrstuvwxyz0123456789 .,\n", k=size))
                r = run_encrypt_decrypt(level, pt)
                r["trial"] = i
                rows.append(r)
            print(f"done {level} size={size}", flush=True)
    return rows


def bench_roundtrip_correctness(n_trials=100):
    """100 encrypt->decrypt round trips per level at 1 KiB."""
    results = {}
    for level in ("L1", "L2", "L3", "L4"):
        ok = 0
        for _ in range(n_trials):
            pt = "".join(random.choices("abcdefghijklmnopqrstuvwxyz0123456789 .,\n", k=1024))
            r = run_encrypt_decrypt(level, pt)
            ok += int(r["correct"])
        results[level] = {"success": ok, "trials": n_trials, "success_rate_pct": round(100 * ok / n_trials, 2)}
    return results


def bench_key_consumption_batch(n_messages=100):
    """
    The chart that proves 'OTP needs a continuous quantum key supply':
    send N messages of random length, accumulate key bytes per level.
    """
    lengths = [random.randint(100, 5000) for _ in range(n_messages)]
    messages = ["".join(random.choices("abcXYZ .,\n", k=l)) for l in lengths]
    cum = {"L1": [], "L2": [], "L3": [], "L4": []}
    totals = {"L1": 0, "L2": 0, "L3": 0, "L4": 0}
    ideall1 = 0
    for i, m in enumerate(messages):
        for level in cum:
            used = len(m.encode()) if level == "L1" else 0  # L2/L3 fixed 32B below
            if level in ("L2", "L3"):
                used = 32
            totals[level] += used
            cum[level].append(totals[level])
        ideall1 += lengths[i]
    return {
        "message_count": n_messages,
        "lengths": lengths,
        "cumulative_bytes": cum,
        "totals_bytes": totals,
        "L1_true_otp_total": ideall1,
        "total_message_bytes": sum(lengths),
    }


def bench_primitives(trials=5, nbytes=65536):
    """Micro-benchmarks of individual cryptographic primitives."""
    data = secrets.token_bytes(nbytes)
    key32 = secrets.token_bytes(32)

    # AES-256-CFB
    c = AES.new(key32, AES.MODE_CFB)
    t0 = time.perf_counter()
    ct = c.encrypt(data)
    aes_enc_ms = (time.perf_counter() - t0) * 1000
    c2 = AES.new(key32, AES.MODE_CFB, c.iv)
    t0 = time.perf_counter()
    c2.decrypt(ct)
    aes_dec_ms = (time.perf_counter() - t0) * 1000

    # Kyber-512
    t0 = time.perf_counter()
    pk, sk = Kyber512.keygen()
    kyber_keygen_ms = (time.perf_counter() - t0) * 1000
    t0 = time.perf_counter()
    ss, ct_k = Kyber512.encaps(pk)
    kyber_encaps_ms = (time.perf_counter() - t0) * 1000
    t0 = time.perf_counter()
    Kyber512.decaps(sk, ct_k)
    kyber_decaps_ms = (time.perf_counter() - t0) * 1000

    # OTP / XOR — the implementation xor's in a Python list comprehension
    otp_key = secrets.token_bytes(nbytes)
    t0 = time.perf_counter()
    _ = bytes([data[i] ^ otp_key[i] for i in range(nbytes)])
    xor_bytes_ms = (time.perf_counter() - t0) * 1000
    t0 = time.perf_counter()
    _ = bytes(a ^ b for a, b in zip(data, otp_key))  # equivalent but via zip
    xor_zip_ms = (time.perf_counter() - t0) * 1000
    t0 = time.perf_counter()
    _ = int.from_bytes(data) ^ int.from_bytes(otp_key)  # big-int XOR (fast path)
    xor_bigint_ms = (time.perf_counter() - t0) * 1000

    # SHA-256 combine (used by L3)
    t0 = time.perf_counter()
    _ = hashlib.sha256(key32 + ss).digest()
    sha256_ms = (time.perf_counter() - t0) * 1000

    rows = {
        "message_bytes": nbytes,
        "aes256cfb_encrypt_ms": round(aes_enc_ms, 3),
        "aes256cfb_decrypt_ms": round(aes_dec_ms, 3),
        "aes_encrypt_MBps": round(nbytes / 1024 / 1024 / (aes_enc_ms / 1000), 2),
        "kyber512_keygen_ms": round(kyber_keygen_ms, 3),
        "kyber512_encaps_ms": round(kyber_encaps_ms, 3),
        "kyber512_decaps_ms": round(kyber_decaps_ms, 3),
        "otp_xor_listcomp_ms": round(xor_bytes_ms, 3),
        "otp_xor_zip_ms": round(xor_zip_ms, 3),
        "otp_xor_bigint_ms": round(xor_bigint_ms, 3),
        "sha256_ms": round(sha256_ms, 6),
    }
    return rows


def main():
    print("== crypto primitives ==", flush=True)
    prim = bench_primitives()
    save_json("crypto_primitives", prim)
    print(prim, flush=True)

    print("== per level x per size ==", flush=True)
    rows = bench_per_level_per_size()
    save_json("crypto_levels_raw", rows)
    fields = list(rows[0].keys())
    save_csv("crypto_levels_raw", rows, fields)

    # aggregate: per level x size
    agg = []
    for level in ("L1", "L2", "L3", "L4"):
        for size in SIZES:
            sel = [r for r in rows if r["level"] == level and r["plaintext_bytes"] >= size * 0.9 and r["plaintext_bytes"] <= size * 1.1]
            if not sel:
                continue
            enc = stats([r["enc_wall_ms"] for r in sel])
            dec = stats([r["dec_wall_ms"] for r in sel])
            encc = stats([r["enc_cpu_ms"] for r in sel])
            decc = stats([r["dec_cpu_ms"] for r in sel])
            agg.append({
                "level": level,
                "plaintext_bytes": sel[0]["plaintext_bytes"],
                "key_material_bytes": sel[0]["key_material_bytes"],
                "ciphertext_b64_bytes": sel[0]["ciphertext_b64_bytes"],
                "email_body_bytes": sel[0]["email_body_bytes"],
                "overhead_pct": round(sum(r["overhead_pct"] for r in sel) / len(sel), 2),
                "enc_wall": enc["mean"], "enc_wall_p95": enc["p95"],
                "enc_cpu": encc["mean"],
                "dec_wall": dec["mean"], "dec_wall_p95": dec["p95"],
                "dec_cpu": decc["mean"],
                "peak_mem_kb": round(sum(r["peak_mem_kb"] for r in sel) / len(sel), 1),
                "correct_pct": round(100 * sum(r["correct"] for r in sel) / len(sel), 1),
            })
    save_json("crypto_levels_summary", agg)
    save_csv("crypto_levels_summary", agg, list(agg[0].keys()))
    print(agg[0], flush=True)

    print("== round-trip correctness (100 trials) ==", flush=True)
    corr = bench_roundtrip_correctness(100)
    save_json("crypto_correctness", corr)
    print(corr, flush=True)

    print("== key consumption batch (100 messages) ==", flush=True)
    batch = bench_key_consumption_batch(100)
    save_json("crypto_key_batch", batch)
    print({k: v for k, v in batch.items() if k not in ("cumulative_bytes", "lengths")}, flush=True)

    print("crypto bench complete", flush=True)


if __name__ == "__main__":
    main()
