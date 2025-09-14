// models/Message.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Message = sequelize.define("Message", {
  message_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  sender_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  receiver_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  message_type: {
    type: DataTypes.ENUM("text", "image", "file"),
    defaultValue: "text",
  },
  attachment_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "messages",
  timestamps: false, // we manually handle created_at
  indexes: [
    { fields: ["sender_id"] },
    { fields: ["receiver_id", "is_read"] },
  ],
});


export default Message;
