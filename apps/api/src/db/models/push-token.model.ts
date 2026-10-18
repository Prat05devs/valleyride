import { DataTypes, Model, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

/** Expo push token per device (Phase 3 apps). */
export class PushToken extends Model<InferAttributes<PushToken>, InferCreationAttributes<PushToken>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare token: string;
  declare platform: string;

  static initModel(sequelize: Sequelize) {
    PushToken.init({
      id:       { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      userId:   { type: DataTypes.UUID, allowNull: false },
      token:    { type: DataTypes.STRING(200), allowNull: false, unique: true },
      platform: { type: DataTypes.STRING(10), allowNull: false },
    }, { sequelize, tableName: 'push_tokens', underscored: true });
  }

  static associate(models: any) {
    PushToken.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}
