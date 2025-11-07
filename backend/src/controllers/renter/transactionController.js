import Transaction from "../../models/Transaction.js";
import { Op } from "sequelize";

export const getTransactionHistory = async (req, res) => {
  try {
    const renterId = req.user.userId;

    // Lấy tất cả giao dịch của user
    const transactions = await Transaction.findAll({
      where: {
        [Op.or]: [{ from_user_id: renterId }, { to_user_id: renterId }],
      },
      order: [["created_at", "DESC"]],
    });

    // Thống kê đơn giản
    const statistics = {
      totalTransactions: transactions.length,
      moneyIn: 0, // Tiền vào (REFUND, COMPENSATION)
      moneyOut: 0, // Tiền ra (DEPOSIT, RENTAL)
      totalAmount: 0, // Tổng số tiền
    };

    // Tính toán thống kê
    transactions.forEach((transaction) => {
      const amount = parseFloat(transaction.amount);
      statistics.totalAmount += amount;

      // Phân loại dòng tiền
      if (
        transaction.type === "REFUND" ||
        transaction.type === "COMPENSATION"
      ) {
        statistics.moneyIn += amount;
      } else if (
        transaction.type === "DEPOSIT" ||
        transaction.type === "RENTAL"
      ) {
        statistics.moneyOut += amount;
      }
    });

    // Trả về dữ liệu
    res.json({
      success: true,
      data: {
        transactions: transactions.map((transaction) => ({
          transaction_id: transaction.transaction_id,
          booking_id: transaction.booking_id,
          from_user_id: transaction.from_user_id,
          to_user_id: transaction.to_user_id,
          amount: transaction.amount,
          type: transaction.type,
          status: transaction.status,
          payment_method: transaction.payment_method,
          processed_at: transaction.processed_at,
          note: transaction.note,
          checkout_url: transaction.checkout_url,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at,
        })),
        statistics,
      },
    });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Không thể lấy lịch sử giao dịch",
    });
  }
};
