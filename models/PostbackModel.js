const sequelize  = require ('./db.js')
const { DataTypes }  = require('sequelize');

const PostbackModel = sequelize.define(
  'postback',
  {
    clickid: { 
      type: DataTypes.STRING,
      unique: true, // Уникальное ограничение
      allowNull: false,
    },
  },
  {
    timestamps: false  // Отключаем временные метки
  });

module.exports = PostbackModel;