import Bank from "../models/Bank.js";

/**
 * Middleware kiểm tra user có tài khoản ngân hàng trước khi thực hiện các thao tác cần hoàn tiền
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
export const requireBankAccount = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Bạn phải đăng nhập để thực hiện thao tác này",
      });
    }

    // Kiểm tra user có tài khoản ngân hàng không
    const bankAccount = await Bank.findOne({
      where: {
        user_id: userId,
      },
    });

    if (!bankAccount) {
      return res.status(400).json({
        success: false,
        message:
          "Bạn cần thêm thông tin tài khoản ngân hàng trước khi hủy booking để có thể nhận hoàn tiền.",
        error_code: "BANK_ACCOUNT_REQUIRED",
        redirect_url: "/account/bank-accounts",
      });
    }

    // Kiểm tra có tài khoản chính không (để hoàn tiền)
    const primaryAccount = await Bank.findOne({
      where: {
        user_id: userId,
        is_primary: true,
      },
    });

    if (!primaryAccount) {
      return res.status(400).json({
        success: false,
        message:
          "Bạn cần đặt một tài khoản ngân hàng làm tài khoản chính để nhận hoàn tiền.",
        error_code: "PRIMARY_BANK_ACCOUNT_REQUIRED",
        redirect_url: "/account/bank-accounts",
      });
    }

    // Thêm thông tin bank account vào request để sử dụng ở controller
    req.primaryBankAccount = primaryAccount;
    next();
  } catch (error) {
    console.error("Error in requireBankAccount middleware:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi kiểm tra thông tin tài khoản ngân hàng",
      error: error.message,
    });
  }
};

/**
 * Middleware kiểm tra user có tài khoản ngân hàng chính (dành cho admin khi duyệt hoàn tiền)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
export const checkUserBankAccount = async (userId) => {
  try {
    const primaryAccount = await Bank.findOne({
      where: {
        user_id: userId,
        is_primary: true,
      },
    });

    return {
      hasBankAccount: !!primaryAccount,
      primaryAccount: primaryAccount,
    };
  } catch (error) {
    console.error("Error checking user bank account:", error);
    return {
      hasBankAccount: false,
      primaryAccount: null,
      error: error.message,
    };
  }
};
