# INDEV Security Platform

**Copyright (c) 2026 Nathanlel / yshiecast31-maker** — MIT License

Local-first security workspace (public app).

## Dual-app system

| App | Repo | Role |
|-----|------|------|
| **INDEV** (this repo) | [indev-app](https://github.com/yshiecast31-maker/indev-app) | Public workspace |
| **Companion** | [indev-companion](https://github.com/yshiecast31-maker/indev-companion) | Private integrity + pairing |
| **ahx1** | [ahx1](https://github.com/yshiecast31-maker/ahx1) | Zero-password crypto engine |

Pairing uses shared 256-bit root + `indev-link:v1` tokens (HKDF + HMAC-SHA-256).

## Features
- Own AI (500k char persistent window)
- Zero-password ahx1 Crypto Lab
- Defense Doctrine + open project catalogue
- Hardened security headers

## Deploy
Cloudflare Pages → Upload assets (use full release zip for complete source)
Build command: `exit 0`

## License
MIT — see LICENSE
