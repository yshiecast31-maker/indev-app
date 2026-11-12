# INDEV Security Platform

Local-first security workspace.

**Live target:** Cloudflare Pages  
**Repo:** https://github.com/yshiecast31-maker/indev-app

## Features (v1.2.0 base)

- Private Vault (local, optional encrypted cloud sync)
- Notes Studio
- Private Chat
- Crypto Lab
  - AES-256-GCM (passphrase)
  - **Zero-password ahx1 mode** (256-bit root only, dual HKDF + AES-GCM + integrity + pre-mix)
- Threat & Code Lab
- Link Sentinel
- Recipe Studio (cooking features coming next)
- Your own AI (local-first, optional Ollama) — next
- Security Register, Incidents, Integrations, Settings

## Deploy to Cloudflare Pages

1. Go to [Cloudflare Pages](https://pages.cloudflare.com)
2. Create project → Connect to Git → select `yshiecast31-maker/indev-app`
3. Build settings:
   - Framework preset: None
   - Build command: (leave empty)
   - Build output directory: `/` (root)
4. Deploy

Or drag-and-drop the release zip.

## Local development

Just open `index.html` or serve the folder with any static server.

```bash
npx serve .
```

## Zero-password crypto

See the standalone engine: [ahx1](https://github.com/yshiecast31-maker/ahx1)

## License

MIT
