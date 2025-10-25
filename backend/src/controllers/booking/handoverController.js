import db from "../../models/index.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const { Booking, BookingHandover, Vehicle, User } = db;

// Cấu hình multer cho upload ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Xác định thư mục dựa trên endpoint
    const isPostRental = req.path.includes("post-rental");
    const uploadPath = isPostRental
      ? "uploads/handover/post-rental/"
      : "uploads/handover/pre-rental/";

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const isPostRental = req.path.includes("post-rental");
    const prefix = isPostRental ? "post" : "pre";
    cb(
      null,
      `${prefix}-${req.params.bookingId}-${uniqueSuffix}${path.extname(
        file.originalname
      )}`
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Chỉ cho phép upload file ảnh (JPEG, JPG, PNG, WEBP)"));
    }
  },
});

// 1. Owner upload ảnh xe trước khi bàn giao
export const uploadPreRentalImages = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const ownerId = req.user.userId;

    // Kiểm tra booking có tồn tại và thuộc về owner
    const booking = await Booking.findOne({
      where: { booking_id: bookingId },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          where: { owner_id: ownerId },
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking hoặc bạn không có quyền truy cập",
      });
    }

    // Kiểm tra trạng thái booking (phải là fully_paid)
    if (booking.status !== "fully_paid") {
      return res.status(400).json({
        success: false,
        message: "Booking chưa được thanh toán đầy đủ",
      });
    }

    // Kiểm tra số lượng file upload
    if (!req.files || req.files.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Cần upload ít nhất 5 ảnh xe",
      });
    }

    if (req.files.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Chỉ được upload tối đa 10 ảnh",
      });
    }

    // Tạo danh sách đường dẫn ảnh
    const imagePaths = req.files.map(
      (file) => `/uploads/handover/pre-rental/${file.filename}`
    );

    // Tìm hoặc tạo bản ghi handover
    let handover = await BookingHandover.findOne({
      where: { booking_id: bookingId },
    });

    if (!handover) {
      handover = await BookingHandover.create({
        booking_id: bookingId,
        pre_rental_images: imagePaths,
        updated_at: new Date(),
      });
    } else {
      // Xóa ảnh cũ nếu có
      if (handover.pre_rental_images) {
        handover.pre_rental_images.forEach((imagePath) => {
          const fullPath = path.join(process.cwd(), imagePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        });
      }

      await handover.update({
        pre_rental_images: imagePaths,
        updated_at: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Upload ảnh xe thành công",
      data: {
        images: imagePaths,
        handover_id: handover.handover_id,
      },
    });
  } catch (error) {
    console.error("Error uploading pre-rental images:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi upload ảnh",
    });
  }
};

// 2. Owner xác nhận bàn giao xe
export const confirmHandoverByOwner = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const ownerId = req.user.userId;

    // Kiểm tra booking
    const booking = await Booking.findOne({
      where: { booking_id: bookingId },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          where: { owner_id: ownerId },
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    // Tìm handover record
    const handover = await BookingHandover.findOne({
      where: { booking_id: bookingId },
    });

    if (
      !handover ||
      !handover.pre_rental_images ||
      handover.pre_rental_images.length < 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Cần upload ít nhất 5 ảnh xe trước khi xác nhận bàn giao",
      });
    }

    // Cập nhật xác nhận của owner và thời gian bàn giao
    await handover.update({
      owner_handover_confirmed: true,
      handover_time: new Date(),
      updated_at: new Date(),
    });

    // Cập nhật status booking thành in_progress
    await booking.update({
      status: "in_progress",
      updated_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Xác nhận bàn giao xe thành công",
      data: {
        handover_confirmed: true,
        handover_time: handover.handover_time,
        booking_status: "in_progress",
      },
    });
  } catch (error) {
    console.error("Error confirming handover by owner:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xác nhận bàn giao",
    });
  }
};

