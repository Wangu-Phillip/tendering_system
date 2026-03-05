export const APP_NAME = 'BW Procurement System';
export const APP_VERSION = '1.0.0';

export const USER_ROLES = {
  ADMIN: 'admin',
  VENDOR: 'vendor',
  BUYER: 'buyer',
  REVIEWER: 'reviewer',
} as const;

export const TENDER_STATUS = {
  OPEN: 'open',
  CLOSING_SOON: 'closing_soon',
  CLOSED: 'closed',
  AWARDED: 'awarded',
} as const;

export const BID_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  EVALUATED: 'evaluated',
  REJECTED: 'rejected',
  AWARDED: 'awarded',
} as const;

export const CATEGORIES = [
  'Construction',
  'IT & Software',
  'Supplies',
  'Services',
  'Equipment',
  'Consulting',
  'Transport',
  'Other',
] as const;

export const CURRENCIES = ['BWP', 'USD', 'EUR', 'GBP', 'ZAR', 'NGN', 'KES'] as const;

export const EVALUATION_CRITERIA = {
  PRICE: 'price',
  QUALITY: 'quality',
  EXPERIENCE: 'experience',
  COMPLIANCE: 'compliance',
} as const;

export const ITEMS_PER_PAGE = 10;
export const DEADLINE_WARNING_DAYS = 3;
