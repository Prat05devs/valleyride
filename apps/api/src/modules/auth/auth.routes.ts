import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { loginLimiter, registerLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { changePasswordSchema, loginSchema, passwordResetSchema, pushTokenSchema, registerSchema, updateMeSchema } from './auth.schema';
import * as ctrl from './auth.controller';

export const authRouter = Router();

authRouter.post('/auth/register', registerLimiter, validate({ body: registerSchema }), ctrl.register);
authRouter.post('/auth/login', validate({ body: loginSchema }), loginLimiter, ctrl.login);
authRouter.post('/auth/refresh', ctrl.refresh);
authRouter.post('/auth/logout', ctrl.logout);
authRouter.get('/me', authenticate, ctrl.me);
authRouter.patch('/me', authenticate, validate({ body: updateMeSchema }), ctrl.updateMe);
authRouter.post('/me/password', authenticate, validate({ body: changePasswordSchema }), ctrl.changePassword);
authRouter.post('/admin/users/password-reset', authenticate, authorize('staff'), validate({ body: passwordResetSchema }), ctrl.resetPassword);
authRouter.post('/me/push-tokens', authenticate, validate({ body: pushTokenSchema }), ctrl.registerPushToken);
authRouter.delete('/me/push-tokens', authenticate, validate({ body: pushTokenSchema.pick({ token: true }) }), ctrl.removePushToken);
