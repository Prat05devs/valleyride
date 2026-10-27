import {
  DataTypes, Model, Sequelize,
  InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey,
} from 'sequelize';
import type { BookingDTO, BookingStatus } from '@valleyride/shared';
import type { User } from './user.model';
import type { Vehicle } from './vehicle.model';

export class Booking extends Model<InferAttributes<Booking>, InferCreationAttributes<Booking>> {
  declare id: CreationOptional<string>;
  declare code: string;
  declare userId: ForeignKey<User['id']>;
  declare vehicleId: ForeignKey<Vehicle['id']>;
  declare vehicleModelId: string;
  declare pickupLocationId: string;
  declare returnLocationId: string;
  declare startAt: Date;
  declare endAt: Date;
  declare status: CreationOptional<BookingStatus>;
  declare holdExpiresAt: Date | null;
  declare billableDays: number;
  declare kmIncluded: number;
  declare rentalPaise: number;
  declare discountPaise: CreationOptional<number>;
  declare feesPaise: CreationOptional<number>;
  declare taxPaise: number;
  declare depositPaise: number;
  declare totalPaise: number;
  declare couponCode: string | null;
  declare tierPct: CreationOptional<number>;
  declare clientRequestKey: CreationOptional<string | null>;
  declare clientRequestHash: CreationOptional<string | null>;

  toDTO(): BookingDTO {
    return {
      id: this.id, code: this.code, status: this.status,
      vehicleModelId: this.vehicleModelId, pickupLocationId: this.pickupLocationId, returnLocationId: this.returnLocationId,
      startAt: this.startAt.toISOString(), endAt: this.endAt.toISOString(),
      holdExpiresAt: this.holdExpiresAt ? this.holdExpiresAt.toISOString() : null,
      billableDays: this.billableDays, kmIncluded: this.kmIncluded,
      rentalPaise: Number(this.rentalPaise), discountPaise: Number(this.discountPaise), feesPaise: Number(this.feesPaise),
      taxPaise: Number(this.taxPaise), depositPaise: Number(this.depositPaise), totalPaise: Number(this.totalPaise),
      couponCode: this.couponCode, tierPct: Number(this.tierPct ?? 0),
    };
  }

  static initModel(sequelize: Sequelize) {
    Booking.init({
      id:               { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      code:             { type: DataTypes.STRING(12), allowNull: false, unique: true },
      vehicleModelId:   { type: DataTypes.UUID, allowNull: false },
      pickupLocationId: { type: DataTypes.UUID, allowNull: false },
      returnLocationId: { type: DataTypes.UUID, allowNull: false },
      startAt:          { type: DataTypes.DATE, allowNull: false },
      endAt:            { type: DataTypes.DATE, allowNull: false },
      status:           { type: DataTypes.STRING, allowNull: false, defaultValue: 'PENDING_PAYMENT' },
      holdExpiresAt:    { type: DataTypes.DATE },
      billableDays:     { type: DataTypes.INTEGER, allowNull: false },
      kmIncluded:       { type: DataTypes.INTEGER, allowNull: false },
      rentalPaise:      { type: DataTypes.BIGINT, allowNull: false, get() { return Number(this.getDataValue('rentalPaise')); } },
      discountPaise:    { type: DataTypes.BIGINT, defaultValue: 0 },
      feesPaise:        { type: DataTypes.BIGINT, defaultValue: 0 },
      taxPaise:         { type: DataTypes.BIGINT, allowNull: false },
      depositPaise:     { type: DataTypes.BIGINT, allowNull: false },
      totalPaise:       { type: DataTypes.BIGINT, allowNull: false },
      couponCode:       { type: DataTypes.STRING(32) },
      tierPct:          { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      clientRequestKey: { type: DataTypes.STRING(100), allowNull: true },
      clientRequestHash: { type: DataTypes.STRING(64), allowNull: true },
    }, { sequelize, tableName: 'bookings', underscored: true });
  }

  static associate(models: any) {
    Booking.belongsTo(models.User, { foreignKey: 'userId', as: 'customer' });
    Booking.belongsTo(models.Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
    Booking.belongsTo(models.VehicleModel, { foreignKey: 'vehicleModelId', as: 'model' });
    Booking.hasMany(models.Payment, { foreignKey: 'bookingId', as: 'payments' });
    Booking.hasMany(models.Handover, { foreignKey: 'bookingId', as: 'handovers' });
  }
}
