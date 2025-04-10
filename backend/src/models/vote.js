import { Model, DataTypes } from 'sequelize';

export function createVoteModel(sequelize) {
  class Vote extends Model {}

  Vote.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false
    },
    story: {
      type: DataTypes.STRING,
      allowNull: false
    },
    revealed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Vote'
  });

  return Vote;
}
