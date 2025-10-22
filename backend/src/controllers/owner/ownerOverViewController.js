import db from "../../models/index.js";
import { Op } from "sequelize";
import sequelize from "../../config/db.js";

const { Booking, Vehicle, User, Brand } = db;

// API lấy tổng quan dashboard
export const getOverviewStats = async (req, res) => {
  try {
    // Tạm thời hardcode owner_id để test
    const ownerId = req.user?.userId || 1;

    // Lấy danh sách xe của owner
    const ownerVehicles = await Vehicle.findAll({
      where: { owner_id: ownerId },
      attributes: ['vehicle_id']
    });

    const vehicleIds = ownerVehicles.map(v => v.vehicle_id);

    if (vehicleIds.length === 0) {
      return res.json({
        success: true,
        data: {
          totalRevenue: 0,
          totalBookings: 0,
          totalVehicles: 0,
          revenueChart: []
        }
      });
    }

    // Tính tổng doanh thu từ các booking đã hoàn thành
    const totalRevenueResult = await Booking.findOne({
      where: {
        vehicle_id: { [Op.in]: vehicleIds },
        status: 'completed'
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalRevenue']
      ],
      raw: true
    });

    // Đếm tổng số đơn thuê
    const totalBookings = await Booking.count({
      where: {
        vehicle_id: { [Op.in]: vehicleIds }
      }
    });

    // Đếm tổng số xe
    const totalVehicles = vehicleIds.length;

    const totalRevenue = totalRevenueResult?.totalRevenue || 0;

    res.json({
      success: true,
      data: {
        totalRevenue: parseFloat(totalRevenue),
        totalBookings,
        totalVehicles
      }
    });

  } catch (error) {
    console.error("Error getting overview stats:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê tổng quan",
      error: error.message
    });
  }
};

// API lấy dữ liệu biểu đồ doanh thu
export const getRevenueChart = async (req, res) => {
  try {
    // Tạm thời hardcode owner_id để test
    const ownerId = req.user?.userId || 1;
    const { period = 'month', year = new Date().getFullYear() } = req.query;

    // Lấy danh sách xe của owner
    const ownerVehicles = await Vehicle.findAll({
      where: { owner_id: ownerId },
      attributes: ['vehicle_id']
    });

    const vehicleIds = ownerVehicles.map(v => v.vehicle_id);

    if (vehicleIds.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    let dateFormat, groupBy;
    let whereCondition = {
      vehicle_id: { [Op.in]: vehicleIds },
      status: 'completed'
    };

    // Xác định format ngày và điều kiện group by theo period
    switch (period) {
      case 'day':
        // Lấy dữ liệu 30 ngày gần nhất
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        whereCondition.created_at = {
          [Op.gte]: thirtyDaysAgo
        };
        dateFormat = '%Y-%m-%d';
        groupBy = sequelize.fn('DATE', sequelize.col('created_at'));
        break;
      case 'month':
        // Lấy dữ liệu theo tháng trong năm
        whereCondition.created_at = {
          [Op.and]: [
            sequelize.where(sequelize.fn('YEAR', sequelize.col('created_at')), year)
          ]
        };
        dateFormat = '%Y-%m';
        groupBy = [
          sequelize.fn('YEAR', sequelize.col('created_at')),
          sequelize.fn('MONTH', sequelize.col('created_at'))
        ];
        break;
      case 'year':
        // Lấy dữ liệu 5 năm gần nhất
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
        whereCondition.created_at = {
          [Op.gte]: fiveYearsAgo
        };
        dateFormat = '%Y';
        groupBy = sequelize.fn('YEAR', sequelize.col('created_at'));
        break;
      default:
        dateFormat = '%Y-%m';
        groupBy = [
          sequelize.fn('YEAR', sequelize.col('created_at')),
          sequelize.fn('MONTH', sequelize.col('created_at'))
        ];
    }

    const revenueData = await Booking.findAll({
      where: whereCondition,
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), dateFormat), 'period'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('booking_id')), 'bookingCount']
      ],
      group: groupBy,
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), dateFormat), 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      data: revenueData.map(item => ({
        period: item.period,
        revenue: parseFloat(item.revenue),
        bookingCount: parseInt(item.bookingCount)
      }))
    });

  } catch (error) {
    console.error("Error getting revenue chart:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy dữ liệu biểu đồ doanh thu",
      error: error.message
    });
  }
};

// API lấy danh sách người thuê theo số lượt thuê
export const getTopRenters = async (req, res) => {
  try {
    // Tạm thời hardcode owner_id để test
    const ownerId = req.user?.userId || 1;
    const { limit = 10 } = req.query;

    // Lấy danh sách xe của owner
    const ownerVehicles = await Vehicle.findAll({
      where: { owner_id: ownerId },
      attributes: ['vehicle_id']
    });

    const vehicleIds = ownerVehicles.map(v => v.vehicle_id);

    if (vehicleIds.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const topRenters = await Booking.findAll({
      where: {
        vehicle_id: { [Op.in]: vehicleIds }
      },
      include: [
        {
          model: User,
          as: "renter",
          attributes: ["user_id", "full_name", "email", "avatar_url"]
        }
      ],
      attributes: [
        'renter_id',
        [sequelize.fn('COUNT', sequelize.col('booking_id')), 'rentCount'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalSpent']
      ],
      group: ['renter_id', 'renter.user_id'],
      order: [[sequelize.fn('COUNT', sequelize.col('booking_id')), 'DESC']],
      limit: parseInt(limit),
      raw: false
    });

    const formattedData = topRenters.map(booking => ({
      user_id: booking.renter.user_id,
      full_name: booking.renter.full_name,
      email: booking.renter.email,
      avatar_url: booking.renter.avatar_url,
      rentCount: parseInt(booking.dataValues.rentCount),
      totalSpent: parseFloat(booking.dataValues.totalSpent || 0)
    }));

    res.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error("Error getting top renters:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách người thuê",
      error: error.message
    });
  }
};

// API lấy danh sách xe được thuê nhiều nhất
export const getTopVehicles = async (req, res) => {
  try {
    // Tạm thời hardcode owner_id để test
    const ownerId = req.user?.userId || 1;
    const { limit = 10 } = req.query;

    const topVehicles = await Vehicle.findAll({
      where: { owner_id: ownerId },
      include: [
        {
          model: Brand,
          as: "brand",
          attributes: ["brand_id", "name", "logo_url"]
        },
        {
          model: Booking,
          as: "bookings",
          attributes: [],
          required: false
        }
      ],
      attributes: [
        'vehicle_id',
        'model',
        'license_plate',
        'main_image_url',
        'price_per_day',
        'rent_count',
        [sequelize.fn('COUNT', sequelize.col('bookings.booking_id')), 'totalBookings'],
        [sequelize.fn('SUM', sequelize.col('bookings.total_amount')), 'totalRevenue']
      ],
      group: ['vehicle_id', 'brand.brand_id'],
      order: [['rent_count', 'DESC']],
      limit: parseInt(limit),
      raw: false
    });

    const formattedData = topVehicles.map(vehicle => ({
      vehicle_id: vehicle.vehicle_id,
      model: vehicle.model,
      license_plate: vehicle.license_plate,
      main_image_url: vehicle.main_image_url,
      price_per_day: parseFloat(vehicle.price_per_day),
      rent_count: vehicle.rent_count,
      brand: vehicle.brand,
      totalBookings: parseInt(vehicle.dataValues.totalBookings || 0),
      totalRevenue: parseFloat(vehicle.dataValues.totalRevenue || 0)
    }));

    res.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error("Error getting top vehicles:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách xe được thuê",
      error: error.message
    });
  }
};