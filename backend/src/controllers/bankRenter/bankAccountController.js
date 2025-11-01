// controllers/bankAccountController.js
import { Op } from "sequelize";
import db from "../../models/index.js";
import cloudinary from "../../config/cloudinary.js";
const { Bank, User } = db;

// Helper function to upload QR code image to Cloudinary
const uploadQRCodeToCloudinary = async (file, retryCount = 0) => {
  const maxRetries = 3;
  const timeout = 30000; // 30 seconds

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Upload timeout after 30 seconds'));
    }, timeout);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "rentzy/bank-qr-codes",
        resource_type: "image",
        timeout: 60000, // Cloudinary timeout
      },
      async (error, result) => {
        clearTimeout(timeoutId);
        
        if (error) {
          console.error(`Upload attempt ${retryCount + 1} failed:`, error.message);
          
          // Retry on connection errors
          if ((error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.message.includes('aborted')) 
              && retryCount < maxRetries) {
            console.log(`Retrying upload... (${retryCount + 1}/${maxRetries})`);
            try {
              const retryResult = await uploadQRCodeToCloudinary(file, retryCount + 1);
              resolve(retryResult);
            } catch (retryError) {
              reject(retryError);
            }
          } else {
            reject(error);
          }
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );

    // Handle stream errors
    uploadStream.on('error', (streamError) => {
      clearTimeout(timeoutId);
      console.error('Upload stream error:', streamError);
      reject(streamError);
    });

    uploadStream.end(file.buffer);
  });
};

// Lấy danh sách tài khoản ngân hàng của user
export const getBankAccounts = async (req, res) => {
  try {
    const userId = req.user.userId;

    const bankAccounts = await Bank.findAll({
      where: { user_id: userId },
      order: [
        ["is_primary", "DESC"], // Tài khoản chính lên đầu
        ["created_at", "DESC"],
      ],
    });

    res.status(200).json({
      success: true,
      message: "Lấy danh sách tài khoản ngân hàng thành công",
      data: bankAccounts,
    });
  } catch (error) {
    console.error("Error getting bank accounts:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách tài khoản ngân hàng",
      error: error.message,
    });
  }
};

// Thêm tài khoản ngân hàng mới
export const createBankAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      bank_name,
      account_number,
      account_holder_name,
      qr_code_url,
      is_primary = false,
    } = req.body;

    // Validate required fields
    if (!bank_name || !account_number || !account_holder_name) {
      return res.status(400).json({
        success: false,
        message:
          "Vui lòng điền đầy đủ thông tin: tên ngân hàng, số tài khoản, tên chủ tài khoản",
      });
    }

    // Kiểm tra trùng lặp tài khoản
    const existingAccount = await Bank.findOne({
      where: {
        user_id: userId,
        account_number: account_number,
        bank_name: bank_name,
      },
    });

    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: "Tài khoản ngân hàng này đã tồn tại",
      });
    }

    // Sử dụng transaction để đảm bảo tính nhất quán
    const newBankAccount = await db.sequelize.transaction(async (t) => {
      // Nếu tạo tài khoản chính, set tất cả tài khoản khác thành false
      if (is_primary) {
        await Bank.update(
          { is_primary: false },
          {
            where: {
              user_id: userId,
              is_primary: true,
            },
            transaction: t,
          }
        );
      }

      // Tạo tài khoản mới
      return await Bank.create({
        user_id: userId,
        bank_name,
        account_number,
        account_holder_name,
        qr_code_url,
        is_primary,
      }, { transaction: t });
    });

    res.status(201).json({
      success: true,
      message: "Thêm tài khoản ngân hàng thành công",
      data: newBankAccount,
    });
  } catch (error) {
    console.error("Error creating bank account:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi thêm tài khoản ngân hàng",
      error: error.message,
    });
  }
};

// Cập nhật tài khoản ngân hàng
export const updateBankAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bankId } = req.params;
    const {
      bank_name,
      account_number,
      account_holder_name,
      qr_code_url,
      is_primary,
    } = req.body;

    // Tìm tài khoản cần cập nhật
    const bankAccount = await Bank.findOne({
      where: {
        bank_id: bankId,
        user_id: userId,
      },
    });

    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản ngân hàng",
      });
    }

    // Sử dụng transaction để cập nhật
    await db.sequelize.transaction(async (t) => {
      // Nếu đặt làm tài khoản chính, set tất cả tài khoản khác thành false
      if (is_primary && !bankAccount.is_primary) {
        await Bank.update(
          { is_primary: false },
          {
            where: {
              user_id: userId,
              is_primary: true,
              bank_id: { [Op.ne]: bankId },
            },
            transaction: t,
          }
        );
      }

      // Cập nhật thông tin
      await bankAccount.update({
        bank_name: bank_name || bankAccount.bank_name,
        account_number: account_number || bankAccount.account_number,
        account_holder_name:
          account_holder_name || bankAccount.account_holder_name,
        qr_code_url:
          qr_code_url !== undefined ? qr_code_url : bankAccount.qr_code_url,
        is_primary:
          is_primary !== undefined ? is_primary : bankAccount.is_primary,
      }, { transaction: t });
    });

    res.status(200).json({
      success: true,
      message: "Cập nhật tài khoản ngân hàng thành công",
      data: bankAccount,
    });
  } catch (error) {
    console.error("Error updating bank account:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật tài khoản ngân hàng",
      error: error.message,
    });
  }
};

