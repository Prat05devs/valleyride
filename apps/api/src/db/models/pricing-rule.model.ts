import { DataTypes, Model, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export class PricingRule extends Model<InferAttributes<PricingRule>, InferCreationAttributes<PricingRule>> {
  declare id: CreationOptional<string>;
  declare vehicleModelId: string | null;
  declare minDays: number | null;
  declare discountPct: number | null;
  declare seasonFrom: string | null;
  declare seasonTo: string | null;
  declare multiplier: CreationOptional<number>;

  static initModel(sequelize: Sequelize) {
    PricingRule.init({
      id:             { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      vehicleModelId: { type: DataTypes.UUID },
      minDays:        { type: DataTypes.INTEGER },
      discountPct:    { type: DataTypes.DECIMAL(5, 2) },
      seasonFrom:     { type: DataTypes.DATEONLY },
      seasonTo:       { type: DataTypes.DATEONLY },
      multiplier:     { type: DataTypes.DECIMAL(4, 2), allowNull: false, defaultValue: 1 },
    }, { sequelize, tableName: 'pricing_rules', underscored: true });
  }

  static associate(models: any) {
    PricingRule.belongsTo(models.VehicleModel, { foreignKey: 'vehicleModelId', as: 'model' });
  }
}
