import Booking from '../../models/Booking.js';
import { Op } from 'sequelize';
import BookingPayout from '../../models/BookingPayout.js';

// export const getNewRegisterUserDataByMonth = async (req, res) => {
//     try {
//         const months = Number(req.query?.months) || 6; // default to last 6 months

//         const labels = [];
//         const data = [];

//         const now = new Date();

//         for (let i = months - 1; i >= 0; i--) {
//             // calculate month start
//             const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

//             const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
//             const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1);

//             // label
//             const monthName = date.toLocaleString("default", { month: "long" });
//             labels.push(`${monthName} ${date.getFullYear()}`);

//             // count users created in this month
//             const count = await User.count({
//                 where: {
//                     created_at: {
//                         [Op.gte]: monthStart,
//                         [Op.lt]: monthEnd,
//                     },
//                 },
//             });

//             data.push(count);
//         }

//         return res.json({ labels, data });
//     } catch (error) {
//         console.error("Error fetching new register user data:", error);
//         return res.status(500).json({ message: "Internal server error" });
//     }
// };

// function to get total revenue from Booking model that have status 'completed' for current month like : 3,6,9,12 months last
export const getRevenueStatsForCompletedBookingInNumberOfMonths = async (req, res) => {
    try {
        // get number of months from query params
        const months = Number(req.query?.months) || 6; // default to last 6 months
        const labels = [];
        const data = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            // calculate month start
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1);
            // label
            const monthName = date.toLocaleString("default", { month: "long" });
            labels.push(`${monthName} ${date.getFullYear()}`);
            // sum total_amount from Booking model where status is 'completed' and created_at is in this month
            const totalRevenue = await Booking.sum('total_amount', {
                where: {
                    status: 'completed',
                    created_at: {
                        [Op.gte]: monthStart,
                        [Op.lt]: monthEnd,
                    },
                },
            });
            data.push(totalRevenue || 0);
        }
        return res.json({ labels, data });

    } catch (error) {
        console.error("Error fetching revenue stats for completed bookings:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// function to get status of booking :  "pending", // Chờ xác nhận
// "deposit_paid", // Đã đặt cọc
// "fully_paid", // Đã thanh toán toàn bộ
// "in_progress", // Đang thuê
// "completed", // Hoàn thành
// "cancel_requested", // Yêu cầu hủy
// "canceled" // Đã hủy
// return {data , labels}

export const getBookingStatusStats = async (req, res) => {
    try {
        const statuses = ["pending", "deposit_paid", "fully_paid", "in_progress", "completed", "cancel_requested", "canceled"];
        const labels = [];
        const data = [];
        for (const status of statuses) {
            const count = await Booking.count({
                where: {
                    status: status,
                },
            });
            // translate status to vietnamese
            let translatedStatus = "";
            switch (status) {
                case "pending":
                    translatedStatus = "Chờ xác nhận";
                    break;
                case "deposit_paid":
                    translatedStatus = "Đã đặt cọc";
                    break;
                case "fully_paid":
                    translatedStatus = "Đã thanh toán toàn bộ";
                    break;
                case "in_progress":
                    translatedStatus = "Đang thuê";
                    break;
                case "completed":
                    translatedStatus = "Hoàn thành";
                    break;
                case "cancel_requested":
                    translatedStatus = "Yêu cầu hủy";
                    break;
                case "canceled":
                    translatedStatus = "Đã hủy";
                    break;
                default:
                    translatedStatus = status;
            }
            labels.push(translatedStatus);
            data.push(count);
        }
        return res.json({ labels, data });
    } catch (error) {
        console.error("Error fetching booking status stats:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// function to count all payout status from booking payout model : "pending", "processing", "completed", "failed", "cancelled"
export const getPayoutStatusStats = async (req, res) => {

    try {
        const statuses = ["pending", "processing", "completed", "failed", "cancelled"];
        const labels = [];
        const data = [];
        for (const status of statuses) {
            const count = await BookingPayout.count({
                where: {
                    payout_status: status,
                },
            });
            // translate status to vietnamese
            let translatedStatus = "";
            switch (status) {
                case "pending":
                    translatedStatus = "Chờ xử lý";
                    break;
                case "processing":
                    translatedStatus = "Đang xử lý";
                    break;
                case "completed":
                    translatedStatus = "Hoàn thành";
                    break;
                case "failed":
                    translatedStatus = "Thất bại";
                    break;
                case "cancelled":
                    translatedStatus = "Đã hủy";
                    break;
                default:
                    translatedStatus = status;
            }
            labels.push(translatedStatus);
            data.push(count);
        }
        return res.json({ labels, data });
    } catch (error) {
        console.error("Error fetching payout status stats:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}