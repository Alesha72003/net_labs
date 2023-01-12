'use strict';

module.exports = function(sequelize, DataTypes) {
	const Stafs = sequelize.define('Stafs', {
        name: DataTypes.STRING,
        photo: DataTypes.STRING,
        price: DataTypes.INTEGER
    });

	Stafs.associate = function(models) {
        Stafs.belongsToMany(models.Orders, {through: models.OrdersToStafs});
	};

	return Stafs;
};
