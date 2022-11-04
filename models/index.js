'use strict';

var fs        = require('fs');
var path      = require('path');
var { Sequelize, DataTypes } = require('sequelize')
var basename  = path.basename(module.filename);
var env       = process.env.NODE_ENV || 'development';
var config    = require(__dirname + '/../config/config.json')[env];

if (config.use_env_variable) {
  var sequelize = new Sequelize(process.env[config.use_env_variable]);
} else {
  console.log(config)
  var sequelize = new Sequelize(config.database, config.username, config.password, config);
  //var sequelize = new Sequelize('postgres://sc_web:sc_web@alesha72003.ru:5432/web')
}

sequelize.authenticate().then(function (rez) { console.log("Connection established"); }, function (err) { console.log("Connection error", err); });


fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(function(file) {
    require(path.join(__dirname, file))(sequelize, DataTypes);
  });

Object.keys(sequelize.models).forEach(function(modelName) {
  if (sequelize.models[modelName].associate) {
    sequelize.models[modelName].associate(sequelize.models);
  }
});

module.exports = sequelize.models;
