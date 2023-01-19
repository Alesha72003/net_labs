'use strict';

module.exports = function(sequelize, DataTypes) {
	var Message = sequelize.define('Message', {
		text: DataTypes.STRING,
        read: DataTypes.BOOLEAN
	});

	Message.associate = function(models) {
		Message.belongsTo(models.User, {foreignKey: "to"});
        Message.belongsTo(models.User, {foreignKey: "from"});
	};

	return Message;
};
