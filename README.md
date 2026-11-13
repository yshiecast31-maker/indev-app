# INDEV Security Platform

**Copyright (c) 2026 Nathanlel / yshiecast31-maker** — MIT License

Local-first security workspace.

## Features (v1.6.0-full)

- **Own AI** — self-learning, 500k character persistent chat window (IndexedDB), never forgets until cleared
- **Zero-password crypto (ahx1)** — dual HKDF + AES-GCM + integrity + pre-mix
- Private Vault, Notes Studio, Private Chat
- Recipe helpers, Threat & Code Lab, Link Sentinel
- Hardened CSP / COOP / COEP / HSTS headers
- Optional Ollama (never required)

## Deploy (Cloudflare Pages)

1. Upload this repo or the release zip as **Upload assets**
2. Build command: `exit 0`
3. Build output directory: `/`

Or connect this repository to Cloudflare Pages (production branch `main`).

## Related

- Standalone crypto engine: [ahx1](https://github.com/yshiecast31-maker/ahx1)

## License

MIT — see [LICENSE](./LICENSE)
