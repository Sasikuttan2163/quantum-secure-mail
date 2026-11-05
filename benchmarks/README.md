# Benchmark suite

Collects performance, key-consumption, overhead, throughput, CPU and
correctness metrics for the quantum secure mail backend and its QKD KME
simulator, and generates the graphs + tables used in `RESULTS.md`.

## Usage

```bash
# one command runs everything (starts offline services if needed):
uv run python benchmarks/run_all.py

# or run a single stage:
uv run python benchmarks/crypto_bench.py   # crypto layer (offline)
uv run python benchmarks/kme_bench.py      # needs KME on :8000
uv run python benchmarks/api_bench.py      # needs KME + backend + mail servers
uv run python benchmarks/make_graphs.py    # rebuild graphs from raw results
```

Outputs:
- `results/raw/*.json` — full raw trial data
- `results/*.csv` — aggregated tables
- `graphs/*.png` — charts
- `RESULTS.md` — the report with every table + narrative

## How it runs end-to-end without Gmail

`run_all.py` checks whether the KME (8000) and backend (8001) are already
running and reuses them; otherwise it starts an **offline stack**:

1. KME simulator on :8000
2. `local_mail_server.py`: a bench SMTP sink (:1025) + minimal IMAP server
   (:1143) that speaks exactly the subset of commands the backend uses
3. The backend on :8001 with env-override config (`SMTP_SERVER=127.0.0.1`,
   `SMTP_USE_TLS=false`, `IMAP_USE_SSL=false`, …). Your `.env` is never read
   or modified and no real email is sent.

With real Gmail credentials in `.env`, delete the local overrides in
`run_all.py` and the same benchmarks run against the live Gmail servers.

## Metrics collected

| Area | Stage | Script | Raw JSON |
|------|-------|--------|----------|
| Crypto latency/CPU/mem (L1–L4 × 6 sizes, 20 trials) | — | crypto_bench.py | crypto_levels_raw |
| Round-trip correctness (100 trials × 4 levels) | — | crypto_bench.py | crypto_correctness |
| Key consumption (per-size + 100-message batch) | — | crypto_bench.py | crypto_key_batch |
| Primitive benchmarks (AES, Kyber, XOR) | — | crypto_bench.py | crypto_primitives |
| KME /enc_keys /dec_keys latency, throughput, bulk-pad delivery | — | kme_bench.py | kme_* |
| /send stage breakdown (key request / encryption / SMTP) | — | api_bench.py | api_send_stages_* |
| /decrypt stage breakdown (fetch / key retrieval / decrypt) | — | api_bench.py | api_decrypt_stages_* |
| REST round-trip /health /send /fetch /decrypt | — | api_bench.py | api_roundtrip |
| Throughput under concurrency 1–16 | — | api_bench.py | api_load |
| Send→fetch→decrypt success rate | — | api_bench.py | api_e2e_success |

The `/send` and `/decrypt` stage timings come from the `timings` field that
the backend now returns (added in `backend/main.py`); it is optional and
backwards-compatible.
