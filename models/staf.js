'use strict';

module.exports = function(sequelize, DataTypes) {
	const Staf = sequelize.define('Staf', {
        name: DataTypes.STRING,
        photo: DataTypes.STRING,
        price: DataTypes.INTEGER
    });

	Staf.associate = function(models) {
        Staf.belongsToMany(models.Orders, {through: models.OrdersToStaf});
	};

	return Staf;
};
