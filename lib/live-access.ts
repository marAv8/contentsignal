// Production inference additionally requires a verified owner session at the route.
// The project binding limits which deployment can enable inference.
export function liveApiEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.CONTENTSIGNAL_ENABLE_LIVE_API !== 'true') return false;
  if (env.NODE_ENV !== 'production') return true;
  return env.VERCEL === '1' && env.VERCEL_ENV === 'production' &&
    env.CONTENTSIGNAL_PROTECTED_PROJECT_ID === env.VERCEL_PROJECT_ID &&
    Boolean(env.CONTENTSIGNAL_PROTECTED_PROJECT_ID);
}
export function permittedOrigin(url: string, origin: string | null, production: boolean): boolean {
  try {
    const target = new URL(url);
    if (production) return !origin || new URL(origin).origin === target.origin;
    const local = (hostname: string) => ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname);
    return local(target.hostname) && (!origin || local(new URL(origin).hostname));
  } catch { return false; }
}
