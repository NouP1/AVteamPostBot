const sequelize  = require ('./db.js')
const { DataTypes }  = require('sequelize');

const PostbackModel = sequelize.define(
  'postback',
  {
    clickid: {
      type: DataTypes.STRING,
      allowNull: false,
  },
  status: {
      type: DataTypes.ENUM('sale', 'first_dep'),
      allowNull: false,
  },
}, {
  timestamps: false,
  uniqueKeys: {
      unique_clickid_status: {
          fields: ['clickid', 'status'], // Уникальность пары clickid + status
      },
  },
});

module.exports = PostbackModel;