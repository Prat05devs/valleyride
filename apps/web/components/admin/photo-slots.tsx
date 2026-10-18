'use client';

import type { PresignedUpload } from '@valleyride/shared';
import { useState } from 'react';
import { Icon } from '@/components/brand/icon';
import { api } from '@/lib/api-client';

export interface Shot { key: string; label: string; preview: string }

/** Camera or file per slot; each photo goes straight to private storage through a pre-signed URL. */
export function PhotoSlots({ bookingId, labels, value, onChange }: { bookingId: string; labels: string[]; value: Shot[]; onChange: (s: Shot[]) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(label: string, file: File) {
    setBusy(label); setError(null);
    try {
      const contentType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const p = await api.post<PresignedUpload>(`/admin/bookings/${bookingId}/photos/presign`, { contentType });
      const r = await fetch(p.uploadUrl, { method: 'PUT', headers: p.headers, body: file });
      if (!r.ok) throw new Error('Upload failed');
      onChange([...value.filter((s) => s.label !== label), { key: p.fileKey, label, preview: URL.createObjectURL(file) }]);
    } catch (e) { setError(`${label}: ${(e as Error).message}`); } finally { setBusy(null); }
  }

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(150px,100%),1fr))] gap-2.5">
        {labels.map((label) => {
          const shot = value.find((s) => s.label === label);
          return (
            <label key={label} aria-label={`${shot ? 'Retake' : 'Take'} ${label} photo`}
              className={`relative flex h-28 cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[22px] text-sm ${shot ? 'bg-surface shadow-[inset_0_0_0_1px_var(--line)]' : 'border-[1.5px] border-dashed border-disabled bg-surface'}`}>
              {shot ? (<>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shot.preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-[13px]">{label} ✓</span>
              </>) : (<><Icon name="camera" />{busy === label ? 'Uploading…' : label}</>)}
              <input type="file" accept="image/*" capture="environment" className="absolute h-px w-px opacity-0" disabled={!!busy}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(label, f); e.target.value = ''; }} />
            </label>
          );
        })}
      </div>
      {error && <p role="alert" className="m-0 text-sm text-orange-ink">{error}</p>}
    </>
  );
}
