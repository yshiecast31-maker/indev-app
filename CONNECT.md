# For ChatGPT (and humans)

## GitHub vs live app
- This repo holds **source notes + Worker**.
- Full app UI is large; deploy from the **release zip** to Cloudflare Pages (`exit 0`).
- Do not assume GitHub `main` is byte-identical to every Pages deploy unless we just pushed the same files.

## ChatGPT connector (OpenAI)
- Not fixed inside ChatGPT settings from here.
- INDEV talks to ChatGPT via **Cloudflare Worker** + `OPENAI_API_KEY`.
- App must set **Connector URL** to the Worker.
- Bug fixed in v1.11.1: `api()` was calling Pages; it now calls the Worker.

## Worker
- Path: `worker/worker.js`
- `POST /api/ai/chat` with `{ provider: "openai"|"chatgpt", messages: [...] }`
- `POST /api/link/check` with `{ url }`

## Money / Notion
- Stripe = payments (not Shopify for current plan).
- Notion = Aldrich-key inventory only.

## What ChatGPT should do
1. Read this file and `worker/worker.js`.
2. Help edit code or Dashboard steps.
3. Not invent a GitHub connector that is not connected in ChatGPT.
4. For full frontend, ask the user for the latest zip if files are missing here.
