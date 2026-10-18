import { DataTypes, Model, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export class Review extends Model<InferAttributes<Review>, InferCreationAttributes<Review>> {
  declare id: CreationOptional<string>;
  declare bookingId: string;
  declare userId: string;
  declare rating: number;
  declare tags: CreationOptional<string[]>;
  declare comment: string | null;
  declare createdAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize) {
    Review.init({
      id:        { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      bookingId: { type: DataTypes.UUID, allowNull: false, unique: true },
      userId:    { type: DataTypes.UUID, allowNull: false },
      rating:    { type: DataTypes.SMALLINT, allowNull: false },
      tags:      { type: DataTypes.ARRAY(DataTypes.STRING(40)), allowNull: false, defaultValue: [] },
      comment:   { type: DataTypes.TEXT },
      createdAt: DataTypes.DATE,
    }, { sequelize, tableName: 'reviews', underscored: true });
  }

  static associate(models: any) {
    Review.belongsTo(models.Booking, { foreignKey: 'bookingId', as: 'booking' });
    Review.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}
