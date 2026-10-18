import { DataTypes, Model, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

/** Written for every fleet, money and KYC action. */
export class AuditLog extends Model<InferAttributes<AuditLog>, InferCreationAttributes<AuditLog>> {
  declare id: CreationOptional<number>;
  declare actorId: string | null;
  declare action: string;
  declare entity: string;
  declare entityId: string;
  declare diff: unknown;
  declare ip: string | null;

  static initModel(sequelize: Sequelize) {
    AuditLog.init({
      id:       { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      actorId:  { type: DataTypes.UUID },
      action:   { type: DataTypes.STRING(80), allowNull: false },
      entity:   { type: DataTypes.STRING(60), allowNull: false },
      entityId: { type: DataTypes.STRING(64), allowNull: false },
      diff:     { type: DataTypes.JSONB },
      ip:       { type: DataTypes.INET },
    }, { sequelize, tableName: 'audit_logs', underscored: true });
  }

  static associate(models: any) {
    AuditLog.belongsTo(models.User, { foreignKey: 'actorId', as: 'actor' });
  }
}
