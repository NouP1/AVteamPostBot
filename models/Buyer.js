const sequelize  = require ('./db.js')
const {DataTypes}  = require('sequelize');

const BuyerModel = sequelize.define(
  'users',
  {
    id: { 
      type: DataTypes.INTEGER,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    nameBuyer: {
      type: DataTypes.STRING,
      defaultValue: 0,

    },
     countRevenue: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
     
    },
    countFirstdeps: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
    {
      timestamps: false  // Отключаем временные метки
    });
    



module.exports = BuyerModel;