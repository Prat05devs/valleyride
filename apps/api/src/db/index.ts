import pg from 'pg';
import { Sequelize } from 'sequelize';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { User } from './models/user.model';
import { Location } from './models/location.model';
import { VehicleModel } from './models/vehicle-model.model';
import { Vehicle } from './models/vehicle.model';
import { VehicleDocument } from './models/vehicle-document.model';
import { MaintenanceRecord } from './models/maintenance-record.model';
import { Booking } from './models/booking.model';
import { Payment } from './models/payment.model';
import { Handover } from './models/handover.model';
import { CustomerDocument } from './models/customer-document.model';
import { PricingRule } from './models/pricing-rule.model';
import { Coupon } from './models/coupon.model';
import { Investor } from './models/investor.model';
import { Investment } from './models/investment.model';
import { RepaymentSchedule } from './models/repayment-schedule.model';
import { RouteGuide } from './models/route-guide.model';
import { AuditLog } from './models/audit-log.model';
import { Review } from './models/review.model';
import { PushToken } from './models/push-token.model';

// Money is BIGINT paise and stays far below 2^53, so read int8 as a JS number instead of a string.
// NUMERIC is only used for rates, percentages and coordinates, never for money.
pg.types.setTypeParser(20, (v) => Number(v));   // int8 / bigint
pg.types.setTypeParser(1700, (v) => Number(v)); // numeric

export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  logging: env.NODE_ENV === 'development' ? (sql) => logger.debug(sql) : false,
  define: { underscored: true },
  pool: { max: 10, idle: 10_000 },
  ...(env.NODE_ENV === 'production' ? { dialectOptions: { ssl: { require: true, rejectUnauthorized: true } } } : {}),
});

export const models = {
  User, Location, VehicleModel, Vehicle, VehicleDocument, MaintenanceRecord, Booking, Payment, Handover,
  CustomerDocument, PricingRule, Coupon, Investor, Investment, RepaymentSchedule, RouteGuide, AuditLog, Review, PushToken,
};

Object.values(models).forEach((m) => m.initModel(sequelize));
Object.values(models).forEach((m) => m.associate(models));

export {
  User, Location, VehicleModel, Vehicle, VehicleDocument, MaintenanceRecord, Booking, Payment, Handover,
  CustomerDocument, PricingRule, Coupon, Investor, Investment, RepaymentSchedule, RouteGuide, AuditLog, Review, PushToken,
};
