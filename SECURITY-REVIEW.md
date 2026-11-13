# Security review — INDEV v1.6.0-full

Copyright (c) 2026 Nathanlel / yshiecast31-maker

## Strengths
- Local-first default; no required external AI
- Zero-password ahx1 uses authenticated encryption patterns
- Hardened CSP / COOP / COEP / HSTS headers
- Generic crypto failure messages
- Large chat memory in IndexedDB (not cookies, not remote)

## Residual risks / weaknesses
1. **innerHTML usage** in several UI lists — mitigated when content is escaped, residual XSS if any path inserts unescaped user data.
2. **localStorage facts** — not encrypted at rest; physical access to the device can read preferences.
3. **Ollama optional path** — if enabled, browser talks to localhost; malicious local process could impersonate Ollama.
4. **500k window** — soft limit; very large pastes can still stress memory on low-end devices.
5. **Service worker** — caches static assets; version bump on every release.
6. **No server-side rate limit** in this static package — rely on Cloudflare controls if exposed publicly.

## Recommendations
- Keep production roots out of source
- Prefer Cloudflare WAF / rate limits on the Pages project
- Periodically clear memory on shared devices
- Treat Ollama as trusted-local only
