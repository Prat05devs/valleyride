import { DataTypes, Model, Op, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export class Coupon extends Model<InferAttributes<Coupon>, InferCreationAttributes<Coupon>> {
  declare code: string;
  declare percentOff: number;
  declare maxUses: number | null;
  declare used: CreationOptional<number>;
  declare validTill: Date | null;
  declare partner: string | null;

  /** A coupon that exists, has not expired and has uses left; otherwise null. */
  static async findValid(code: string): Promise<Coupon | null> {
    return Coupon.findOne({
      where: {
        code: code.toUpperCase(),
        [Op.and]: [
          { [Op.or]: [{ validTill: null }, { validTill: { [Op.gt]: new Date() } }] },
          { [Op.or]: [{ maxUses: null }, { used: { [Op.lt]: Sequelize.col('max_uses') } }] },
        ],
      },
    });
  }

  static initModel(sequelize: Sequelize) {
    Coupon.init({
      code:       { type: DataTypes.STRING(32), primaryKey: true },
      percentOff: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
      maxUses:    { type: DataTypes.INTEGER },
      used:       { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      validTill:  { type: DataTypes.DATE },
      partner:    { type: DataTypes.STRING(80) },
    }, { sequelize, tableName: 'coupons', underscored: true });
  }

  static associate(_models: any) {}
}
