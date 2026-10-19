import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { createFetchMock, Miniflare } from 'miniflare';

void test('notifications send in the Worker runtime and reject redirects without forwarding credentials', async (t) => {
  const fetchMock = createFetchMock();
  fetchMock.disableNetConnect();
  const telegram = fetchMock.get('https://api.telegram.org');
  telegram.intercept({ path: '/bottest-token/sendMessage', method: 'POST' }).reply(200, { ok: true });
  telegram
    .intercept({ path: '/bottest-token/sendMessage', method: 'POST' })
    .reply(302, '', { headers: { location: 'https://untrusted.invalid/' } });
  const whatsapp = fetchMock.get('https://api.callmebot.com');
  const whatsappPath = '/whatsapp.php?phone=%2B359888111222&apikey=test-key&text=test';
  whatsapp.intercept({ path: whatsappPath }).reply(200, 'Message queued');
  whatsapp
    .intercept({ path: whatsappPath })
    .reply(302, 'Message queued', { headers: { location: 'https://untrusted.invalid/' } });

  const source = stripTypeScriptTypes(readFileSync(new URL('../lib/server/notifications.ts', import.meta.url), 'utf8'));
  const runtime = new Miniflare({
    modules: true,
    compatibilityDate: '2026-05-15',
    fetchMock,
    cf: false,
    script: `${source}
      export default {
        async fetch(request) {
          const config = new URL(request.url).pathname === '/telegram'
            ? { TELEGRAM_BOT_TOKEN: 'test-token', TELEGRAM_CHAT_ID: 'test-owner' }
            : { CALLMEBOT_PHONE: '+359888111222', CALLMEBOT_API_KEY: 'test-key' };
          return Response.json(await notifyOwner(config, 'test'));
        }
      };`,
  });
  t.after(() => runtime.dispose());
  for (const channel of ['telegram', 'whatsapp']) {
    const success = await runtime.dispatchFetch(`https://test.invalid/${channel}`);
    assert.deepEqual(await success.json(), [{ channel, status: 'accepted' }]);
    const redirect = await runtime.dispatchFetch(`https://test.invalid/${channel}`);
    assert.deepEqual(await redirect.json(), [{ channel, status: 'failed' }]);
  }
  fetchMock.assertNoPendingInterceptors();
});
