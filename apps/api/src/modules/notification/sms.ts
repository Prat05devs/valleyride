import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { sendWhatsApp } from './whatsapp';
import { otpMessage } from './templates';

/**
 * Sends a login OTP. Outside production the code is written to the API log instead (look for "dev OTP"),
 * so local login works without MSG91. In production SMS goes through MSG91's OTP API with a DLT-approved template.
 */
export async function sendOtp(phone: string, code: string, channel: 'sms' | 'whatsapp' = 'sms'): Promise<void> {
  if (env.NODE_ENV !== 'production') {
    logger.info({ phone, code, channel }, 'dev OTP');
    return;
  }
  if (channel === 'whatsapp') return sendWhatsApp(phone, otpMessage(code));
  if (!env.MSG91_AUTH_KEY || !env.MSG91_OTP_TEMPLATE_ID) throw new Error('MSG91_AUTH_KEY and MSG91_OTP_TEMPLATE_ID must be set');
  const url = new URL('https://control.msg91.com/api/v5/otp');
  url.search = new URLSearchParams({ template_id: env.MSG91_OTP_TEMPLATE_ID, mobile: phone.replace(/^\+/, ''), otp: code }).toString();
  const res = await fetch(url, {
    method: 'POST', headers: { authkey: env.MSG91_AUTH_KEY, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10_000),
  });
  const body = (await res.json().catch(() => null)) as { type?: string; message?: string } | null;
  if (!res.ok || body?.type === 'error') throw new Error(`MSG91 OTP failed: ${body?.message ?? res.status}`);
}