// 3. Renter xác nhận ảnh xe và nhận xe
export const confirmPreRentalImagesByRenter = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const renterId = req.user.userId;

    // Kiểm tra booking
    const booking = await Booking.findOne({
      where: {
        booking_id: bookingId,
        renter_id: renterId,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    // Tìm handover record
    const handover = await BookingHandover.findOne({
      where: { booking_id: bookingId },
    });

    if (!handover || !handover.owner_handover_confirmed) {
      return res.status(400).json({
        success: false,
        message: "Chủ xe chưa xác nhận bàn giao",
      });
    }

    // Cập nhật xác nhận của renter
    await handover.update({
      renter_handover_confirmed: true,
      updated_at: new Date(),
    });
    await booking.update({
      status: "in_progress",
      updated_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Xác nhận nhận xe thành công",
      data: {
        renter_confirmed: true,
        both_confirmed: true,
      },
    });
  } catch (error) {
    console.error("Error confirming pre-rental images by renter:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xác nhận nhận xe",
    });
  }
};

// 4. Lấy thông tin ảnh pre-rental
export const getPreRentalImages = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId;

    // Kiểm tra quyền truy cập (owner hoặc renter)
    const booking = await Booking.findOne({
      where: { booking_id: bookingId },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["owner_id"],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    const isOwner = booking.vehicle.owner_id === userId;
    const isRenter = booking.renter_id === userId;

    if (!isOwner && !isRenter) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập",
      });
    }

    // Lấy thông tin handover
    const handover = await BookingHandover.findOne({
      where: { booking_id: bookingId },
    });

    if (!handover) {
      return res.status(200).json({
        success: true,
        data: {
          images: [],
          owner_confirmed: false,
          renter_confirmed: false,
          owner_handover_confirmed: false,
          renter_handover_confirmed: false,
          handover_time: null,
        },
      });
    }

    // Convert image paths to proper object structure
    const images = (handover.pre_rental_images || []).map(
      (imagePath, index) => {
        const filename = path.basename(imagePath);
        return {
          id: `pre_${handover.handover_id}_${index}`,
          filename: filename,
          originalName: filename.replace(/^\d+_/, ""), // Remove timestamp prefix
          path: imagePath,
        };
      }
    );

    return res.status(200).json({
      success: true,
      data: {
        images: images,
        owner_confirmed: Boolean(handover.owner_handover_confirmed),
        renter_confirmed: Boolean(handover.renter_handover_confirmed),
        owner_handover_confirmed: Boolean(handover.owner_handover_confirmed),
        renter_handover_confirmed: Boolean(handover.renter_handover_confirmed),
        handover_time: handover.handover_time,
      },
    });
  } catch (error) {
    console.error("Error getting pre-rental images:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy ảnh",
    });
  }
};

// 5. Owner upload ảnh xe sau khi trả lại
export const uploadPostRentalImages = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const ownerId = req.user.userId;

    // Kiểm tra booking
    const booking = await Booking.findOne({
      where: { booking_id: bookingId },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          where: { owner_id: ownerId },
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    // Kiểm tra trạng thái booking (phải là in_progress)
    if (booking.status !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: "Chuyến xe chưa bắt đầu hoặc đã kết thúc",
      });
    }

    // Kiểm tra đã qua thời gian kết thúc chưa
    const currentTime = new Date();
    const endDateTime = new Date(`${booking.end_date}T${booking.end_time}`);

    if (currentTime < endDateTime) {
      return res.status(400).json({
        success: false,
        message: "Chưa đến thời gian kết thúc chuyến xe",
      });
    }

    // Kiểm tra số lượng file upload
    if (!req.files || req.files.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Cần upload ít nhất 5 ảnh xe",
      });
    }

    if (req.files.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Chỉ được upload tối đa 10 ảnh",
      });
    }

    // Tạo danh sách đường dẫn ảnh
    const imagePaths = req.files.map(
      (file) => `/uploads/handover/post-rental/${file.filename}`
    );

    // Tìm handover record
    let handover = await BookingHandover.findOne({
      where: { booking_id: bookingId },
    });

    if (!handover) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy thông tin bàn giao xe",
      });
    }

    // Xóa ảnh cũ nếu có
    if (handover.post_rental_images) {
      handover.post_rental_images.forEach((imagePath) => {
        const fullPath = path.join(process.cwd(), imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    // Cập nhật ảnh post-rental và thời gian trả xe
    await handover.update({
      post_rental_images: imagePaths,
      return_time: new Date(),
      updated_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Upload ảnh xe sau khi trả lại thành công",
      data: {
        images: imagePaths,
        return_time: handover.return_time,
      },
    });
  } catch (error) {
    console.error("Error uploading post-rental images:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi upload ảnh",
    });
  }
};

// 6. Owner xác nhận trả xe (giống logic confirmHandoverByOwner)
export const confirmReturnByOwner = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const ownerId = req.user.userId;

    // Kiểm tra booking
    const booking = await Booking.findOne({
      where: { booking_id: bookingId },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          where: { owner_id: ownerId },
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    // Tìm handover record
    const handover = await BookingHandover.findOne({
      where: { booking_id: bookingId },
    });

    if (
      !handover ||
      !handover.post_rental_images ||
      handover.post_rental_images.length < 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Cần upload ít nhất 5 ảnh xe trước khi xác nhận trả xe",
      });
    }

    // Cập nhật xác nhận của owner và thời gian trả xe
    await handover.update({
      owner_return_confirmed: true,
      return_time: new Date(),
      updated_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Xác nhận trả xe thành công",
      data: {
        return_confirmed: true,
        return_time: handover.return_time,
      },
    });
  } catch (error) {
    console.error("Error confirming return by owner:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xác nhận trả xe",
    });
  }
};

