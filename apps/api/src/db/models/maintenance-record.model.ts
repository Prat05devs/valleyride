import { DataTypes, Model, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { MaintenanceType } from '@valleyride/shared';

export class MaintenanceRecord extends Model<InferAttributes<MaintenanceRecord>, InferCreationAttributes<MaintenanceRecord>> {
  declare id: CreationOptional<string>;
  declare vehicleId: string;
  declare type: MaintenanceType;
  declare odometerKm: number;
  declare costPaise: CreationOptional<number>;
  declare performedOn: string;
  declare notes: string | null;

  static initModel(sequelize: Sequelize) {
    MaintenanceRecord.init({
      id:          { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      vehicleId:   { type: DataTypes.UUID, allowNull: false },
      type:        { type: DataTypes.STRING, allowNull: false },
      odometerKm:  { type: DataTypes.INTEGER, allowNull: false },
      costPaise:   { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
      performedOn: { type: DataTypes.DATEONLY, allowNull: false },
      notes:       { type: DataTypes.TEXT },
    }, { sequelize, tableName: 'maintenance_records', underscored: true });
  }

  static associate(models: any) {
    MaintenanceRecord.belongsTo(models.Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
  }
}
