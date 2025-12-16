import db from "../../models/index.js";
import multer from "multer";
import cloudinary from "../../config/cloudinary.js";

const {
  Booking,
  BookingHandover,
  Vehicle,
  User,
  BookingPayout,
  PointsTransaction,
  Notification,
} = db;

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

    // // Chỉ cho phép xác nhận bàn giao khi đã thanh toán đủ và hợp đồng hoàn tất
    // if (booking.status !== "fully_paid") {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Booking chưa được thanh toán đầy đủ",
    //   });
    // }
    // const contract = await db.BookingContract.findOne({
    //   where: { booking_id: bookingId },
    // });
    // if (!contract || contract.contract_status !== "completed") {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Hợp đồng DocuSign chưa hoàn tất",
    //   });
    // }

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

    // Tạo thông báo cho renter
    await Notification.create({
      user_id: booking.renter_id,
      title: "Chủ xe đã xác nhận bàn giao",
      content: `Chủ xe đã xác nhận bàn giao xe ${booking.vehicle.model}. Vui lòng kiểm tra ảnh và xác nhận nhận xe.`,
      type: "rental",
      is_read: false,
    });

    // Nếu renter đã xác nhận và đủ điều kiện, chuyển booking sang in_progress
    const latestHandover = await BookingHandover.findOne({
      where: { booking_id: bookingId },
    });
    if (latestHandover?.renter_handover_confirmed) {
      await booking.update({ status: "in_progress" });
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
      {
        model: Vehicle,
        as: "vehicle",
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
  // const contract = await db.BookingContract.findOne({ where: { booking_id: id } });
  // if (!contract || contract.contract_status !== "completed") {
  //   return res.status(400).json({
  //     success: false,
  //     message: "Hợp đồng DocuSign chưa hoàn tất",
  //   });
  // }

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

  // Chỉ chuyển sang in_progress khi chủ xe đã xác nhận
  if (handover.owner_handover_confirmed) {
    const updateBooking = await booking.update({
      status: "in_progress",
    });
    if (!updateBooking) {
      return res.status(400).json({
        success: false,
        message: "Cập nhật booking thất bại",
      });
    }
  }

  // Tạo thông báo cho chủ xe
  await Notification.create({
    user_id: booking.vehicle.owner_id,
    title: "Khách thuê đã xác nhận nhận xe",
    content: `Khách thuê đã xác nhận nhận xe ${booking.vehicle.model}. Chuyến đi đã bắt đầu.`,
    type: "rental",
    is_read: false,
  });

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
    // Nhận thêm thông tin tình trạng xe/hư hỏng từ body
  const {
      damage_reported,
      damage_description,
      compensation_amount,
      late_return,
      late_return_fee,
      late_return_fee_description,
    } = req.body || {};

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
      const rawDesc = late_return_fee_description;
      const descTrim = rawDesc !== undefined && rawDesc !== null ? String(rawDesc).trim() : null;
      const descNormalized = descTrim && !/^0*(?:\.0+)?$/.test(descTrim) ? descTrim : null;
      handover = await BookingHandover.create({
        booking_id: bookingId,
        post_rental_images: uploadedUrls,
        owner_return_confirmed: true,
        return_time: new Date(),
        // lưu tình trạng xe/hư hỏng nếu có
        damage_reported:
          typeof damage_reported === "string"
            ? damage_reported === "true"
            : Boolean(damage_reported),
        damage_description:
          (damage_description && String(damage_description).trim()) || null,
        compensation_amount:
          compensation_amount !== undefined && compensation_amount !== null
            ? Number(compensation_amount) || 0
            : 0,
        // trả xe trễ
        late_return:
          typeof late_return === "string" ? late_return === "true" : Boolean(late_return),
        late_return_fee:
          (typeof late_return === "string" ? late_return === "true" : Boolean(late_return))
            ? (late_return_fee !== undefined && late_return_fee !== null
                ? Number(late_return_fee) || 0
                : null)
            : null,
        late_return_fee_description:
          (typeof late_return === "string" ? late_return === "true" : Boolean(late_return))
            ? descNormalized
            : null,
      });
    } else {
      console.log("Updating existing handover record");
      // Cập nhật handover với ảnh mới và xác nhận
      const rawDescUpd = late_return_fee_description;
      const descTrimUpd = rawDescUpd !== undefined && rawDescUpd !== null ? String(rawDescUpd).trim() : null;
      const descNormalizedUpd = descTrimUpd && !/^0*(?:\.0+)?$/.test(descTrimUpd) ? descTrimUpd : null;
      await handover.update({
        post_rental_images: uploadedUrls,
        owner_return_confirmed: true,
        return_time: new Date(),
        // cập nhật tình trạng xe/hư hỏng nếu có
        damage_reported:
          typeof damage_reported === "string"
            ? damage_reported === "true"
            : damage_reported !== undefined
            ? Boolean(damage_reported)
            : handover.damage_reported,
        damage_description:
          damage_description !== undefined
            ? (String(damage_description).trim() || null)
            : handover.damage_description,
        compensation_amount:
          compensation_amount !== undefined && compensation_amount !== null
            ? Number(compensation_amount) || 0
            : handover.compensation_amount,
        // cập nhật thông tin trả xe trễ nếu có
        late_return:
          late_return !== undefined
            ? (typeof late_return === "string" ? late_return === "true" : Boolean(late_return))
            : handover.late_return,
        late_return_fee:
          late_return !== undefined
            ? ((typeof late_return === "string" ? late_return === "true" : Boolean(late_return))
                ? (late_return_fee !== undefined && late_return_fee !== null
                    ? Number(late_return_fee) || 0
                    : null)
                : null)
            : handover.late_return_fee,
        late_return_fee_description:
          late_return_fee_description !== undefined
            ? descNormalizedUpd
            : handover.late_return_fee_description,
      });
    }

    // Tạo thông báo cho renter
    await Notification.create({
      user_id: booking.renter_id,
      title: "Chủ xe đã xác nhận nhận lại xe",
      content: `Chủ xe đã xác nhận nhận lại xe ${booking.vehicle.model}. Vui lòng kiểm tra và xác nhận hoàn thành chuyến đi.`,
      type: "rental",
      is_read: false,
    });

    // Không cần cleanup vì sử dụng memory storage

    res.status(200).json({
      success: true,
      message: "Xác nhận nhận lại xe thành công",
      data: {
        handover_id: handover.handover_id,
        uploadedImages: uploadedUrls,
        return_time: handover.return_time,
        damage_reported: handover.damage_reported,
        damage_description: handover.damage_description,
        compensation_amount: handover.compensation_amount,
        late_return: handover.late_return,
        late_return_fee: handover.late_return_fee,
        late_return_fee_description: handover.late_return_fee_description,
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

  // Sử dụng transaction để đảm bảo tính nhất quán dữ liệu
  const transaction = await db.sequelize.transaction();

  try {
    const booking = await Booking.findOne({
      where: { booking_id: id },
      include: [
        {
          model: User,
          as: "renter",
          where: { user_id: renterId },
        },
      ],
      transaction,
    });

    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking hoặc bạn không có quyền truy cập",
      });
    }

    const handover = await BookingHandover.findOne({
      where: { booking_id: id },
      transaction,
    });

    if (!handover) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy handover record",
      });
    }

    // Cập nhật handover
    const update = await handover.update(
      {
        renter_return_confirmed: true,
        return_time: new Date(),
      },
      { transaction }
    );

    if (!update) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Cập nhật handover record thất bại",
      });
    }

    // Cập nhật booking status
    const updateBooking = await booking.update(
      {
        status: "completed",
      },
      { transaction }
    );

    if (!updateBooking) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Cập nhật booking thất bại",
      });
    }

    // Cập nhật rent_count của vehicle
    const vehicle = await Vehicle.findOne({
      where: { vehicle_id: booking.vehicle_id },
      transaction,
    });

    await vehicle.update(
      {
        rent_count: vehicle.rent_count + 1,
      },
      { transaction }
    );

    // Tính toán và cộng điểm thưởng 1% cho renter
    const pointsReward = Math.floor(booking.total_amount * 0.01); // 1% của tổng tiền đơn hàng

    // Lấy thông tin user để cập nhật điểm
    const user = await User.findByPk(renterId, { transaction });
    const newBalance = user.points + pointsReward;

    // Cập nhật điểm cho user
    await user.update({ points: newBalance }, { transaction });

    // Tạo transaction point
    await PointsTransaction.create(
      {
        user_id: renterId,
        transaction_type: "earn",
        points_amount: pointsReward,
        balance_after: newBalance,
        reference_type: "booking",
        reference_id: booking.booking_id,
        description: `Thưởng điểm 1% khi hoàn thành chuyến đi #${booking.booking_id}`,
      },
      { transaction }
    );

    // Tạo BookingPayout với status pending
    const bookingPayout = await BookingPayout.create(
      {
        booking_id: booking.booking_id,
        total_rental_amount: booking.total_amount,
        platform_commission_rate: 0.1, // 10% commission
        payout_status: "pending",
        payout_method: "bank_transfer",
        requested_at: new Date(),
      },
      { transaction }
    );

    // Tạo thông báo cho renter về điểm thưởng
    await Notification.create(
      {
        user_id: renterId,
        title: "Hoàn thành chuyến đi và nhận điểm thưởng",
        content: `Chúc mừng! Bạn đã hoàn thành chuyến đi #${
          booking.booking_id
        } và nhận được ${pointsReward.toLocaleString(
          "vi-VN"
        )} điểm thưởng. Yêu cầu thanh toán cho chủ xe đang được xử lý.`,
        type: "rental",
        is_read: false,
      },
      { transaction }
    );

    // Tạo thông báo cho owner về payout
    await Notification.create(
      {
        user_id: vehicle.owner_id,
        title: "Yêu cầu thanh toán mới",
        content: `Chuyến đi #${
          booking.booking_id
        } đã hoàn thành. Yêu cầu thanh toán ${booking.total_amount.toLocaleString(
          "vi-VN"
        )} VND đang được xử lý và sẽ được chuyển vào tài khoản của bạn sau khi trừ phí hoa hồng.`,
        type: "rental",
        is_read: false,
      },
      { transaction }
    );

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Xác nhận trả xe thành công",
      data: {
        handover_id: handover.handover_id,
        renter_return_confirmed: handover.renter_return_confirmed,
        return_time: handover.return_time,
        points_rewarded: pointsReward,
        new_balance: newBalance,
        payout_id: bookingPayout.payout_id,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error in confirmRenterReturn:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi xác nhận trả xe",
      error: error.message,
    });
  }
};

export default {
  confirmOwnerHandover,
  confirmRenterHandover,

  confirmOwnerReturn,
  confirmRenterReturn,
  uploadMiddleware,
};
