import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const port = 39000 + Math.floor(Math.random() * 1000);
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ['server.mjs'], {
  cwd: new URL('..', import.meta.url),
  env: { ...process.env, PORT: String(port), OPENAI_API_KEY: '', OPENAI_MODEL: '', LINKEDIN_CLIENT_ID: '', LINKEDIN_CLIENT_SECRET: '' },
  stdio: 'ignore'
});

async function ready() {
  for (let i = 0; i < 30; i++) {
    try { const response = await fetch(`${base}/api/status`); if (response.ok) return; }
    catch { /* startup */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Server did not start');
}

test('local app requires explicit approval and rejects cross-origin writes', async () => {
  try {
    await ready();
    const page = await fetch(base);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /LinkedIn-помощник/);

    const status = await fetch(`${base}/api/status`).then(r => r.json());
    assert.equal(status.connected, false);
    assert.equal(status.aiReady, false);

    const apiWithoutKey = await fetch(`${base}/api/questions`, { method: 'POST', headers: { origin: base, 'x-assistant-request': '1', 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'api', note: 'Test note' }) });
    assert.equal(apiWithoutKey.status, 400);
    assert.match((await apiWithoutKey.json()).error, /OPENAI_API_KEY/);

    const crossOrigin = await fetch(`${base}/api/publish`, { method: 'POST', headers: { origin: 'https://evil.example', 'x-assistant-request': '1', 'content-type': 'application/json' }, body: '{}' });
    assert.equal(crossOrigin.status, 400);

    const withoutApproval = await fetch(`${base}/api/publish`, { method: 'POST', headers: { origin: base, 'x-assistant-request': '1', 'content-type': 'application/json' }, body: JSON.stringify({ content: 'Test' }) });
    assert.equal(withoutApproval.status, 400);
    assert.match((await withoutApproval.json()).error, /подтверждение/);
  } finally { child.kill(); }
});
