import db from "../../models/index.js";
import { Op } from "sequelize";
import sequelize from "../../config/db.js";

const { Booking, Vehicle, User, Brand } = db;

// API lấy tổng quan dashboard
export const getOverviewStats = async (req, res) => {
  try {
    console.log('=== getOverviewStats API called ===');
    console.log('Request user:', req.user);
    
    const ownerId = req.user?.userId;
    if (!ownerId) {
      console.log('ERROR: No ownerId found in request');
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng"
      });
    }
    
    console.log('Processing overview stats for ownerId:', ownerId);

    // Lấy toàn bộ xe của owner (tất cả trạng thái: pending, approved, rejected, blocked)
    const ownerVehicles = await Vehicle.findAll({
      where: { 
        owner_id: ownerId,
        
      },
      attributes: ['vehicle_id']
    });

    const vehicleIds = ownerVehicles.map(v => v.vehicle_id);

    if (vehicleIds.length === 0) {
      return res.json({
        success: true,
        data: {
          totalRevenue: 0,
          totalBookings: 0,
          totalVehicles: 0
        }
      });
    }

    // Tính tổng doanh thu từ các booking đã hoàn thành và confirmed
    const totalRevenueResult = await Booking.findOne({
      where: {
        vehicle_id: { [Op.in]: vehicleIds },
        status: { [Op.in]: ['completed', 'in_progress', 'ongoing', 'pending', 'fully_paid'] } // Bao gồm cả confirmed và ongoing
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalRevenue']
      ],
      raw: true
    });

    // Đếm tổng số đơn thuê (các trạng thái hợp lệ)
    const totalBookings = await Booking.count({
      where: {
        vehicle_id: { [Op.in]: vehicleIds },
        status: { [Op.in]: ['completed', 'in_progress', 'ongoing', 'pending', 'fully_paid'] }
      }
    });

    // Đếm tổng số xe đã được phê duyệt
    const totalVehicles = await Vehicle.count({
      where: {
        vehicle_id: { [Op.in]: vehicleIds },
        approvalStatus: 'approved'
      }
    });

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
    console.log('=== getRevenueChart API called ===');
    console.log('Request query:', req.query);
    console.log('Request user:', req.user);
    
    const ownerId = req.user?.userId;
    if (!ownerId) {
      console.log('ERROR: No ownerId found');
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng"
      });
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentQuarter = Math.ceil(currentMonth / 3);
    
    const { period = 'year', year = currentYear, month = currentMonth, quarter = currentQuarter } = req.query;
    console.log('Parsed params:', { period, year, month, quarter, ownerId });

    // Lấy danh sách xe của owner với điều kiện chặt chẽ
    const ownerVehicles = await Vehicle.findAll({
      where: { 
        owner_id: ownerId,
      },
      attributes: ['vehicle_id']
    });

    const vehicleIds = ownerVehicles.map(v => v.vehicle_id);
    console.log('Owner vehicles found:', ownerVehicles.length);
    console.log('Vehicle IDs:', vehicleIds);

    // Hàm tạo dữ liệu đầy đủ cho tháng hiện tại
    const generateFullMonthData = (year, month) => {
      const daysInMonth = new Date(year, month, 0).getDate();
      const fullData = [];
      
      console.log(`Generating full month data for ${year}-${month}, days: ${daysInMonth}`);
      
      for (let day = 1; day <= daysInMonth; day++) {
        // Tạo date string trực tiếp để tránh vấn đề timezone
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        fullData.push({
          period: dateStr,
          revenue: 0,
          bookingCount: 0
        });
      }
      
      console.log('Generated full month data:', fullData.slice(0, 5), '...', fullData.slice(-5));
      return fullData;
    };

    if (vehicleIds.length === 0) {
      // Nếu không có xe, vẫn trả về dữ liệu đầy đủ với giá trị 0
      if (period === 'day') {
        const fullData = generateFullMonthData(parseInt(year), parseInt(month));
        return res.json({
          success: true,
          data: fullData
        });
      }
      return res.json({
        success: true,
        data: []
      });
    }

    let dateFormat, groupBy;
    let whereCondition = {
      vehicle_id: { [Op.in]: vehicleIds },
      status: { [Op.in]: ['completed', 'in_progress', 'ongoing', 'pending', 'fully_paid'] }
    };

    // Xác định format ngày và điều kiện group by theo period
    switch (period) {
      case 'day':
        // Lấy dữ liệu theo ngày trong tháng hiện tại
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59);
        
        console.log(`Date range for ${year}-${month}:`, {
          startOfMonth: startOfMonth.toISOString(),
          endOfMonth: endOfMonth.toISOString()
        });
        
        whereCondition.created_at = {
          [Op.between]: [startOfMonth, endOfMonth]
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
      case 'quarter':
        // Lấy dữ liệu các tháng trong một quý của năm
        // Sử dụng giá trị mặc định nếu không được cung cấp
        const q = parseInt(quarter) || currentQuarter;
        const y = parseInt(year) || currentYear;
        
        // Validate quarter (1-4)
        if (q < 1 || q > 4) {
          return res.status(400).json({
            success: false,
            message: 'Quarter phải là số từ 1 đến 4'
          });
        }
        const startMonth = (q - 1) * 3 + 1; // 1,4,7,10
        const endMonth = startMonth + 2;    // 3,6,9,12
        whereCondition.created_at = {
          [Op.and]: [
            sequelize.where(sequelize.fn('YEAR', sequelize.col('created_at')), y),
            sequelize.where(sequelize.fn('MONTH', sequelize.col('created_at')), { [Op.between]: [startMonth, endMonth] })
          ]
        };
        dateFormat = '%Y-%m';
        groupBy = [
          sequelize.fn('YEAR', sequelize.col('created_at')),
          sequelize.fn('MONTH', sequelize.col('created_at'))
        ];
        break;
      case 'year':
        // Lấy dữ liệu 5 năm gần nhất tính đến năm được chọn
        // Nếu frontend gửi selectedYear, dùng làm mốc; nếu không, dùng năm hiện tại
        const endYear = parseInt(year) || new Date().getFullYear();
        const startYear = endYear - 4;
        const startDate = new Date(startYear, 0, 1);
        const endDate = new Date(endYear, 11, 31, 23, 59, 59);
        whereCondition.created_at = {
          [Op.between]: [startDate, endDate]
        };
        dateFormat = '%Y';
        groupBy = sequelize.fn('YEAR', sequelize.col('created_at'));
        break;
      default:
        dateFormat = '%Y-%m-%d';
        groupBy = sequelize.fn('DATE', sequelize.col('created_at'));
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

    console.log('Raw revenue data from database:', revenueData);

    // Xử lý dữ liệu theo period
    let finalData = revenueData.map(item => ({
      period: item.period,
      revenue: parseFloat(item.revenue) || 0,
      bookingCount: parseInt(item.bookingCount) || 0
    }));

    console.log('Processed revenue data:', finalData);

    // Nếu là xem theo ngày, tạo dữ liệu đầy đủ cho tháng
    if (period === 'day') {
      const fullMonthData = generateFullMonthData(parseInt(year), parseInt(month));
      const revenueMap = new Map(finalData.map(item => [item.period, item]));
      
      finalData = fullMonthData.map(dayData => {
        const existingData = revenueMap.get(dayData.period);
        return existingData || dayData;
      });

      // Đảm bảo chỉ hiển thị các ngày thuộc tháng được chọn
      const monthPrefix = `${year}-${month.toString().padStart(2, '0')}`;
      finalData = finalData.filter(item => item.period.startsWith(monthPrefix));
      
      console.log('Filtered final data for month:', monthPrefix, finalData.length, 'days');
    }

    // Nếu là xem theo tháng, tạo dữ liệu đủ 12 tháng
    if (period === 'month') {
      const months = Array.from({ length: 12 }, (_, i) => i + 1);
      const monthLabels = months.map(m => `${year}-${m.toString().padStart(2, '0')}`);
      const revenueMap = new Map(finalData.map(item => [item.period, item]));
      finalData = monthLabels.map(label => revenueMap.get(label) || { period: label, revenue: 0, bookingCount: 0 });
      console.log('Filled full 12 months data for year:', year, finalData.length, 'months');
    }

    // Nếu là xem theo quý, tạo dữ liệu đủ các tháng trong quý
    if (period === 'quarter') {
      const q = parseInt(quarter) || currentQuarter;
      const y = parseInt(year) || currentYear;
      const startMonth = (q - 1) * 3 + 1;
      const endMonth = startMonth + 2;
      const months = Array.from({ length: 3 }, (_, i) => startMonth + i);
      const monthLabels = months.map(m => `${y}-${m.toString().padStart(2, '0')}`);
      const revenueMap = new Map(finalData.map(item => [item.period, item]));
      finalData = monthLabels.map(label => revenueMap.get(label) || { period: label, revenue: 0, bookingCount: 0 });
      console.log('Filled full quarter months for year:', y, 'quarter:', q, finalData.length, 'months');
    }

    // Nếu là xem theo năm, tạo dữ liệu đủ 5 năm gần nhất
    if (period === 'year') {
      const endYear = parseInt(year) || new Date().getFullYear();
      const years = Array.from({ length: 5 }, (_, i) => (endYear - 4) + i);
      const revenueMap = new Map(finalData.map(item => [String(item.period), item]));
      finalData = years.map(y => revenueMap.get(String(y)) || { period: String(y), revenue: 0, bookingCount: 0 });
      console.log('Filled full 5-year range:', years, 'items:', finalData.length);
    }

    console.log('Final chart data:', finalData);
    console.log('=== getRevenueChart API completed successfully ===');
    
    return res.status(200).json({
      success: true,
      data: finalData
    });

  } catch (error) {
    console.error('=== ERROR in getRevenueChart ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy dữ liệu biểu đồ doanh thu"
    });
  }
};

