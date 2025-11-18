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