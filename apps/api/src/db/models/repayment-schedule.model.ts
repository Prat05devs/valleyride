import { DataTypes, Model, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { RepaymentStatus } from '@valleyride/shared';

export class RepaymentSchedule extends Model<InferAttributes<RepaymentSchedule>, InferCreationAttributes<RepaymentSchedule>> {
  declare id: CreationOptional<string>;
  declare investmentId: string;
  declare installmentNo: number;
  declare dueDate: string;
  declare principalPaise: number;
  declare interestPaise: number;
  declare status: CreationOptional<RepaymentStatus>;
  declare paidAt: Date | null;
  declare txnRef: string | null;

  static initModel(sequelize: Sequelize) {
    RepaymentSchedule.init({
      id:             { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      investmentId:   { type: DataTypes.UUID, allowNull: false },
      installmentNo:  { type: DataTypes.INTEGER, allowNull: false },
      dueDate:        { type: DataTypes.DATEONLY, allowNull: false },
      principalPaise: { type: DataTypes.BIGINT, allowNull: false },
      interestPaise:  { type: DataTypes.BIGINT, allowNull: false },
      status:         { type: DataTypes.STRING, allowNull: false, defaultValue: 'DUE' },
      paidAt:         { type: DataTypes.DATE },
      txnRef:         { type: DataTypes.STRING(64) },
    }, { sequelize, tableName: 'repayment_schedules', underscored: true });
  }

  static associate(models: any) {
    RepaymentSchedule.belongsTo(models.Investment, { foreignKey: 'investmentId', as: 'investment' });
  }
}
