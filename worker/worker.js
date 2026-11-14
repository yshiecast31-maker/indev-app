/**
 * INDEV Worker — AI chat + limited link check
 * Secrets: OPENAI_API_KEY, XAI_API_KEY, DEEPSEEK_API_KEY, ALLOWED_ORIGIN
 */
const PROVIDERS = {
  openai: { url: 'https://api.openai.com/v1/chat/completions', keyEnv: 'OPENAI_API_KEY', defaultModel: 'gpt-4o-mini' },
  chatgpt: { url: 'https://api.openai.com/v1/chat/completions', keyEnv: 'OPENAI_API_KEY', defaultModel: 'gpt-4o-mini' },
  xai: { url: 'https://api.x.ai/v1/chat/completions', keyEnv: 'XAI_API_KEY', defaultModel: 'grok-2-latest' },
  deepseek: { url: 'https://api.deepseek.com/chat/completions', keyEnv: 'DEEPSEEK_API_KEY', defaultModel: 'deepseek-chat' },
};

function cors(origin, allowed) {
  const o = allowed && origin === allowed ? allowed : (allowed || '*');
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

function safeHttpUrl(raw) {
  let u;
  try { u = new URL(String(raw || '')); } catch { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  const host = u.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local')) return null;
  if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0)/.test(host)) return null;
  if (host === '::1' || host.startsWith('fc') || host.startsWith('fd')) return null;
  if (host.includes('metadata') || host === 'metadata.google.internal') return null;
  return u;
}

export default {
  async fetch(request, env) {
    const allowed = env.ALLOWED_ORIGIN || '';
    const origin = request.headers.get('Origin') || '';
    const c = cors(origin, allowed);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: c });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405, c);
    if (allowed && origin && origin !== allowed) return json({ error: 'Origin not allowed' }, 403, c);

    const path = new URL(request.url).pathname;
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400, c); }

    if (path === '/api/ai/chat' || path === '/api/chat' || path === '/') {
      if (path === '/' && !body.provider && !body.messages) return json({ error: 'Not found' }, 404, c);
      const providerName = String(body.provider || 'openai').toLowerCase();
      const provider = PROVIDERS[providerName];
      if (!provider) return json({ error: 'Unknown provider', providers: Object.keys(PROVIDERS) }, 400, c);
      const apiKey = env[provider.keyEnv];
      if (!apiKey) return json({ error: 'Provider not configured' }, 503, c);
      const messages = Array.isArray(body.messages) ? body.messages : null;
      if (!messages || !messages.length) return json({ error: 'messages required' }, 400, c);
      if (JSON.stringify(messages).length > 180000) return json({ error: 'Payload too large' }, 413, c);
      const model = (body.model && String(body.model).slice(0, 64)) || provider.defaultModel;
      const upstream = await fetch(provider.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
        body: JSON.stringify({
          model,
          messages: messages.map((m) => ({
            role: m.role === 'assistant' || m.role === 'system' ? m.role : 'user',
            content: String(m.content ?? '').slice(0, 80000),
          })),
          temperature: 0.7,
          stream: false,
        }),
      });
      const text = await upstream.text();
      let data;
      try { data = JSON.parse(text); } catch { return json({ error: 'Upstream error' }, 502, c); }
      if (!upstream.ok) return json({ error: 'Upstream error', status: upstream.status }, 502, c);
      const reply = data.choices?.[0]?.message?.content || null;
      return json({ provider: providerName, model, reply, usage: data.usage || null }, 200, c);
    }

    if (path === '/api/link/check') {
      const u = safeHttpUrl(body.url);
      if (!u) return json({ error: 'URL not allowed' }, 400, c);
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      try {
        const res = await fetch(u.toString(), {
          method: 'GET',
          redirect: 'follow',
          signal: ctrl.signal,
          headers: { 'User-Agent': 'INDEV-LinkCheck/1.0' },
        });
        clearTimeout(t);
        const ct = res.headers.get('content-type') || '';
        let sample = '';
        if (ct.includes('text/html') || ct.includes('text/plain')) {
          sample = (await res.text()).slice(0, 8000);
        }
        const titleMatch = sample.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
        return json({
          ok: res.ok,
          status: res.status,
          finalUrl: res.url,
          contentType: ct,
          title: titleMatch ? titleMatch[1].trim() : null,
          sampleLength: sample.length,
        }, 200, c);
      } catch (e) {
        clearTimeout(t);
        return json({ error: 'Fetch failed' }, 502, c);
      }
    }

    return json({ error: 'Not found' }, 404, c);
  },
};
