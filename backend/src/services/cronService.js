import cron from "node-cron";
import Booking from "../models/Booking.js";
import Vehicle from "../models/Vehicle.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import FeatureFlag from "../models/FeatureFlag.js";
import Brand from "../models/Brand.js";
import { checkVehicleInfoCore } from "../controllers/ai/generateCarDescription.js";
import { Op } from "sequelize";

/**
 * Auto-cancel confirmed bookings that haven't paid deposit within 15 minutes
 * Chạy mỗi 2 phút để kiểm tra và hủy các booking đã hết hạn thời gian đặt cọc
 */
const autoCancelExpiredBookings = async () => {
  const startTime = Date.now();
  const TIMEOUT_MS = 30000; // 30 giây timeout
  
  try {
    console.log("[CRON] Checking for confirmed bookings expired deposit window...");

    // Tạo timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Cron job timeout after 30 seconds')), TIMEOUT_MS);
    });

    // Tính thời gian 15 phút trước (deposit timeout)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Tìm các booking confirmed đã quá 15 phút (chưa thanh toán tiền cọc)
    const queryPromise = Booking.findAll({
      where: {
        status: "confirmed",
        updated_at: {
          [Op.lt]: fifteenMinutesAgo, // Được xác nhận trước 15 phút
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
      order: [['updated_at', 'ASC']], // Xử lý booking xác nhận sớm nhất trước
    });

    // Race between query và timeout
    const expiredBookings = await Promise.race([queryPromise, timeoutPromise]);

    if (expiredBookings.length === 0) {
      console.log("✅ [CRON] No expired bookings found");
      return;
    }

    console.log(`📋 [CRON] Found ${expiredBookings.length} confirmed booking(s) past deposit window`);

    // Xử lý từng booking hết hạn với batch processing
    const batchSize = 5;
    for (let i = 0; i < expiredBookings.length; i += batchSize) {
      const batch = expiredBookings.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (booking) => {
          try {
            console.log(`🗑️ [CRON] Auto-canceling booking ${booking.booking_id} due to unpaid deposit`);

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
                title: "Booking bị hủy do chưa thanh toán cọc",
                content: `Booking cho xe ${booking.vehicle.model} đã bị hủy tự động do khách không thanh toán tiền cọc trong 15 phút sau khi xác nhận.`,
                type: "rental",
                is_read: false,
              });
            }

            // Tạo thông báo cho renter
            await Notification.create({
              user_id: booking.renter_id,
              title: "Booking bị hủy do chưa thanh toán cọc",
              content: `Booking của bạn đã bị hủy tự động do không thanh toán tiền cọc trong thời gian quy định (15 phút) sau khi chủ xe xác nhận.`,
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
      `🎉 [CRON] Auto-cancel deposit process completed in ${duration}ms. Processed ${expiredBookings.length} booking(s)`
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`💥 [CRON] Error in auto-cancel deposit window (${duration}ms):`, error.message);
    
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

  // Chạy mỗi 2 phút để hủy các booking pending quá hạn chờ chủ xe chấp nhận
  cron.schedule("*/2 * * * *", autoCancelUnapprovedPendingBookings, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh",
  });

  console.log("⏰ [CRON] Auto-cancel pending job scheduled (every 2 minutes)");

  // Chạy mỗi 15 phút để thông báo thanh toán trước khi nhận xe
  cron.schedule("*/15 * * * *", notifyUnpaidBookingsBeforePickup, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh",
  });

  console.log("💰 [CRON] Payment reminder job scheduled (every 15 minutes)");

  // Có thể thêm các cron job khác ở đây
  // Ví dụ: cleanup old notifications, send reminder emails, etc.
  // Tự động duyệt xe pending khi bật cờ AUTO_APPROVE_VEHICLE
  cron.schedule("*/2 * * * *", autoApprovePendingVehicles, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh",
  });
  console.log("✅ [CRON] Auto-approve vehicles job scheduled (every 2 minutes)");
};

