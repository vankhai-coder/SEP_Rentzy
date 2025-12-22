import db from "../../models/index.js";
import { Op } from "sequelize";
import {
  calculateCancellationFeeLogic,
  createCancellationInfo,
} from "../../utils/cancellationUtils.js";
import cloudinary from "../../config/cloudinary.js";
import { decryptWithSecret } from "../../utils/cryptoUtil.js";
const {
  Booking,
  BookingReview,
  Notification,
  Vehicle,
  User,
  Brand,
  BookingHandover,
  BookingCancellation,
  Transaction,
  BookingContract,
  TrafficFineRequest,
} = db;

// 1. GET /api/owner/bookings - Quản lý đơn thuê
export const getOwnerBookings = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const {
      status,
      page = 1,
      limit = 10,
      sortBy = "created_at",
      sortOrder = "DESC",
    } = req.query;

    const offset = (page - 1) * limit;

    // Lấy danh sách xe của owner
    const ownerVehicles = await Vehicle.findAll({
      where: { owner_id: ownerId },
      attributes: ["vehicle_id"],
    });

    const vehicleIds = ownerVehicles.map((v) => v.vehicle_id);

    if (vehicleIds.length === 0) {
      return res.json({
        success: true,
        data: {
          bookings: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    }

    // Tạo điều kiện where
    let whereCondition = {
      vehicle_id: { [Op.in]: vehicleIds },
    };

    if (status) {
      whereCondition.status = status;
    }

    const { count, rows: bookings } = await Booking.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          include: [
            {
              model: Brand,
              as: "brand",
              attributes: ["brand_id", "name", "logo_url"],
            },
          ],
          attributes: [
            "vehicle_id",
            "model",
            "license_plate",
            "main_image_url",
            "price_per_day",
          ],
        },
        {
          model: User,
          as: "renter",
          attributes: ["user_id", "full_name", "email", "phone_number"],
        },
        {
          model: BookingCancellation,
          as: "cancellation",
          required: false, // LEFT JOIN để lấy booking ngay cả khi chưa có cancellation
          attributes: [
            "cancellation_id",
            "cancellation_fee",
            "total_refund_for_owner",
            "total_refund_for_renter",
            "cancellation_reason",
            "cancelled_by",
            "refund_status_renter",
            "refund_status_owner",
          ],
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    // Xử lý thông tin hủy cho từng booking
    const processedBookings = bookings.map((booking) => {
      const bookingData = booking.toJSON();

      // Nếu booking có trạng thái cancel_requested hoặc canceled nhưng chưa có BookingCancellation
      if (
        (bookingData.status === "cancel_requested" ||
          bookingData.status === "canceled") &&
        !bookingData.cancellation
      ) {
        // Tính toán thông tin hủy dựa trên logic chung
        const calculation = calculateCancellationFeeLogic(bookingData);
        const cancellationInfo = createCancellationInfo(
          bookingData,
          calculation
        );

        // Thêm thông tin hủy tính toán vào response
        bookingData.cancellation_info = {
          ...cancellationInfo,
          calculated: true, // Đánh dấu là thông tin được tính toán
          status:
            bookingData.status === "cancel_requested"
              ? "pending_approval"
              : "approved",
        };
      } else if (bookingData.cancellation) {
        // Nếu đã có BookingCancellation, sử dụng dữ liệu từ database
        bookingData.cancellation_info = {
          cancellation_fee: bookingData.cancellation.cancellation_fee,
          owner_refund: bookingData.cancellation.total_refund_for_owner,
          renter_refund: bookingData.cancellation.total_refund_for_renter,
          cancellation_reason: bookingData.cancellation.cancellation_reason,
          cancelled_by: bookingData.cancellation.cancelled_by,
          can_approve: false, // Đã được xử lý
          calculated: false, // Dữ liệu từ database
          status: "approved",
          refund_status_renter: bookingData.cancellation.refund_status_renter,
          refund_status_owner: bookingData.cancellation.refund_status_owner,
        };
      }

      // Xóa thông tin cancellation gốc để tránh trùng lặp
      delete bookingData.cancellation;

      return bookingData;
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        bookings: processedBookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting owner bookings:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách đơn thuê",
      error: error.message,
    });
  }
};

// Get owner transactions
export const getOwnerTransactions = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const {
      page = 1,
      limit = 10,
      search = "",
      type = "",
      status = "",
      sortBy = "created_at",
      sortOrder = "desc",
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Map sortBy from frontend camelCase to database snake_case
    const sortByMap = {
      createdAt: "created_at",
      updatedAt: "updated_at",
      amount: "amount",
    };
    const dbSortBy = sortByMap[sortBy] || sortBy;

    // Build where conditions cho Transaction
    const whereConditions = {
      to_user_id: ownerId, // Lấy các giao dịch mà owner nhận tiền
      type: { [Op.in]: ["COMPENSATION", "PAYOUT"] }, // Chỉ lấy COMPENSATION và PAYOUT
    };

    console.log('Owner Transactions Query:', {
      ownerId,
      whereConditions,
      filters: { search, type, status }
    });

    // Add search condition
    if (search) {
      whereConditions[Op.or] = [
        { transaction_id: { [Op.like]: `%${search}%` } },
        { note: { [Op.like]: `%${search}%` } },
        { "$fromUser.full_name$": { [Op.like]: `%${search}%` } },
      ];
    }

    // Add status filter
    if (status && status !== "all") {
      whereConditions.status = status.toUpperCase();
    }

    // Add type filter
    if (type && type !== "all") {
      if (type === "compensation") {
        whereConditions.type = "COMPENSATION";
      } else if (type === "payout") {
        whereConditions.type = "PAYOUT";
      }
    }

    // Get transactions from Transaction table
    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: "fromUser",
          attributes: ["user_id", "full_name", "email", "phone_number"],
          required: false,
        },
        {
          model: User,
          as: "toUser",
          attributes: ["user_id", "full_name", "email"],
          required: false,
        },
        {
          model: Booking,
          attributes: ["booking_id", "start_date", "end_date"],
          include: [
            {
              model: Vehicle,
              as: "vehicle",
              attributes: ["vehicle_id", "license_plate", "model", "brand_id"],
              include: [
                {
                  model: Brand,
                  as: "brand",
                  attributes: ["name"],
                },
              ],
            },
            {
              model: User,
              as: "renter",
              attributes: ["user_id", "full_name", "email", "phone_number"],
            },
          ],
          required: false,
        },
      ],
      order: [[dbSortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset,
      distinct: true,
    });

    console.log('Transaction Query Results:', {
      count,
      transactionsFound: transactions.length,
      sampleTransaction: transactions[0] ? {
        id: transactions[0].transaction_id,
        type: transactions[0].type,
        amount: transactions[0].amount,
        to_user_id: transactions[0].to_user_id,
        status: transactions[0].status
      } : null
    });

    // Format transactions data
    const formattedTransactions = transactions.map((transaction) => {
      // Xác định loại giao dịch
      let transactionType = "income";
      let description = "";

      if (transaction.type === "COMPENSATION") {
        transactionType = "compensation";
        description = `Bồi thường từ khách hàng hủy chuyến`;
      } else if (transaction.type === "PAYOUT") {
        transactionType = "payout";
        description = `Thanh toán từ hệ thống`;
      }

      // Thêm thông tin xe nếu có
      if (transaction.Booking?.vehicle) {
        description += ` - Xe ${transaction.Booking.vehicle.license_plate}`;
      }

      return {
        id: transaction.transaction_id,
        bookingCode: transaction.Booking
          ? `BK${transaction.Booking.booking_id}`
          : "N/A",
        type: transactionType,
        amount: parseFloat(transaction.amount || 0),
        description: transaction.note || description,
        paymentStatus: transaction.status.toLowerCase(),
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
        startDate: transaction.Booking?.start_date || null,
        endDate: transaction.Booking?.end_date || null,
        renter: transaction.Booking?.renter
          ? {
            id: transaction.Booking.renter.user_id,
            name: transaction.Booking.renter.full_name,
            email: transaction.Booking.renter.email,
            phone: transaction.Booking.renter.phone_number,
          }
          : transaction.fromUser
            ? {
              id: transaction.fromUser.user_id,
              name: transaction.fromUser.full_name,
              email: transaction.fromUser.email,
              phone: transaction.fromUser.phone_number,
            }
            : null,
        vehicle: transaction.Booking?.vehicle
          ? {
            id: transaction.Booking.vehicle.vehicle_id,
            licensePlate: transaction.Booking.vehicle.license_plate,
            model: transaction.Booking.vehicle.model,
            brand: transaction.Booking.vehicle.brand?.name || "N/A",
          }
          : null,
      };
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    // Tính thống kê tổng từ tất cả transactions (không chỉ trang hiện tại)
    const allTransactionsStats = await Transaction.findAll({
      where: {
        to_user_id: ownerId,
        type: { [Op.in]: ["COMPENSATION", "PAYOUT"] },
      },
      attributes: [
        [
          db.sequelize.fn("COUNT", db.sequelize.col("transaction_id")),
          "totalTransactions",
        ],
        [
          db.sequelize.fn("SUM", db.sequelize.col("amount")),
          "totalAmount",
        ],
      ],
      raw: true,
    });

    const stats = allTransactionsStats[0] || {};
    const totalTransactions = parseInt(stats.totalTransactions || 0);
    const totalAmount = parseFloat(stats.totalAmount || 0);

    console.log('Transaction Statistics:', {
      totalTransactions,
      totalAmount,
      rawStats: stats
    });

    // Tính tiền vào (tất cả transactions có amount > 0)
    const moneyInResult = await Transaction.findOne({
      where: {
        to_user_id: ownerId,
        type: { [Op.in]: ["COMPENSATION", "PAYOUT"] },
        amount: { [Op.gt]: 0 },
      },
      attributes: [
        [
          db.sequelize.fn("SUM", db.sequelize.col("amount")),
          "moneyIn",
        ],
      ],
      raw: true,
    });
    const moneyIn = parseFloat(moneyInResult?.moneyIn || 0);

    // Tính tiền ra (tất cả transactions có amount < 0)
    const moneyOutResult = await Transaction.findOne({
      where: {
        to_user_id: ownerId,
        type: { [Op.in]: ["COMPENSATION", "PAYOUT"] },
        amount: { [Op.lt]: 0 },
      },
      attributes: [
        [
          db.sequelize.fn("SUM", db.sequelize.fn("ABS", db.sequelize.col("amount"))),
          "moneyOut",
        ],
      ],
      raw: true,
    });
    const moneyOut = parseFloat(moneyOutResult?.moneyOut || 0);

    res.status(200).json({
      success: true,
      message: "Lấy danh sách giao dịch thành công",
      data: {
        transactions: formattedTransactions,
        statistics: {
          totalTransactions,
          totalAmount,
          moneyIn,
          moneyOut,
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting owner transactions:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách giao dịch",
      error: error.message,
    });
  }
};

// 3. GET /api/owner/revenue - Doanh thu
export const getOwnerRevenue = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const {
      period = "month",
      year,
      quarter,
      month,
    } = req.query;

    // Lấy danh sách xe của owner
    const ownerVehicles = await Vehicle.findAll({
      where: { owner_id: ownerId },
      attributes: ["vehicle_id"],
    });

    const vehicleIds = ownerVehicles.map((v) => v.vehicle_id);

    if (vehicleIds.length === 0) {
      return res.json({
        success: true,
        data: {
          totalRevenue: 0,
          completedBookings: 0,
          monthlyRevenue: [],
          vehicleStats: [],
        },
      });
    }

    // Tạo điều kiện filter cho totalRevenue và completedBookings
    let revenueWhereCondition = {
      vehicle_id: { [Op.in]: vehicleIds },
      status: "completed",
    };

    // Áp dụng filter theo năm/quý/tháng
    if (year) {
      const filterYear = parseInt(year);
      const dateConditions = [
        db.sequelize.where(
          db.sequelize.fn("YEAR", db.sequelize.col("created_at")),
          filterYear
        ),
      ];

      if (quarter) {
        const filterQuarter = parseInt(quarter);
        const startMonth = (filterQuarter - 1) * 3 + 1;
        const endMonth = filterQuarter * 3;
        dateConditions.push(
          db.sequelize.where(
            db.sequelize.fn("MONTH", db.sequelize.col("created_at")),
            { [Op.between]: [startMonth, endMonth] }
          )
        );
      } else if (month) {
        const filterMonth = parseInt(month);
        dateConditions.push(
          db.sequelize.where(
            db.sequelize.fn("MONTH", db.sequelize.col("created_at")),
            filterMonth
          )
        );
      }

      revenueWhereCondition.created_at = {
        [Op.and]: dateConditions,
      };
    }

    // Tính doanh thu tổng
    const totalRevenueResult = await Booking.findOne({
      where: revenueWhereCondition,
      attributes: [
        [
          db.sequelize.fn("SUM", db.sequelize.col("total_amount")),
          "totalRevenue",
        ],
      ],
      raw: true,
    });

    const totalRevenue = parseFloat(totalRevenueResult?.totalRevenue || 0);

    // Đếm số đơn hoàn thành
    const completedBookings = await Booking.count({
      where: revenueWhereCondition,
    });

    // Xử lý filter theo năm/quý/tháng
    let dateFilter = "";
    let monthlyRevenue = [];
    const now = new Date();

    if (year) {
      const filterYear = parseInt(year);

      if (quarter) {
        // Filter theo quý (3 tháng)
        const filterQuarter = parseInt(quarter);
        const startMonth = (filterQuarter - 1) * 3 + 1;
        const endMonth = filterQuarter * 3;

        dateFilter = `AND YEAR(created_at) = ${filterYear} 
                      AND MONTH(created_at) >= ${startMonth} 
                      AND MONTH(created_at) <= ${endMonth}`;

        // Tạo đầy đủ 3 tháng trong quý
        const monthlyRevenueRaw = await db.sequelize.query(
          `
          SELECT 
            MONTH(created_at) as month,
            YEAR(created_at) as year,
            SUM(total_amount) as revenue,
            COUNT(*) as booking_count
          FROM bookings 
          WHERE vehicle_id IN (${vehicleIds.join(",")})
            AND status = 'completed'
            ${dateFilter}
          GROUP BY YEAR(created_at), MONTH(created_at)
          ORDER BY year ASC, month ASC
        `,
          { type: db.sequelize.QueryTypes.SELECT }
        );

        const revenueMap = new Map();
        monthlyRevenueRaw.forEach(item => {
          const key = `${item.year}-${item.month}`;
          revenueMap.set(key, item);
        });

        for (let m = startMonth; m <= endMonth; m++) {
          const key = `${filterYear}-${m}`;
          if (revenueMap.has(key)) {
            monthlyRevenue.push(revenueMap.get(key));
          } else {
            monthlyRevenue.push({
              month: m,
              year: filterYear,
              revenue: 0,
              booking_count: 0
            });
          }
        }
      } else if (month) {
        // Filter theo tháng cụ thể - trả về dữ liệu theo ngày
        const filterMonth = parseInt(month);
        dateFilter = `AND YEAR(created_at) = ${filterYear} 
                      AND MONTH(created_at) = ${filterMonth}`;

        // Lấy dữ liệu theo ngày trong tháng
        const dailyRevenueRaw = await db.sequelize.query(
          `
          SELECT 
            DAY(created_at) as day,
            MONTH(created_at) as month,
            YEAR(created_at) as year,
            SUM(total_amount) as revenue,
            COUNT(*) as booking_count
          FROM bookings 
          WHERE vehicle_id IN (${vehicleIds.join(",")})
            AND status = 'completed'
            ${dateFilter}
          GROUP BY YEAR(created_at), MONTH(created_at), DAY(created_at)
          ORDER BY year ASC, month ASC, day ASC
        `,
          { type: db.sequelize.QueryTypes.SELECT }
        );

        // Tạo map để dễ tìm kiếm
        const dailyRevenueMap = new Map();
        dailyRevenueRaw.forEach(item => {
          dailyRevenueMap.set(item.day, item);
        });

        // Tạo đầy đủ các ngày trong tháng (kể cả ngày không có dữ liệu)
        const daysInMonth = new Date(filterYear, filterMonth, 0).getDate();
        const dailyRevenue = [];
        for (let day = 1; day <= daysInMonth; day++) {
          if (dailyRevenueMap.has(day)) {
            dailyRevenue.push(dailyRevenueMap.get(day));
          } else {
            dailyRevenue.push({
              day: day,
              month: filterMonth,
              year: filterYear,
              revenue: 0,
              booking_count: 0
            });
          }
        }

        // Vẫn giữ monthlyRevenue để tương thích, nhưng sẽ dùng dailyRevenue cho frontend
        monthlyRevenue = dailyRevenue;
      } else {
        // Filter theo cả năm (12 tháng)
        dateFilter = `AND YEAR(created_at) = ${filterYear}`;

        const monthlyRevenueRaw = await db.sequelize.query(
          `
          SELECT 
            MONTH(created_at) as month,
            YEAR(created_at) as year,
            SUM(total_amount) as revenue,
            COUNT(*) as booking_count
          FROM bookings 
          WHERE vehicle_id IN (${vehicleIds.join(",")})
            AND status = 'completed'
            ${dateFilter}
          GROUP BY YEAR(created_at), MONTH(created_at)
          ORDER BY year ASC, month ASC
        `,
          { type: db.sequelize.QueryTypes.SELECT }
        );

        const revenueMap = new Map();
        monthlyRevenueRaw.forEach(item => {
          const key = `${item.year}-${item.month}`;
          revenueMap.set(key, item);
        });

        // Tạo đầy đủ 12 tháng trong năm
        for (let m = 1; m <= 12; m++) {
          const key = `${filterYear}-${m}`;
          if (revenueMap.has(key)) {
            monthlyRevenue.push(revenueMap.get(key));
          } else {
            monthlyRevenue.push({
              month: m,
              year: filterYear,
              revenue: 0,
              booking_count: 0
            });
          }
        }
      }
    } else {
      // Mặc định: 6 tháng gần nhất
      const monthlyRevenueRaw = await db.sequelize.query(
        `
        SELECT 
          MONTH(created_at) as month,
          YEAR(created_at) as year,
          SUM(total_amount) as revenue,
          COUNT(*) as booking_count
        FROM bookings 
        WHERE vehicle_id IN (${vehicleIds.join(",")})
          AND status = 'completed'
          AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY YEAR(created_at), MONTH(created_at)
        ORDER BY year DESC, month DESC
      `,
        { type: db.sequelize.QueryTypes.SELECT }
      );

      // Tạo map để dễ tìm kiếm
      const revenueMap = new Map();
      monthlyRevenueRaw.forEach(item => {
        const key = `${item.year}-${item.month}`;
        revenueMap.set(key, item);
      });

      // Tạo đầy đủ 6 tháng gần nhất (kể cả tháng không có dữ liệu)
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${year}-${month}`;

        if (revenueMap.has(key)) {
          monthlyRevenue.push(revenueMap.get(key));
        } else {
          monthlyRevenue.push({
            month: month,
            year: year,
            revenue: 0,
            booking_count: 0
          });
        }
      }
    }

    // Thống kê trạng thái đặt xe
    const bookingStatusStats = await Booking.findAll({
      where: {
        vehicle_id: { [Op.in]: vehicleIds },
      },
      attributes: [
        "status",
        [db.sequelize.fn("COUNT", db.sequelize.col("booking_id")), "count"],
      ],
      group: ["status"],
      raw: true,
    });

    // Thống kê trạng thái thanh toán giải ngân (PAYOUT transactions)
    const disbursementStatusStats = await Transaction.findAll({
      where: {
        type: "PAYOUT",
        to_user_id: ownerId,
      },
      attributes: [
        "status",
        [db.sequelize.fn("COUNT", db.sequelize.col("transaction_id")), "count"],
      ],
      group: ["status"],
      raw: true,
    });

    // Thống kê theo xe
    const vehicleStatsRaw = await Booking.findAll({
      where: {
        vehicle_id: { [Op.in]: vehicleIds },
        status: "completed",
      },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          include: [
            {
              model: Brand,
              as: "brand",
              attributes: ["brand_id", "name"],
            },
          ],
          attributes: ["vehicle_id", "model", "license_plate"],
        },
      ],
      attributes: [
        "vehicle_id",
        [
          db.sequelize.fn("SUM", db.sequelize.col("total_amount")),
          "totalRevenue",
        ],
        [
          db.sequelize.fn("COUNT", db.sequelize.col("booking_id")),
          "bookingCount",
        ],
      ],
      group: ["vehicle_id", "vehicle.vehicle_id"],
      raw: false,
    });

    // Serialize dữ liệu để đảm bảo cấu trúc đúng
    const vehicleStats = vehicleStatsRaw.map(stat => {
      const data = stat.toJSON ? stat.toJSON() : stat;
      return {
        vehicle: data.vehicle || null,
        totalRevenue: parseFloat(data.totalRevenue || data.dataValues?.totalRevenue || 0),
        bookingCount: parseInt(data.bookingCount || data.dataValues?.bookingCount || 0),
      };
    });

    // Nếu có filter tháng, trả về dailyRevenue thay vì monthlyRevenue
    const responseData = {
      totalRevenue,
      completedBookings,
      monthlyRevenue: year && month ? [] : monthlyRevenue, // Chỉ trả về monthlyRevenue khi không có filter tháng
      vehicleStats,
      bookingStatusStats,
      disbursementStatusStats,
    };

    // Thêm dailyRevenue nếu có filter tháng
    if (year && month) {
      responseData.dailyRevenue = monthlyRevenue; // monthlyRevenue đã chứa dữ liệu theo ngày
    }

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error getting owner revenue:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin doanh thu",
      error: error.message,
    });
  }
};

// 4. GET /api/owner/vehicle-reviews - Đánh giá về xe
export const getVehicleReviews = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { page = 1, limit = 10, vehicle_id } = req.query;

    const offset = (page - 1) * limit;

    // Lấy danh sách xe của owner
    const ownerVehicles = await Vehicle.findAll({
      where: { owner_id: ownerId },
      attributes: ["vehicle_id"],
    });

    const vehicleIds = ownerVehicles.map((v) => v.vehicle_id);

    if (vehicleIds.length === 0) {
      return res.json({
        success: true,
        data: {
          reviews: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    }

    // Tạo điều kiện where cho booking
    let bookingWhere = {
      vehicle_id: { [Op.in]: vehicleIds },
    };

    if (vehicle_id) {
      bookingWhere.vehicle_id = vehicle_id;
    }

    const { count, rows: reviews } = await BookingReview.findAndCountAll({
      include: [
        {
          model: Booking,
          as: "booking",
          where: bookingWhere,
          include: [
            {
              model: Vehicle,
              as: "vehicle",
              include: [
                {
                  model: Brand,
                  as: "brand",
                  attributes: ["brand_id", "name", "logo_url"],
                },
              ],
              attributes: [
                "vehicle_id",
                "model",
                "license_plate",
                "main_image_url",
              ],
            },
            {
              model: User,
              as: "renter",
              attributes: ["user_id", "full_name", "avatar_url"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    const totalPages = Math.ceil(count / limit);

    // Tính điểm đánh giá trung bình
    const avgRatingResult = await BookingReview.findOne({
      include: [
        {
          model: Booking,
          as: "booking",
          where: { vehicle_id: { [Op.in]: vehicleIds } },
        },
      ],
      attributes: [
        [db.sequelize.fn("AVG", db.sequelize.col("rating")), "avgRating"],
        [
          db.sequelize.fn("COUNT", db.sequelize.col("review_id")),
          "totalReviews",
        ],
      ],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        reviews,
        avgRating: parseFloat(avgRatingResult?.avgRating || 0),
        totalReviews: parseInt(avgRatingResult?.totalReviews || 0),
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting vehicle reviews:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy đánh giá xe",
      error: error.message,
    });
  }
};

// 5. GET /api/owner/notifications - Thông báo
export const getOwnerNotifications = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { page = 1, limit = 10, is_read } = req.query;

    const offset = (page - 1) * limit;

    let whereCondition = { user_id: ownerId };

    // Only apply filter when query param is explicitly 'true' or 'false'
    if (is_read === "true") {
      whereCondition.is_read = true;
    } else if (is_read === "false") {
      whereCondition.is_read = false;
    }

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereCondition,
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const totalPages = Math.ceil(count / limit);

    // Đếm số thông báo chưa đọc
    const unreadCount = await Notification.count({
      where: {
        user_id: ownerId,
        is_read: false,
      },
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting notifications:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông báo",
      error: error.message,
    });
  }
};

// PATCH /api/owner/notifications/:id/read - Đánh dấu đã đọc
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.userId;

    const notification = await Notification.findOne({
      where: {
        notification_id: id,
        user_id: ownerId,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông báo",
      });
    }

    await notification.update({
      is_read: true,
      updated_at: new Date(),
    });

    res.json({
      success: true,
      message: "Đã đánh dấu thông báo là đã đọc",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật thông báo",
      error: error.message,
    });
  }
};

// GET /api/owner/dashboard/bookings/:id - Lấy chi tiết đơn thuê
export const getBookingDetail = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;

    // Lấy danh sách xe của owner để kiểm tra quyền truy cập
    const ownerVehicles = await Vehicle.findAll({
      where: { owner_id: ownerId },
      attributes: ["vehicle_id"],
    });

    const vehicleIds = ownerVehicles.map((v) => v.vehicle_id);

    if (vehicleIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy xe nào của bạn",
      });
    }

    // Lấy chi tiết booking
    const booking = await Booking.findOne({
      where: {
        booking_id: id,
        vehicle_id: { [Op.in]: vehicleIds },
      },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          attributes: [
            "vehicle_id",
            "model",
            "license_plate",
            "main_image_url",
            "price_per_day",
            "location",
          ],
        },
        {
          model: User,
          as: "renter",
          attributes: ["user_id", "full_name", "email", "phone_number"],
        },
        {
          model: BookingHandover,
          as: "handover",
          attributes: { exclude: [] }, //  lấy tất cả cột
        },
        {
          model: BookingContract,
          as: "contract",
          attributes: [
            "contract_id",
            "contract_number",
            "contract_status",
            "renter_signed_at",
            "owner_signed_at",
            "contract_file_url",
          ],
        },
        {
          model: TrafficFineRequest,
          as: "trafficFineRequests",
          required: false,
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn thuê",
      });
    }

    // Parse traffic_fine_images từ JSON string thành array
    const bookingData = booking.toJSON();
    if (bookingData.traffic_fine_images) {
      try {
        bookingData.traffic_fine_images = JSON.parse(
          bookingData.traffic_fine_images
        );
      } catch (e) {
        // Nếu không parse được, giữ nguyên hoặc set thành array rỗng
        bookingData.traffic_fine_images = [];
      }
    } else {
      bookingData.traffic_fine_images = [];
    }

    // DECRYPT PHONE NUMBER 
    if (bookingData.renter && bookingData.renter.phone_number) {
      bookingData.renter.phone_number = decryptWithSecret(bookingData.renter.phone_number, process.env.ENCRYPT_KEY);
    }

    res.json({
      success: true,
      data: bookingData,
    });
  } catch (error) {
    console.error("Error getting booking detail:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết đơn thuê",
      error: error.message,
    });
  }
};

// PATCH /api/owner/notifications/mark-all-read - Đánh dấu tất cả đã đọc
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const ownerId = req.user.userId;

    await Notification.update(
      {
        is_read: true,
        updated_at: new Date(),
      },
      {
        where: {
          user_id: ownerId,
          is_read: false,
        },
      }
    );

    res.json({
      success: true,
      message: "Đã đánh dấu tất cả thông báo là đã đọc",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật thông báo",
      error: error.message,
    });
  }
};

// API lấy danh sách booking đã hủy của owner với thông tin chi tiết về tiền hoàn
export const getCancelledBookings = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;

    const offset = (page - 1) * limit;

    // Lấy danh sách xe của owner
    const ownerVehicles = await Vehicle.findAll({
      where: { owner_id: ownerId },
      attributes: ["vehicle_id"],
    });

    const vehicleIds = ownerVehicles.map((v) => v.vehicle_id);

    if (vehicleIds.length === 0) {
      return res.json({
        success: true,
        data: {
          cancelledBookings: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    }

    // Điều kiện where cho BookingCancellation
    let cancellationWhere = {};
    if (status) {
      if (status === "pending_refund") {
        cancellationWhere = {
          [Op.or]: [
            { refund_status_renter: "pending" },
            { refund_status_owner: "pending" },
          ],
        };
      } else if (status === "completed_refund") {
        cancellationWhere = {
          refund_status_renter: "completed",
          refund_status_owner: { [Op.in]: ["completed", "none"] },
        };
      }
    }

    const { count, rows: cancelledBookings } =
      await BookingCancellation.findAndCountAll({
        where: cancellationWhere,
        include: [
          {
            model: Booking,
            as: "booking",
            where: {
              vehicle_id: { [Op.in]: vehicleIds },
              status: { [Op.in]: ["canceled", "cancel_requested"] },
            },
            include: [
              {
                model: Vehicle,
                as: "vehicle",
                include: [
                  {
                    model: Brand,
                    as: "brand",
                    attributes: ["brand_id", "name", "logo_url"],
                  },
                ],
                attributes: [
                  "vehicle_id",
                  "model",
                  "license_plate",
                  "main_image_url",
                  "price_per_day",
                ],
              },
              {
                model: User,
                as: "renter",
                attributes: [
                  "user_id",
                  "full_name",
                  "email",
                  "phone_number",
                  "avatar_url",
                ],
              },
            ],
            attributes: [
              "booking_id",
              "start_date",
              "end_date",
              "total_amount",
              "total_paid",
              "status",
              "created_at",
            ],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
        distinct: true,
      });

    // Format dữ liệu để hiển thị dưới dạng bảng
    const formattedData = cancelledBookings.map((cancellation) => {
      const booking = cancellation.booking;

      // Tính toán phí platform (10% của cancellation_fee)
      const cancellationFee = parseFloat(cancellation.cancellation_fee) || 0;
      const platformFee = cancellationFee * 0.1;
      const ownerRefund = parseFloat(cancellation.total_refund_for_owner) || 0;
      const renterRefund =
        parseFloat(cancellation.total_refund_for_renter) || 0;

      return {
        // Thông tin cơ bản
        cancellation_id: cancellation.cancellation_id,
        booking_id: booking.booking_id,
        vehicle_info: {
          model: booking.vehicle.model,
          license_plate: booking.vehicle.license_plate,
          brand: booking.vehicle.brand?.name || "N/A",
          image: booking.vehicle.main_image_url,
          price_per_day: booking.vehicle.price_per_day,
        },
        renter_info: {
          name: booking.renter.full_name,
          email: booking.renter.email,
          phone: booking.renter.phone_number,
          avatar: booking.renter.avatar_url,
        },

        // Thông tin booking
        booking_period: {
          start_date: booking.start_date,
          end_date: booking.end_date,
          created_at: booking.created_at,
        },

        // Thông tin tài chính
        financial_info: {
          total_amount: parseFloat(booking.total_amount) || 0,
          total_paid: parseFloat(booking.total_paid) || 0,
          cancellation_fee: cancellationFee,
          platform_fee: platformFee, // 10% phí hủy cho admin
          owner_refund: ownerRefund, // 90% phí hủy cho owner
          renter_refund: renterRefund, // Tiền hoàn cho renter
        },

        // Thông tin hủy
        cancellation_info: {
          reason: cancellation.cancellation_reason,
          cancelled_by: cancellation.cancelled_by,
        },

        // Trạng thái hoàn tiền
        refund_status: {
          renter: {
            status: cancellation.refund_status_renter,
            amount: renterRefund,
            processed_at: cancellation.refund_processed_at_renter,
            reason: cancellation.refund_reason_renter,
          },
          owner: {
            status: cancellation.refund_status_owner,
            amount: ownerRefund,
            processed_at: cancellation.refund_processed_at_owner,
          },
          platform: {
            amount: platformFee,
            status: cancellationFee > 0 ? "completed" : "none", // Platform luôn nhận ngay
          },
        },

        // Trạng thái tổng quan
        overall_status: booking.status,
        created_at: cancellation.created_at,
        updated_at: cancellation.updated_at,
      };
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        cancelledBookings: formattedData,
        summary: {
          total_cancelled: count,
          total_platform_fee: formattedData.reduce(
            (sum, item) => sum + item.financial_info.platform_fee,
            0
          ),
          total_owner_refund: formattedData.reduce(
            (sum, item) => sum + item.financial_info.owner_refund,
            0
          ),
          total_renter_refund: formattedData.reduce(
            (sum, item) => sum + item.financial_info.renter_refund,
            0
          ),
          pending_refunds: formattedData.filter(
            (item) =>
              item.refund_status.renter.status === "pending" ||
              item.refund_status.owner.status === "pending"
          ).length,
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting cancelled bookings:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách booking đã hủy",
      error: error.message,
    });
  }
};

// GET /api/owner/dashboard/traffic-fine-search/captcha - Lấy captcha image
export const getTrafficFineCaptcha = async (req, res) => {
  try {
    // Đảm bảo SSL config được set trước khi import
    if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    const { createAxiosInstance, getCaptchaImage } = await import(
      "../../utils/trafficFine/apiCaller.js"
    );
    const { createSession, createEmptyJar } = await import(
      "../../utils/trafficFine/captchaSessionStore.js"
    );

    // Tạo CookieJar riêng cho phiên captcha này và lưu lại để dùng khi submit form
    const jar = createEmptyJar();
    const instance = createAxiosInstance(jar);

    console.log("[TrafficFineCaptcha] Fetching captcha image...");
    const captchaImage = await getCaptchaImage(jar);

    if (!captchaImage || captchaImage.length === 0) {
      throw new Error("Captcha image is empty");
    }

    const sessionId = createSession(jar);
    const base64Image = captchaImage.toString("base64");

    console.log("[TrafficFineCaptcha] Captcha fetched successfully, size:", captchaImage.length, "bytes");

    return res.json({
      success: true,
      image: `data:image/png;base64,${base64Image}`,
      captchaSessionId: sessionId,
    });
  } catch (error) {
    console.error("[TrafficFineCaptcha] Error getting captcha:", error);
    console.error("[TrafficFineCaptcha] Error stack:", error.stack);
    console.error("[TrafficFineCaptcha] Error details:", {
      message: error.message,
      code: error.code,
      response: error.response?.status,
      responseData: error.response?.data,
    });

    res.status(500).json({
      success: false,
      message: "Không thể lấy mã bảo mật. Vui lòng thử lại sau.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// POST /api/owner/dashboard/traffic-fine-search - Tra cứu phạt nguội
export const searchTrafficFine = async (req, res) => {
  try {
    const { licensePlate, captcha, vehicleType, captchaSessionId } = req.body;

    if (!licensePlate) {
      return res.status(400).json({
        success: false,
        message: "Biển số xe là bắt buộc",
      });
    }

    if (!captcha) {
      return res.status(400).json({
        success: false,
        message: "Mã bảo mật là bắt buộc",
      });
    }

    // Lấy CookieJar theo sessionId để đảm bảo captcha hợp lệ
    let existingJar = null;
    try {
      const { getSessionJar, deleteSession } = await import(
        "../../utils/trafficFine/captchaSessionStore.js"
      );
      existingJar = getSessionJar(captchaSessionId);
      if (!existingJar) {
        return res.status(400).json({
          success: false,
          message:
            "Phiên mã bảo mật đã hết hạn hoặc không hợp lệ. Vui lòng tải lại mã.",
        });
      }
    } catch (sessionErr) {
      // Không block nếu module lỗi, nhưng khả năng captcha fail sẽ cao
      console.error(
        "[TrafficFineSearch] Error loading captcha session:",
        sessionErr
      );
    }

    // Import trực tiếp từ utils
    let callTrafficFineAPI;
    try {
      const apiCallerModule = await import(
        "../../utils/trafficFine/apiCaller.js"
      );
      callTrafficFineAPI = apiCallerModule.callTrafficFineAPI;
    } catch (importError) {
      console.error(
        "[TrafficFineSearch] Error importing apiCaller:",
        importError
      );
      return res.status(500).json({
        success: false,
        message: "Lỗi khi khởi tạo module tra cứu phạt nguội",
        error:
          process.env.NODE_ENV === "development"
            ? importError.message
            : undefined,
      });
    }

    console.log(
      `[TrafficFineSearch] Searching for license plate: ${licensePlate}, vehicleType: ${vehicleType || "1"
      }`
    );

    try {
      // Gọi trực tiếp API từ csgt.vn với captcha từ user
      const violations = await callTrafficFineAPI(
        licensePlate.trim(),
        captcha.trim(),
        vehicleType || "1",
        existingJar
      );

      if (!violations || violations.length === 0) {
        console.log(`[TrafficFineSearch] No violations found`);
        return res.json({
          success: true,
          data: {
            licensePlate: licensePlate.trim().toUpperCase(),
            violations: [],
            totalFines: 0,
            totalAmount: 0,
          },
        });
      }

      console.log(`[TrafficFineSearch] Found ${violations.length} violations`);

      // Map dữ liệu từ API csgt.vn sang format mong muốn
      const mappedViolations = violations.map((violation) => ({
        licensePlate:
          violation.licensePlate || licensePlate.trim().toUpperCase(),
        plateColor: violation.plateColor || "N/A",
        vehicleType: violation.vehicleType || "N/A",
        violationTime: violation.violationTime || "N/A",
        violationLocation: violation.violationLocation || "N/A",
        violationBehavior: violation.violationBehavior || "N/A",
        status: violation.status || "Chưa xác định",
        detectionUnit: violation.detectionUnit || "N/A",
        resolutionPlaces: violation.resolutionPlaces || [],
      }));

      res.json({
        success: true,
        data: {
          licensePlate: licensePlate.trim().toUpperCase(),
          violations: mappedViolations,
          totalFines: mappedViolations.length,
          totalAmount: 0, // API không trả về số tiền phạt
        },
      });
    } catch (apiError) {
      console.error("[TrafficFineSearch] Error calling csgt.vn API:", apiError);
      console.error("[TrafficFineSearch] Error stack:", apiError.stack);

      // Kiểm tra nếu lỗi là do captcha sai
      if (apiError.message.includes("Mã bảo mật không đúng")) {
        return res.status(400).json({
          success: false,
          message:
            apiError.message || "Mã bảo mật không đúng. Vui lòng thử lại.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Không thể tra cứu phạt nguội từ csgt.vn. Vui lòng thử lại sau.",
        error:
          process.env.NODE_ENV === "development" ? apiError.message : undefined,
      });
    }
  } catch (error) {
    console.error("[TrafficFineSearch] Error searching traffic fine:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tra cứu phạt nguội",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// PATCH /api/owner/dashboard/bookings/:id/accept - Owner chấp nhận booking (chuyển từ pending -> confirmed)
export const acceptBooking = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;

    // Lấy danh sách xe của owner để kiểm tra quyền truy cập
    const ownerVehicles = await Vehicle.findAll({
      where: { owner_id: ownerId },
      attributes: ["vehicle_id"],
    });

    const vehicleIds = ownerVehicles.map((v) => v.vehicle_id);

    if (vehicleIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy xe nào của bạn",
      });
    }

    // Tìm booking
    const booking = await Booking.findOne({
      where: {
        booking_id: id,
        vehicle_id: { [Op.in]: vehicleIds },
      },
      include: [
        {
          model: User,
          as: "renter",
          attributes: ["user_id", "full_name", "email"],
        },
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["vehicle_id", "model", "owner_id"],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn thuê hoặc bạn không có quyền truy cập",
      });
    }

    // Kiểm tra trạng thái booking - chỉ cho phép accept khi status là pending
    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Chỉ có thể chấp nhận booking ở trạng thái "Chờ xác nhận". Trạng thái hiện tại: ${booking.status}`,
      });
    }

    // Cập nhật trạng thái booking thành "confirmed"
    await booking.update({
      status: "confirmed",
      updated_at: new Date(),
    });

    // Tạo thông báo cho renter
    await Notification.create({
      user_id: booking.renter_id,
      title: "Đơn đặt xe đã được chấp nhận",
      content: `Chủ xe đã chấp nhận đơn đặt xe #${booking.booking_id}. Bạn có thể tiếp tục thanh toán đặt cọc 30%.`,
      type: "booking",
      is_read: false,
    });

    res.json({
      success: true,
      message: "Đã chấp nhận đơn đặt xe thành công",
      data: {
        booking_id: booking.booking_id,
        status: "confirmed",
      },
    });
  } catch (error) {
    console.error("Error accepting booking:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi chấp nhận đơn đặt xe",
      error: error.message,
    });
  }
};

