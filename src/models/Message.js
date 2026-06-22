const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Conversation = require('./Conversation');

const Message = sequelize.define(
  'Message',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Conversation,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    role: {
      type: DataTypes.ENUM('user', 'assistant'),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: 'messages',
    timestamps: true,
    indexes: [
      { fields: ['conversationId', 'createdAt'] },
    ],
  }
);

Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });

module.exports = Message;
