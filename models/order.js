'use strict';

module.exports = function(sequelize, DataTypes) {
	const Orders = sequelize.define('Orders', {
    });

	Orders.associate = function(models) {
		//Orders.belongsTo(models.Client);
        Orders.belongsToMany(models.Stafs, {through: models.OrdersToStafs});
	};

	return Orders;
};
