import { DataTypes, Model, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { Role, UserStatus } from '@valleyride/shared';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare role: CreationOptional<Role>;
  declare fullName: string | null;
  declare phone: string;
  declare email: string | null;
  declare phoneVerifiedAt: Date | null;
  /** scrypt hash; null until the person sets a password (or staff reset it). Never sent to clients. */
  declare passwordHash: CreationOptional<string | null>;
  declare status: CreationOptional<UserStatus>;

  static initModel(sequelize: Sequelize) {
    User.init({
      id:              { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      role:            { type: DataTypes.STRING, allowNull: false, defaultValue: 'customer' },
      fullName:        { type: DataTypes.STRING(120) },
      phone:           { type: DataTypes.STRING(15), allowNull: false, unique: true },
      email:           { type: DataTypes.CITEXT },
      phoneVerifiedAt: { type: DataTypes.DATE },
      passwordHash:    { type: DataTypes.STRING(200) },
      status:          { type: DataTypes.STRING, allowNull: false, defaultValue: 'ACTIVE' },
    }, { sequelize, tableName: 'users', underscored: true });
  }

  static associate(models: any) {
    User.hasMany(models.Booking, { foreignKey: 'userId', as: 'bookings' });
    User.hasMany(models.CustomerDocument, { foreignKey: 'userId', as: 'documents' });
    User.hasOne(models.Investor, { foreignKey: 'userId', as: 'investor' });
  }
}
