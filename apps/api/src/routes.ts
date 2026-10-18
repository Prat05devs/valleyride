import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes';
import { fleetRouter } from './modules/fleet/fleet.routes';
import { bookingRouter } from './modules/booking/booking.routes';
import { investorRouter } from './modules/investor/investor.routes';
import { contentRouter } from './modules/content/routes-guide.routes';
import { kycRouter } from './modules/kyc/kyc.routes';
import { handoverRouter } from './modules/handover/handover.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { paymentsMocked } from './modules/payment/razorpay.client';
import { paymentDevRouter, paymentRouter } from './modules/payment/payment.dev';
import { filesDevRouter } from './modules/kyc/files.dev';
import { env } from './config/env';

/** Mounted at /api/v1. */
export const apiRouter = Router();

apiRouter.use(authRouter);
apiRouter.use(fleetRouter);
apiRouter.use(bookingRouter);
apiRouter.use(investorRouter);
apiRouter.use(contentRouter);
apiRouter.use(kycRouter);
apiRouter.use(handoverRouter);
apiRouter.use(adminRouter);
apiRouter.use(paymentRouter);
if (paymentsMocked) apiRouter.use(paymentDevRouter);
if (env.STORAGE_DRIVER === 'local') apiRouter.use(filesDevRouter);
