import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

// BookingReview Model - Đánh giá booking
const BookingReview = sequelize.define(
  "BookingReview",
  {
    // ID đánh giá (Primary Key)
    review_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },

    // ID booking được đánh giá
    booking_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      unique: true,
    },

    // Điểm đánh giá (1-5 sao)
    rating: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },

    // Nội dung đánh giá
    review_content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Thời gian tạo
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    // Thời gian cập nhật
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "BookingReview",
    tableName: "booking_reviews",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default BookingReview;
