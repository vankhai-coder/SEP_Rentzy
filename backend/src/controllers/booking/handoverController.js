import db from "../../models/index.js";
import multer from "multer";
import cloudinary from "../../config/cloudinary.js";

const { Booking, BookingHandover, Vehicle, User } = db;

// Không cần hàm xóa file tạm vì sử dụng memory storage

// Cấu hình multer để xử lý file trong memory (không lưu vào disk)
const storage = multer.memoryStorage();

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
export const uploadMiddleware = upload.array("images", 10);

export const confirmOwnerHandover = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const ownerId = req.user.userId;

    // Không cần lưu file tạm vì sử dụng memory storage

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

    console.log("booking found:", booking ? "yes" : "no");
    if (booking) {
      console.log("booking status:", booking.status);
    }

    if (!booking) {
      console.log("ERROR: Booking not found");
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking hoặc bạn không có quyền truy cập",
      });
    }

    // Kiểm tra số lượng file
    if (!req.files || req.files.length < 5) {
      console.log("ERROR: Not enough files:", req.files ? req.files.length : 0);
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

    // Upload ảnh lên Cloudinary từ memory buffer
    console.log("Starting Cloudinary upload for", req.files.length, "files");
    console.log(
      "Files to upload:",
      req.files.map((f) => ({
        originalname: f.originalname,
        size: f.size,
        mimetype: f.mimetype,
      }))
    );

    const uploadPromises = req.files.map(async (file, index) => {
      try {
        console.log(
          `Uploading file ${index + 1}/${req.files.length}: ${
            file.originalname
          }`
        );

        // Upload từ buffer thay vì file path
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: `handover/pre-rental/${bookingId}`,
                resource_type: "image",
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            )
            .end(file.buffer);
        });

        console.log(
          `Successfully uploaded file ${index + 1}: ${result.secure_url}`
        );
        return result.secure_url;
      } catch (error) {
        console.error(
          `Error uploading file ${index + 1} to Cloudinary:`,
          error
        );
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

    // Không cần cleanup vì sử dụng memory storage

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

    // Không cần cleanup vì sử dụng memory storage

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
export const confirmOwnerReturn = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const ownerId = req.user.userId;

    // Không cần lưu file tạm vì sử dụng memory storage

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

    console.log("booking found:", booking ? "yes" : "no");
    if (booking) {
      console.log("booking status:", booking.status);
    }

    if (!booking) {
      console.log("ERROR: Booking not found");
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking hoặc bạn không có quyền truy cập",
      });
    }

    if (booking.status !== "in_progress") {
      console.log("ERROR: Booking status not in_progress:", booking.status);
      return res.status(400).json({
        success: false,
        message: "Booking chưa được thanh toán đầy đủ",
      });
    }

    // Kiểm tra số lượng file
    if (!req.files || req.files.length < 5) {
      console.log("ERROR: Not enough files:", req.files ? req.files.length : 0);
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

    // Upload ảnh lên Cloudinary từ memory buffer
    console.log("Starting Cloudinary upload for", req.files.length, "files");
    console.log(
      "Files to upload:",
      req.files.map((f) => ({
        originalname: f.originalname,
        size: f.size,
        mimetype: f.mimetype,
      }))
    );

    const uploadPromises = req.files.map(async (file, index) => {
      try {
        console.log(
          `Uploading file ${index + 1}/${req.files.length}: ${
            file.originalname
          }`
        );

        // Upload từ buffer thay vì file path
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: `handover/post-rental/${bookingId}`,
                resource_type: "image",
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            )
            .end(file.buffer);
        });

        console.log(
          `Successfully uploaded file ${index + 1}: ${result.secure_url}`
        );
        return result.secure_url;
      } catch (error) {
        console.error(
          `Error uploading file ${index + 1} to Cloudinary:`,
          error
        );
        throw error;
      }
    });

    const uploadedUrls = await Promise.all(uploadPromises);

    // Tìm hoặc tạo handover record
    let handover = await BookingHandover.findOne({
      where: { booking_id: bookingId },
    });

    console.log("handover found:", handover ? "yes" : "no");

    if (!handover) {
      console.log("Creating new handover record");
      handover = await BookingHandover.create({
        booking_id: bookingId,
        post_rental_images: uploadedUrls,
        owner_return_confirmed: true,
        return_time: new Date(),
      });
    } else {
      console.log("Updating existing handover record");
      // Cập nhật handover với ảnh mới và xác nhận
      await handover.update({
        post_rental_images: uploadedUrls,
        owner_return_confirmed: true,
        return_time: new Date(),
      });
    }

    // Không cần cleanup vì sử dụng memory storage

    res.status(200).json({
      success: true,
      message: "Xác nhận bàn giao xe thành công",
      data: {
        handover_id: handover.handover_id,
        uploadedImages: uploadedUrls,
        return_time: handover.return_time,
      },
    });
  } catch (error) {
    console.error("Error in confirm owner returned:", error);

    // Không cần cleanup vì sử dụng memory storage

    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi xác nhận bàn giao xe",
      error: error.message,
    });
  }
};
// renter xác nhận ảnh xe sau khi trả

export const confirmRenterReturn = async (req, res) => {
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
    renter_return_confirmed: true,
    return_time: new Date(),
  });
  if (!update) {
    return res.status(400).json({
      success: false,
      message: "Cập nhật handover record thất bại",
    });
  }
  const updateBooking = await booking.update({
    status: "completed",
  });
  if (!updateBooking) {
    return res.status(400).json({
      success: false,
      message: "Cập nhật booking thất bại",
    });
  }
  const vehicle = await Vehicle.findOne({
    where: { vehicle_id: booking.vehicle_id },
  });
  // cộng rent_count lên 1
  await vehicle.update({
    rent_count: vehicle.rent_count + 1,
  });

  res.status(200).json({
    success: true,
    message: "Xác nhận trả xe  thành công",
    data: {
      handover_id: handover.handover_id,
      renter_return_confirmed: handover.renter_return_confirmed,
      return_time: handover.return_time,
    },
  });
};

export default {
  confirmOwnerHandover,
  confirmRenterHandover,

  confirmOwnerReturn,
  confirmRenterReturn,
  uploadMiddleware,
};
