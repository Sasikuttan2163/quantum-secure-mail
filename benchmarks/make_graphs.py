"""
Generate all graphs from the raw benchmark results in results/raw/.
Run:  uv run python make_graphs.py
"""
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

RESULTS = Path(__file__).parent / "results"
RAW = RESULTS / "raw"
GRAPHS = Path(__file__).parent / "graphs"
GRAPHS.mkdir(exist_ok=True)

COLORS = {"L1": "#d62728", "L2": "#1f77b4", "L3": "#2ca02c", "L4": "#7f7f7f"}
NAMES = {"L1": "L1 OTP", "L2": "L2 AES-256-CFB", "L3": "L3 Kyber-512", "L4": "L4 plaintext"}


def load(name):
    return json.loads((RAW / f"{name}.json").read_text())


def save(fig, name):
    fig.tight_layout()
    fig.savefig(GRAPHS / name, dpi=150)
    plt_close = fig  # keep reference; close after save
    plt_close.clf()
    plt_close.canvas.manager = None  # noop safety
    import matplotlib.pyplot as _p
    _p.close(fig)
    print("graph:", name)


def grouped_bar_bymetric(groups, metrics, title, ylabel, fname, log=False):
    """groups = [{'label': 'L1 OTP', 'values': {metric: v}}, ...]"""
    import numpy as np
    x = range(len(metrics))
    width = 0.8 / len(groups)
    fig, ax = plt.subplots(figsize=(max(7, 1.4 * len(metrics)), 4.5))
    for gi, g in enumerate(groups):
        vals = [g["values"].get(m, 0) for m in metrics]
        pos = [xi + (gi - len(groups) / 2 + 0.5) * width for xi in x]
        ax.bar(pos, vals, width=width * 0.9, label=g["label"])
        for p, v in zip(pos, vals):
            if v > 0:
                ax.text(p, v, f"{v:.1f}", ha="center", va="bottom", fontsize=6)
    if log:
        ax.set_yscale("log")
    ax.set_xticks(list(x))
    ax.set_xticklabels(metrics)
    ax.set_ylabel(ylabel)
    ax.set_title(title)
    ax.legend(fontsize=8)
    save(fig, fname)


def line_by_key(rows, xkey, ykey, serieskey, title, xlabel, ylabel, fname, log=False):
    fig, ax = plt.subplots(figsize=(7, 4.5))
    series = {}
    for r in rows:
        series.setdefault(r[serieskey], []).append(r)
    for key, items in sorted(series.items()):
        items.sort(key=lambda r: r[xkey])
        ax.plot([r[xkey] for r in items], [r[ykey] for r in items],
                marker="o", label=NAMES.get(key, key), color=COLORS.get(key))
    if log:
        ax.set_yscale("log")
        ax.set_xscale("log")
    ax.set_xlabel(xlabel)
    ax.set_ylabel(ylabel)
    ax.set_title(title)
    ax.legend(fontsize=8)
    ax.grid(alpha=0.3)
    save(fig, fname)


def stacked_send_stages():
    agg = load("api_send_stages_summary")
    levels = [r["level"] for r in agg]
    stages = [("key_request_ms", "KME key request", "#9467bd"),
              ("encryption_ms", "Encryption", "#1f77b4"),
              ("smtp_ms", "SMTP transmission", "#ff7f0e")]
    fig, ax = plt.subplots(figsize=(7, 4.5))
    bottom = [0.0] * len(levels)
    for key, label, color in stages:
        vals = [r[key] for r in agg]
        ax.bar(levels, vals, bottom=bottom, label=label, color=color)
        bottom = [b + v for b, v in zip(bottom, vals)]
    for i, r in enumerate(agg):
        ax.text(i, r["total_ms"], f'{r["total_ms"]:.0f} ms', ha="center", va="bottom", fontsize=9)
    ax.set_ylabel("Time (ms)")
    ax.set_title("End-to-end /send time by stage (2 KiB message)")
    ax.legend(fontsize=8)
    save(fig, "e2e_send_stages_by_level.png")


def stacked_decrypt_stages():
    agg = load("api_decrypt_stages_summary")
    levels = [r["level"] for r in agg]
    stages = [("fetch_ms", "IMAP fetch", "#8c564b"),
              ("key_retrieval_ms", "KME key retrieval", "#9467bd"),
              ("decrypt_ms", "Decrypt", "#1f77b4")]
    fig, ax = plt.subplots(figsize=(7, 4.5))
    bottom = [0.0] * len(levels)
    for key, label, color in stages:
        vals = [r[key] for r in agg]
        ax.bar(levels, vals, bottom=bottom, label=label, color=color)
        bottom = [b + v for b, v in zip(bottom, vals)]
    for i, r in enumerate(agg):
        ax.text(i, r["total_ms"], f'{r["total_ms"]:.0f} ms', ha="center", va="bottom", fontsize=9)
    ax.set_ylabel("Time (ms)")
    ax.set_title("End-to-end /decrypt time by stage")
    ax.legend(fontsize=8)
    save(fig, "e2e_decrypt_stages_by_level.png")


