// models/Notification.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { sendToUser } from "../services/wsService.js";

const Notification = sequelize.define("Notification", {
  notification_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  type: {
    type: DataTypes.ENUM("system", "rental", "promotion", "alert"),
    defaultValue: "system",
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "notifications",
  timestamps: false, // we handle created_at / updated_at manually
  indexes: [
    { fields: ["user_id", "is_read"] },
  ],
});

Notification.addHook("afterCreate", async (notification) => {
  try {
    const unreadCount = await Notification.count({ where: { user_id: notification.user_id, is_read: false } });
    sendToUser(notification.user_id, { type: "NOTIFICATIONS_UNREAD_COUNT", data: { unreadCount } });
  } catch {}
});

Notification.addHook("afterUpdate", async (notification) => {
  try {
    const unreadCount = await Notification.count({ where: { user_id: notification.user_id, is_read: false } });
    sendToUser(notification.user_id, { type: "NOTIFICATIONS_UNREAD_COUNT", data: { unreadCount } });
  } catch {}
});

export default Notification;
