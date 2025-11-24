import db from "../../models/index.js";
import { Op } from "sequelize";

const {
  TrafficFineRequest,
  Booking,
  User,
  Vehicle,
  Notification,
} = db;

// GET /api/admin/traffic-fine-requests - Lấy danh sách yêu cầu phạt nguội
export const getTrafficFineRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search = "",
    } = req.query;

    const offset = (page - 1) * limit;

    // Tạo điều kiện where
    const whereCondition = {};
    if (status) {
      whereCondition.status = status;
    }

    // Tạo điều kiện tìm kiếm
    let bookingWhere = {};
    if (search) {
      bookingWhere = {
        [Op.or]: [
          { booking_id: { [Op.like]: `%${search}%` } },
        ],
      };
    }

    // Lấy danh sách yêu cầu
    const { count, rows: requests } = await TrafficFineRequest.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Booking,
          as: "booking",
          where: bookingWhere,
          include: [
            {
              model: User,
              as: "renter",
              attributes: ["user_id", "full_name", "email", "phone_number"],
            },
            {
              model: Vehicle,
              as: "vehicle",
              attributes: ["vehicle_id", "model", "license_plate"],
              include: [
                {
                  model: User,
                  as: "owner",
                  attributes: ["user_id", "full_name", "email"],
                },
              ],
            },
          ],
        },
        {
          model: User,
          as: "owner",
          attributes: ["user_id", "full_name", "email"],
        },
        {
          model: User,
          as: "reviewer",
          attributes: ["user_id", "full_name", "email"],
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    // Parse images từ JSON string
    const requestsData = requests.map((request) => {
      const requestData = request.toJSON();
      if (requestData.images) {
        try {
          requestData.images = JSON.parse(requestData.images);
        } catch (e) {
          requestData.images = [];
        }
      } else {
        requestData.images = [];
      }
      return requestData;
    });

    return res.json({
      success: true,
      data: {
        requests: requestsData,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting traffic fine requests:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách yêu cầu phạt nguội",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// GET /api/admin/traffic-fine-requests/stats - Lấy thống kê
export const getTrafficFineRequestStats = async (req, res) => {
  try {
    const total = await TrafficFineRequest.count();
    const pending = await TrafficFineRequest.count({ where: { status: "pending" } });
    const approved = await TrafficFineRequest.count({ where: { status: "approved" } });
    const rejected = await TrafficFineRequest.count({ where: { status: "rejected" } });

    return res.json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
      },
    });
  } catch (error) {
    console.error("Error getting traffic fine request stats:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê",
    });
  }
};

// PATCH /api/admin/traffic-fine-requests/:id/approve - Duyệt yêu cầu phạt nguội
export const approveTrafficFineRequest = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const adminId = req.user.userId;

    // Tìm yêu cầu
    const request = await TrafficFineRequest.findOne({
      where: { request_id: id },
      include: [
        {
          model: Booking,
          as: "booking",
          include: [
            {
              model: User,
              as: "renter",
              attributes: ["user_id", "full_name", "email"],
            },
          ],
        },
      ],
      transaction,
    });

    if (!request) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu phạt nguội",
      });
    }

    if (request.status !== "pending") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Yêu cầu đã được xử lý",
      });
    }

    const now = new Date();

    // Cập nhật trạng thái yêu cầu
    await request.update(
      {
        status: "approved",
        reviewed_by: adminId,
        reviewed_at: now,
        updated_at: now,
      },
      { transaction }
    );

    // Parse images
    let imageUrls = [];
    if (request.images) {
      try {
        imageUrls = JSON.parse(request.images);
      } catch (e) {
        imageUrls = [];
      }
    }

    // Cập nhật booking với thông tin phạt nguội
    await request.booking.update(
      {
        traffic_fine_amount: parseFloat(request.amount),
        traffic_fine_description: request.description,
        traffic_fine_images: JSON.stringify(imageUrls),
        updated_at: now,
      },
      { transaction }
    );

    // Tạo notification cho renter
    await Notification.create(
      {
        user_id: request.booking.renter_id,
        title: "Phí phạt nguội",
        content: `Phí phạt nguội cho đơn thuê #${request.booking.booking_id}. Số tiền: ${parseFloat(request.amount).toLocaleString('vi-VN')} VNĐ. ${request.description ? `Lý do: ${request.description}` : ''}`,
        type: "alert",
      },
      { transaction }
    );

    await transaction.commit();

    return res.json({
      success: true,
      message: "Đã duyệt yêu cầu phạt nguội thành công",
      data: {
        request_id: request.request_id,
        booking_id: request.booking_id,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error approving traffic fine request:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi duyệt yêu cầu phạt nguội",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// PATCH /api/admin/traffic-fine-requests/:id/reject - Từ chối yêu cầu phạt nguội
export const rejectTrafficFineRequest = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    const adminId = req.user.userId;

    // Tìm yêu cầu
    const request = await TrafficFineRequest.findOne({
      where: { request_id: id },
      include: [
        {
          model: Booking,
          as: "booking",
          include: [
            {
              model: User,
              as: "renter",
              attributes: ["user_id", "full_name", "email"],
            },
            {
              model: Vehicle,
              as: "vehicle",
              include: [
                {
                  model: User,
                  as: "owner",
                  attributes: ["user_id", "full_name", "email"],
                },
              ],
            },
          ],
        },
      ],
      transaction,
    });

    if (!request) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu phạt nguội",
      });
    }

    if (request.status !== "pending") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Yêu cầu đã được xử lý",
      });
    }

    const now = new Date();

    // Cập nhật trạng thái yêu cầu
    await request.update(
      {
        status: "rejected",
        rejection_reason: rejection_reason || "Không đủ bằng chứng",
        reviewed_by: adminId,
        reviewed_at: now,
        updated_at: now,
      },
      { transaction }
    );

    // Tạo notification cho owner
    await Notification.create(
      {
        user_id: request.owner_id,
        title: "Yêu cầu phạt nguội bị từ chối",
        content: `Yêu cầu phạt nguội cho đơn thuê #${request.booking_id} đã bị từ chối. ${rejection_reason ? `Lý do: ${rejection_reason}` : ''}`,
        type: "alert",
      },
      { transaction }
    );

    await transaction.commit();

    return res.json({
      success: true,
      message: "Đã từ chối yêu cầu phạt nguội",
      data: {
        request_id: request.request_id,
        booking_id: request.booking_id,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error rejecting traffic fine request:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi từ chối yêu cầu phạt nguội",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

