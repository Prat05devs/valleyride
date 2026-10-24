'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, ApiError } from '@/lib/api-client';
import { useMe } from '@/lib/use-me';

function Profile() {
  const router = useRouter();
  const sp = useSearchParams();
  const welcome = sp.get('welcome') === '1';
  const next = sp.get('next');
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { if (me) { setName(me.fullName ?? ''); setEmail(me.email ?? ''); } }, [me]);

  async function save() {
    setBusy(true); setMsg(null);
    try {
      await api.patch('/me', { fullName: name.trim(), email: email.trim() || null });
      await qc.invalidateQueries({ queryKey: ['me'] });
      if (welcome) router.replace(next && next.startsWith('/') && !next.startsWith('//') ? next : '/account/documents');
      else setMsg('Saved');
    } catch (e) { setMsg(e instanceof ApiError && e.code === 'VALIDATION' ? 'Check the name and email.' : (e as Error).message); } finally { setBusy(false); }
  }

  return (
    <>
      <div><h1 className="m-0 text-[40px] font-normal tracking-[-0.6px]">{welcome ? 'Welcome aboard' : 'Profile'}</h1>{welcome && <p className="mt-1.5 text-[17px] text-muted">Your name goes on the rental agreement and invoices.</p>}</div>
      <form className="flex max-w-[560px] flex-col gap-4 rounded-sheet bg-surface p-7" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <label className="label">Full name, as on your driving licence<Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required minLength={2} /></label>
        <label className="label">Email for invoices (optional)<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" /></label>
        <label className="label">Mobile number<Input value={me?.phone ?? ''} readOnly /><span className="text-[13px]">Your number is how you log in, so it can&apos;t be changed here.</span></label>
        {msg && <p role="status" className="m-0 text-sm text-muted">{msg}</p>}
        <Button type="submit" disabled={busy || name.trim().length < 2}>{welcome ? 'Continue' : 'Save'}</Button>
      </form>
      {!welcome && <ChangePassword />}
    </>
  );
}

/** Signs out every other device; this one gets a fresh session from the API. */
function ChangePassword() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function save() {
    setBusy(true); setMsg(null);
    try {
      await api.post('/me/password', { currentPassword: current, newPassword: next });
      setCurrent(''); setNext(''); setMsg('Password changed. Other devices have been logged out.');
    } catch (e) { setMsg(e instanceof ApiError ? e.message : 'Could not change the password'); } finally { setBusy(false); }
  }
  return (
    <form aria-label="Change password" className="flex max-w-[560px] flex-col gap-4 rounded-sheet bg-surface p-7" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <h2 className="m-0 text-2xl font-normal">Change password</h2>
      <label className="label">Current password<Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" maxLength={128} /></label>
      <label className="label">New password<Input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" maxLength={128} />
        <span className="text-[13px]">At least 8 characters.</span></label>
      {msg && <p role="status" className="m-0 text-sm text-muted">{msg}</p>}
      <Button type="submit" variant="field" disabled={busy || !current || next.length < 8}>Change password</Button>
    </form>
  );
}

export default function ProfilePage() { return <Suspense><Profile /></Suspense>; }
