import { DataTypes, Model, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { InvestmentStatus, InvestmentStructure } from '@valleyride/shared';

export class Investment extends Model<InferAttributes<Investment>, InferCreationAttributes<Investment>> {
  declare id: CreationOptional<string>;
  declare investorId: string;
  declare principalPaise: number;
  declare annualRatePct: number;
  declare tenureMonths: number;
  declare structure: InvestmentStructure;
  declare startDate: string;
  declare agreementFileKey: string | null;
  declare status: CreationOptional<InvestmentStatus>;

  static initModel(sequelize: Sequelize) {
    Investment.init({
      id:               { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      investorId:       { type: DataTypes.UUID, allowNull: false },
      principalPaise:   { type: DataTypes.BIGINT, allowNull: false },
      annualRatePct:    { type: DataTypes.DECIMAL(5, 2), allowNull: false },
      tenureMonths:     { type: DataTypes.INTEGER, allowNull: false },
      structure:        { type: DataTypes.STRING, allowNull: false },
      startDate:        { type: DataTypes.DATEONLY, allowNull: false },
      agreementFileKey: { type: DataTypes.TEXT },
      status:           { type: DataTypes.STRING, allowNull: false, defaultValue: 'DRAFT' },
    }, { sequelize, tableName: 'investments', underscored: true });
  }

  static associate(models: any) {
    Investment.belongsTo(models.Investor, { foreignKey: 'investorId', as: 'investor' });
    Investment.hasMany(models.RepaymentSchedule, { foreignKey: 'investmentId', as: 'schedule' });
  }
}