// 7. Renter xác nhận ảnh xe sau khi trả lại
export const confirmPostRentalImagesByRenter = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const renterId = req.user.userId;

    // Kiểm tra booking
    const booking = await Booking.findOne({
      where: {
        booking_id: bookingId,
        renter_id: renterId,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    // Tìm handover record
    const handover = await BookingHandover.findOne({
      where: { booking_id: bookingId },
    });

    if (
      !handover ||
      !handover.post_rental_images ||
      handover.post_rental_images.length < 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Cần có ít nhất 5 ảnh xe trước khi xác nhận",
      });
    }

    // Kiểm tra owner đã xác nhận trả xe chưa
    if (!handover.owner_return_confirmed) {
      return res.status(400).json({
        success: false,
        message: "Chủ xe chưa xác nhận trả xe",
      });
    }

    // Cập nhật xác nhận của renter và hoàn thành booking
    await handover.update({
      renter_return_confirmed: true,
      updated_at: new Date(),
    });

    // Hoàn thành booking
    await booking.update({
      status: "completed",
      updated_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Xác nhận trả xe thành công",
      data: {
        return_confirmed: true,
        booking_completed: true,
      },
    });
  } catch (error) {
    console.error("Error confirming post-rental images by renter:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xác nhận trả xe",
    });
  }
};


// 8. Lấy thông tin ảnh post-rental
export const getPostRentalImages = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId;

    // Kiểm tra quyền truy cập
    const booking = await Booking.findOne({
      where: { booking_id: bookingId },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["owner_id"],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    const isOwner = booking.vehicle.owner_id === userId;
    const isRenter = booking.renter_id === userId;

    if (!isOwner && !isRenter) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập",
      });
    }

    // Lấy thông tin handover
    const handover = await BookingHandover.findOne({
      where: { booking_id: bookingId },
    });

    if (!handover) {
      return res.status(200).json({
        success: true,
        data: {
          images: [],
          owner_return_confirmed: false,
          renter_return_confirmed: false,
          return_time: null,
        },
      });
    }

    // Convert image paths to proper object structure
    const images = (handover.post_rental_images || []).map(
      (imagePath, index) => {
        const filename = path.basename(imagePath);
        return {
          id: `post_${handover.handover_id}_${index}`,
          filename: filename,
          originalName: filename.replace(/^\d+_/, ""), // Remove timestamp prefix
          path: imagePath,
        };
      }
    );

    return res.status(200).json({
      success: true,
      data: {
        images: images,
        owner_return_confirmed: Boolean(handover.owner_return_confirmed),
        renter_return_confirmed: Boolean(handover.renter_return_confirmed),
        return_time: handover.return_time,
      },
    });
  } catch (error) {
    console.error("Error getting post-rental images:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy ảnh",
    });
  }
};

