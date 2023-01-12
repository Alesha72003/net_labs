'use strict';

module.exports = function(sequelize, DataTypes) {
	const Client = sequelize.define('Clients', {
		username: DataTypes.STRING,
		passwordhash: DataTypes.STRING
	});

	Client.associate = function(models) {
		Client.hasMany(models.Orders);
	};

	return Client;
};
