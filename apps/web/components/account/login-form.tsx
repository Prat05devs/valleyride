'use client';

import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api-client';
import type { SessionUser } from '@/lib/auth';
import { cn } from '@/lib/utils';

const WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP;

/** Phone number and password. Cookies are set by the API (httpOnly). New riders create their account here too. */
export function LoginForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const next = useSearchParams().get('next');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const e164 = `+91${phone.replace(/\D/g, '')}`;
  const validPhone = /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''));
  const valid = validPhone && (mode === 'login' ? password.length > 0 : password.length >= 8);

  async function submit() {
    setBusy(true); setError(null);
    try {
      const { user } = await api.post<{ user: SessionUser }>(mode === 'login' ? '/auth/login' : '/auth/register', { phone: e164, password });
      await qc.invalidateQueries({ queryKey: ['me'] });
      const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null;
      router.replace(!user.fullName ? `/account/profile?welcome=1${safeNext ? `&next=${encodeURIComponent(safeNext)}` : ''}` : safeNext ?? (user.role === 'staff' || user.role === 'admin' ? '/admin' : user.role === 'investor' ? '/invest/portal' : '/account/bookings'));
      router.refresh();
    } catch (e) {
      if (e instanceof ApiError && e.code === 'ALREADY_REGISTERED') { setMode('login'); setPassword(''); }
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
    } finally { setBusy(false); }
  }

  const switchTo = (m: 'login' | 'register') => { setMode(m); setError(null); };
  const forgotHref = WHATSAPP ? `https://wa.me/${WHATSAPP.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I forgot my Valley Ride password. My number is ${e164}.`)}` : null;

  return (
    <div className="mx-auto flex w-full max-w-[440px] flex-col gap-5">
      <div role="tablist" aria-label="Log in or create an account" className="grid grid-cols-2 gap-1 rounded-full bg-field p-1">
        {(['login', 'register'] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => switchTo(m)}
            className={cn('h-11 rounded-full text-[15px]', mode === m ? 'bg-ink text-surface' : 'text-ink')}>
            {m === 'login' ? 'Log in' : 'Create account'}
          </button>
        ))}
      </div>
      <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); if (valid) submit(); }}>
        <div className="flex flex-col gap-1.5">
          <h2 className="m-0 text-4xl font-normal tracking-[-0.5px]">{mode === 'login' ? 'Log in' : 'Create your account'}</h2>
          <p className="m-0 text-base text-muted">{mode === 'login' ? 'Use your mobile number and password.' : 'Your mobile number is your login. Next, you add your name and driving licence.'}</p>
        </div>
        <label className="label gap-2">Mobile number
          <span className="flex h-[60px] items-center gap-3 rounded-full bg-field px-[22px]">
            <span className="border-r border-[#D5D8DC] pr-3 text-[17px] text-ink">+91</span>
            <input type="tel" inputMode="numeric" autoComplete="tel-national" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, '').slice(0, 11))}
              className="min-w-0 flex-1 border-0 bg-transparent text-[17px] text-ink outline-none" placeholder="98765 43210" autoFocus />
          </span>
        </label>
        <label className="label gap-2">Password
          <span className="flex h-[60px] items-center gap-3 rounded-full bg-field pl-[22px] pr-2">
            <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} maxLength={128}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="min-w-0 flex-1 border-0 bg-transparent text-[17px] text-ink outline-none" />
            <button type="button" onClick={() => setShow(!show)} aria-pressed={show} className="h-11 rounded-full px-4 text-sm underline">{show ? 'Hide' : 'Show'}</button>
          </span>
          {mode === 'register' && <span className="text-[13px] text-muted">At least 8 characters. A short phrase is easy to remember and hard to guess.</span>}
        </label>
        <Button type="submit" size="lg" className="h-[60px]" disabled={!valid || busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</Button>
        {mode === 'login' && (
          <p className="m-0 text-sm text-muted">Forgot your password? {forgotHref
            ? <a href={forgotHref} target="_blank" rel="noreferrer" className="text-ink underline">Message us on WhatsApp</a>
            : 'Contact the Valley Ride desk'} and we&apos;ll send you a temporary one.</p>
        )}
      </form>
      {error && <p role="alert" className="m-0 rounded-[20px] bg-orange-tint px-4 py-3 text-sm text-orange-ink">{error}</p>}
      <p className="m-0 text-sm leading-[1.45] text-muted">By continuing you agree to the <Link href="/terms" className="text-ink underline">rental terms</Link> and <Link href="/terms" className="text-ink underline">privacy policy</Link>.</p>
    </div>
  );
}