/**
 * Dừng tất cả cron jobs (dùng khi shutdown server)
 */
export const stopCronJobs = () => {
  console.log(" [CRON] Stopping all cron jobs...");
  cron.destroy();
};

/**
 * Thông báo cho người dùng chưa thanh toán đủ trước khi nhận xe 1 giờ
 * Chạy mỗi 15 phút để kiểm tra các booking sắp tới
 */
const notifyUnpaidBookingsBeforePickup = async () => {
  const startTime = Date.now();
  const TIMEOUT_MS = 30000; // 30 giây timeout
  
  try {
    console.log("[CRON] Checking for unpaid bookings before pickup...");

    // Tạo timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Payment reminder cron job timeout after 30 seconds')), TIMEOUT_MS);
    });

    // Tính thời gian 1 giờ tới
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    const now = new Date();

    // Tìm các booking chưa thanh toán đủ và sắp tới giờ nhận xe
    const queryPromise = Booking.findAll({
      where: {
        status: {
          [Op.in]: ["deposit_paid", "confirmed"] // Chưa thanh toán đủ
        },
        start_date: {
          [Op.between]: [now, oneHourFromNow] // Trong vòng 1 giờ tới
        },
        // Thêm điều kiện để tránh spam notification
        updated_at: {
          [Op.lt]: new Date(Date.now() - 30 * 60 * 1000) // Chỉ thông báo nếu booking đã được tạo/cập nhật trước 30 phút
        }
      },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["vehicle_id", "model", "license_plate"],
          required: true
        },
        {
          model: User,
          as: "renter",
          attributes: ["user_id", "full_name", "email"],
          required: true
        }
      ],
      limit: 50, // Giới hạn số lượng để tránh overload
      order: [['start_date', 'ASC']] // Ưu tiên booking sắp tới nhất
    });

    // Race between query và timeout
    const unpaidBookings = await Promise.race([queryPromise, timeoutPromise]);

    if (unpaidBookings.length === 0) {
      console.log("✅ [CRON] No unpaid bookings found before pickup time");
      return;
    }

    console.log(`📋 [CRON] Found ${unpaidBookings.length} unpaid booking(s) before pickup`);

    // Kiểm tra xem đã gửi thông báo chưa (để tránh spam)
    const recentNotifications = await Notification.findAll({
      where: {
        user_id: {
          [Op.in]: unpaidBookings.map(booking => booking.renter_id)
        },
        type: "payment_reminder",
        created_at: {
          [Op.gte]: new Date(Date.now() - 60 * 60 * 1000) // Trong vòng 1 giờ qua
        }
      },
      attributes: ['user_id', 'content']
    });

    // Tạo map để check notification đã gửi
    const notifiedUsers = new Set(
      recentNotifications
        .filter(notif => unpaidBookings.some(booking => 
          notif.content.includes(`#${booking.booking_id}`)
        ))
        .map(notif => notif.user_id)
    );

    // Xử lý từng booking với batch processing
    const batchSize = 5;
    let notificationsSent = 0;

    for (let i = 0; i < unpaidBookings.length; i += batchSize) {
      const batch = unpaidBookings.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (booking) => {
          try {
            // Skip nếu đã gửi thông báo cho user này rồi
            if (notifiedUsers.has(booking.renter_id)) {
              console.log(`⏭️ [CRON] Skipping notification for booking ${booking.booking_id} - already notified`);
              return;
            }

            const timeToPickup = Math.round((new Date(booking.start_date) - now) / (1000 * 60)); // phút
            const remainingAmount = parseFloat(booking.total_amount) - parseFloat(booking.total_paid || 0);

            console.log(`📢 [CRON] Sending payment reminder for booking ${booking.booking_id}`);

            // Tạo thông báo cho renter
            await Notification.create({
              user_id: booking.renter_id,
              title: "Nhắc nhở thanh toán trước khi nhận xe",
              content: `Bạn cần thanh toán thêm ${remainingAmount.toLocaleString('vi-VN')} VND cho booking #${booking.booking_id} (xe ${booking.vehicle.model}) trước khi nhận xe. Thời gian còn lại: ${timeToPickup} phút. Vui lòng hoàn tất thanh toán để đảm bảo nhận xe đúng giờ.`,
              type: "payment_reminder",
              is_read: false,
            });

            notificationsSent++;
            console.log(`✅ [CRON] Payment reminder sent for booking ${booking.booking_id} to user ${booking.renter.full_name}`);
            
          } catch (error) {
            console.error(`❌ [CRON] Error sending payment reminder for booking ${booking.booking_id}:`, error.message);
          }
        })
      );
    }

    const duration = Date.now() - startTime;
    console.log(`🎉 [CRON] Payment reminder process completed in ${duration}ms. Sent ${notificationsSent} notification(s)`);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`💥 [CRON] Error in payment reminder job (${duration}ms):`, error.message);
    
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
 * Auto-cancel pending bookings that wait over 15 minutes without owner approval
 * Hủy các booking ở trạng thái pending nếu quá 15 phút mà chủ xe chưa chấp nhận
 */
