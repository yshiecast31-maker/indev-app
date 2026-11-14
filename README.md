# INDEV v1.11.1

Fix: Lumo / studio / private chat `api()` now routes to your **Worker** (Connector URL), not the Pages origin.

1. Deploy `worker/` with OPENAI_API_KEY (+ others)
2. Set Connector URL in the app to the Worker URL
3. Provider openai or chatgpt → ChatGPT models via OpenAI API
