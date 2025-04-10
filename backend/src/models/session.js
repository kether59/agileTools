import { Model, DataTypes } from 'sequelize';
import { sequelize } from './index.js';

export function createSessionModel(sequelize) {
  class Session extends Model {}

  Session.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'voting', 'revealed', 'closed'),
      defaultValue: 'active'
    },
    currentStory: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    votingScale: {
      type: DataTypes.STRING,
      defaultValue: '0,1,2,3,5,8,13,21,?',
      get() {
        return this.getDataValue('votingScale').split(',');
      },
      set(val) {
        this.setDataValue('votingScale', Array.isArray(val) ? val.join(',') : val);
      }
    }
  }, {
    sequelize,
    modelName: 'Session'
  });

  return Session;
}
