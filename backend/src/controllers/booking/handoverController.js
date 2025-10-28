import db from "../../models/index.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import uploadFile from "../../utils/uploadFile.js";
import cloudinary from "../../config/cloudinary.js";

const { Booking, BookingHandover, Vehicle, User } = db;

// Cấu hình multer để lưu file tạm thời trước khi upload lên Cloudinary
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads", "temp");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Chỉ chấp nhận file ảnh định dạng JPG, JPEG, PNG, WEBP"),
        false
      );
    }
  },
});

// Hàm helper để xóa file tạm
const deleteTempFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Error deleting temp file:", error);
  }
};

// 1. Owner upload ảnh xe trước khi bàn giao
export const uploadPreRentalImages = async (req, res) => {
  const tempFiles = [];

  try {
    const { bookingId } = req.params;
    const ownerId = req.user.userId;

    // Lưu danh sách file tạm để cleanup sau
    if (req.files) {
      tempFiles.push(...req.files.map((file) => file.path));
    }

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
        message: "Không tìm thấy booking hoặc bạn không có quyền truy cập",
      });
    }

    if (booking.status !== "fully_paid") {
      return res.status(400).json({
        success: false,
        message: "Booking chưa được thanh toán đầy đủ",
      });
    }

    // Kiểm tra số lượng file
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

    // Upload ảnh lên Cloudinary và chỉ lưu URL
    const uploadPromises = req.files.map(async (file) => {
      const result = await uploadFile(
        file.path,
        `rentzy/handover/pre-rental/${bookingId}`
      );
      return result.url.trim(); // Chỉ trả về URL và loại bỏ khoảng trắng
    });

    const uploadedImageUrls = await Promise.all(uploadPromises);

    // Tìm hoặc tạo handover record
    let handover = await BookingHandover.findOne({
      where: { booking_id: bookingId },
    });

    if (!handover) {
      handover = await BookingHandover.create({
        booking_id: bookingId,
        pre_rental_images: uploadedImageUrls,
        updated_at: new Date(),
      });
    } else {
      // Xóa ảnh cũ trên Cloudinary nếu có
      if (
        handover.pre_rental_images &&
        Array.isArray(handover.pre_rental_images)
      ) {
        const deletePromises = handover.pre_rental_images.map(async (image) => {
          if (image.publicId) {
            try {
              await cloudinary.uploader.destroy(image.publicId);
            } catch (error) {
              console.error(`Error deleting old image:`, error);
            }
          }
        });
        await Promise.all(deletePromises);
      }

      await handover.update({
        pre_rental_images: uploadedImageUrls,
        updated_at: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Upload ảnh xe thành công",
      data: {
        images: uploadedImageUrls,
        handover_id: handover.handover_id,
      },
    });
  } catch (error) {
    console.error("Error uploading pre-rental images:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi upload ảnh",
    });
  } finally {
    // Cleanup temp files
    tempFiles.forEach(deleteTempFile);
  }
};

// 2. Owner upload ảnh xe sau khi trả lại
export const uploadPostRentalImages = async (req, res) => {
  const tempFiles = [];

  try {
    const { bookingId } = req.params;
    const ownerId = req.user.userId;

    // Lưu danh sách file tạm để cleanup sau
    if (req.files) {
      tempFiles.push(...req.files.map((file) => file.path));
    }

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

    if (booking.status !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: "Chuyến xe chưa bắt đầu hoặc đã kết thúc",
      });
    }

    // Kiểm tra thời gian kết thúc
    const currentTime = new Date();
    const endDateTime = new Date(`${booking.end_date}T${booking.end_time}`);

    if (currentTime < endDateTime) {
      return res.status(400).json({
        success: false,
        message: "Chưa đến thời gian kết thúc chuyến xe",
      });
    }

    // Kiểm tra số lượng file
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

    // Upload ảnh lên Cloudinary và chỉ lưu URL
    const uploadPromises = req.files.map(async (file) => {
      const result = await uploadFile(
        file.path,
        `rentzy/handover/post-rental/${bookingId}`
      );
      return result.url.trim(); // Chỉ trả về URL và loại bỏ khoảng trắng
    });

    const uploadedImageUrls = await Promise.all(uploadPromises);

    // Tìm handover record
    const handover = await BookingHandover.findOne({
      where: { booking_id: bookingId },
    });

    if (!handover) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy thông tin bàn giao xe",
      });
    }

    // Xóa ảnh cũ trên Cloudinary nếu có
    if (
      handover.post_rental_images &&
      Array.isArray(handover.post_rental_images)
    ) {
      const deletePromises = handover.post_rental_images.map(async (image) => {
        if (image.publicId) {
          try {
            await cloudinary.uploader.destroy(image.publicId);
          } catch (error) {
            console.error(`Error deleting old image:`, error);
          }
        }
      });
      await Promise.all(deletePromises);
    }

    // Cập nhật ảnh post-rental
    await handover.update({
      post_rental_images: uploadedImageUrls,
      return_time: new Date(),
      updated_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Ảnh post-rental đã được upload thành công",
      data: {
        post_rental_images: uploadedImageUrls,
        return_time: handover.return_time,
      },
    });
  } catch (error) {
    console.error("Error uploading post-rental images:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi upload ảnh",
    });
  } finally {
    // Cleanup temp files
    tempFiles.forEach(deleteTempFile);
  }
};


