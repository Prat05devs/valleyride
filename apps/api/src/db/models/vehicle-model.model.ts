import { DataTypes, Model, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { PricingModel, VehicleCategory, VehicleModelDTO, VehicleSpecs } from '@valleyride/shared';

export class VehicleModel extends Model<InferAttributes<VehicleModel>, InferCreationAttributes<VehicleModel>> {
  declare id: CreationOptional<string>;
  declare slug: string;
  declare name: string;
  declare category: VehicleCategory;
  declare engineCc: number;
  declare priceDayPaise: number;
  declare depositPaise: number;
  declare kmPerDay: number;
  declare extraKmPaise: number;
  declare images: CreationOptional<string[]>;
  declare specs: CreationOptional<VehicleSpecs | null>;

  /** The input packages/shared quote() expects. */
  toPricing(): PricingModel {
    return { pricePerDayPaise: this.priceDayPaise, depositPaise: this.depositPaise, kmPerDay: this.kmPerDay };
  }

  toDTO(): VehicleModelDTO {
    return {
      id: this.id, slug: this.slug, name: this.name, category: this.category, engineCc: this.engineCc,
      pricePerDayPaise: this.priceDayPaise, depositPaise: this.depositPaise, kmPerDay: this.kmPerDay,
      extraKmPaise: this.extraKmPaise, images: this.images, specs: this.specs ?? null,
    };
  }

  static initModel(sequelize: Sequelize) {
    VehicleModel.init({
      id:            { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      slug:          { type: DataTypes.STRING(60), allowNull: false, unique: true },
      name:          { type: DataTypes.STRING(120), allowNull: false },
      category:      { type: DataTypes.STRING, allowNull: false },
      engineCc:      { type: DataTypes.INTEGER, allowNull: false },
      priceDayPaise: { type: DataTypes.BIGINT, allowNull: false },
      depositPaise:  { type: DataTypes.BIGINT, allowNull: false },
      kmPerDay:      { type: DataTypes.INTEGER, allowNull: false },
      extraKmPaise:  { type: DataTypes.BIGINT, allowNull: false },
      images:        { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      specs:         { type: DataTypes.JSONB, allowNull: true },
    }, { sequelize, tableName: 'vehicle_models', underscored: true });
  }

  static associate(models: any) {
    VehicleModel.hasMany(models.Vehicle, { foreignKey: 'vehicleModelId', as: 'vehicles' });
    VehicleModel.hasMany(models.PricingRule, { foreignKey: 'vehicleModelId', as: 'pricingRules' });
  }
}
