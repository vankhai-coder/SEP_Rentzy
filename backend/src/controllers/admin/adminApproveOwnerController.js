import RegisterOwner from '../../models/RegisterOwner.js'
import { Op } from 'sequelize';
import User from '../../models/User.js';
// function to get stats for admin dashboard : include total requests , total accepted , total rejected , total pending from : 

// const RegisterOwner = sequelize.define(
//   "RegisterOwner",
//   {
//     register_owner_id: {
//       type: DataTypes.BIGINT.UNSIGNED,
//       primaryKey: true,
//       autoIncrement: true,
//     },
//     user_id: {
//       type: DataTypes.BIGINT.UNSIGNED,
//       allowNull: false,
//       references: {
//         model: "users", // table name
//         key: "user_id",
//       },
//     },
//     status: {
//       type: DataTypes.ENUM("pending", "approved", "rejected"),
//       defaultValue: "pending",
//     },

export const getOwnerApprovalStats = async (req, res) => {
    try {
        const totalRequests = await RegisterOwner.count();
        const totalApproved = await RegisterOwner.count({ where: { status: 'approved' } });
        const totalRejected = await RegisterOwner.count({ where: { status: 'rejected' } });
        const totalPending = await RegisterOwner.count({ where: { status: 'pending' } });
        return res.status(200).json({
            totalRequests,
            totalApproved,
            totalRejected,
            totalPending
        });
    } catch (error) {
        console.error("Error fetching owner approval stats:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// fuction to get list of request that base on filter : email/name and status (pending/approved/rejected) ,page , limit send from req.query :

export const getOwnerApprovalRequestsWithFilter = async (req, res) => {
  try {
    const { nameOrEmail, status, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    // RegisterOwner filters
    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    // User filters
    let userWhere;
    if (nameOrEmail?.trim()) {
      const term = `%${nameOrEmail}%`;
      userWhere = {
        [Op.or]: [
          { full_name: { [Op.like]: term } },
          { email: { [Op.like]: term } }
        ]
      };
    }

    // Query
    const { rows, count } = await RegisterOwner.findAndCountAll({
      where: whereClause,
      attributes: ['reason_rejected', 'status'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: [
            'full_name',
            'email',
            'avatar_url',
            'user_id',
            'created_at'
          ],
          where: userWhere, // only apply if defined
          required: !!userWhere, // ensures INNER JOIN when filtering
        },
      ],
      offset,
      limit: limitNum,
      order: [['created_at', 'DESC']],
      distinct: true,
    });

    // Final format
    const users = rows.map(r => ({
      full_name: r.user.full_name,
      email: r.user.email,
      avatar_url: r.user.avatar_url,
      user_id: r.user.user_id,
      reason_rejected: r.reason_rejected,
      status: r.status,
      created_at: r.user.created_at,
    }));

    const totalPages = Math.ceil(count / limitNum);

    return res.status(200).json({ users, totalPages });
  } catch (error) {
    console.error('Error fetching owner approval requests:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

