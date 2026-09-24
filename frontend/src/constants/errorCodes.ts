import { ActivityCategory } from './activity';
import { GoalStatus } from './goal';
import { ReductionUnit } from './reduction';

export const ErrorCodes = {
  AUTH_TOKEN_MISSING: 'AUTH_TOKEN_MISSING',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  RBAC_ROLE_DENIED: 'RBAC_ROLE_DENIED',
  USER_EMAIL_DUPLICATE: 'USER_EMAIL_DUPLICATE',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ACTIVITY_CATEGORY_INVALID: `ACTIVITY_CATEGORY_INVALID:${Object.values(ActivityCategory).join('|')}`,
  GOAL_STATUS_INVALID: `GOAL_STATUS_INVALID:${Object.values(GoalStatus).join('|')}`,
  REDUCTION_UNIT_INVALID: `REDUCTION_UNIT_INVALID:${Object.values(ReductionUnit).join('|')}`,
  REDUCTION_DUPLICATE: 'REDUCTION_DUPLICATE',
  REDUCTION_NOT_FOUND: 'REDUCTION_NOT_FOUND',
  DATABASE_FAILED: 'DATABASE_FAILED'
} as const;

