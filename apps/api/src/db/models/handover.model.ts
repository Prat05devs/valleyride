import { DataTypes, Model, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { HandoverType, ReturnCharges } from '@valleyride/shared';

export class Handover extends Model<InferAttributes<Handover>, InferCreationAttributes<Handover>> {
  declare id: CreationOptional<string>;
  declare bookingId: string;
  declare type: HandoverType;
  declare odometerKm: number;
  declare fuelLevel: number | null;
  declare photos: CreationOptional<{ key: string; label: string }[]>;
  declare damageNotes: string | null;
  declare agreementFileKey: string | null;
  declare staffId: string;
  declare signedAt: Date | null;
  declare emergencyContact: { name: string; phone: string; relationship: string } | null;
  declare checklist: { helmetsReturned: boolean; documentsReturned: boolean } | null;
  declare charges: ReturnCharges | null;
  declare createdAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize) {
    Handover.init({
      id:               { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      bookingId:        { type: DataTypes.UUID, allowNull: false },
      type:             { type: DataTypes.STRING, allowNull: false },
      odometerKm:       { type: DataTypes.INTEGER, allowNull: false },
      fuelLevel:        { type: DataTypes.SMALLINT },
      photos:           { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      damageNotes:      { type: DataTypes.TEXT },
      agreementFileKey: { type: DataTypes.TEXT },
      staffId:          { type: DataTypes.UUID, allowNull: false },
      signedAt:         { type: DataTypes.DATE },
      emergencyContact: { type: DataTypes.JSONB },
      checklist:        { type: DataTypes.JSONB },
      charges:          { type: DataTypes.JSONB },
      createdAt:        DataTypes.DATE,
    }, { sequelize, tableName: 'handovers', underscored: true });
  }

  static associate(models: any) {
    Handover.belongsTo(models.Booking, { foreignKey: 'bookingId', as: 'booking' });
    Handover.belongsTo(models.User, { foreignKey: 'staffId', as: 'staff' });
  }
}
