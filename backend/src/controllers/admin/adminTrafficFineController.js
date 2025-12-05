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
      
      // Debug log
      console.log(`Processing request #${requestData.request_id}:`, {
        images_raw: requestData.images,
        images_type: typeof requestData.images,
        request_type: requestData.request_type
      });
      
      if (requestData.images) {
        try {
          let parsed;
          // Nếu đã là object hoặc array, giữ nguyên
          if (typeof requestData.images === 'object' && !Array.isArray(requestData.images)) {
            parsed = requestData.images;
          } else if (Array.isArray(requestData.images)) {
            // Format cũ: array đơn giản
            requestData.images = requestData.images;
            requestData.receipt_images = [];
            return requestData;
          } else if (typeof requestData.images === 'string') {
            // Parse từ JSON string
            parsed = JSON.parse(requestData.images);
          } else {
            parsed = null;
          }
          
          // Kiểm tra format mới: {violations: [...], receipts: [...]}
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            if (parsed.violations || parsed.receipts) {
              // Format mới
              requestData.images = Array.isArray(parsed.violations) ? parsed.violations : [];
              requestData.receipt_images = Array.isArray(parsed.receipts) ? parsed.receipts : [];
            } else {
              // Object nhưng không phải format mới, thử convert thành array
              requestData.images = Object.values(parsed).filter(v => typeof v === 'string');
              requestData.receipt_images = [];
            }
          } else if (Array.isArray(parsed)) {
            // Format cũ: array đơn giản
            requestData.images = parsed;
            requestData.receipt_images = [];
          } else {
            requestData.images = [];
            requestData.receipt_images = [];
          }
        } catch (e) {
          console.error(`Error parsing images for request #${requestData.request_id}:`, e);
          requestData.images = [];
          requestData.receipt_images = [];
        }
      } else {
        requestData.images = [];
        requestData.receipt_images = [];
      }
      
      // Log kết quả
      console.log(`Request #${requestData.request_id} processed:`, {
        images_count: requestData.images?.length || 0,
        images: requestData.images,
        receipt_images_count: requestData.receipt_images?.length || 0,
        receipt_images: requestData.receipt_images
      });
      
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

    // Xử lý theo loại yêu cầu
    if (request.request_type === "delete") {
      // Xóa phạt nguội khỏi booking
      await request.booking.update(
        {
          traffic_fine_amount: 0,
          traffic_fine_paid: 0, // Reset tiền đã thanh toán nếu có
          traffic_fine_description: null,
          traffic_fine_images: null,
          updated_at: now,
        },
        { transaction }
      );

      // Tạo notification cho owner
      await Notification.create(
        {
          user_id: request.owner_id,
          title: "Yêu cầu xóa phạt nguội đã được duyệt",
          content: `Yêu cầu xóa phạt nguội cho đơn thuê #${request.booking.booking_id} đã được admin duyệt. Phạt nguội đã được xóa khỏi đơn thuê.`,
          type: "alert",
        },
        { transaction }
      );

      // Tạo notification cho renter nếu có
      if (request.booking.renter_id) {
        await Notification.create(
          {
            user_id: request.booking.renter_id,
            title: "Phạt nguội đã được xóa",
            content: `Phạt nguội cho đơn thuê #${request.booking.booking_id} đã được xóa bởi chủ xe và được admin duyệt.`,
            type: "alert",
          },
          { transaction }
        );
      }
    } else {
      // Xử lý request thêm/sửa phạt nguội
      // Parse images - hỗ trợ cả format mới và format cũ
      let imageUrls = [];
      let receiptImageUrls = [];
      
      if (request.images) {
        try {
          const parsed = typeof request.images === 'string' 
            ? JSON.parse(request.images) 
            : request.images;
          
          // Kiểm tra format mới: {violations: [...], receipts: [...]}
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            if (parsed.violations || parsed.receipts) {
              // Format mới
              imageUrls = Array.isArray(parsed.violations) ? parsed.violations : [];
              receiptImageUrls = Array.isArray(parsed.receipts) ? parsed.receipts : [];
            } else {
              // Object nhưng không phải format mới
              imageUrls = Object.values(parsed).filter(v => typeof v === 'string');
            }
          } else if (Array.isArray(parsed)) {
            // Format cũ: array đơn giản
            imageUrls = parsed;
          }
        } catch (e) {
          console.error('Error parsing images in approve:', e);
          imageUrls = [];
        }
      }

      // Lưu cả violations và receipts vào traffic_fine_images với format mới
      const allImages = {
        violations: imageUrls,
        receipts: receiptImageUrls
      };

      // Cập nhật booking với thông tin phạt nguội
      await request.booking.update(
        {
          traffic_fine_amount: parseFloat(request.amount),
          traffic_fine_description: request.description,
          traffic_fine_images: JSON.stringify(allImages),
          updated_at: now,
        },
        { transaction }
      );

      // Tạo notification cho owner
      await Notification.create(
        {
          user_id: request.owner_id,
          title: "Yêu cầu phạt nguội đã được duyệt",
          content: `Yêu cầu ${request.description ? 'thêm/sửa' : 'thêm'} phạt nguội cho đơn thuê #${request.booking.booking_id} đã được admin duyệt. Số tiền: ${parseFloat(request.amount).toLocaleString('vi-VN')} VNĐ.`,
          type: "alert",
        },
        { transaction }
      );

      // Tạo notification cho renter
      if (request.booking.renter_id) {
        await Notification.create(
          {
            user_id: request.booking.renter_id,
            title: "Phí phạt nguội",
            content: `Phí phạt nguội cho đơn thuê #${request.booking.booking_id}. Số tiền: ${parseFloat(request.amount).toLocaleString('vi-VN')} VNĐ. ${request.description ? `Lý do: ${request.description}` : ''}`,
            type: "alert",
          },
          { transaction }
        );
      }
    }

    await transaction.commit();

    const message = request.request_type === "delete" 
      ? "Đã duyệt yêu cầu xóa phạt nguội thành công"
      : "Đã duyệt yêu cầu phạt nguội thành công";

    return res.json({
      success: true,
      message,
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
    const requestTypeLabel = request.request_type === "delete" ? "xóa phạt nguội" : "phạt nguội";
    await Notification.create(
      {
        user_id: request.owner_id,
        title: `Yêu cầu ${requestTypeLabel} bị từ chối`,
        content: `Yêu cầu ${requestTypeLabel} cho đơn thuê #${request.booking_id} đã bị từ chối. ${rejection_reason ? `Lý do: ${rejection_reason}` : ''}`,
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

