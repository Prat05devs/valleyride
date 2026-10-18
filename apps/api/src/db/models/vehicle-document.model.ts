import { DataTypes, Model, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { VehicleDocumentType } from '@valleyride/shared';

export class VehicleDocument extends Model<InferAttributes<VehicleDocument>, InferCreationAttributes<VehicleDocument>> {
  declare id: CreationOptional<string>;
  declare vehicleId: string;
  declare type: VehicleDocumentType;
  declare number: string;
  declare expiresOn: string | null;
  declare fileKey: string | null;

  static initModel(sequelize: Sequelize) {
    VehicleDocument.init({
      id:        { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      vehicleId: { type: DataTypes.UUID, allowNull: false },
      type:      { type: DataTypes.STRING, allowNull: false },
      number:    { type: DataTypes.STRING(64), allowNull: false },
      expiresOn: { type: DataTypes.DATEONLY },
      fileKey:   { type: DataTypes.TEXT },
    }, { sequelize, tableName: 'vehicle_documents', underscored: true });
  }

  static associate(models: any) {
    VehicleDocument.belongsTo(models.Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
  }
}