// ==================== UTILITY FUNCTIONS ====================

// Lấy thông tin tổng quan handover
// Delete pre-rental image
export const deletePreRentalImage = async (req, res) => {
  try {
    const { bookingId, imageId } = req.params;

    // Find handover record
    const handover = await BookingHandover.findOne({
      where: { booking_id: bookingId },
    });

    if (!handover) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin bàn giao",
      });
    }

    // Parse image ID to get index
    const imageIndex = parseInt(imageId.split("_")[2]);
    const images = handover.pre_rental_images || [];

    if (imageIndex < 0 || imageIndex >= images.length) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ảnh",
      });
    }

    // Get image path and delete file
    const imagePath = images[imageIndex];
    const fullPath = path.join(
      process.cwd(),
      "uploads",
      "handover",
      "pre-rental",
      path.basename(imagePath)
    );

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Remove image from array
    images.splice(imageIndex, 1);

    // Update handover record
    await handover.update({
      pre_rental_images: images,
    });

    return res.status(200).json({
      success: true,
      message: "Xóa ảnh thành công",
    });
  } catch (error) {
    console.error("Error deleting pre-rental image:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa ảnh",
    });
  }
};

// Delete post-rental image
export const deletePostRentalImage = async (req, res) => {
  try {
    const { bookingId, imageId } = req.params;

    // Find handover record
    const handover = await BookingHandover.findOne({
      where: { booking_id: bookingId },
    });

    if (!handover) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin bàn giao",
      });
    }

    // Parse image ID to get index
    const imageIndex = parseInt(imageId.split("_")[2]);
    const images = handover.post_rental_images || [];

    if (imageIndex < 0 || imageIndex >= images.length) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ảnh",
      });
    }

    // Get image path and delete file
    const imagePath = images[imageIndex];
    const fullPath = path.join(
      process.cwd(),
      "uploads",
      "handover",
      "post-rental",
      path.basename(imagePath)
    );

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Remove image from array
    images.splice(imageIndex, 1);

    // Update handover record
    await handover.update({
      post_rental_images: images,
    });

    return res.status(200).json({
      success: true,
      message: "Xóa ảnh thành công",
    });
  } catch (error) {
    console.error("Error deleting post-rental image:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa ảnh",
    });
  }
};

export const getHandoverStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId;

    // Kiểm tra quyền truy cập
    const booking = await Booking.findOne({
      where: { booking_id: bookingId },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["owner_id"],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    const isOwner = booking.vehicle.owner_id === userId;
    const isRenter = booking.renter_id === userId;

    if (!isOwner && !isRenter) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập",
      });
    }

    // Lấy thông tin handover
    const handover = await BookingHandover.findOne({
      where: { booking_id: bookingId },
    });

    const response = {
      booking_status: booking.status,
      handover_exists: !!handover,
      pre_rental: {
        images_uploaded: handover?.pre_rental_images?.length || 0,
        owner_confirmed: Boolean(handover?.owner_handover_confirmed || false),
        renter_confirmed: Boolean(handover?.renter_handover_confirmed || false),
        handover_time: handover?.handover_time || null,
      },
      post_rental: {
        images_uploaded: handover?.post_rental_images?.length || 0,
        owner_confirmed: Boolean(handover?.owner_return_confirmed || false),
        renter_confirmed: Boolean(handover?.renter_return_confirmed || false),
        return_time: handover?.return_time || null,
      },
      user_role: isOwner ? "owner" : "renter",
    };

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error getting handover status:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy trạng thái bàn giao",
    });
  }
};

// Middleware upload
export const uploadMiddleware = upload.array("images", 10);

// Export default
export default {
  uploadPreRentalImages,
  confirmHandoverByOwner,
  confirmPreRentalImagesByRenter,
  getPreRentalImages,
  deletePreRentalImage,
  uploadPostRentalImages,
  confirmReturnByOwner,
  confirmPostRentalImagesByRenter,
  getPostRentalImages,
  deletePostRentalImage,
  getHandoverStatus,
  uploadMiddleware,
};
