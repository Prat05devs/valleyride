import { Op } from 'sequelize';
import { PushToken } from '../../db';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

/** Expo push notifications for the Phase 3 apps. Tokens Expo reports as unregistered are deleted. */
export async function sendPush(userId: string, title: string, body: string, data: Record<string, string> = {}) {
  const tokens = await PushToken.findAll({ where: { userId } });
  if (!tokens.length || env.NODE_ENV === 'test') return;
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(tokens.map((t) => ({ to: t.token, title, body, data, sound: 'default' }))),
  });
  const json = (await res.json().catch(() => null)) as { data?: { status: string; details?: { error?: string } }[] } | null;
  const dead = (json?.data ?? []).map((r, i) => (r.details?.error === 'DeviceNotRegistered' ? tokens[i]!.token : null)).filter(Boolean) as string[];
  if (dead.length) await PushToken.destroy({ where: { token: { [Op.in]: dead } } });
  if (!res.ok) logger.warn({ status: res.status }, 'expo push failed');
}

export const pushTokens = {
  async register(userId: string, token: string, platform: string) {
    await PushToken.upsert({ userId, token, platform }, { conflictFields: ['token'] as never });
  },
  async remove(userId: string, token: string) {
    await PushToken.destroy({ where: { userId, token } });
  },
};
