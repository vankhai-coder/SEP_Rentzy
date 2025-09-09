// models/Message.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";


const Message = sequelize.define(
  "Message",
  {
    message_id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    booking_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    sender_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    receiver_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
  },
  { tableName: "messages" }
);

export default Message;
