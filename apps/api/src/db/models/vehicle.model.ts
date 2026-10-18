import { DataTypes, Model, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { VehicleStatus } from '@valleyride/shared';

export class Vehicle extends Model<InferAttributes<Vehicle>, InferCreationAttributes<Vehicle>> {
  declare id: CreationOptional<string>;
  declare vehicleModelId: string;
  declare registrationNo: string;
  declare homeLocationId: string;
  declare status: CreationOptional<VehicleStatus>;
  declare odometerKm: CreationOptional<number>;
  declare purchasedOn: string | null;

  static initModel(sequelize: Sequelize) {
    Vehicle.init({
      id:             { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      vehicleModelId: { type: DataTypes.UUID, allowNull: false },
      registrationNo: { type: DataTypes.STRING(20), allowNull: false, unique: true },
      homeLocationId: { type: DataTypes.UUID, allowNull: false },
      status:         { type: DataTypes.STRING, allowNull: false, defaultValue: 'ACTIVE' },
      odometerKm:     { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      purchasedOn:    { type: DataTypes.DATEONLY },
    }, { sequelize, tableName: 'vehicles', underscored: true });
  }

  static associate(models: any) {
    Vehicle.belongsTo(models.VehicleModel, { foreignKey: 'vehicleModelId', as: 'model' });
    Vehicle.belongsTo(models.Location, { foreignKey: 'homeLocationId', as: 'homeLocation' });
    Vehicle.hasMany(models.Booking, { foreignKey: 'vehicleId', as: 'bookings' });
    Vehicle.hasMany(models.VehicleDocument, { foreignKey: 'vehicleId', as: 'documents' });
    Vehicle.hasMany(models.MaintenanceRecord, { foreignKey: 'vehicleId', as: 'maintenance' });
  }
}
