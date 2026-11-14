/**
 * INDEV Worker — AI chat + limited link check
 * Secrets: OPENAI_API_KEY, XAI_API_KEY, DEEPSEEK_API_KEY, ALLOWED_ORIGIN
 *
 * provider "chatgpt" is an alias for OpenAI API keys — not a login to a ChatGPT account.
 */
const PROVIDERS = {
  openai: { url: 'https://api.openai.com/v1/chat/completions', keyEnv: 'OPENAI_API_KEY', defaultModel: 'gpt-4o-mini' },
  chatgpt: { url: 'https://api.openai.com/v1/chat/completions', keyEnv: 'OPENAI_API_KEY', defaultModel: 'gpt-4o-mini' },
  xai: { url: 'https://api.x.ai/v1/chat/completions', keyEnv: 'XAI_API_KEY', defaultModel: 'grok-2-latest' },
  deepseek: { url: 'https://api.deepseek.com/chat/completions', keyEnv: 'DEEPSEEK_API_KEY', defaultModel: 'deepseek-chat' },
};

const RATE = new Map();
function rateLimit(key, limit = 30, windowMs = 60000) {
  const now = Date.now();
  let b = RATE.get(key);
  if (!b || now > b.reset) b = { count: 0, reset: now + windowMs };
  b.count += 1;
  RATE.set(key, b);
  return b.count <= limit;
}

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

function isPrivateHostnameOrIp(host) {
  const h = (host || '').toLowerCase().replace(/^\[|\]$/g, '');
  if (!h || h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')) return true;
  if (h === 'metadata.google.internal' || h.includes('metadata')) return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const a = m.slice(1).map(Number);
    if (a.some((n) => n > 255)) return true;
    if (a[0] === 10) return true;
    if (a[0] === 127) return true;
    if (a[0] === 0) return true;
    if (a[0] === 169 && a[1] === 254) return true;
    if (a[0] === 192 && a[1] === 168) return true;
    if (a[0] === 172 && a[1] >= 16 && a[1] <= 31) return true;
    if (a[0] === 100 && a[1] >= 64 && a[1] <= 127) return true;
    if (a[0] >= 224) return true;
    return false;
  }
  if (h === '::1' || h === '0:0:0:0:0:0:0:1') return true;
  if (h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80')) return true;
  if (h.startsWith('::ffff:')) return isPrivateHostnameOrIp(h.slice(7));
  return false;
}

function safeHttpUrl(raw) {
  let u;
  try { u = new URL(String(raw || '').trim()); } catch { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  if (u.username || u.password) return null;
  if (isPrivateHostnameOrIp(u.hostname)) return null;
  return u;
}

async function readBodyLimited(res, maxBytes) {
  const reader = res.body && res.body.getReader();
  if (!reader) return '';
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      chunks.push(value.slice(0, Math.max(0, maxBytes - (total - value.byteLength))));
      try { await reader.cancel(); } catch (_) {}
      break;
    }
    chunks.push(value);
  }
  const buf = new Uint8Array(Math.min(total, maxBytes));
  let off = 0;
  for (const c of chunks) {
    const n = Math.min(c.byteLength, buf.length - off);
    buf.set(c.subarray(0, n), off);
    off += n;
    if (off >= buf.length) break;
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(buf.subarray(0, off));
}

export default {
  async fetch(request, env) {
    const allowed = env.ALLOWED_ORIGIN || '';
    const origin = request.headers.get('Origin') || '';
    const c = cors(origin, allowed);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: c });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405, c);
    if (allowed && origin && origin !== allowed) return json({ error: 'Origin not allowed' }, 403, c);

    const clientKey = (request.headers.get('CF-Connecting-IP') || origin || 'anon') + ':' + new URL(request.url).pathname;
    if (!rateLimit(clientKey, 40, 60000)) return json({ error: 'Rate limit' }, 429, c);

    const path = new URL(request.url).pathname;
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400, c); }

    if (path === '/api/ai/chat' || path === '/api/chat') {
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
      const timer = setTimeout(() => ctrl.abort(), 8000);
      try {
        const res = await fetch(u.toString(), {
          method: 'GET',
          redirect: 'manual',
          signal: ctrl.signal,
          headers: { 'User-Agent': 'INDEV-LinkCheck/1.0' },
        });
        const loc = res.headers.get('Location');
        if (res.status >= 300 && res.status < 400 && loc) {
          let next;
          try { next = new URL(loc, u); } catch { next = null; }
          if (!next || !safeHttpUrl(next.toString())) {
            clearTimeout(timer);
            return json({ error: 'Redirect target not allowed', status: res.status }, 400, c);
          }
          const res2 = await fetch(next.toString(), {
            method: 'GET',
            redirect: 'manual',
            signal: ctrl.signal,
            headers: { 'User-Agent': 'INDEV-LinkCheck/1.0' },
          });
          const sample = await readBodyLimited(res2, 64 * 1024);
          clearTimeout(timer);
          const ct = res2.headers.get('content-type') || '';
          const titleMatch = sample.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
          return json({
            ok: res2.ok,
            status: res2.status,
            finalUrl: next.toString(),
            redirectedFrom: u.toString(),
            contentType: ct,
            title: titleMatch ? titleMatch[1].trim() : null,
            sampleLength: sample.length,
          }, 200, c);
        }
        const sample = await readBodyLimited(res, 64 * 1024);
        clearTimeout(timer);
        const ct = res.headers.get('content-type') || '';
        const titleMatch = sample.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
        return json({
          ok: res.ok,
          status: res.status,
          finalUrl: u.toString(),
          contentType: ct,
          title: titleMatch ? titleMatch[1].trim() : null,
          sampleLength: sample.length,
        }, 200, c);
      } catch (e) {
        clearTimeout(timer);
        return json({ error: 'Fetch failed' }, 502, c);
      }
    }

    return json({ error: 'Not found' }, 404, c);
  },
};
