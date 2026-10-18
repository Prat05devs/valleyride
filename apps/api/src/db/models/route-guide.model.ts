import { DataTypes, Model, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { Photo, RouteDetails, RouteGuideDTO, RouteStop } from '@valleyride/shared';

export class RouteGuide extends Model<InferAttributes<RouteGuide>, InferCreationAttributes<RouteGuide>> {
  declare id: CreationOptional<string>;
  declare slug: string;
  declare title: string;
  declare distanceKm: number;
  declare bodyMd: string;
  declare recommendedModels: CreationOptional<string[]>;
  declare rideTime: CreationOptional<string | null>;
  declare bestTime: CreationOptional<string | null>;
  declare difficulty: CreationOptional<RouteDetails['difficulty']>;
  declare bikeAdvice: CreationOptional<string | null>;
  declare highlights: CreationOptional<string[]>;
  declare stops: CreationOptional<RouteStop[]>;
  declare tips: CreationOptional<string[]>;
  declare cover: CreationOptional<Photo | null>;
  declare mapImage: CreationOptional<string | null>;

  toDTO(): RouteGuideDTO {
    return {
      id: this.id, slug: this.slug, title: this.title, distanceKm: this.distanceKm,
      bodyMd: this.bodyMd, recommendedModels: this.recommendedModels,
      rideTime: this.rideTime ?? null, bestTime: this.bestTime ?? null, difficulty: this.difficulty ?? null, bikeAdvice: this.bikeAdvice ?? null,
      highlights: this.highlights ?? [], stops: this.stops ?? [], tips: this.tips ?? [], cover: this.cover ?? null, mapImage: this.mapImage ?? null,
    };
  }

  static initModel(sequelize: Sequelize) {
    RouteGuide.init({
      id:                { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      slug:              { type: DataTypes.STRING(80), allowNull: false, unique: true },
      title:             { type: DataTypes.STRING(160), allowNull: false },
      distanceKm:        { type: DataTypes.INTEGER, allowNull: false },
      bodyMd:            { type: DataTypes.TEXT, allowNull: false },
      recommendedModels: { type: DataTypes.ARRAY(DataTypes.UUID), allowNull: false, defaultValue: [] },
      rideTime:          { type: DataTypes.STRING(60), allowNull: true },
      bestTime:          { type: DataTypes.STRING(200), allowNull: true },
      difficulty:        { type: DataTypes.STRING(20), allowNull: true },
      bikeAdvice:        { type: DataTypes.TEXT, allowNull: true },
      highlights:        { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      stops:             { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      tips:              { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      cover:             { type: DataTypes.JSONB, allowNull: true },
      mapImage:          { type: DataTypes.STRING(500), allowNull: true },
    }, { sequelize, tableName: 'route_guides', underscored: true });
  }

  static associate(_models: any) {}
}
