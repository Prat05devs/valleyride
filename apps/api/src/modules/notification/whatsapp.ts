import { env } from '../../config/env';
import { logger } from '../../utils/logger';

/**
 * WhatsApp Business (Cloud API) messages: confirmations, reminders, refunds. Logged outside production.
 * A document link (e.g. a 5-minute signed invoice URL) is sent as a WhatsApp document message.
 * Messages outside the 24-hour customer window need approved templates in Meta Business Manager.
 */
export async function sendWhatsApp(phone: string, text: string, document?: { url: string; filename: string }): Promise<void> {
  if (env.NODE_ENV !== 'production') {
    logger.info({ phone, text, document: document?.filename }, 'dev WhatsApp');
    return;
  }
  if (!env.WHATSAPP_API_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) throw new Error('WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID must be set');
  const send = (payload: object) => fetch(`https://graph.facebook.com/v20.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.WHATSAPP_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: phone.replace(/^\+/, ''), ...payload }),
  });
  const res = await send(document ? { type: 'document', document: { link: document.url, filename: document.filename, caption: text } } : { type: 'text', text: { body: text } });
  if (!res.ok) throw new Error(`WhatsApp send failed: ${res.status} ${await res.text().catch(() => '')}`);
}
