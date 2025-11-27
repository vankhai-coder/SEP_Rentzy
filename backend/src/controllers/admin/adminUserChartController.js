// controllers/admin/getNewRegisterUserData.js
import RegisterOwner from "../../models/RegisterOwner.js";
import User from "../../models/User.js";
import { Op } from "sequelize";

export const getNewRegisterUserDataByMonth = async (req, res) => {
    try {
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

            // count users created in this month
            const count = await User.count({
                where: {
                    created_at: {
                        [Op.gte]: monthStart,
                        [Op.lt]: monthEnd,
                    },
                },
            });

            data.push(count);
        }

        return res.json({ labels, data });
    } catch (error) {
        console.error("Error fetching new register user data:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// function to get number of users by role : renter , owner , admin and return {data , labels}
export const getUserCountByRole = async (req, res) => {
    try {
        const roles = ['renter', 'owner', 'admin'];
        const labels = [];
        const data = [];
        for (const role of roles) {
            const count = await User.count({
                where: {
                    role: role,
                },
            });
            // push role and translate to vietnamese
            labels.push(role === 'renter' ? 'Người thuê' : role === 'owner' ? 'Chủ xe' : 'Quản trị viên');
            data.push(count);
        }
        return res.json({ labels, data });
    } catch (error) {
        console.error("Error fetching user count by role:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// fucntion to get status of approved owners : approved , pending , rejected and return {data , labels}
export const getApprovedOwnerStatus = async (req, res) => {
    try {
        const statuses = ['approved', 'pending', 'rejected'];
        const labels = [];
        const data = [];
        for (const status of statuses) {
            const count = await RegisterOwner.count({
                where: {
                    status: status,
                },
            });
            // translate status to vietnamese
            labels.push(status === 'approved' ? 'Đã duyệt' : status === 'pending' ? 'Đang chờ' : 'Bị từ chối');
            data.push(count);
        }
        return res.json({ labels, data });
    } catch (error) {
        console.error("Error fetching approved owner status:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

