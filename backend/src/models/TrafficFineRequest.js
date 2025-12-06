// models/TrafficFineRequest.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const TrafficFineRequest = sequelize.define(
  "TrafficFineRequest",
  {
    // ID yêu cầu phạt nguội (khóa chính)
    request_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    // ID đặt xe
    booking_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    // ID chủ xe (owner) tạo yêu cầu
    owner_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    // Loại yêu cầu: add (thêm/sửa) hoặc delete (xóa)
    request_type: {
      type: DataTypes.ENUM("add", "delete"),
      defaultValue: "add",
      allowNull: false,
    },
    // Số tiền phạt nguội (không bắt buộc cho request xóa)
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    // Mô tả / Lý do phạt nguội
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Hình ảnh phạt nguội (lưu dưới dạng JSON array)
    images: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Trạng thái: pending, approved, rejected
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    // Trạng thái chuyển tiền phạt nguội cho owner: none, pending, approved, rejected
    transfer_status: {
      type: DataTypes.ENUM("none", "pending", "approved", "rejected"),
      defaultValue: "none",
      allowNull: false,
    },
    // Lý do từ chối (nếu bị reject)
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Lý do xóa (cho request_type = 'delete')
    deletion_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // ID admin duyệt/từ chối
    reviewed_by: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    // Thời gian duyệt/từ chối
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Thời gian tạo
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    // Thời gian cập nhật
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "traffic_fine_requests",
    timestamps: false,
    indexes: [
      { fields: ["booking_id"] },
      { fields: ["owner_id"] },
      { fields: ["status"] },
      { fields: ["created_at"] },
    ],
  }
);

export default TrafficFineRequest;

