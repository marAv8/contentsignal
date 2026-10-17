import { test } from 'node:test';
import assert from 'node:assert/strict';
import { liveApiEnabled, permittedOrigin } from '../lib/live-access';
const hosted: NodeJS.ProcessEnv = { NODE_ENV: 'production', VERCEL: '1', VERCEL_ENV: 'production', VERCEL_PROJECT_ID: 'private-project', CONTENTSIGNAL_PROTECTED_PROJECT_ID: 'private-project', CONTENTSIGNAL_ENABLE_LIVE_API: 'true' };
test('production fails closed without explicit protected project binding', () => {
  assert.equal(liveApiEnabled({ NODE_ENV: 'production', CONTENTSIGNAL_ENABLE_LIVE_API: 'true' }), false);
  assert.equal(liveApiEnabled({...hosted, CONTENTSIGNAL_PROTECTED_PROJECT_ID: ''}), false);
  assert.equal(liveApiEnabled({...hosted, VERCEL_PROJECT_ID: 'other-project'}), false);
  assert.equal(liveApiEnabled({...hosted, VERCEL_ENV: 'preview'}), false);
  assert.equal(liveApiEnabled({...hosted, CONTENTSIGNAL_ENABLE_LIVE_API: 'false'}), false);
  assert.equal(liveApiEnabled(hosted), true);
});
test('origin checks reject malformed and cross-site requests', () => {
  assert.equal(permittedOrigin('https://private.example/api/analyze', 'https://attacker.example', true), false);
  assert.equal(permittedOrigin('https://private.example/api/analyze', 'garbage', true), false);
  assert.equal(permittedOrigin('https://private.example/api/analyze', 'https://private.example', true), true);
  assert.equal(permittedOrigin('http://localhost:3000/api/analyze', 'http://localhost:3000', false), true);
  assert.equal(permittedOrigin('http://remote.example/api/analyze', null, false), false);
});