// 5. Xóa ảnh pre-rental
export const deletePreRentalImage = async (req, res) => {
  try {
    const { bookingId, imageIndex } = req.params;
    const ownerId = req.user.userId;

    // Kiểm tra quyền
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

    const handover = await BookingHandover.findOne({
      where: { booking_id: bookingId },
    });

    if (!handover || !handover.pre_rental_images) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ảnh",
      });
    }

    const imageIndexNum = parseInt(imageIndex);
    if (imageIndexNum < 0 || imageIndexNum >= handover.pre_rental_images.length) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ảnh",
      });
    }

    // Lấy URL ảnh cần xóa
    const imageUrl = handover.pre_rental_images[imageIndexNum];
    
    // Trích xuất publicId từ URL Cloudinary
    const urlParts = imageUrl.split('/');
    const fileNameWithExt = urlParts[urlParts.length - 1];
    const fileName = fileNameWithExt.split('.')[0];
    const publicId = `rentzy/handover/pre-rental/${bookingId}/${fileName}`;

    // Xóa ảnh từ Cloudinary
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error("Error deleting image from Cloudinary:", error);
    }

    // Cập nhật database
    const updatedImages = handover.pre_rental_images.filter(
      (_, index) => index !== imageIndexNum
    );
    await handover.update({
      pre_rental_images: updatedImages,
      updated_at: new Date(),
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

// 6. Xóa ảnh post-rental
export const deletePostRentalImage = async (req, res) => {
  try {
    const { bookingId, imageIndex } = req.params;
    const ownerId = req.user.userId;

    // Kiểm tra quyền
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

    const handover = await BookingHandover.findOne({
      where: { booking_id: bookingId },
    });

    if (!handover || !handover.post_rental_images) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ảnh",
      });
    }

    const imageIndexNum = parseInt(imageIndex);
    if (imageIndexNum < 0 || imageIndexNum >= handover.post_rental_images.length) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ảnh",
      });
    }

    // Lấy URL ảnh cần xóa
    const imageUrl = handover.post_rental_images[imageIndexNum];
    
    // Trích xuất publicId từ URL Cloudinary
    const urlParts = imageUrl.split('/');
    const fileNameWithExt = urlParts[urlParts.length - 1];
    const fileName = fileNameWithExt.split('.')[0];
    const publicId = `rentzy/handover/post-rental/${bookingId}/${fileName}`;

    // Xóa ảnh từ Cloudinary
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error("Error deleting image from Cloudinary:", error);
    }

    // Cập nhật database
    const updatedImages = handover.post_rental_images.filter(
      (_, index) => index !== imageIndexNum
    );
    await handover.update({
      post_rental_images: updatedImages,
      updated_at: new Date(),
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

// 7. Xác nhận bàn giao bởi owner
export const confirmHandoverByOwner = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const ownerId = req.user.userId;

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

    const handover = await BookingHandover.findOne({
      where: { booking_id: bookingId },
    });

    if (!handover) {
      return res.status(400).json({
        success: false,
        message: "Chưa có ảnh xe để xác nhận",
      });
    }

    await handover.update({
      owner_handover_confirmed: true,
      handover_time: new Date(),
      updated_at: new Date(),
    });

    // Nếu cả hai đều đã xác nhận, cập nhật trạng thái booking
    if (handover.renter_handover_confirmed) {
      await booking.update({
        status: "in_progress",
        updated_at: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xác nhận bàn giao xe thành công",
      data: {
        owner_confirmed: true,
        both_confirmed: handover.renter_handover_confirmed,
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

// 8. Xác nhận bàn giao bởi renter
export const confirmPreRentalImagesByRenter = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const renterId = req.user.userId;

    const booking = await Booking.findOne({
      where: { booking_id: bookingId, renter_id: renterId },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    const handover = await BookingHandover.findOne({
      where: { booking_id: bookingId },
    });

    if (!handover) {
      return res.status(400).json({
        success: false,
        message: "Chưa có ảnh xe để xác nhận",
      });
    }

    await handover.update({
      renter_handover_confirmed: true,
      updated_at: new Date(),
    });

    // Nếu cả hai đều đã xác nhận, cập nhật trạng thái booking
    if (handover.owner_handover_confirmed) {
      await booking.update({
        status: "in_progress",
        updated_at: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xác nhận nhận xe thành công",
      data: {
        renter_confirmed: true,
        both_confirmed: handover.owner_handover_confirmed,
      },
    });
  } catch (error) {
    console.error("Error confirming by renter:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xác nhận",
    });
  }
};

// 9. Xác nhận trả xe bởi owner
export const confirmReturnByOwner = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const ownerId = req.user.userId;

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

    const handover = await BookingHandover.findOne({
      where: { booking_id: bookingId },
    });

    if (!handover) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy thông tin bàn giao",
      });
    }

    await handover.update({
      owner_return_confirmed: true,
      updated_at: new Date(),
    });

    // Nếu cả hai đều đã xác nhận, cập nhật trạng thái booking
    if (handover.renter_return_confirmed) {
      await booking.update({
        status: "completed",
        updated_at: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xác nhận nhận lại xe thành công",
      data: {
        owner_confirmed: true,
        both_confirmed: handover.renter_return_confirmed,
      },
    });
  } catch (error) {
    console.error("Error confirming return by owner:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xác nhận",
    });
  }
};

// 10. Xác nhận trả xe bởi renter
export const confirmPostRentalImagesByRenter = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const renterId = req.user.userId;

    const booking = await Booking.findOne({
      where: { booking_id: bookingId, renter_id: renterId },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    const handover = await BookingHandover.findOne({
      where: { booking_id: bookingId },
    });

    if (!handover) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy thông tin bàn giao",
      });
    }

    await handover.update({
      renter_return_confirmed: true,
      updated_at: new Date(),
    });

    // Nếu cả hai đều đã xác nhận, cập nhật trạng thái booking
    if (handover.owner_return_confirmed) {
      await booking.update({
        status: "completed",
        updated_at: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xác nhận trả xe thành công",
      data: {
        renter_confirmed: true,
        both_confirmed: handover.owner_return_confirmed,
      },
    });
  } catch (error) {
    console.error("Error confirming return by renter:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xác nhận",
    });
  }
};

