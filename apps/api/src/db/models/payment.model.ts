import { DataTypes, Model, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { PaymentKind, PaymentStatus } from '@valleyride/shared';

export class Payment extends Model<InferAttributes<Payment>, InferCreationAttributes<Payment>> {
  declare id: CreationOptional<string>;
  declare bookingId: string;
  declare kind: PaymentKind;
  declare providerOrderId: string | null;
  declare providerPaymentId: string | null;
  declare amountPaise: number;
  declare status: CreationOptional<PaymentStatus>;
  declare idempotencyKey: string | null;
  declare raw: unknown;

  static initModel(sequelize: Sequelize) {
    Payment.init({
      id:                { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      bookingId:         { type: DataTypes.UUID, allowNull: false },
      kind:              { type: DataTypes.STRING, allowNull: false },
      providerOrderId:   { type: DataTypes.STRING(64) },
      providerPaymentId: { type: DataTypes.STRING(64), unique: true },
      amountPaise:       { type: DataTypes.BIGINT, allowNull: false },
      status:            { type: DataTypes.STRING, allowNull: false, defaultValue: 'CREATED' },
      idempotencyKey:    { type: DataTypes.STRING(100), unique: true },
      raw:               { type: DataTypes.JSONB },
    }, { sequelize, tableName: 'payments', underscored: true });
  }

  static associate(models: any) {
    Payment.belongsTo(models.Booking, { foreignKey: 'bookingId', as: 'booking' });
  }
}
