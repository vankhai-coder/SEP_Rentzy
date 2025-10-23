import cron from 'node-cron';
import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { Op } from 'sequelize';

/**
 * Auto-cancel expired pending bookings
 * Chạy mỗi phút để kiểm tra và hủy các booking đã hết hạn
 */
const autoCancelExpiredBookings = async () => {
  try {
    console.log('🔄 [CRON] Checking for expired pending bookings...');
    
    // Tính thời gian 15 phút trước (booking timeout)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    // Tìm các booking pending đã quá 15 phút
    const expiredBookings = await Booking.findAll({
      where: {
        status: 'pending',
        created_at: {
          [Op.lt]: fifteenMinutesAgo // Tạo trước 15 phút
        }
      },
      include: [
        {
          model: Vehicle,
          attributes: ['vehicle_id', 'model', 'owner_id']
        }
      ]
    });

    if (expiredBookings.length === 0) {
      console.log('✅ [CRON] No expired bookings found');
      return;
    }

    console.log(`🚨 [CRON] Found ${expiredBookings.length} expired booking(s)`);

    // Xử lý từng booking hết hạn
    for (const booking of expiredBookings) {
      try {
        console.log(`🗑️ [CRON] Auto-canceling booking ${booking.booking_id}`);
        
        // Cập nhật status thành canceled
        await booking.update({
          status: 'canceled',
          updated_at: new Date()
        });

        // Hoàn lại điểm thưởng nếu có
        if (booking.points_used > 0) {
          await User.increment('points', {
            by: booking.points_used,
            where: { user_id: booking.renter_id }
          });
          console.log(`💰 [CRON] Refunded ${booking.points_used} points to user ${booking.renter_id}`);
        }

        // Tạo thông báo cho owner
        if (booking.Vehicle && booking.Vehicle.owner_id) {
          await Notification.create({
            user_id: booking.Vehicle.owner_id,
            title: 'Booking đã hết hạn',
            content: `Booking cho xe ${booking.Vehicle.model} đã bị hủy tự động do hết thời gian thanh toán.`,
            type: 'rental',
            is_read: false
          });
        }

        // Tạo thông báo cho renter
        await Notification.create({
          user_id: booking.renter_id,
          title: 'Booking đã hết hạn',
          content: `Booking của bạn đã bị hủy tự động do không thanh toán trong thời gian quy định (15 phút).`,
          type: 'rental',
          is_read: false
        });

        console.log(`✅ [CRON] Successfully auto-canceled booking ${booking.booking_id}`);
        
      } catch (error) {
        console.error(`❌ [CRON] Error canceling booking ${booking.booking_id}:`, error);
      }
    }

    console.log(`🎯 [CRON] Auto-cancel process completed. Processed ${expiredBookings.length} booking(s)`);
    
  } catch (error) {
    console.error('❌ [CRON] Error in auto-cancel expired bookings:', error);
  }
};

/**
 * Khởi tạo và bắt đầu các cron jobs
 */
export const initializeCronJobs = () => {
  console.log('🚀 [CRON] Initializing cron jobs...');
  
  // Chạy mỗi phút để kiểm tra booking hết hạn
  cron.schedule('* * * * *', autoCancelExpiredBookings, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh"
  });
  
  console.log('✅ [CRON] Auto-cancel booking job scheduled (every minute)');
  
  // Có thể thêm các cron job khác ở đây
  // Ví dụ: cleanup old notifications, send reminder emails, etc.
};

/**
 * Dừng tất cả cron jobs (dùng khi shutdown server)
 */
export const stopCronJobs = () => {
  console.log('🛑 [CRON] Stopping all cron jobs...');
  cron.destroy();
};

// Export function để test manual
export { autoCancelExpiredBookings };