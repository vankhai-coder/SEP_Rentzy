import { Op } from "sequelize";
import User from "../../models/User.js";

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

        if (isActive) {
            // check if isActive is either 'active' or 'inactive'
            whereClause.is_active = isActive === 'active' ? true : false;
        }

        const offset = (page - 1) * limit;

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