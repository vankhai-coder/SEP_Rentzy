// models/Notification.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";


const Notification = sequelize.define(
  "Notification",
  {
    notification_id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    message: { type: DataTypes.STRING(255), allowNull: false },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "notifications" }
);

export default Notification;