// Đặt tài khoản chính
export const setPrimaryAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bankId } = req.params;

    // Tìm tài khoản cần đặt làm chính
    const bankAccount = await Bank.findOne({
      where: {
        bank_id: bankId,
        user_id: userId,
      },
    });

    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản ngân hàng",
      });
    }

    if (bankAccount.is_primary) {
      return res.status(400).json({
        success: false,
        message: "Tài khoản này đã là tài khoản chính",
      });
    }

    // Sử dụng transaction để đảm bảo tính nhất quán
    await db.sequelize.transaction(async (t) => {
      // Hủy tài khoản chính hiện tại
      await Bank.update(
        { is_primary: false },
        {
          where: {
            user_id: userId,
            is_primary: true,
          },
          transaction: t,
        }
      );

      // Đặt tài khoản mới làm chính
      await bankAccount.update({ is_primary: true }, { transaction: t });
    });

    res.status(200).json({
      success: true,
      message: "Đặt tài khoản chính thành công",
      data: bankAccount,
    });
  } catch (error) {
    console.error("Error setting primary account:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi đặt tài khoản chính",
      error: error.message,
    });
  }
};

// Xóa tài khoản ngân hàng
export const deleteBankAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bankId } = req.params;

    const bankAccount = await Bank.findOne({
      where: {
        bank_id: bankId,
        user_id: userId,
      },
    });

    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản ngân hàng",
      });
    }

    // Kiểm tra xem có phải tài khoản chính không
    if (bankAccount.is_primary) {
      // Kiểm tra xem có tài khoản khác không
      const otherAccounts = await Bank.count({
        where: {
          user_id: userId,
          bank_id: { [Op.ne]: bankId },
        },
      });

      if (otherAccounts > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Không thể xóa tài khoản chính khi còn tài khoản khác. Vui lòng đặt tài khoản khác làm chính trước khi xóa.",
        });
      }
    }

    await bankAccount.destroy();

    res.status(200).json({
      success: true,
      message: "Xóa tài khoản ngân hàng thành công",
    });
  } catch (error) {
    console.error("Error deleting bank account:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa tài khoản ngân hàng",
      error: error.message,
    });
  }
};

// Lấy tài khoản chính của user (cho admin chuyển tiền)
export const getPrimaryAccount = async (req, res) => {
  try {
    const { userId } = req.params;

    const primaryAccount = await Bank.findOne({
      where: {
        user_id: userId,
        is_primary: true,
      },
      include: [
        {
          model: User,
          attributes: ["user_id", "full_name", "email", "phone_number"],
        },
      ],
    });

    if (!primaryAccount) {
      return res.status(404).json({
        success: false,
        message: "Người dùng chưa có tài khoản ngân hàng chính",
      });
    }

    res.status(200).json({
      success: true,
      message: "Lấy tài khoản chính thành công",
      data: primaryAccount,
    });
  } catch (error) {
    console.error("Error getting primary account:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy tài khoản chính",
      error: error.message,
    });
  }
};

// Upload ảnh QR code lên Cloudinary
export const uploadQRCode = async (req, res) => {
  try {
    console.log("Upload QR code request received");
    console.log("File info:", req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : "No file");

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn ảnh QR code để upload",
      });
    }

    // Kiểm tra định dạng file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Chỉ chấp nhận file ảnh định dạng JPEG, JPG, PNG, WEBP",
      });
    }

    // Kiểm tra kích thước file (max 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Kích thước file không được vượt quá 5MB",
      });
    }

    console.log("Starting Cloudinary upload...");
    // Upload lên Cloudinary
    const uploadResult = await uploadQRCodeToCloudinary(req.file);
    console.log("Cloudinary upload successful:", uploadResult);

    res.status(200).json({
      success: true,
      message: "Upload ảnh QR code thành công",
      data: {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
      },
    });
  } catch (error) {
    console.error("Error uploading QR code:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi upload ảnh QR code",
      error: error.message,
    });
  }
};