def kme_enc_latency():
    rows = load("kme_enc_keys")
    for key_count in sorted({r["key_count"] for r in rows}):
        sel = [r for r in rows if r["key_count"] == key_count]
        sel.sort(key=lambda r: r["key_size_bits"])
        fig, ax = plt.subplots(figsize=(7, 4.5))
        ax.errorbar([r["key_size_bits"] for r in sel], [r["mean_ms"] for r in sel],
                    yerr=[r["stdev_ms"] for r in sel], marker="o", capsize=4)
        ax.set_xlabel("Requested key size (bits)")
        ax.set_ylabel("KME response time (ms)")
        ax.set_title(f"KME /enc_keys latency vs key size ({key_count} key(s) per request)")
        ax.grid(alpha=0.3)
        save(fig, f"kme_latency_vs_size_n{key_count}.png")
    # latency vs number of requested keys
    sel = [r for r in rows if r["key_size_bits"] == 256]
    sel.sort(key=lambda r: r["key_count"])
    fig, ax = plt.subplots(figsize=(7, 4.5))
    ax.plot([r["key_count"] for r in sel], [r["mean_ms"] for r in sel], marker="s", color="#9467bd")
    ax.set_xlabel("Number of keys requested")
    ax.set_ylabel("KME response time (ms)")
    ax.set_title("KME /enc_keys latency vs number of keys (256-bit keys)")
    ax.grid(alpha=0.3)
    save(fig, "kme_latency_vs_keycount.png")


def key_consumption():
    b = load("crypto_key_batch")
    cum = b["cumulative_bytes"]
    fig, ax = plt.subplots(figsize=(7, 4.5))
    for level in ("L1", "L2", "L3", "L4"):
        y = cum[level]
        ax.plot(range(1, len(y) + 1), y, label=NAMES[level], color=COLORS[level], lw=2 if level == "L1" else 1.4)
    ax.set_xlabel("Messages sent (random 100 B - 5 KB bodies)")
    ax.set_ylabel("Cumulative QKD key material consumed (bytes)")
    ax.set_title(f"Key consumption over {b['message_count']} messages\n"
                 f"(OTP totals {b['L1_true_otp_total']:,} B vs AES/PQC {b['totals_bytes']['L2']:,} B)")
    ax.legend(fontsize=8)
    ax.grid(alpha=0.3)
    save(fig, "key_consumption_batch.png")

    # consumption ratio vs message size
    s = load("crypto_levels_summary")
    fig, ax = plt.subplots(figsize=(7, 4.5))
    for level in ("L1", "L2", "L3"):
        items = [r for r in s if r["level"] == level]
        items.sort(key=lambda r: r["plaintext_bytes"])
        ax.plot([r["plaintext_bytes"] for r in items], [r["key_material_bytes"] for r in items],
                marker="o", label=NAMES[level], color=COLORS[level])
    ax.set_yscale("log")
    ax.set_xscale("log")
    ax.set_xlabel("Message size (bytes)")
    ax.set_ylabel("QKD key material consumed per message (bytes)")
    ax.set_title("Quantum key material consumed per message vs message size")
    ax.legend(fontsize=8)
    ax.grid(alpha=0.3, which="both")
    save(fig, "key_consumption_vs_size.png")


def overhead():
    s = load("crypto_levels_summary")
    fig, ax = plt.subplots(figsize=(7.5, 4.5))
    for level in ("L1", "L2", "L3", "L4"):
        items = [r for r in s if r["level"] == level]
        items.sort(key=lambda r: r["plaintext_bytes"])
        ax.plot([r["plaintext_bytes"] for r in items], [r["overhead_pct"] for r in items],
                marker="o", label=NAMES[level], color=COLORS[level])
    ax.set_xscale("log")
    ax.set_xlabel("Plaintext size (bytes)")
    ax.set_ylabel("Transport overhead (%)")
    ax.set_title("Email transport overhead by security level and message size")
    ax.legend(fontsize=8)
    ax.grid(alpha=0.3)
    save(fig, "overhead_vs_size.png")