const autoCancelUnapprovedPendingBookings = async () => {
  const startTime = Date.now();
  const TIMEOUT_MS = 30000; // 30 giây timeout

  try {
    console.log("[CRON] Checking for pending bookings over approval window...");

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Pending approval cron job timeout after 30 seconds')), TIMEOUT_MS);
    });

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const queryPromise = Booking.findAll({
      where: {
        status: "pending",
        created_at: {
          [Op.lt]: fifteenMinutesAgo,
        },
      },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["vehicle_id", "model", "owner_id"],
          required: false,
        },
      ],
      limit: 50,
      order: [["created_at", "ASC"]],
    });

    const expiredPendings = await Promise.race([queryPromise, timeoutPromise]);

    if (expiredPendings.length === 0) {
      console.log("✅ [CRON] No pending bookings exceeded approval window");
      return;
    }

    console.log(`📋 [CRON] Found ${expiredPendings.length} pending booking(s) exceeded approval window`);

    const batchSize = 5;
    for (let i = 0; i < expiredPendings.length; i += batchSize) {
      const batch = expiredPendings.slice(i, i + batchSize);

      await Promise.allSettled(
        batch.map(async (booking) => {
          try {
            console.log(`🗑️ [CRON] Auto-canceling pending booking ${booking.booking_id} due to no owner approval`);

            await booking.update({
              status: "canceled",
              updated_at: new Date(),
            });

            if (booking.points_used > 0) {
              await User.increment("points", {
                by: booking.points_used,
                where: { user_id: booking.renter_id },
              });
              console.log(`💰 [CRON] Refunded ${booking.points_used} points to user ${booking.renter_id}`);
            }

            if (booking.vehicle && booking.vehicle.owner_id) {
              await Notification.create({
                user_id: booking.vehicle.owner_id,
                title: "Booking bị hủy do chờ duyệt quá hạn",
                content: `Booking cho xe ${booking.vehicle.model} đã bị hủy tự động do không được chủ xe chấp nhận trong vòng 15 phút.`,
                type: "rental",
                is_read: false,
              });
            }

            await Notification.create({
              user_id: booking.renter_id,
              title: "Booking đã bị hủy do chờ duyệt quá lâu",
              content: `Booking của bạn đã bị hủy tự động vì chủ xe không chấp nhận trong thời gian quy định (15 phút).`,
              type: "rental",
              is_read: false,
            });

            console.log(`✅ [CRON] Successfully auto-canceled pending booking ${booking.booking_id}`);
          } catch (error) {
            console.error(`❌ [CRON] Error canceling pending booking ${booking.booking_id}:`, error.message);
          }
        })
      );
    }

    const duration = Date.now() - startTime;
    console.log(`🎉 [CRON] Pending approval cancel process completed in ${duration}ms. Processed ${expiredPendings.length} booking(s)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`💥 [CRON] Error in pending approval cancel job (${duration}ms):`, error.message);
    if (error.name === 'SequelizeDatabaseError') {
      console.error('🔍 [CRON] Database error details:', { sql: error.sql, parameters: error.parameters });
    }
  }
};

// Export function để test manual
export { autoCancelExpiredBookings, notifyUnpaidBookingsBeforePickup, autoCancelUnapprovedPendingBookings };

// ====== Auto approve/reject vehicles pending ======
const autoApprovePendingVehicles = async () => {
  const startTime = Date.now();
  try {
    const flag = await FeatureFlag.findOne({ where: { key: "AUTO_APPROVE_VEHICLE" } });
    if (!flag || flag.enabled !== true) {
      return;
    }

    const pendings = await Vehicle.findAll({
      where: { approvalStatus: "pending" },
      include: [
        { model: User, as: "owner", attributes: ["user_id", "full_name", "email"] },
        { model: Brand, as: "brand", attributes: ["brand_id", "name"] },
      ],
      order: [["created_at", "ASC"]],
      limit: 20,
    });

    if (pendings.length === 0) return;

    for (const v of pendings) {
      try {
        const result = await checkVehicleInfoCore({ vehicle: v.toJSON() });
        const fail = Number(result?.summary?.fail || 0);
        if (fail > 0) {
          await v.update({ approvalStatus: "rejected", updated_at: new Date() });
          const reason = buildRejectReasonFromResult(result, v.model);
          await Notification.create({
            user_id: v.owner?.user_id,
            title: "Xe bị từ chối",
            content: `Xe ${v.model} (${v.license_plate}) đã bị từ chối. Lý do:\n${reason}`,
            type: "alert",
            is_read: false,
          });
        } else {
          await v.update({ approvalStatus: "approved", updated_at: new Date() });
          try {
            await Notification.create({
              user_id: v.owner?.user_id,
              title: "Xe đã được duyệt",
              content: `Xe ${v.model} (${v.license_plate}) đã được duyệt, bây giờ người dùng có thể thuê.`,
              type: "rental",
              is_read: false,
            });
          } catch (e) {
            console.error("[CRON] Error creating notification for approved vehicle:", e.message);
          }
        }
      } catch (e) {
        console.error("[CRON] Auto-approve vehicle error:", e.message);
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    const duration = Date.now() - startTime;
    console.log(`[CRON] Auto-approve vehicles completed in ${duration}ms, processed ${pendings.length}`);
  } catch (error) {
    console.error("[CRON] Error in autoApprovePendingVehicles:", error.message);
  }
};

const buildRejectReasonFromResult = (result, vehicleModel) => {
  try {
    if (!result || !Array.isArray(result.checks)) return "";
    const items = (result.checks || []).filter((c) => c && (c.status === "fail" || c.status === "warn"));
    if (items.length === 0) return "";
    const lines = [];
    lines.push(`Xe ${vehicleModel} có vấn đề cần chỉnh sửa.`);
    const failCount = items.filter((c) => c.status === "fail").length;
    const warnCount = items.filter((c) => c.status === "warn").length;
    if (failCount > 0) lines.push(`Lỗi nghiêm trọng: ${failCount}`);
    if (warnCount > 0) lines.push(`Cảnh báo: ${warnCount}`);
    items.forEach((c) => {
      const label = String(c.label || '').trim();
      const detail = String(c.detail || '').trim();
      const statusText = c.status === 'fail' ? 'Lỗi' : 'Cảnh báo';
      lines.push(`- ${statusText} ${label}: ${detail}. Gợi ý: vui lòng kiểm tra và cập nhật thông tin "${label}" cho chính xác.`);
    });
    return lines.join("\n");
  } catch {
    return "";
  }
};
