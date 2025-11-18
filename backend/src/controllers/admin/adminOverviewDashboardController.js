import { Op } from 'sequelize';
import Booking from '../../models/Booking.js';
import User from '../../models/User.js';
import Vehicle from '../../models/Vehicle.js';

export const getAdminOverviewStats = async (req, res) => {

    /** =============================
     * 1. Total Revenue (Completed)
     * ============================== */
    const totalRevenueResult = await Booking.findAll({
        where: { status: 'completed' },
        attributes: [
            [Booking.sequelize.fn('SUM', Booking.sequelize.col('total_amount')), 'total_revenue']
        ],
        raw: true,
    });
    const totalRevenue = totalRevenueResult[0].total_revenue || 0;

    // convert to vND format
    const formatter = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    });
    const formattedTotalRevenue = formatter.format(totalRevenue);

    /** =============================
     * 2. Date Ranges
     * ============================== */
    const now = new Date();
    const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    /** =============================
     * 3. Renter Users
     * ============================== */
    const totalRenters = await User.count({
        where: { role: 'renter', is_active: true }
    });

    const totalRentersPreviousMonth = await User.count({
        where: {
            role: 'renter',
            is_active: true,
            created_at: {
                [Op.gte]: firstDayOfPreviousMonth,
                [Op.lte]: lastDayOfPreviousMonth,
            }
        }
    });

    const totalRentersCurrentMonth = await User.count({
        where: {
            role: 'renter',
            is_active: true,
            created_at: {
                [Op.gte]: firstDayOfCurrentMonth,
                [Op.lte]: now,
            }
        }
    });

    /** =============================
     * 4. Owner Users
     * ============================== */
    const totalOwners = await User.count({
        where: { role: 'owner', is_active: true }
    });

    const totalOwnersPreviousMonth = await User.count({
        where: {
            role: 'owner',
            is_active: true,
            created_at: {
                [Op.gte]: firstDayOfPreviousMonth,
                [Op.lte]: lastDayOfPreviousMonth,
            }
        }
    });

    const totalOwnersCurrentMonth = await User.count({
        where: {
            role: 'owner',
            is_active: true,
            created_at: {
                [Op.gte]: firstDayOfCurrentMonth,
                [Op.lte]: now,
            }
        }
    });

    /** =============================
     * 5. Completed Bookings
     * ============================== */
    const totalCompletedBookings = await Booking.count({
        where: { status: 'completed' }
    });

    const totalCompletedBookingsPreviousMonth = await Booking.count({
        where: {
            status: 'completed',
            created_at: {
                [Op.gte]: firstDayOfPreviousMonth,
                [Op.lte]: lastDayOfPreviousMonth,
            }
        }
    });

    const totalCompletedBookingsCurrentMonth = await Booking.count({
        where: {
            status: 'completed',
            created_at: {
                [Op.gte]: firstDayOfCurrentMonth,
                [Op.lte]: now,
            }
        }
    });

    /** =============================
     * 6. Response
     * ============================== */
    return res.status(200).json({
        totalRevenue: formattedTotalRevenue,
        totalRenters: {
            count: totalRenters,
            previousMonth: totalRentersPreviousMonth,
            currentMonth: totalRentersCurrentMonth,
        },
        totalOwners: {
            count: totalOwners,
            previousMonth: totalOwnersPreviousMonth,
            currentMonth: totalOwnersCurrentMonth,
        },
        totalCompletedBookings: {
            count: totalCompletedBookings,
            previousMonth: totalCompletedBookingsPreviousMonth,
            currentMonth: totalCompletedBookingsCurrentMonth,
        },
    });
};

export const getAdminCurrentBookings = async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            attributes: ["total_amount", "status"],
            include: [
                {
                    model: User,
                    as: "renter",
                    attributes: ["full_name", "email"],
                },
                {
                    model: Vehicle,
                    as: "vehicle", // <--- bắt buộc phải dùng alias
                    attributes: ["model"],
                },
            ],
            order: [["created_at", "DESC"]],
            limit: 10,
        });

        return res.status(200).json({ bookings });
    } catch (error) {
        console.error("Error fetching current bookings:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getAdminCurrentRegisteredUsers = async (req, res) => {
    // get 10 most recent registered users (renters and owners) , get fields :  full_name, email, role, created_at
    try {
        const users = await User.findAll({
            attributes: ['full_name', 'email', 'role', 'created_at', 'user_id'],
            where: {
                is_active: true,
            },
            order: [['created_at', 'DESC']],
            limit: 10,
        });
        return res.status(200).json({ users });
    } catch (error) {
        console.error("Error fetching current registered users:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}