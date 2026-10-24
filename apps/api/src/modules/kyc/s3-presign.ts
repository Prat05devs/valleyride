import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { PresignedUpload } from '@valleyride/shared';
import { env } from '../../config/env';

/**
 * Private files (KYC documents, handover photos, agreements, invoices), uploaded with 10-minute signed PUT links and
 * read through 5-minute signed GET links. `local` (the default, and production on the droplet) keeps them on disk
 * behind HMAC-signed /api/v1/files links; `s3` uses pre-signed S3 URLs.
 */
const UPLOAD_TTL = 10 * 60;
export const READ_TTL = 5 * 60;
const LOCAL_DIR = path.resolve(__dirname, '../../../.uploads');

let s3: S3Client | undefined;
const client = () => (s3 ??= new S3Client({ region: env.AWS_REGION }));

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/heic': 'heic', 'application/pdf': 'pdf' };

export const newFileKey = (prefix: string, contentType: string) => `${prefix}/${randomUUID()}.${EXT[contentType] ?? 'bin'}`;

const sign = (op: string, key: string, exp: number) => createHmac('sha256', env.JWT_ACCESS_SECRET).update(`${op}:${key}:${exp}`).digest('hex');

export function verifyLocalSignature(op: 'put' | 'get', key: string, exp: number, sig: string) {
  if (!Number.isFinite(exp) || exp < Date.now() / 1000 || key.includes('..')) return false;
  const a = Buffer.from(sign(op, key, exp)); const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** `origin` is the API's public origin, used only by the local driver. */
export async function presignPut(key: string, contentType: string, origin: string): Promise<PresignedUpload> {
  if (env.STORAGE_DRIVER === 'local') {
    const exp = Math.floor(Date.now() / 1000) + UPLOAD_TTL;
    const url = `${origin}/api/v1/files?key=${encodeURIComponent(key)}&exp=${exp}&sig=${sign('put', key, exp)}`;
    return { uploadUrl: url, fileKey: key, headers: { 'Content-Type': contentType }, expiresInSeconds: UPLOAD_TTL };
  }
  const cmd = new PutObjectCommand({ Bucket: env.S3_BUCKET_PRIVATE!, Key: key, ContentType: contentType, ServerSideEncryption: 'AES256' });
  const uploadUrl = await getSignedUrl(client(), cmd, { expiresIn: UPLOAD_TTL });
  return { uploadUrl, fileKey: key, headers: { 'Content-Type': contentType, 'x-amz-server-side-encryption': 'AES256' }, expiresInSeconds: UPLOAD_TTL };
}

export async function presignGet(key: string, origin: string) {
  if (env.STORAGE_DRIVER === 'local') {
    const exp = Math.floor(Date.now() / 1000) + READ_TTL;
    return `${origin}/api/v1/files?key=${encodeURIComponent(key)}&exp=${exp}&sig=${sign('get', key, exp)}`;
  }
  return getSignedUrl(client(), new GetObjectCommand({ Bucket: env.S3_BUCKET_PRIVATE!, Key: key }), { expiresIn: READ_TTL });
}

/** Server-side write (generated PDFs). */
export async function putObject(key: string, body: Buffer, contentType: string) {
  if (env.STORAGE_DRIVER === 'local') return localWrite(key, body);
  await client().send(new PutObjectCommand({ Bucket: env.S3_BUCKET_PRIVATE!, Key: key, Body: body, ContentType: contentType, ServerSideEncryption: 'AES256' }));
}

export async function localWrite(key: string, body: Buffer) {
  const file = path.join(LOCAL_DIR, key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
}
export const localRead = (key: string) => readFile(path.join(LOCAL_DIR, key));
