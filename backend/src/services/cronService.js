import cron from "node-cron";
import Booking from "../models/Booking.js";
import Vehicle from "../models/Vehicle.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { Op } from "sequelize";

/**
 * Auto-cancel expired pending bookings
 * Chạy mỗi 2 phút để kiểm tra và hủy các booking đã hết hạn
 */
const autoCancelExpiredBookings = async () => {
  const startTime = Date.now();
  const TIMEOUT_MS = 30000; // 30 giây timeout
  
  try {
    console.log("[CRON] Checking for expired pending bookings...");

    // Tạo timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Cron job timeout after 30 seconds')), TIMEOUT_MS);
    });

    // Tính thời gian 15 phút trước (booking timeout)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Tìm các booking pending đã quá 15 phút với query tối ưu
    const queryPromise = Booking.findAll({
      where: {
        status: "pending",
        created_at: {
          [Op.lt]: fifteenMinutesAgo, // Tạo trước 15 phút
        },
      },
      include: [
        {
          model: Vehicle,
          as: "vehicle", 
          attributes: ["vehicle_id", "model", "owner_id"],
          required: false, // LEFT JOIN để tránh lỗi nếu vehicle bị xóa
        },
      ],
      limit: 50, // Giới hạn số lượng để tránh overload
      order: [['created_at', 'ASC']], // Xử lý booking cũ nhất trước
    });

    // Race between query và timeout
    const expiredBookings = await Promise.race([queryPromise, timeoutPromise]);

    if (expiredBookings.length === 0) {
      console.log("✅ [CRON] No expired bookings found");
      return;
    }

    console.log(`📋 [CRON] Found ${expiredBookings.length} expired booking(s)`);

    // Xử lý từng booking hết hạn với batch processing
    const batchSize = 5;
    for (let i = 0; i < expiredBookings.length; i += batchSize) {
      const batch = expiredBookings.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (booking) => {
          try {
            console.log(`🗑️ [CRON] Auto-canceling booking ${booking.booking_id}`);

            // Cập nhật status thành canceled
            await booking.update({
              status: "canceled",
              updated_at: new Date(),
            });

            // Hoàn lại điểm thưởng nếu có
            if (booking.points_used > 0) {
              await User.increment("points", {
                by: booking.points_used,
                where: { user_id: booking.renter_id },
              });
              console.log(
                `💰 [CRON] Refunded ${booking.points_used} points to user ${booking.renter_id}`
              );
            }

            // Tạo thông báo cho owner
            if (booking.vehicle && booking.vehicle.owner_id) {
              await Notification.create({
                user_id: booking.vehicle.owner_id,
                title: "Booking đã hết hạn",
                content: `Booking cho xe ${booking.vehicle.model} đã bị hủy tự động do hết thời gian thanh toán.`,
                type: "rental",
                is_read: false,
              });
            }

            // Tạo thông báo cho renter
            await Notification.create({
              user_id: booking.renter_id,
              title: "Booking đã hết hạn",
              content: `Booking của bạn đã bị hủy tự động do không thanh toán trong thời gian quy định (15 phút).`,
              type: "rental",
              is_read: false,
            });

            console.log(
              `✅ [CRON] Successfully auto-canceled booking ${booking.booking_id}`
            );
          } catch (error) {
            console.error(
              `❌ [CRON] Error canceling booking ${booking.booking_id}:`,
              error.message
            );
          }
        })
      );
    }

    const duration = Date.now() - startTime;
    console.log(
      `🎉 [CRON] Auto-cancel process completed in ${duration}ms. Processed ${expiredBookings.length} booking(s)`
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`💥 [CRON] Error in auto-cancel expired bookings (${duration}ms):`, error.message);
    
    // Log chi tiết lỗi để debug
    if (error.name === 'SequelizeDatabaseError') {
      console.error('🔍 [CRON] Database error details:', {
        sql: error.sql,
        parameters: error.parameters
      });
    }
  }
};

/**
 * Khởi tạo và bắt đầu các cron jobs
 */
export const initializeCronJobs = () => {
  console.log("🚀 [CRON] Initializing cron jobs...");

  // Chạy mỗi 2 phút để kiểm tra booking hết hạn (giảm tải hệ thống)
  cron.schedule("*/2 * * * *", autoCancelExpiredBookings, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh",
  });

  console.log("⏰ [CRON] Auto-cancel booking job scheduled (every 2 minutes)");

  // Có thể thêm các cron job khác ở đây
  // Ví dụ: cleanup old notifications, send reminder emails, etc.
};

/**
 * Dừng tất cả cron jobs (dùng khi shutdown server)
 */
export const stopCronJobs = () => {
  console.log(" [CRON] Stopping all cron jobs...");
  cron.destroy();
};

// Export function để test manual
export { autoCancelExpiredBookings };
