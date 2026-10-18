import { DataTypes, Model, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { VerificationStatus } from '@valleyride/shared';

export class Investor extends Model<InferAttributes<Investor>, InferCreationAttributes<Investor>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare panMasked: string | null;
  declare bankAccountRef: string | null;
  declare kycStatus: CreationOptional<VerificationStatus>;

  static initModel(sequelize: Sequelize) {
    Investor.init({
      id:             { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      userId:         { type: DataTypes.UUID, allowNull: false, unique: true },
      panMasked:      { type: DataTypes.STRING(12) },
      bankAccountRef: { type: DataTypes.STRING(64) },
      kycStatus:      { type: DataTypes.STRING, allowNull: false, defaultValue: 'PENDING' },
    }, { sequelize, tableName: 'investors', underscored: true });
  }

  static associate(models: any) {
    Investor.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Investor.hasMany(models.Investment, { foreignKey: 'investorId', as: 'investments' });
  }
}
