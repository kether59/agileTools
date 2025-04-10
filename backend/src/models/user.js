import { Model, DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';

export function createUserModel(sequelize) {
  class User extends Model {
    static async hashPassword(password) {
      return bcrypt.hash(password, 10);
    }

    async validatePassword(password) {
      return bcrypt.compare(password, this.password);
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('user', 'moderator', 'admin'),
      defaultValue: 'user'
    }
  }, {
    sequelize,
    modelName: 'User',
    hooks: {
      beforeCreate: async (user) => {
        user.password = await User.hashPassword(user.password);
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await User.hashPassword(user.password);
        }
      }
    }
  });

  return User;
}
