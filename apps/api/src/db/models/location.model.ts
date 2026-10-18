import { DataTypes, Model, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { LocationDTO } from '@valleyride/shared';

export class Location extends Model<InferAttributes<Location>, InferCreationAttributes<Location>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare city: string;
  declare address: string;
  declare lat: number | null;
  declare lng: number | null;
  declare openHours: Record<string, string> | null;
  declare isActive: CreationOptional<boolean>;

  toDTO(): LocationDTO {
    return { id: this.id, name: this.name, city: this.city, address: this.address, lat: this.lat, lng: this.lng, openHours: this.openHours };
  }

  static initModel(sequelize: Sequelize) {
    Location.init({
      id:        { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      name:      { type: DataTypes.STRING(120), allowNull: false },
      city:      { type: DataTypes.STRING(60), allowNull: false },
      address:   { type: DataTypes.TEXT, allowNull: false },
      lat:       { type: DataTypes.DECIMAL(9, 6) },
      lng:       { type: DataTypes.DECIMAL(9, 6) },
      openHours: { type: DataTypes.JSONB },
      isActive:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    }, { sequelize, tableName: 'locations', underscored: true });
  }

  static associate(models: any) {
    Location.hasMany(models.Vehicle, { foreignKey: 'homeLocationId', as: 'vehicles' });
  }
}
