const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Conversation = sequelize.define(
  'Conversation',
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
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'New Chat',
    },
  },
  {
    tableName: 'conversations',
    timestamps: true,
    indexes: [
      { fields: ['userId', 'updatedAt'] },
    ],
  }
);

Conversation.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Conversation, { foreignKey: 'userId', as: 'conversations' });

module.exports = Conversation;
