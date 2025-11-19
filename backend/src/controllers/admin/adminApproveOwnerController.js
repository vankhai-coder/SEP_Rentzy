import RegisterOwner from '../../models/RegisterOwner.js'
import { Op } from 'sequelize';
import User from '../../models/User.js';
import { sendEmail } from '../../utils/email/sendEmail.js';
import { ownerApprovalNotificationTemplate, ownerRejectionNotificationTemplate } from '../../utils/email/templates/emailTemplate.js';
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

// function to approve owner request :
export const approveOwnerRequest = async (req, res) => {
  try {
    const { user_id } = req.body || {};

    // validation
    if (!user_id) {
      return res.status(400).json({ message: 'Missing user_id in request body' });
    }

    // get user by user_id , get email : 
    const user = await User.findOne({ where: { user_id }, attributes: ['email'] });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // update user role to owner
    const result = await User.update(
      { role: 'owner' },
      { where: { user_id } }
    );

    // if no rows affected , user not found
    if (result[0] === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // update register owner status to approved
    const resultRegisterOwner = await RegisterOwner.update(
      { status: 'approved', reason_rejected: null },
      { where: { user_id } }
    );
    if (resultRegisterOwner[0] === 0) {
      return res.status(404).json({ message: 'Register owner request not found' });
    }

    try {
      // send email notification to user about approval : 
      await sendEmail({
        from: process.env.GMAIL_USER,
        to: user.email, // get email from req.body
        subject: 'Chấp nhận yêu cầu trở thành chủ xe',
        html: ownerApprovalNotificationTemplate(process.env.CLIENT_ORIGIN),

      });
    } catch (error) {
      console.error('Error sending approval email:', error);
    }

    // return response
    return res.status(200).json({ message: 'Accept renter to become owner successfully' });

  } catch (error) {
    console.error('Error approving owner request:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }

};

// function to reject owner request :
export const rejectOwnerRequest = async (req, res) => {
  try {
    const { user_id, reason_rejected } = req.body || {};

    // validation
    if (!user_id || !reason_rejected) {
      return res.status(400).json({ message: 'Missing user_id or reason_rejected in request body' });
    }

    // update register owner status to rejected
    const resultRegisterOwner = await RegisterOwner.update(
      { status: 'rejected', reason_rejected: reason_rejected },
      { where: { user_id } }
    );
    if (resultRegisterOwner[0] === 0) {
      return res.status(404).json({ message: 'Register owner request not found' });
    }

    // send email notification to user about rejection :
    try {
      // get user by user_id , get email :
      const user = await User.findOne({ where: { user_id }, attributes: ['email'] });
      if (!user) {
        return res.status(404).json({ message: 'User not found by user_id' });
      }

      await sendEmail({
        from: process.env.GMAIL_USER,
        to: user.email, // get email from req.body
        subject: 'Từ chối yêu cầu trở thành chủ xe',
        html: ownerRejectionNotificationTemplate(reason_rejected),
      });
    } catch (error) {
      console.error('Error sending rejection email:', error);
    }


    // return response
    return res.status(200).json({ message: 'Reject renter to become owner successfully' });

  } catch (error) {
    console.error('Error rejecting owner request:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }

};