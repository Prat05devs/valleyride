import type { CookieOptions, Request, Response } from 'express';
import { env } from '../../config/env';
import { authService, type Session } from './auth.service';
import { pushTokens } from '../notification/push';
import { ACCESS_COOKIE, ACCESS_TTL_SECONDS, REFRESH_COOKIE, REFRESH_TTL_DAYS, revokeRefreshToken } from './tokens';

const cookieBase: CookieOptions = { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax', ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}) };

/** Web clients get httpOnly cookies; the mobile app (X-Client: mobile) gets the tokens in the body for Bearer use. */
function sendSession(req: Request, res: Response, s: Session) {
  res.cookie(ACCESS_COOKIE, s.accessToken, { ...cookieBase, path: '/', maxAge: ACCESS_TTL_SECONDS * 1000 });
  res.cookie(REFRESH_COOKIE, s.refreshToken, { ...cookieBase, path: '/api/v1/auth', maxAge: REFRESH_TTL_DAYS * 86_400_000 });
  const mobile = req.get('x-client') === 'mobile';
  res.json({ data: { user: s.user, ...(mobile ? { accessToken: s.accessToken, refreshToken: s.refreshToken } : {}) } });
}

export async function register(req: Request, res: Response) {
  res.status(201);
  sendSession(req, res, await authService.register(req.body));
}

export async function login(req: Request, res: Response) {
  sendSession(req, res, await authService.login(req.body));
}

export async function changePassword(req: Request, res: Response) {
  sendSession(req, res, await authService.changePassword(req.user!.id, req.body));
}

export async function resetPassword(req: Request, res: Response) {
  res.json({ data: await authService.resetPassword({ id: req.user!.id, role: req.user!.role, ip: req.ip ?? null }, req.body.phone) });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken;
  sendSession(req, res, await authService.refresh(String(token ?? '')));
}

export async function me(req: Request, res: Response) {
  res.json({ data: await authService.me(req.user!.id) });
}

export async function updateMe(req: Request, res: Response) {
  res.json({ data: await authService.updateMe(req.user!.id, req.body) });
}

/** Revokes the refresh token (cookie or body) and clears both cookies. */
export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken;
  if (token) await revokeRefreshToken(String(token));
  res.clearCookie(ACCESS_COOKIE, { ...cookieBase, path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...cookieBase, path: '/api/v1/auth' });
  res.json({ data: { ok: true } });
}

export async function registerPushToken(req: Request, res: Response) {
  await pushTokens.register(req.user!.id, req.body.token, req.body.platform);
  res.status(204).end();
}
export async function removePushToken(req: Request, res: Response) {
  await pushTokens.remove(req.user!.id, req.body.token);
  res.status(204).end();
}
