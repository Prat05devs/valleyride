import express, { Router } from 'express';
import { getRedis } from '../../jobs/queue';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { paymentService } from './payment.service';
import { verifyWebhookSignature } from './razorpay.client';

export const paymentWebhookRouter = Router();

const SEEN_TTL_SECONDS = 7 * 86_400;

/** Mounted before express.json(): the HMAC is computed over the exact raw body. */
paymentWebhookRouter.post('/razorpay', express.raw({ type: 'application/json', limit: '1mb' }), async (req, res) => {
  const raw = req.body as Buffer;
  if (!Buffer.isBuffer(raw) || !verifyWebhookSignature(raw, req.get('x-razorpay-signature'))) {
    throw new AppError(400, 'BAD_SIGNATURE', 'Invalid webhook signature');
  }
  const event = JSON.parse(raw.toString('utf8'));
  const eventId = req.get('x-razorpay-event-id') ?? `${event.event}:${event.payload?.payment?.entity?.id}`;

  // Processed once per event id; the key is released if handling fails so Razorpay's retry can succeed.
  const seenKey = `webhook:razorpay:${eventId}`;
  const first = await getRedis().set(seenKey, '1', 'EX', SEEN_TTL_SECONDS, 'NX');
  if (!first) return res.json({ ok: true, duplicate: true });

  try {
    const entity = event.payload?.payment?.entity;
    if (event.event === 'payment.captured') await paymentService.handleCaptured(entity, event);
    else if (event.event === 'payment.failed') await paymentService.handleFailed(entity, event);
    else if (event.event === 'refund.processed') await paymentService.handleRefundProcessed(event.payload?.refund?.entity, event);
    else logger.info({ event: event.event }, 'razorpay event ignored');
  } catch (err) {
    await getRedis().del(seenKey);
    throw err;
  }
  res.json({ ok: true });
});
