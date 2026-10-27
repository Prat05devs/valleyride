'use client';

import { DOCUMENT_LABEL, type CustomerDocumentDTO, type PresignedUpload } from '@valleyride/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Icon } from '@/components/brand/icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { api, ApiError } from '@/lib/api-client';
import { formatDay } from '@/lib/format';

type DocType = 'DL' | 'AADHAAR' | 'PASSPORT';
const ACCEPT = ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'];

export default function DocumentsPage() {
  const { data, isError, isLoading, refetch } = useQuery({ queryKey: ['kyc'], queryFn: () => api.get<CustomerDocumentDTO[]>('/kyc/documents') });
  return (
    <>
      <div><h1 className="m-0 text-[40px] font-normal tracking-[-0.6px]">Documents</h1><p className="mt-1.5 text-[17px] text-muted">We check these before your first pickup. Bring the originals too.</p></div>
      {isError && <p role="alert">Could not check your documents. <button type="button" className="underline" onClick={() => void refetch()}>Try again</button></p>}
      {isLoading && <p role="status">Loading documents…</p>}
      {data && <div className="grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-4">
        <DocCard title="Driving licence" types={['DL']} current={data?.find((d) => d.type === 'DL')} />
        <DocCard title="ID proof" types={['AADHAAR', 'PASSPORT']} current={data?.find((d) => d.type !== 'DL')} />
      </div>}
      <div className="flex items-center gap-3 rounded-card bg-surface px-[22px] py-[18px] text-[15px] text-muted"><Icon name="lock" />Files are private and available to authorised staff. Typed ID numbers are masked; photos may show the full number. Use a masked Aadhaar if you upload Aadhaar.</div>
    </>
  );
}

function DocCard({ title, types, current }: { title: string; types: DocType[]; current?: CustomerDocumentDTO }) {
  const qc = useQueryClient();
  const [type, setType] = useState<DocType>(current?.type ?? types[0]!);
  const [number, setNumber] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editing = !current || current.status === 'REJECTED' || replacing;

  async function submit() {
    if (!file) return;
    setBusy(true); setError(null);
    try {
      const contentType = ACCEPT.includes(file.type) ? file.type : 'image/jpeg';
      const p = await api.post<PresignedUpload>('/kyc/documents/presign', { type, contentType });
      const put = await fetch(p.uploadUrl, { method: 'PUT', headers: p.headers, body: file });
      if (!put.ok) throw new Error('The upload did not finish. Please try again.');
      await api.post('/kyc/documents', { type, number, fileKey: p.fileKey });
      setFile(null); setNumber(''); setReplacing(false);
      await qc.invalidateQueries({ queryKey: ['kyc'] });
    } catch (e) { setError(e instanceof ApiError && e.details ? 'Check the number and try again.' : (e as Error).message); } finally { setBusy(false); }
  }

  const badge = !current ? <Badge>Not added</Badge>
    : current.status === 'VERIFIED' ? <Badge className="gap-1.5"><Icon name="check" size={16} />Verified</Badge>
      : current.status === 'PENDING' ? <Badge>In review</Badge>
        : <Badge variant="orange" className="gap-1.5"><span className="h-2 w-2 rounded-full bg-orange" />Needs a new photo</Badge>;
  const numberLabel = type === 'DL' ? 'Licence number' : type === 'AADHAAR' ? 'Aadhaar number (12 digits)' : 'Passport number';

  return (
    <div className="flex flex-col gap-3.5 rounded-sheet bg-surface p-6">
      <div className="flex items-center justify-between"><h2 className="m-0 text-[22px] font-normal">{title}</h2>{badge}</div>
      {current && !editing && (
        <>
          <span className="text-sm text-muted">{DOCUMENT_LABEL[current.type]} ending {current.numberMasked} · {current.status === 'VERIFIED' && current.verifiedAt ? `verified ${formatDay(current.verifiedAt)}` : "we'll let you know when it's checked"}</span>
          <Button variant="field" size="sm" className="self-start" onClick={() => setReplacing(true)}>Replace</Button>
        </>
      )}
      {editing && (
        <>
          {types.length > 1 && <label className="label">Type<Select value={type} onChange={(e) => setType(e.target.value as DocType)}>{types.map((t) => <option key={t} value={t}>{DOCUMENT_LABEL[t]}</option>)}</Select></label>}
          <label className="label">{numberLabel}<Input value={number} onChange={(e) => setNumber(e.target.value)} inputMode={type === 'AADHAAR' ? 'numeric' : 'text'} autoComplete="off" className="uppercase tracking-[1px]" /></label>
          <label className="relative flex h-[150px] cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-[1.5px] border-dashed border-disabled px-4 text-center text-[15px]"
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}>
            <Icon name="upload" />
            <span>{file ? file.name : <>Drop a photo or PDF here, or <span className="underline">browse</span></>}</span>
            <span className="text-[13px] text-muted">JPG, PNG or PDF up to 10 MB, all four corners visible</span>
            <input type="file" accept="image/*,application/pdf" className="absolute h-px w-px opacity-0" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          {current?.status === 'REJECTED' && !replacing && <span className="text-sm leading-[1.45] text-muted">We couldn&apos;t read the details on the last photo. Take it in good light with all four corners visible.</span>}
          {error && <p role="alert" className="m-0 text-sm text-orange-ink">{error}</p>}
          <Button disabled={!file || number.replace(/\s/g, '').length < 4 || busy || (file?.size ?? 0) > 10 * 1024 * 1024} onClick={submit}>{busy ? 'Uploading…' : 'Send for checking'}</Button>
          {replacing && <Button variant="ghost" size="sm" onClick={() => setReplacing(false)}>Keep the current one</Button>}
        </>
      )}
    </div>
  );
}