// PATCH /api/owner/dashboard/bookings/:id/reject - Owner từ chối booking (pending -> canceled) kèm lý do
export const rejectBooking = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;
    const { reason } = req.body || {};

    // Lấy danh sách xe của owner để kiểm tra quyền truy cập
    const ownerVehicles = await Vehicle.findAll({
      where: { owner_id: ownerId },
      attributes: ["vehicle_id"],
    });
    const vehicleIds = ownerVehicles.map((v) => v.vehicle_id);

    if (vehicleIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy xe nào của bạn",
      });
    }

    // Tìm booking của owner
    const booking = await Booking.findOne({
      where: {
        booking_id: id,
        vehicle_id: { [Op.in]: vehicleIds },
      },
      include: [
        {
          model: User,
          as: "renter",
          attributes: ["user_id", "full_name", "email"],
        },
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["vehicle_id", "model", "owner_id"],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn thuê hoặc bạn không có quyền truy cập",
      });
    }

    // Chỉ cho phép từ chối khi booking đang chờ xác nhận
    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Chỉ có thể từ chối booking ở trạng thái \"Chờ xác nhận\". Trạng thái hiện tại: ${booking.status}`,
      });
    }

    // Cập nhật trạng thái booking thành "canceled"
    await booking.update({
      status: "canceled",
      updated_at: new Date(),
    });

    // Tạo thông báo cho renter, kèm lý do nếu có
    await Notification.create({
      user_id: booking.renter_id,
      title: "Đơn đặt xe đã bị từ chối",
      content: `Chủ xe đã từ chối đơn đặt xe #${booking.booking_id}. ${reason ? `Lý do: ${reason}` : ""
        }`,
      type: "booking",
      is_read: false,
    });

    return res.json({
      success: true,
      message: "Đã từ chối đơn đặt xe thành công",
      data: { booking_id: booking.booking_id, status: "canceled" },
    });
  } catch (error) {
    console.error("Error rejecting booking:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi từ chối đơn đặt xe",
      error: error.message,
    });
  }
};

