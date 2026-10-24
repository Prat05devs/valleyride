import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findByPk, verifyAccessToken } = vi.hoisted(() => ({ findByPk: vi.fn(), verifyAccessToken: vi.fn() }));
vi.mock('../../src/db', () => ({ User: { findByPk } }));
vi.mock('../../src/modules/auth/tokens', () => ({ ACCESS_COOKIE: 'vr_access', verifyAccessToken }));

import { authenticate, authorize } from '../../src/middleware/auth';

const res = {} as Response;
const request = (bearer = true) => ({
  get: () => bearer ? 'Bearer signed-token' : undefined,
  cookies: bearer ? {} : { vr_access: 'signed-token' },
} as unknown as Request);

beforeEach(() => {
  vi.resetAllMocks();
  verifyAccessToken.mockReturnValue({ sub: 'user-id', role: 'customer' });
  findByPk.mockResolvedValue({ id: 'user-id', role: 'admin', status: 'ACTIVE' });
});

describe('current account permissions', () => {
  it.each([true, false])('allows a promoted admin with an older token (Bearer: %s)', async (bearer) => {
    const req = request(bearer);
    const next = vi.fn();
    await authenticate(req, res, next);
    authorize('admin')(req, res, next);
    expect(req.user).toEqual({ id: 'user-id', role: 'admin' });
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('removes admin access immediately after demotion despite an admin token', async () => {
    verifyAccessToken.mockReturnValue({ sub: 'user-id', role: 'admin' });
    findByPk.mockResolvedValue({ id: 'user-id', role: 'customer', status: 'ACTIVE' });
    const req = request();
    await authenticate(req, res, vi.fn());
    expect(() => authorize('admin')(req, res, vi.fn())).toThrow('You do not have access');
  });

  it('rejects a blocked account even with a valid admin token', async () => {
    findByPk.mockResolvedValue({ id: 'user-id', role: 'admin', status: 'BLOCKED' });
    await expect(authenticate(request(), res, vi.fn())).rejects.toMatchObject({ status: 403, code: 'ACCOUNT_BLOCKED' });
  });

  it('rejects a deleted account', async () => {
    findByPk.mockResolvedValue(null);
    await expect(authenticate(request(), res, vi.fn())).rejects.toMatchObject({ status: 401, code: 'TOKEN_INVALID' });
  });

  it('rejects an invalid token before looking up an account', async () => {
    verifyAccessToken.mockImplementation(() => { throw new Error('Invalid signature'); });
    await expect(authenticate(request(), res, vi.fn())).rejects.toMatchObject({ status: 401, code: 'TOKEN_INVALID' });
    expect(findByPk).not.toHaveBeenCalled();
  });

  it('preserves database errors instead of misreporting an invalid token', async () => {
    findByPk.mockRejectedValue(new Error('Database unavailable'));
    await expect(authenticate(request(), res, vi.fn())).rejects.toThrow('Database unavailable');
  });
});
