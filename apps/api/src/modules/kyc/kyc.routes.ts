import { Router } from 'express';
import { z } from 'zod';
import { presignUploadSchema, reviewDocumentSchema, submitDocumentSchema, uuid } from '@valleyride/shared';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as ctrl from './kyc.controller';

export const kycRouter = Router();
const docParams = z.object({ docId: uuid });

kycRouter.post('/kyc/documents/presign', authenticate, authorize('customer'), validate({ body: presignUploadSchema }), ctrl.presign);
kycRouter.post('/kyc/documents', authenticate, authorize('customer'), validate({ body: submitDocumentSchema }), ctrl.submit);
kycRouter.get('/kyc/documents', authenticate, ctrl.listMine);

kycRouter.get('/admin/kyc', authenticate, authorize('staff'), validate({ query: z.object({ status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional() }) }), ctrl.queue);
kycRouter.get('/admin/kyc/:docId/file', authenticate, authorize('staff'), validate({ params: docParams }), ctrl.fileLink);
kycRouter.patch('/admin/kyc/:docId', authenticate, authorize('staff'), validate({ params: docParams, body: reviewDocumentSchema }), ctrl.review);
