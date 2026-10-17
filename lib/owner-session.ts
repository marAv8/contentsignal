import { createHash, timingSafeEqual } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';

export const OWNER_COOKIE = 'contentsignal_owner';
export const SESSION_SECONDS = 60 * 60 * 8;
const issuer = 'contentsignal-owner';
const audience = 'contentsignal-live-api';
export function ownerAuthConfigured(env: NodeJS.ProcessEnv = process.env) {
  return (env.CONTENTSIGNAL_OWNER_KEY?.length ?? 0) >= 40 && (env.CONTENTSIGNAL_SESSION_SECRET?.length ?? 0) >= 40;
}
export function validOwnerKey(candidate: string, env: NodeJS.ProcessEnv = process.env) {
  if (!ownerAuthConfigured(env) || candidate.length > 200) return false;
  const hash = (v: string) => createHash('sha256').update(v).digest();
  return timingSafeEqual(hash(candidate), hash(env.CONTENTSIGNAL_OWNER_KEY!));
}
export async function createOwnerSession(env: NodeJS.ProcessEnv = process.env) {
  if (!ownerAuthConfigured(env)) throw new Error('Owner access is not configured');
  return new SignJWT({ role: 'owner' }).setProtectedHeader({ alg: 'HS256' }).setSubject('owner')
    .setIssuer(issuer).setAudience(audience).setIssuedAt().setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(new TextEncoder().encode(env.CONTENTSIGNAL_SESSION_SECRET));
}
export async function validOwnerSession(token?: string, env: NodeJS.ProcessEnv = process.env) {
  if (!token || token.length > 2000 || !ownerAuthConfigured(env)) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(env.CONTENTSIGNAL_SESSION_SECRET), {
      algorithms: ['HS256'], issuer, audience, maxTokenAge: SESSION_SECONDS,
    });
    return payload.sub === 'owner' && payload.role === 'owner';
  } catch { return false; }
}
