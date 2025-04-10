import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createUserModel } from './user.js';
import { createSessionModel } from './session.js';
import { createVoteModel } from './vote.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DATABASE_PATH || join(__dirname, '../../data/database.sqlite'),
  logging: false
});

// Create models
export const User = createUserModel(sequelize);
export const Session = createSessionModel(sequelize);
export const Vote = createVoteModel(sequelize);

// Setup associations
User.hasMany(Session, { foreignKey: 'ownerId' });
Session.belongsTo(User, { foreignKey: 'ownerId' });

Session.hasMany(Vote);
Vote.belongsTo(Session);

User.hasMany(Vote);
Vote.belongsTo(User);
