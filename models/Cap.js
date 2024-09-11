const sequelize  = require ('../db.js')
const {DataTypes}  = require('sequelize');

const CapModel = sequelize.define(
  'caps',
  {
    id: { 
      type: DataTypes.INTEGER,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    nameCap: {
      type: DataTypes.STRING,
      defaultValue: 0,
    },
     countCap: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
     
    },
    fullCap: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    }
  },
  {
    timestamps: false  // Отключаем временные метки
  });
   

module.exports = CapModel;