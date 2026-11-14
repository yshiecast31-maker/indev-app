# CONNECT.md

## Source of truth
- **GitHub** = source for Worker + notes in this repo
- **Release ZIP** = full frontend for Cloudflare Pages (`exit 0`)
- Do not assume Pages equals GitHub main unless the same files were deployed

## ChatGPT / OpenAI
- `provider: "chatgpt"` is an **alias for the OpenAI API**, not a link to a user's ChatGPT account
- Needs Worker secret `OPENAI_API_KEY` and app **Connector URL** = Worker URL

## Stripe / Notion
- Stripe = payments
- Notion = Aldrich-key inventory only

## Worker endpoints
- `POST /api/ai/chat`
- `POST /api/link/check` (public URLs; no automatic multi-hop redirect; body capped)

## ChatGPT should not
- Invent a ChatGPT\u2194GitHub connector that is not connected in ChatGPT settings
- Present mock backends as live
