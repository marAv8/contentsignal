import { cookies } from 'next/headers';
import { OWNER_COOKIE, validOwnerSession } from '@/lib/owner-session';
import { SignalMark } from '@/components/workspace-icons';
export const dynamic = 'force-dynamic';
export default async function OwnerAccess({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const signedIn = await validOwnerSession((await cookies()).get(OWNER_COOKIE)?.value);
  const { error } = await searchParams;
  return <main className="owner-page"><section className="owner-card">
    <div className="brand-mark"><SignalMark/></div>
    <p className="eyebrow">CONTENTSIGNAL / OWNER ACCESS</p>
    <h1>{signedIn ? 'Live testing unlocked.' : 'Your private test desk.'}</h1>
    <p>The demo is open to everyone. Only the owner can run live AI tests using the project’s API credits.</p>
    {signedIn ? <><a className="button primary" href="/">Return to workspace</a><form action="/api/owner" method="post"><input type="hidden" name="action" value="logout"/><button className="button">Lock live testing</button></form></> : <form action="/api/owner" method="post">
      <label htmlFor="owner-key">Private owner access key</label>
      <input id="owner-key" name="key" type="password" required autoComplete="current-password" maxLength={200}/>
      {error && <p role="alert" className="owner-error">That key wasn’t recognized. Please try again.</p>}
      <button className="button primary" type="submit">Unlock live testing</button>
      <small>Access lasts eight hours on this browser. Keep your key private.</small>
    </form>}
    <a href="/" className="owner-back">← Browse the public demo</a>
  </section></main>;
}
