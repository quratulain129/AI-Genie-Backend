const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const ContentSession = sequelize.define(
  'ContentSession',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.ENUM('text', 'marketing', 'media'),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'New Session',
    },
  },
  {
    tableName: 'content_sessions',
    timestamps: true,
    indexes: [
      { fields: ['userId', 'type', 'updatedAt'] },
    ],
  }
);

ContentSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(ContentSession, { foreignKey: 'userId', as: 'contentSessions' });

module.exports = ContentSession;
