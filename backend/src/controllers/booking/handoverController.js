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

export const confirmOwnerHandover = async (req, res) => {
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
        message: "Cần upload ít nhất 5 ảnh xe để xác nhận bàn giao",
      });
    }

    if (req.files.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Chỉ được upload tối đa 10 ảnh",
      });
    }

    // Upload ảnh lên Cloudinary
    const uploadPromises = req.files.map(async (file) => {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: `handover/pre-rental/${bookingId}`,
          resource_type: "image",
        });
        return result.secure_url;
      } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        throw error;
      }
    });

    const uploadedUrls = await Promise.all(uploadPromises);

    // Tìm hoặc tạo handover record
    let handover = await BookingHandover.findOne({
      where: { booking_id: bookingId },
    });

    if (!handover) {
      handover = await BookingHandover.create({
        booking_id: bookingId,
        pre_rental_images: uploadedUrls,
        owner_handover_confirmed: true,
        handover_time: new Date(),
      });
    } else {
      // Cập nhật handover với ảnh mới và xác nhận
      await handover.update({
        pre_rental_images: uploadedUrls,
        owner_handover_confirmed: true,
        handover_time: new Date(),
      });
    }

    // Cleanup temp files
    tempFiles.forEach(deleteTempFile);

    res.status(200).json({
      success: true,
      message: "Xác nhận bàn giao xe thành công",
      data: {
        handover_id: handover.handover_id,
        uploadedImages: uploadedUrls,
        handover_time: handover.handover_time,
      },
    });
  } catch (error) {
    console.error("Error in confirmOwnerHandover:", error);

    // Cleanup temp files in case of error
    tempFiles.forEach(deleteTempFile);

    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi xác nhận bàn giao xe",
      error: error.message,
    });
  }
};

// renter xác nhận ảnh xe trước lúc nhận

export const confirmRenterHandover = async (req, res) => {
  const id = req.params.bookingId;
  const renterId = req.user.userId;

  const booking = await Booking.findOne({
    where: { booking_id: id },
    include: [
      {
        model: User,
        as: "renter",
        where: { user_id: renterId },
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
  const handover = await BookingHandover.findOne({
    where: { booking_id: id },
  });
  if (!handover) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy handover record",
    });
  }

  const update = await handover.update({
    renter_handover_confirmed: true,
    handover_time: new Date(),
  });
  if (!update) {
    return res.status(400).json({
      success: false,
      message: "Cập nhật handover record thất bại",
    });
  }
  const updateBooking = await booking.update({
    status: "in_progress",
  });
  if (!updateBooking) {
    return res.status(400).json({
      success: false,
      message: "Cập nhật booking thất bại",
    });
  }
  res.status(200).json({
    success: true,
    message: "Xác nhận handover record thành công",
    data: {
      handover_id: handover.handover_id,
      renter_handover_confirmed: handover.renter_handover_confirmed,
      handover_time: handover.handover_time,
    },
  });
};

export const uploadMiddleware = upload.array("images", 10);

export default {
  confirmOwnerHandover,
  uploadMiddleware,
};
