const { Sequelize} = require('sequelize');
module.exports =  new Sequelize({
  dialect: 'sqlite',
  storage: 'buyers.db',
  // logging: (...msg) => console.log(msg)
});