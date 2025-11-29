import { Op } from "sequelize";
import User from "../../models/User.js";
import { banUnbanNotificationTemplate } from "../../utils/email/templates/emailTemplate.js";
import { sendEmail } from "../../utils/email/sendEmail.js";
export const getUserManagementStats = async (req, res) => {
    try {
        // get total number of users 
        const totalUsers = await User.count();

        // get number of active users (is_active: true)
        const activeUsers = await User.count({ where: { is_active: true } });

        // get number of user that have role : 'renter'
        const renterUsers = await User.count({ where: { role: 'renter' } });

        // get number of user that have role : 'owner'
        const ownerUsers = await User.count({ where: { role: 'owner' } });

        // return response with stats
        res.status(200).json({
            totalUsers,
            activeUsers,
            renterUsers,
            ownerUsers
        });

    } catch (error) {
        console.error("Error fetching user management stats:", error);
        res.status(500).json({ message: "Internal server error" });
    }

}


//  const response = await axiosInstance.get('/api/admin/user-management/users', {
//       params: {
//         nameOrEmail: searchFilter.nameOrEmail,
//         role: searchFilter.role,
//         isActive: searchFilter.isActive,
//         page: currentPage,
//         limit: USERS_PER_PAGE,
//       }
//     });

export const getUsers = async (req, res) => {
    try {
        const { nameOrEmail, role, isActive, page = 1, limit = 10 } = req.query;

        console.log(role);

        const whereClause = {};

        if (nameOrEmail) {
            whereClause[Op.or] = [
                { full_name: { [Op.like]: `%${nameOrEmail}%` } },
                { email: { [Op.like]: `%${nameOrEmail}%` } }
            ];
        }

        if (role) {
            // check role is either : 'renter' or 'owner' 
            if (role === 'renter' || role === 'owner') {
                whereClause.role = role;
            }
        }
        // exclude role "admin" and remaining filters role : 
        if (!role) {
            whereClause.role = { [Op.not]: 'admin' };
        }

        if (isActive) {
            // check if isActive is either 'active' or 'inactive'
            whereClause.is_active = isActive === 'active' ? true : false;
        }


        const offset = (page - 1) * limit;

        // log whereClause
        console.log("whereClause:", whereClause);

        const { rows: users, count: totalUsers } = await User.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']],
            // get only necessary fields : avatar_url , user_id,full_name,email,role,is_active,created_at,points
            attributes: ['user_id', 'avatar_url', 'full_name', 'email', 'role', 'is_active', 'created_at', 'points']
        });

        const totalPages = Math.ceil(totalUsers / limit);

        res.status(200).json({
            users,
            totalPages
        });

    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// ban or unban user
export const toggleUserActiveStatus = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // toggle is_active status
        user.is_active = !user.is_active;
        await user.save();

        const isBanned = !user.is_active;

        // send email notification to user about account status change
        try {
            // send email notification to user about approval : 
            await sendEmail({
                from: process.env.GMAIL_USER,
                to: user.email, // get email from req.body
                subject: 'Tài khoản của bạn đã  ' + (isBanned ? 'bị khóa' : 'được mở khóa'),
                html: banUnbanNotificationTemplate(isBanned),

            });
            // console log send email success : 
            console.log(`Ban/Unban email sent to ${user.email} successfully.`);
        } catch (error) {
            console.error('Error sending ban/unban email:', error);
        }

        res.status(200).json({ message: `User has been ${user.is_active ? 'unbanned' : 'banned'} successfully.` });

    } catch (error) {
        console.error("Error toggling user active status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}