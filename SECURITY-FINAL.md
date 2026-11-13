# INDEV v1.9.0-final — security posture

Copyright (c) 2026 Nathanlel / yshiecast31-maker — MIT

## Primitives
- AEAD: AES-256-GCM (Web Crypto)
- KDF: HKDF-SHA-256
- Pairing: HMAC-SHA-256 (`indev-link:v1`)
- Cloud path: TLS + Worker secrets only
- Headers: CSP, COOP, COEP, CORP, HSTS, frame denial, no-store

## Not claimed
Zero bugs forever, zero vulnerabilities forever, immunity to compromised devices, or national-SOC equivalence.

## Data leak controls
- API keys only in Worker secrets
- Roots/tokens redacted from client logs
- Worker does not echo upstream error bodies
- Separate origins for public vs companion

## Operator checklist
- Deploy Worker secrets + ALLOWED_ORIGIN
- Different origins for public and companion
- Never commit keys or roots
- Rotate pairing root on suspected compromise
- Cloudflare WAF / rate limits
