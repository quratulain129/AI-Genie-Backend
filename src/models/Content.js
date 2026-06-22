const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const ContentSession = require('./ContentSession');

const Content = sequelize.define(
  'Content',
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
    sessionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: ContentSession,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.ENUM('text', 'marketing', 'media', 'chat'),
      allowNull: false,
    },
    prompt: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    generatedContent: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    tableName: 'contents',
    timestamps: true,
    indexes: [
      {
        fields: ['userId', 'createdAt'],
      },
      {
        fields: ['type'],
      },
      {
        fields: ['sessionId'],
      },
    ],
  }
);

Content.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Content, { foreignKey: 'userId', as: 'contents' });
Content.belongsTo(ContentSession, { foreignKey: 'sessionId', as: 'session' });
ContentSession.hasMany(Content, { foreignKey: 'sessionId', as: 'contents' });

module.exports = Content;
