// models/BookingReview.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const BookingReview = sequelize.define("BookingReview", {
  // ID đánh giá (khóa chính)
  review_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  // ID đặt xe được đánh giá
  booking_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    unique: true, // Quan hệ 1-1 với booking
  },
  // Điểm đánh giá (1-5 sao)
  rating: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  // Tiêu đề đánh giá
  review_title: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  // Nội dung đánh giá
  review_content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Thời gian tạo đánh giá
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  // Thời gian cập nhật đánh giá
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "booking_reviews",
  timestamps: false,
  indexes: [
    { fields: ["booking_id"] },
    { fields: ["rating"] },
    { fields: ["created_at"] },
  ],
});

export default BookingReview;