// API lấy danh sách người thuê theo số lượt thuê
export const getTopRenters = async (req, res) => {
  try {
    console.log('=== getTopRenters API called ===');
    console.log('Request user:', req.user);
    
    const ownerId = req.user?.userId;
    if (!ownerId) {
      console.log('ERROR: No ownerId found in request');
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng"
      });
    }
    
    console.log('Processing top renters for ownerId:', ownerId);

    const { limit = 10 } = req.query;

    // Lấy danh sách xe của owner (chỉ xe đã được phê duyệt)
    const ownerVehicles = await Vehicle.findAll({
      where: { 
        owner_id: ownerId,
      },
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
        vehicle_id: { [Op.in]: vehicleIds },
        status: { [Op.in]: ['completed', 'in_progress', 'ongoing', 'pending', 'fully_paid'] } 
      },
      include: [
        {
          model: User,
          as: "renter",
          attributes: ["user_id", "full_name", "email", "avatar_url"],
          required: true
        }
      ],
      attributes: [
        'renter_id',
        [sequelize.fn('COUNT', sequelize.col('booking_id')), 'rentCount'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalSpent']
      ],
      group: [
        'renter_id', 
        'renter.user_id', 
        'renter.full_name', 
        'renter.email', 
        'renter.avatar_url'
      ],
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
    console.log('=== getTopVehicles API called ===');
    console.log('Request user:', req.user);
    
    const ownerId = req.user?.userId;
    if (!ownerId) {
      console.log('ERROR: No ownerId found in request');
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng"
      });
    }
    
    console.log('Processing top vehicles for ownerId:', ownerId);

    const { limit = 10 } = req.query;

    // Sử dụng subquery để đếm booking cho mỗi xe
    const topVehicles = await Vehicle.findAll({
      where: { 
        owner_id: ownerId,
      },
      include: [
        {
          model: Brand,
          as: "brand",
          attributes: ["brand_id", "name", "logo_url"],
          required: false
        }
      ],
      attributes: [
        'vehicle_id',
        'model',
        'license_plate',
        'main_image_url',
        'price_per_day',
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM bookings
            WHERE bookings.vehicle_id = Vehicle.vehicle_id
            AND bookings.status IN ('completed', 'in_progress', 'ongoing', 'pending', 'fully_paid')
          )`),
          'rent_count'
        ],
        [
          sequelize.literal(`(
            SELECT COALESCE(SUM(total_amount), 0)
            FROM bookings
            WHERE bookings.vehicle_id = Vehicle.vehicle_id
            AND bookings.status IN ('completed', 'in_progress', 'ongoing', 'pending', 'fully_paid')
          )`),
          'totalRevenue'
        ]
      ],
      order: [
        [sequelize.literal('rent_count'), 'DESC'],
        ['vehicle_id', 'ASC'] // Secondary sort for consistent ordering
      ],
      limit: parseInt(limit),
      raw: false
    });

    console.log('Raw vehicles data:', topVehicles.map(v => ({
      id: v.vehicle_id,
      model: v.model,
      rent_count: v.dataValues.rent_count
    })));

    const formattedData = topVehicles.map(vehicle => ({
      vehicle_id: vehicle.vehicle_id,
      model: vehicle.model,
      license_plate: vehicle.license_plate,
      main_image_url: vehicle.main_image_url,
      price_per_day: parseFloat(vehicle.price_per_day),
      rent_count: parseInt(vehicle.dataValues.rent_count || 0),
      brand: vehicle.brand,
      total_paid: parseFloat(vehicle.dataValues.totalRevenue || 0)
    }));

    console.log('Formatted vehicles data:', formattedData);

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

//API lấy lịch sử thuê xe của các xe được thuê nhiều nhất
export const getTopVehiclesRentalHistory = async (req, res) => {
  try {
    const ownerId = req.user?.userId;
    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng",
      });
    }

    const { vehicle_id, limit = 10 } = req.query;

    if (!vehicle_id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu tham số vehicle_id",
      });
    }

    // Đảm bảo xe thuộc về owner hiện tại
    const vehicle = await Vehicle.findOne({
      where: { vehicle_id, owner_id: ownerId },
      attributes: ["vehicle_id", "model", "license_plate", "main_image_url"],
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy xe hoặc bạn không có quyền truy cập",
      });
    }

    // Lấy lịch sử booking của xe
    const bookings = await Booking.findAll({
      where: {
        vehicle_id,
        // Lấy mọi lượt thuê để hiển thị lịch sử đầy đủ
        status: {
          [Op.in]: [
            
            "completed"
            
          ],
        },
      },
      include: [
        {
          model: User,
          as: "renter",
          attributes: ["user_id", "full_name", "email", "avatar_url"],
          required: false,
        },
      ],
      attributes: [
        "booking_id",
        "start_date",
        "start_time",
        "end_date",
        "end_time",
        "status",
        "total_amount",
        "created_at",
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
    });

    const formatted = bookings.map((b) => ({
      booking_id: b.booking_id,
      start_date: b.start_date,
      start_time: b.start_time,
      end_date: b.end_date,
      end_time: b.end_time,
      status: b.status,
      total_amount: parseFloat(b.total_amount || 0),
      renter: b.renter
        ? {
            user_id: b.renter.user_id,
            full_name: b.renter.full_name,
            email: b.renter.email,
            avatar_url: b.renter.avatar_url,
          }
        : null,
    }));

    return res.json({
      success: true,
      data: {
        vehicle: {
          vehicle_id: vehicle.vehicle_id,
          model: vehicle.model,
          license_plate: vehicle.license_plate,
          main_image_url: vehicle.main_image_url,
        },
        bookings: formatted,
      },
    });

  } catch (error) {
    console.error("Error getting top vehicles rental history:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy lịch sử thuê xe của các xe được thuê nhiều nhất",
      error: error.message
    });
  }
};