def crypto_latency():
    s = load("crypto_levels_summary")
    line_by_key(s, "plaintext_bytes", "enc_wall", "level",
                "Encryption time vs message size", "Plaintext size (bytes)", "Encryption time (ms)",
                "crypto_encryption_vs_size.png")
    line_by_key(s, "plaintext_bytes", "dec_wall", "level",
                "Decryption time vs message size", "Ciphertext size (bytes)", "Decryption time (ms)",
                "crypto_decryption_vs_size.png")
    line_by_key(s, "plaintext_bytes", "enc_cpu", "level",
                "Encryption CPU time vs message size", "Plaintext size (bytes)", "CPU time (ms)",
                "crypto_encryption_cpu_vs_size.png")
    line_by_key(s, "plaintext_bytes", "dec_cpu", "level",
                "Decryption CPU time vs message size", "Ciphertext size (bytes)", "CPU time (ms)",
                "crypto_decryption_cpu_vs_size.png")


def sort_levels(d):
    return [l for l in ("L1", "L2", "L3", "L4") if l in d]


def grouped_bar_levels(metrics, title, ylabel, fname):
    """metric values per level, small category chart."""
    s = load("crypto_levels_summary")
    at4k = {r["level"]: r for r in s if r["plaintext_bytes"] == 4096}
    levels = sort_levels(at4k)
    fig, ax = plt.subplots(figsize=(7, 4.5))
    bars = ax.bar([NAMES[l] for l in levels], [at4k[l][metrics] for l in levels],
                  color=[COLORS[l] for l in levels])
    for b, l in zip(bars, levels):
        ax.text(b.get_x() + b.get_width() / 2, at4k[l][metrics], f'{at4k[l][metrics]:.2f}',
                ha="center", va="bottom", fontsize=9)
    ax.set_ylabel(ylabel)
    ax.set_title(title)
    save(fig, fname)


def throughput():
    rows = load("api_load")
    fig, ax1 = plt.subplots(figsize=(7, 4.5))
    x = [r["concurrency"] for r in rows]
    ax1.plot(x, [r["msgs_per_sec"] for r in rows], marker="o", color="#1f77b4", label="msgs/sec")
    ax1.set_xlabel("Concurrent client requests")
    ax1.set_ylabel("Messages sent / sec")
    ax2 = ax1.twinx()
    ax2.plot(x, [r["latency_mean_ms"] for r in rows], marker="s", color="#d62728", label="mean latency")
    ax2.plot(x, [r["latency_p95_ms"] for r in rows], marker="^", color="#ff7f0e", label="p95 latency")
    ax2.set_ylabel("Latency (ms)")
    ax1.set_title("Backend /send throughput under increasing load (L2, 1 KiB)")
    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, fontsize=8, loc="upper left")
    ax1.grid(alpha=0.3)
    save(fig, "throughput_load.png")


def api_roundtrip():
    r = load("api_roundtrip")
    names = {"health": "/health (GET)", "fetch": "/fetch (POST)", "send": "/send (POST, L4)",
             "decrypt_L1": "/decrypt L1", "decrypt_L2": "/decrypt L2", "decrypt_L3": "/decrypt L3"}
    keys = [k for k in names if k in r]
    vals = [r[k]["mean"] for k in keys]
    fig, ax = plt.subplots(figsize=(7.5, 4.5))
    bars = ax.bar([names[k] for k in keys], vals, color="#1f77b4")
    for b, k in zip(bars, keys):
        ax.text(b.get_x() + b.get_width() / 2, r[k]["mean"], f"{r[k]['mean']:.1f}", ha="center", va="bottom", fontsize=8)
    ax.set_ylabel("Mean round-trip (ms)")
    ax.set_title("REST API round-trip time per endpoint (local loopback)")
    ax.grid(alpha=0.3, axis="y")
    save(fig, "api_roundtrip.png")


def kme_delivery():
    rows = load("kme_key_delivery")
    fig, ax = plt.subplots(figsize=(7, 4.5))
    ax.plot([r["key_material_bytes"] for r in rows], [r["mean_ms"] for r in rows], marker="o", color="#9467bd")
    for r in rows:
        ax.annotate(f'{r["requests_needed"]} req', (r["key_material_bytes"], r["mean_ms"]),
                    textcoords="offset points", xytext=(6, 2), fontsize=8)
    ax.set_xlabel("OTP key material requested (bytes)")
    ax.set_ylabel("Time to deliver (ms)")
    ax.set_title("KME delivery time for bulk OTP key material")
    ax.grid(alpha=0.3)
    save(fig, "kme_key_delivery.png")


def main():
    stacked_send_stages()
    stacked_decrypt_stages()
    kme_enc_latency()
    key_consumption()
    overhead()
    crypto_latency()
    grouped_bar_levels("enc_cpu", "Encryption CPU time (4 KiB message)", "CPU (ms)",
                       "encryption_cpu_by_level.png")
    grouped_bar_levels("dec_cpu", "Decryption CPU time (4 KiB message)", "CPU (ms)",
                       "decryption_cpu_by_level.png")
    throughput()
    api_roundtrip()
    kme_delivery()
    print("all graphs done ->", GRAPHS, flush=True)


if __name__ == "__main__":
    main()