// POST /api/owner/dashboard/bookings/:id/traffic-fine - Thêm/cập nhật phí phạt nguội
export const addTrafficFine = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;
    const { amount, description } = req.body;

    // Validate input
    if (!amount || amount < 0) {
      return res.status(400).json({
        success: false,
        message: "Số tiền phạt nguội không hợp lệ",
      });
    }

    // Validate images - bắt buộc phải có ít nhất 1 ảnh phạt nguội và 1 ảnh hóa đơn
    const trafficFineImages = req.files?.images || [];
    const receiptImages = req.files?.receipt_images || [];

    if (trafficFineImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng thêm ít nhất một hình ảnh phạt nguội",
      });
    }

    if (receiptImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng thêm ít nhất một hình ảnh hóa đơn nộp phạt",
      });
    }

    // Tìm booking
    const booking = await Booking.findOne({
      where: { booking_id: id },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          where: { owner_id: ownerId },
          attributes: ["vehicle_id", "license_plate"],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn thuê",
      });
    }

    // Chỉ cho phép thêm phí phạt nguội khi booking đang trong quá trình hoặc đã hoàn thành
    if (!["in_progress", "completed"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message:
          "Chỉ có thể thêm phí phạt nguội cho đơn thuê đang diễn ra hoặc đã hoàn thành",
      });
    }

    const trafficFineAmount = parseFloat(amount);

    // Upload traffic fine images to Cloudinary
    const trafficFineUploadPromises = trafficFineImages.map((file) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: `traffic-fines/${booking.booking_id}/violations`,
              resource_type: "image",
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result.secure_url);
              }
            }
          )
          .end(file.buffer);
      });
    });

    // Upload receipt images to Cloudinary
    const receiptUploadPromises = receiptImages.map((file) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: `traffic-fines/${booking.booking_id}/receipts`,
              resource_type: "image",
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result.secure_url);
              }
            }
          )
          .end(file.buffer);
      });
    });

    const [trafficFineImageUrls, receiptImageUrls] = await Promise.all([
      Promise.all(trafficFineUploadPromises),
      Promise.all(receiptUploadPromises)
    ]);

    // Tạo yêu cầu phạt nguội chờ duyệt thay vì cập nhật trực tiếp
    // Lưu cả ảnh phạt nguội và ảnh hóa đơn vào images (JSON format)
    const allImages = {
      violations: trafficFineImageUrls,
      receipts: receiptImageUrls
    };

    const trafficFineRequest = await TrafficFineRequest.create({
      booking_id: booking.booking_id,
      owner_id: ownerId,
      amount: trafficFineAmount,
      description: description || null,
      images: JSON.stringify(allImages),
      status: "pending",
    });

    // Tìm tất cả admin users để gửi notification
    // const adminUsers = await User.findAll({
    //   where: { role: "admin" },
    //   attributes: ["user_id"],
    // });

    // // Tạo notification cho tất cả admin
    // if (adminUsers.length > 0) {
    //   const notifications = adminUsers.map((admin) => ({
    //     user_id: admin.user_id,
    //     title: "Yêu cầu duyệt phạt nguội mới",
    //     content: `Có yêu cầu duyệt phạt nguội mới cho đơn thuê #${
    //       booking.booking_id
    //     }. Số tiền: ${trafficFineAmount.toLocaleString("vi-VN")} VNĐ.`,
    //     type: "alert",
    //   }));
    //   await Notification.bulkCreate(notifications);
    // }

    return res.json({
      success: true,
      message: "Đã gửi yêu cầu phạt nguội chờ duyệt",
      data: {
        request_id: trafficFineRequest.request_id,
        booking_id: booking.booking_id,
        status: "pending",
        message: "Yêu cầu của bạn đang chờ admin duyệt",
      },
    });
  } catch (error) {
    console.error("Error adding traffic fine:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi thêm phí phạt nguội",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// POST /api/owner/dashboard/bookings/:id/traffic-fine/delete-request - Yêu cầu xóa phí phạt nguội
export const requestDeleteTrafficFine = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;
    const { deletion_reason } = req.body;

    // Validate input
    if (!deletion_reason || deletion_reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Lý do xóa phải có ít nhất 10 ký tự",
      });
    }

    // Tìm booking
    const booking = await Booking.findOne({
      where: { booking_id: id },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          where: { owner_id: ownerId },
          attributes: ["vehicle_id", "license_plate"],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn thuê",
      });
    }

    // Kiểm tra booking có phạt nguội không
    if (!booking.traffic_fine_amount || booking.traffic_fine_amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Đơn thuê này không có phí phạt nguội để xóa",
      });
    }

    // Chỉ cho phép yêu cầu xóa khi booking đang trong quá trình hoặc đã hoàn thành
    if (!["in_progress", "completed"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message:
          "Chỉ có thể yêu cầu xóa phí phạt nguội cho đơn thuê đang diễn ra hoặc đã hoàn thành",
      });
    }

    // Kiểm tra xem đã có yêu cầu xóa đang chờ duyệt chưa
    const existingDeleteRequest = await TrafficFineRequest.findOne({
      where: {
        booking_id: booking.booking_id,
        owner_id: ownerId,
        request_type: "delete",
        status: "pending",
      },
    });

    if (existingDeleteRequest) {
      return res.status(400).json({
        success: false,
        message:
          "Bạn đã có yêu cầu xóa phạt nguội đang chờ duyệt. Vui lòng chờ admin xử lý.",
      });
    }

    // Tạo yêu cầu xóa phạt nguội chờ duyệt
    // Sử dụng amount = 0 thay vì null để tránh lỗi NOT NULL constraint nếu migration chưa chạy
    const deleteRequest = await TrafficFineRequest.create({
      booking_id: booking.booking_id,
      owner_id: ownerId,
      request_type: "delete",
      amount: 0, // Sử dụng 0 thay vì null để tương thích với schema cũ
      description: null,
      images: null,
      deletion_reason: deletion_reason.trim(),
      status: "pending",
    });

    // Tìm tất cả admin users để gửi notification
    const adminUsers = await User.findAll({
      where: { role: "admin" },
      attributes: ["user_id"],
    });

    // Tạo notification cho tất cả admin
    if (adminUsers.length > 0) {
      const notifications = adminUsers.map((admin) => ({
        user_id: admin.user_id,
        title: "Yêu cầu xóa phạt nguội mới",
        content: `Có yêu cầu xóa phạt nguội cho đơn thuê #${booking.booking_id
          }. Lý do: ${deletion_reason.trim().substring(0, 100)}...`,
        type: "alert",
      }));
      await Notification.bulkCreate(notifications);
    }

    return res.json({
      success: true,
      message: "Đã gửi yêu cầu xóa phạt nguội chờ duyệt",
      data: {
        request_id: deleteRequest.request_id,
        booking_id: booking.booking_id,
        status: "pending",
        message: "Yêu cầu của bạn đang chờ admin duyệt",
      },
    });
  } catch (error) {
    console.error("Error requesting traffic fine deletion:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return res.status(500).json({
      success: false,
      message: "Lỗi khi gửi yêu cầu xóa phạt nguội",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      details:
        process.env.NODE_ENV === "development"
          ? {
            name: error.name,
            stack: error.stack,
          }
          : undefined,
    });
  }
};
