/** Enums shared by the API, web and mobile apps. Values match the PostgreSQL enums in apps/api migrations. */

export const ROLES = ['customer', 'staff', 'admin', 'investor'] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ['ACTIVE', 'BLOCKED'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const BOOKING_STATUSES = [
  'PENDING_PAYMENT', 'CONFIRMED', 'ONGOING', 'COMPLETED', 'DEPOSIT_SETTLED', 'CANCELLED', 'EXPIRED',
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Statuses that occupy a vehicle. Mirrors the WHERE clause of the bookings_no_overlap exclusion constraint. */
export const ACTIVE_STATUSES: readonly BookingStatus[] = ['PENDING_PAYMENT', 'CONFIRMED', 'ONGOING'];

export const VEHICLE_CATEGORIES = ['SCOOTER', 'MOTORCYCLE', 'ADVENTURE'] as const;
export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];

export const VEHICLE_STATUSES = ['ACTIVE', 'MAINT', 'RETIRED'] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const VEHICLE_DOCUMENT_TYPES = ['RC', 'INSURANCE', 'PERMIT', 'PUC'] as const;
export type VehicleDocumentType = (typeof VEHICLE_DOCUMENT_TYPES)[number];

export const MAINTENANCE_TYPES = ['SERVICE', 'REPAIR'] as const;
export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number];

export const CUSTOMER_DOCUMENT_TYPES = ['DL', 'AADHAAR', 'PASSPORT'] as const;
export type CustomerDocumentType = (typeof CUSTOMER_DOCUMENT_TYPES)[number];

export const VERIFICATION_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const PAYMENT_KINDS = ['RENTAL', 'DEPOSIT', 'EXTRA', 'REFUND'] as const;
export type PaymentKind = (typeof PAYMENT_KINDS)[number];

export const PAYMENT_STATUSES = ['CREATED', 'CAPTURED', 'FAILED', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const HANDOVER_TYPES = ['PICKUP', 'RETURN'] as const;
export type HandoverType = (typeof HANDOVER_TYPES)[number];

export const INVESTMENT_STRUCTURES = ['amortizing', 'interest_only'] as const;
export type InvestmentStructure = (typeof INVESTMENT_STRUCTURES)[number];

export const INVESTMENT_STATUSES = ['DRAFT', 'ACTIVE', 'CLOSED'] as const;
export type InvestmentStatus = (typeof INVESTMENT_STATUSES)[number];

export const REPAYMENT_STATUSES = ['DUE', 'PAID', 'LATE'] as const;
export type RepaymentStatus = (typeof REPAYMENT_STATUSES)[number];

/** Times are stored in UTC and shown in this zone. */
export const DISPLAY_TIMEZONE = 'Asia/Kolkata';
