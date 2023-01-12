'use strict';

module.exports = function(sequelize, DataTypes) {
	const Orders = sequelize.define('Orders', {
    });

	Orders.associate = function(models) {
		//Orders.belongsTo(models.Client);
        Orders.belongsToMany(models.Staf, {through: models.OrdersToStaf});
	};

	return Orders;
};
