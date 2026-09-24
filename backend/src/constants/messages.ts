export const Messages = {
  USER_CREATED: 'User created and demo CarbonTrack session opened',
  USER_LOGIN_OK: 'User login accepted',
  USER_PROFILE_UPDATED: 'User profile saved',
  ACTIVITY_CREATED: 'Activity carbon value calculated and stored',
  ACTIVITY_UPDATED: 'Activity carbon record updated',
  ACTIVITY_DELETED: 'Activity removed from carbon ledger',
  GOAL_CREATED: 'Goal created and progress linked to activities',
  GOAL_UPDATED: 'Goal status updated',
  REDUCTION_CREATED: 'Reduction measure stored in reduction ledger',
  REDUCTION_UPDATED: 'Reduction record adjusted and re-aggregated by new record_date',
  REDUCTION_DELETED: 'Reduction removed from reduction ledger',
  FACTOR_CREATED: 'Carbon factor stored for region matching',
  AUDIT_LOGGED: 'Audit log captured',
  BACKEND_SHARED: 'Shared backend/frontend copy used by coupled message constants'
} as const;
