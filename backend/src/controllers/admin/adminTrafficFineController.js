import db from "../../models/index.js";
import { Op } from "sequelize";
import { sendEmail } from "../../utils/email/sendEmail.js";

const {
  TrafficFineRequest,
  Booking,
  User,
  Vehicle,
  Notification,
  Transaction,
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

export const getTrafficFinePayouts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", transfer_status } = req.query;
    const offset = (page - 1) * limit;

    const whereCondition = {};
    if (transfer_status && transfer_status !== "all") {
      whereCondition.transfer_status = transfer_status;
    } else if (!transfer_status) {
      whereCondition.transfer_status = "pending";
    }

    if (search) {
      whereCondition[Op.or] = [{ booking_id: { [Op.like]: `%${search}%` } }];
    }

    const { count, rows } = await TrafficFineRequest.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Booking,
          as: "booking",
          include: [
            { model: User, as: "renter", attributes: ["user_id", "full_name", "email"] },
            {
              model: Vehicle,
              as: "vehicle",
              include: [
                { 
                  model: User, 
                  as: "owner", 
                  attributes: ["user_id", "full_name", "email", "phone_number"],
                  include: [
                    { model: db.Bank, as: "banks", where: { is_primary: true }, required: false, attributes: ["bank_name", "account_number", "account_holder_name", "qr_code_url", "is_primary"] }
                  ]
                },
              ],
              attributes: ["vehicle_id", "model", "license_plate"],
            },
          ],
        },
        { model: User, as: "owner", attributes: ["user_id", "full_name", "email", "phone_number"] },
      ],
      order: [["reviewed_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    const payouts = await Promise.all(
      rows.map(async (reqItem) => {
        const booking = reqItem.booking;
        const totalPaidFine = parseFloat(booking?.traffic_fine_paid || 0);
        const totalFine = parseFloat(booking?.traffic_fine_amount || 0);
        const requestAmount = parseFloat(reqItem.amount || 0);
        const transferredSum = await Transaction.sum("amount", {
          where: {
            booking_id: booking.booking_id,
            type: "COMPENSATION",
            status: "COMPLETED",
            note: { [Op.like]: `%TRAFFIC_FINE_PAYOUT booking #${booking.booking_id}%` },
          },
        });
        const alreadyTransferred = parseFloat(transferredSum || 0);
        const payableBase = Math.min(totalPaidFine, requestAmount || totalFine || 0);
        const remainingToTransfer = Math.max(payableBase - alreadyTransferred, 0);

        const ownerUser = booking.vehicle?.owner || reqItem.owner || null;
        const primaryBank = ownerUser?.banks?.[0] || null;

        return {
          request_id: reqItem.request_id,
          booking_id: booking.booking_id,
          renter: booking.renter,
          owner: ownerUser,
          owner_bank: primaryBank ? {
            bank_name: primaryBank.bank_name,
            account_number: primaryBank.account_number,
            account_holder_name: primaryBank.account_holder_name,
            qr_code_url: primaryBank.qr_code_url,
          } : null,
          vehicle: { model: booking.vehicle?.model, license_plate: booking.vehicle?.license_plate },
          traffic_fine_amount: totalFine,
          traffic_fine_paid: totalPaidFine,
          transferred: alreadyTransferred,
          remaining_to_transfer: remainingToTransfer,
          transfer_status: reqItem.transfer_status,
          updated_at: booking.updated_at,
          created_at: reqItem.created_at,
        };
      })
    );

    // Only filter if we are specifically looking for pending, or let the DB filter handle it.
    // However, the previous logic filtered by remaining_to_transfer > 0.
    // If we want history (completed), remaining might be 0.
    // So we should REMOVE this filter if we want to show all.
    // If transfer_status is 'pending', we might still want to ensure remaining > 0, but DB filter 'pending' should be enough.
    // Wait, DB filter is on request.transfer_status.
    // If request.transfer_status is 'pending', it means it hasn't been fully processed?
    // Let's assume the DB status is the source of truth.
    
    return res.json({
      success: true,
      data: {
        payouts: payouts, // Removed .filter()
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting traffic fine payouts:", error);
    return res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách chuyển tiền phạt nguội", error: error.message });
  }
};

// Lấy tất cả traffic fine requests cho admin
export const getAllTrafficFineRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      request_type,
      transfer_status,
      search,
      sort_by = "created_at",
      order = "DESC",
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Filter by request_type
    if (request_type) {
      whereClause.request_type = request_type;
    }

    // Filter by transfer_status
    if (transfer_status) {
      whereClause.transfer_status = transfer_status;
    }

    // Search by booking_id or owner_id
    if (search) {
      whereClause[Op.or] = [
        { booking_id: { [Op.like]: `%${search}%` } },
        { owner_id: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    // Count total records
    const totalRecords = await TrafficFineRequest.count({
      where: whereClause,
    });

    // Fetch requests with pagination
    const requests = await TrafficFineRequest.findAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort_by, order.toUpperCase()]],
    });

    // Parse images JSON for each request
    const parsedRequests = requests.map((request) => {
      const requestData = request.toJSON();
      if (requestData.images) {
        try {
          requestData.images = JSON.parse(requestData.images);
        } catch (e) {
          requestData.images = [];
        }
      }
      return requestData;
    });

    res.status(200).json({
      success: true,
      data: parsedRequests,
      pagination: {
        total: totalRecords,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalRecords / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching traffic fine requests:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách yêu cầu phạt nguội",
      error: error.message,
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

    // Determine transfer status based on request type
    // If delete, no transfer needed (none). If add/update, needs transfer (pending).
    const transferStatus = request.request_type === "delete" ? "none" : "pending";

    // Cập nhật trạng thái yêu cầu
    await request.update(
      {
        status: "approved",
        reviewed_by: adminId,
        reviewed_at: now,
        updated_at: now,
        transfer_status: transferStatus,
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

      // Lấy thông tin owner và renter
      const owner = request.booking?.vehicle?.owner;
      const renter = request.booking?.renter;

      // Tạo notification cho owner
      await Notification.create(
        {
          user_id: request.owner_id,
          title: "Yêu cầu phạt nguội đã được duyệt",
          content: `Yêu cầu phạt nguội cho đơn thuê #${request.booking.booking_id} đã được admin duyệt. Số tiền: ${parseFloat(request.amount).toLocaleString('vi-VN')} VNĐ.`,
          type: "alert",
        },
        { transaction }
      );

      // Gửi email cho owner
      if (owner?.email) {
        try {
          const emailHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8" />
                <style>
                  body { font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; }
                  .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 30px; }
                  h2 { color: #333333; margin: 0 0 12px 0; }
                  p { color: #555555; font-size: 15px; line-height: 1.6; margin: 6px 0; }
                  .details { background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0; }
                  .row { display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding: 8px 0; }
                  .row:last-child { border-bottom: none; }
                  .label { color: #64748b; }
                  .value { color: #334155; font-weight: 500; }
                  .footer { margin-top: 24px; font-size: 12px; color: #888888; text-align: center; }
                </style>
              </head>
              <body>
                <div class="container">
                  <h2>Yêu cầu phạt nguội đã được duyệt</h2>
                  <p>Xin chào${owner.full_name ? ` ${owner.full_name}` : ""},</p>
                  <p>Yêu cầu phạt nguội cho đơn thuê #${request.booking.booking_id} đã được admin duyệt.</p>
                  <div class="details">
                    <div class="row"><span class="label">Mã đơn thuê:</span><span class="value">#${request.booking.booking_id}</span></div>
                    <div class="row"><span class="label">Số tiền phạt:</span><span class="value">${parseFloat(request.amount).toLocaleString('vi-VN')} VNĐ</span></div>
                    ${request.description ? `<div class="row"><span class="label">Lý do:</span><span class="value">${request.description}</span></div>` : ''}
                  </div>
                  <div class="footer">© ${new Date().getFullYear()} Rentzy. Mọi quyền được bảo lưu.</div>
                </div>
              </body>
            </html>
          `;
          await sendEmail({
            from: process.env.GMAIL_USER,
            to: owner.email,
            subject: `Yêu cầu phạt nguội đã được duyệt - Booking #${request.booking.booking_id}`,
            html: emailHtml,
          });
          console.log("Email sent to owner:", owner.email);
        } catch (emailError) {
          console.error("Error sending email to owner:", emailError);
        }
      }

      // Tạo notification cho renter
      if (request.booking.renter_id && renter) {
        await Notification.create(
          {
            user_id: request.booking.renter_id,
            title: "Phí phạt nguội",
            content: `Phí phạt nguội cho đơn thuê #${request.booking.booking_id}. Số tiền: ${parseFloat(request.amount).toLocaleString('vi-VN')} VNĐ. ${request.description ? `Lý do: ${request.description}` : ''}`,
            type: "alert",
          },
          { transaction }
        );

        // Gửi email cho renter
        if (renter.email) {
          try {
            const emailHtml = `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="UTF-8" />
                  <style>
                    body { font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 30px; }
                    h2 { color: #333333; margin: 0 0 12px 0; }
                    p { color: #555555; font-size: 15px; line-height: 1.6; margin: 6px 0; }
                    .details { background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0; }
                    .row { display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding: 8px 0; }
                    .row:last-child { border-bottom: none; }
                    .label { color: #64748b; }
                    .value { color: #334155; font-weight: 500; }
                    .footer { margin-top: 24px; font-size: 12px; color: #888888; text-align: center; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h2>Thông báo phí phạt nguội</h2>
                    <p>Xin chào${renter.full_name ? ` ${renter.full_name}` : ""},</p>
                    <p>Đơn thuê #${request.booking.booking_id} của bạn vừa có 1 phí phạt nguội.</p>
                    <div class="details">
                      <div class="row"><span class="label">Mã đơn thuê:</span><span class="value">#${request.booking.booking_id}</span></div>
                      <div class="row"><span class="label">Số tiền phạt:</span><span class="value">${parseFloat(request.amount).toLocaleString('vi-VN')} VNĐ</span></div>
                      ${request.description ? `<div class="row"><span class="label">Lý do:</span><span class="value">${request.description}</span></div>` : ''}
                    </div>
                    <p>Vui lòng thanh toán phí phạt nguội theo thỏa thuận với chủ xe.</p>
                    <div class="footer">© ${new Date().getFullYear()} Rentzy. Mọi quyền được bảo lưu.</div>
                  </div>
                </body>
              </html>
            `;
            await sendEmail({
              from: process.env.GMAIL_USER,
              to: renter.email,
              subject: `Thông báo phí phạt nguội - Booking #${request.booking.booking_id}`,
              html: emailHtml,
            });
            console.log("Email sent to renter:", renter.email);
          } catch (emailError) {
            console.error("Error sending email to renter:", emailError);
          }
        }
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

    // Lấy thông tin owner
    const owner = request.booking?.vehicle?.owner;

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

    // Gửi email cho owner (chỉ owner, không gửi cho renter)
    if (owner?.email) {
      try {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <style>
                body { font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 30px; }
                h2 { color: #dc2626; margin: 0 0 12px 0; }
                p { color: #555555; font-size: 15px; line-height: 1.6; margin: 6px 0; }
                .details { background: #fef2f2; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #dc2626; }
                .row { display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding: 8px 0; }
                .row:last-child { border-bottom: none; }
                .label { color: #64748b; }
                .value { color: #334155; font-weight: 500; }
                .footer { margin-top: 24px; font-size: 12px; color: #888888; text-align: center; }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>Yêu cầu ${requestTypeLabel} bị từ chối</h2>
                <p>Xin chào${owner.full_name ? ` ${owner.full_name}` : ""},</p>
                <p>Yêu cầu ${requestTypeLabel} cho đơn thuê #${request.booking_id} đã bị admin từ chối.</p>
                <div class="details">
                  <div class="row"><span class="label">Mã đơn thuê:</span><span class="value">#${request.booking_id}</span></div>
                  ${rejection_reason ? `<div class="row"><span class="label">Lý do từ chối:</span><span class="value">${rejection_reason}</span></div>` : ''}
                </div>
                <p>Vui lòng kiểm tra lại thông tin và gửi yêu cầu mới nếu cần.</p>
                <div class="footer">© ${new Date().getFullYear()} Rentzy. Mọi quyền được bảo lưu.</div>
              </div>
            </body>
          </html>
        `;
        await sendEmail({
          from: process.env.GMAIL_USER,
          to: owner.email,
          subject: `Yêu cầu ${requestTypeLabel} bị từ chối - Booking #${request.booking_id}`,
          html: emailHtml,
        });
        console.log("Email sent to owner:", owner.email);
      } catch (emailError) {
        console.error("Error sending email to owner:", emailError);
      }
    }

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

export const transferTrafficFineToOwner = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const booking = await Booking.findOne({
      where: { booking_id: id },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          include: [
            { model: User, as: "owner", attributes: ["user_id", "full_name", "email"] },
          ],
        },
      ],
      transaction: t,
    });

    if (!booking) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn thuê" });
    }

    const totalPaidFine = parseFloat(booking.traffic_fine_paid || 0);
    if (totalPaidFine <= 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Chưa có tiền phạt nguội đã thanh toán" });
    }

    const transferredSum = await Transaction.sum("amount", {
      where: {
        booking_id: booking.booking_id,
        type: "COMPENSATION",
        status: "COMPLETED",
        note: { [Op.like]: `%TRAFFIC_FINE_PAYOUT booking #${booking.booking_id}%` },
      },
      transaction: t,
    });

    const alreadyTransferred = parseFloat(transferredSum || 0);
    const remainingToTransfer = totalPaidFine - alreadyTransferred;

    if (remainingToTransfer <= 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Không còn số tiền phạt nguội cần chuyển" });
    }

    const ownerId = booking.vehicle?.owner?.user_id;
    if (!ownerId) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Thiếu thông tin chủ xe" });
    }

    await Transaction.create(
      {
        booking_id: booking.booking_id,
        from_user_id: null,
        to_user_id: ownerId,
        amount: remainingToTransfer,
        type: "COMPENSATION",
        status: "COMPLETED",
        payment_method: "BANK_TRANSFER",
        processed_at: new Date(),
        note: `TRAFFIC_FINE_PAYOUT booking #${booking.booking_id}`,
      },
      { transaction: t }
    );

    await Notification.create(
      {
        user_id: ownerId,
        title: "Nhận chuyển tiền phạt nguội",
        content: `Bạn đã nhận ${remainingToTransfer.toLocaleString("vi-VN")} VNĐ tiền phạt nguội cho đơn #${booking.booking_id}.`,
        type: "payout",
      },
      { transaction: t }
    );

    const tfReq = await TrafficFineRequest.findOne({
      where: { booking_id: booking.booking_id, status: "approved" },
      order: [["reviewed_at", "DESC"]],
      transaction: t,
    });
    if (tfReq) {
      await tfReq.update({ transfer_status: "approved" }, { transaction: t });
    }

    await t.commit();
    return res.json({ success: true, message: "Đã chuyển tiền phạt nguội cho chủ xe", data: { booking_id: booking.booking_id, amount: remainingToTransfer } });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ success: false, message: "Lỗi khi chuyển tiền phạt nguội", error: error.message });
  }
};
