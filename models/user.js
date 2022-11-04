'use strict';

module.exports = function(sequelize, DataTypes) {
	var User = sequelize.define('User', {
		username: DataTypes.STRING,
		passwordhash: DataTypes.STRING
	});

	User.associate = function(models) {
		User.belongsToMany(models.Group, {through: models.User_Group});
	};

	return User;
};
