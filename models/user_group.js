module.exports = function(sequelize, DataTypes) {
	var User_Group = sequelize.define('User_Group', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		}
	}, { timestamps: false });

	User_Group.associate = function(models) {
		// User_Group.belongsTo(models.Group);
		// User_Group.belongsTo(models.User);
	};

	return User_Group;
};