// 11. Lấy trạng thái handover
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

    const handover = await BookingHandover.findOne({
      where: { booking_id: bookingId },
    });

    if (!handover) {
      return res.status(200).json({
        success: true,
        data: {
          pre_rental_images_count: 0,
          post_rental_images_count: 0,
          owner_handover_confirmed: false,
          renter_handover_confirmed: false,
          owner_return_confirmed: false,
          renter_return_confirmed: false,
          handover_time: null,
          return_time: null,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        pre_rental_images_count: handover.pre_rental_images?.length || 0,
        post_rental_images_count: handover.post_rental_images?.length || 0,
        owner_handover_confirmed: Boolean(handover.owner_handover_confirmed),
        renter_handover_confirmed: Boolean(handover.renter_handover_confirmed),
        owner_return_confirmed: Boolean(handover.owner_return_confirmed),
        renter_return_confirmed: Boolean(handover.renter_return_confirmed),
        handover_time: handover.handover_time,
        return_time: handover.return_time,
      },
    });
  } catch (error) {
    console.error("Error getting handover status:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy trạng thái",
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
  deletePreRentalImage,
  uploadPostRentalImages,
  confirmReturnByOwner,
  confirmPostRentalImagesByRenter,
  deletePostRentalImage,
  getHandoverStatus,
  uploadMiddleware,
};
