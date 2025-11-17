// models/SearchHistory.js (tương tự)
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const SearchHistory = sequelize.define(
  "SearchHistory",
  {
    search_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true, // Allow null cho guest
    },
    search_params: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    results_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "search_histories",
    timestamps: false,
    indexes: [{ fields: ["user_id"] }, { fields: ["created_at"] }],
  }
);

export default SearchHistory;
