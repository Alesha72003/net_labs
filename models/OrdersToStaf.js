module.exports = function(sequelize, DataTypes) {
	var OrdersToStaf = sequelize.define('OrdersToStaf', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		}
	}, { timestamps: false });

	OrdersToStaf.associate = function(models) {
		// User_Group.belongsTo(models.Group);
		// User_Group.belongsTo(models.User);
	};

	return OrdersToStaf;
};
