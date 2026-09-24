import { ReductionController } from '../controllers/reductionController';
import { logTemplate } from '../utils/logger';

export const reductionRoutes = [
  'GET /reductions requireAuth filters=start,end',
  'GET /reductions/summary requireAuth',
  'POST /reductions requireAuth audit',
  'PATCH /reductions/:id requireAuth audit',
  'DELETE /reductions/:id requireAuth audit'
];

logTemplate('info', 'REDUCTION_LIST_START', { userId: 0 });
export const reductionRouteControllers = [ReductionController];
