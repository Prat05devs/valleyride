import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { otpLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { otpRequestSchema, otpVerifySchema, pushTokenSchema, updateMeSchema } from './auth.schema';
import * as ctrl from './auth.controller';

export const authRouter = Router();

authRouter.post('/auth/otp/request', validate({ body: otpRequestSchema }), otpLimiter, ctrl.requestOtp);
authRouter.post('/auth/otp/verify', validate({ body: otpVerifySchema }), ctrl.verifyOtp);
authRouter.post('/auth/refresh', ctrl.refresh);
authRouter.post('/auth/logout', ctrl.logout);
authRouter.get('/me', authenticate, ctrl.me);
authRouter.patch('/me', authenticate, validate({ body: updateMeSchema }), ctrl.updateMe);
authRouter.post('/me/push-tokens', authenticate, validate({ body: pushTokenSchema }), ctrl.registerPushToken);
authRouter.delete('/me/push-tokens', authenticate, validate({ body: pushTokenSchema.pick({ token: true }) }), ctrl.removePushToken);
