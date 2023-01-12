module.exports = function(sequelize, DataTypes) {
	var OrdersToStafs = sequelize.define('OrdersToStafs', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		}
	}, { timestamps: false });

	OrdersToStafs.associate = function(models) {
		// User_Group.belongsTo(models.Group);
		// User_Group.belongsTo(models.User);
	};

	return OrdersToStafs;
};
