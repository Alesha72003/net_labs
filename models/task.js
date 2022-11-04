'use strict';

module.exports = function(sequelize, DataTypes) {
	const Task = sequelize.define('Task', {
        taskname: DataTypes.STRING,
        description: DataTypes.STRING,
		// creationdate: DataTypes.DATE,
		// modification_date: DataTypes.DATE,
		deadlineAt: DataTypes.DATE,
		status: DataTypes.ENUM(["NEW", "IN WORK", "COMPLETED", "DELETED"])
    });

	Task.associate = function(models) {
		Task.belongsTo(models.Group);
	};

	return Task;
};
