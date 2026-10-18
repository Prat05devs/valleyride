'use client';

import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api-client';
import type { SessionUser } from '@/lib/auth';
import { cn } from '@/lib/utils';

/** Phone OTP: the same step logs in or creates the account. Cookies are set by the API (httpOnly). */
export function LoginForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const next = useSearchParams().get('next');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const e164 = `+91${phone.replace(/\D/g, '')}`;
  const valid = /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''));

  async function send(channel: 'sms' | 'whatsapp') {
    setBusy(true); setError(null);
    try { await api.post('/auth/otp/request', { phone: e164, channel }); setStep('code'); setDigits(['', '', '', '', '', '']); setTimeout(() => boxes.current[0]?.focus(), 50); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Could not send the code'); } finally { setBusy(false); }
  }

  async function verify(code: string) {
    setBusy(true); setError(null);
    try {
      const { user } = await api.post<{ user: SessionUser }>('/auth/otp/verify', { phone: e164, code });
      await qc.invalidateQueries({ queryKey: ['me'] });
      const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null;
      router.replace(!user.fullName ? `/account/profile?welcome=1${safeNext ? `&next=${encodeURIComponent(safeNext)}` : ''}` : safeNext ?? (user.role === 'staff' || user.role === 'admin' ? '/admin' : user.role === 'investor' ? '/invest/portal' : '/account/bookings'));
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not verify the code');
      setDigits(['', '', '', '', '', '']); boxes.current[0]?.focus();
    } finally { setBusy(false); }
  }

  function setDigit(i: number, v: string) {
    const clean = v.replace(/\D/g, '');
    if (clean.length > 1) { // pasted code
      const all = clean.slice(0, 6).split('');
      const d = [...digits]; all.forEach((c, j) => { if (i + j < 6) d[i + j] = c; });
      setDigits(d); boxes.current[Math.min(5, i + all.length)]?.focus();
      if (d.every(Boolean)) verify(d.join(''));
      return;
    }
    const d = [...digits]; d[i] = clean; setDigits(d);
    if (clean && i < 5) boxes.current[i + 1]?.focus();
    if (d.every(Boolean)) verify(d.join(''));
  }

  const first = digits.findIndex((d) => !d);
  return (
    <div className="mx-auto flex w-full max-w-[440px] flex-col gap-5">
      {step === 'phone' ? (
        <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); if (valid) send('sms'); }}>
          <div className="flex flex-col gap-1.5"><h2 className="m-0 text-4xl font-normal tracking-[-0.5px]">Log in</h2><p className="m-0 text-base text-muted">We&apos;ll text a 6-digit code to your phone. New here? The same step creates your account.</p></div>
          <label className="label gap-2">Mobile number
            <span className="flex h-[60px] items-center gap-3 rounded-full bg-field px-[22px]">
              <span className="border-r border-[#D5D8DC] pr-3 text-[17px] text-ink">+91</span>
              <input type="tel" inputMode="numeric" autoComplete="tel-national" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, '').slice(0, 11))}
                className="min-w-0 flex-1 border-0 bg-transparent text-[17px] text-ink outline-none" placeholder="98765 43210" autoFocus />
            </span>
          </label>
          <Button type="submit" size="lg" className="h-[60px]" disabled={!valid || busy}>Get OTP</Button>
          <Button type="button" variant="field" className="h-12" disabled={!valid || busy} onClick={() => send('whatsapp')}>Send the code on WhatsApp</Button>
        </form>
      ) : (
        <>
          <div className="flex flex-col gap-1.5"><h2 className="m-0 text-4xl font-normal tracking-[-0.5px]">Enter the code</h2>
            <p className="m-0 text-base text-muted">Sent to +91 {phone}. <button type="button" onClick={() => setStep('phone')} className="text-ink underline">Change number</button></p></div>
          <fieldset className="m-0 border-0 p-0"><legend className="sr-only">One-time code</legend>
            <div className="grid grid-cols-6 gap-2.5">
              {digits.map((d, i) => (
                <input key={i} ref={(el) => { boxes.current[i] = el; }} aria-label={`Digit ${i + 1}`} inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} value={d}
                  onChange={(e) => setDigit(i, e.target.value)} onKeyDown={(e) => { if (e.key === 'Backspace' && !d && i > 0) boxes.current[i - 1]?.focus(); }}
                  className={cn('h-16 min-w-0 rounded-[20px] text-center text-[26px] outline-none', d ? 'border-[1.5px] border-ink' : i === first ? 'border-2 border-orange' : 'border-0 bg-field')} />
              ))}
            </div>
          </fieldset>
          <Button size="lg" className="h-[60px]" disabled={busy || digits.some((x) => !x)} onClick={() => verify(digits.join(''))}>{busy ? 'Checking…' : 'Verify and continue'}</Button>
          <span className="text-sm text-muted">Codes expire after 5 minutes. <button type="button" disabled={busy} onClick={() => send('sms')} className="text-ink underline">Send a new code</button></span>
        </>
      )}
      {error && <p role="alert" className="m-0 rounded-[20px] bg-orange-tint px-4 py-3 text-sm text-orange-ink">{error}</p>}
      <p className="m-0 text-sm leading-[1.45] text-muted">By continuing you agree to the <Link href="/terms" className="text-ink underline">rental terms</Link> and <Link href="/terms" className="text-ink underline">privacy policy</Link>.</p>
    </div>
  );
}
