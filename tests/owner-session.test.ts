import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import { createOwnerSession, validOwnerSession, validOwnerKey } from '../lib/owner-session';
const env: NodeJS.ProcessEnv = { NODE_ENV: 'test', CONTENTSIGNAL_OWNER_KEY: 'a'.repeat(64), CONTENTSIGNAL_SESSION_SECRET: 'b'.repeat(64) };
test('owner key rejects missing configuration and incorrect input', () => {
  assert.equal(validOwnerKey('a'.repeat(64), env), true);
  assert.equal(validOwnerKey('wrong', env), false);
  assert.equal(validOwnerKey('a'.repeat(64), {NODE_ENV:'test'}), false);
});
test('owner session rejects missing, tampered, expired and differently signed tokens', async () => {
  const token = await createOwnerSession(env);
  assert.equal(await validOwnerSession(token, env), true);
  assert.equal(await validOwnerSession(undefined, env), false);
  assert.equal(await validOwnerSession(token + 'tampered', env), false);
  assert.equal(await validOwnerSession(token, {...env, CONTENTSIGNAL_SESSION_SECRET: 'c'.repeat(64)}), false);
  const expired = await new SignJWT({role:'owner'}).setProtectedHeader({alg:'HS256'}).setSubject('owner')
    .setIssuer('contentsignal-owner').setAudience('contentsignal-live-api').setIssuedAt(1).setExpirationTime(2)
    .sign(new TextEncoder().encode(env.CONTENTSIGNAL_SESSION_SECRET));
  assert.equal(await validOwnerSession(expired, env), false);
});
