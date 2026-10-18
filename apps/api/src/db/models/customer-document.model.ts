import { DataTypes, Model, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { CustomerDocumentType, VerificationStatus } from '@valleyride/shared';

/** Files live in private S3; only the masked number is stored here (last 4 digits of Aadhaar). */
export class CustomerDocument extends Model<InferAttributes<CustomerDocument>, InferCreationAttributes<CustomerDocument>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare type: CustomerDocumentType;
  declare numberMasked: string;
  declare fileKey: string;
  declare status: CreationOptional<VerificationStatus>;
  declare verifiedBy: string | null;
  declare verifiedAt: Date | null;

  static initModel(sequelize: Sequelize) {
    CustomerDocument.init({
      id:           { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      userId:       { type: DataTypes.UUID, allowNull: false },
      type:         { type: DataTypes.STRING, allowNull: false },
      numberMasked: { type: DataTypes.STRING(32), allowNull: false },
      fileKey:      { type: DataTypes.TEXT, allowNull: false },
      status:       { type: DataTypes.STRING, allowNull: false, defaultValue: 'PENDING' },
      verifiedBy:   { type: DataTypes.UUID },
      verifiedAt:   { type: DataTypes.DATE },
    }, { sequelize, tableName: 'customer_documents', underscored: true });
  }

  static associate(models: any) {
    CustomerDocument.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    CustomerDocument.belongsTo(models.User, { foreignKey: 'verifiedBy', as: 'verifier' });
  }
}
