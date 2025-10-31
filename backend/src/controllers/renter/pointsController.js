// controllers/renter/pointsController.js
import db from "../../models/index.js";
import { Op } from "sequelize";

const { User, PointsTransaction } = db;

// API lấy điểm hiện tại của user

// API lấy lịch sử giao dịch điểm
export const getPointsHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      page = 1, 
      limit = 15, 
      transaction_type, 
      reference_type, 
      search
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build where conditions
    const whereConditions = { user_id: userId };
    
    // Filter by transaction type
    if (transaction_type && transaction_type !== 'all') {
      whereConditions.transaction_type = transaction_type;
    }
    
    // Filter by reference type
    if (reference_type && reference_type !== 'all') {
      whereConditions.reference_type = reference_type;
    }
    
    // Search in description
    if (search && search.trim()) {
      whereConditions.description = {
        [Op.iLike]: `%${search.trim()}%`
      };
    }

    // Get transactions with pagination - default sort by created_at DESC
    const { count, rows: transactions } = await PointsTransaction.findAndCountAll({
      where: whereConditions,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          attributes: ['user_id', 'full_name', 'email']
        }
      ]
    });

    // Get user's current points
    const user = await User.findByPk(userId, {
      attributes: ['points']
    });

    // Calculate statistics
    const stats = await PointsTransaction.findAll({
      where: { user_id: userId },
      attributes: [
        [db.sequelize.fn('SUM', db.sequelize.literal('CASE WHEN points_amount > 0 THEN points_amount ELSE 0 END')), 'total_earned'],
        [db.sequelize.fn('SUM', db.sequelize.literal('CASE WHEN points_amount < 0 THEN ABS(points_amount) ELSE 0 END')), 'total_spent'],
        [db.sequelize.fn('COUNT', db.sequelize.col('transaction_id')), 'total_transactions']
      ],
      raw: true
    });

    const statistics = {
      current_balance: user.points || 0,
      total_earned: parseInt(stats[0].total_earned) || 0,
      total_spent: parseInt(stats[0].total_spent) || 0,
      total_transactions: parseInt(stats[0].total_transactions) || 0
    };

    res.status(200).json({
      success: true,
      data: {
        transactions,
        statistics,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit)
        },
        filters: {
          transaction_type: transaction_type || 'all',
          reference_type: reference_type || 'all',
          search: search || ''
        }
      }
    });

  } catch (error) {
    console.error('Error fetching points history:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy lịch sử điểm',
      error: error.message
    });
  }
};
