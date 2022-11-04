'use strict';

module.exports = function(sequelize, DataTypes) {
	const Group = sequelize.define('Group', {
        name: DataTypes.STRING
    });

	Group.associate = function(models) {
		Group.belongsToMany(models.User, {through: models.User_Group});
		//Group.hasMany(models.User, {through: 'User_Groups'});
        Group.hasMany(models.Task);
	};

	return Group;
};
