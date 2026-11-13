# INDEV dual-app architecture

Copyright (c) 2026 Nathanlel / yshiecast31-maker — MIT

## Apps

1. **INDEV (public)** — https://github.com/yshiecast31-maker/indev-app
2. **INDEV Companion (private)** — https://github.com/yshiecast31-maker/indev-companion

## Connection

- Shared 256-bit root (offline, never committed)
- Token: `indev-link:v1.<salt>.<hmac>`
- HMAC over context `INDEV-PAIR-OK` with key from HKDF-SHA-256

## Limits

Not government software. Not remote attestation. Not automatic self-healing.
