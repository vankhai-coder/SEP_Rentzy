import { PayOS } from "@payos/node";
import crypto from "crypto";
import { Op } from "sequelize";
import db from "../../models/index.js";
import { sendEmail } from "../../utils/email/sendEmail.js";
import {
  paymentSuccessTemplateForRenter,
  paymentSuccessTemplateForOwner,
} from "../../utils/email/templates/emailTemplate.js";

const { Booking, Transaction, User, Notification } = db;

const payOS = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

// PAYOS: Tạo link thanh toán cho đặt cọc
const createPayOSLink = async (req, res) => {
  try {
    const { bookingId, returnUrl, cancelUrl } = req.body;
    if (!bookingId || !returnUrl || !cancelUrl) {
      return res.status(400).json({ error: "Thiếu thông tin." });
    }

    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: User, as: "renter" }],
    });

    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng." });
    }

    if (booking.status !== "pending") {
      return res
        .status(400)
        .json({ error: "Đơn hàng không hợp lệ để thanh toán." });
    }

    // Đặt cọc là 30% của tổng thanh toán thực tế (total_amount)
    const totalAmount = booking.total_amount || 0;
    const amount = Math.floor(totalAmount * 0.3);

    if (totalAmount < 1000) {
      return res
        .status(400)
        .json({ error: "Tổng tiền đơn hàng không hợp lệ." });
    }

    if (amount < 1000) {
      return res
        .status(400)
        .json({ error: "Số tiền thanh toán phải từ 1.000đ trở lên." });
    }

    // orderCode: số dương nhỏ hơn 9007199254740991, duy nhất
    let orderCode;
    if (
      // đã có trong database
      booking.order_code &&
      typeof booking.order_code === "number" &&
      booking.order_code > 0 &&
      booking.order_code < 9007199254740991
    ) {
      // lấy mã cũ dùng
      orderCode = booking.order_code;
    } else {
      // tạo mã mới
      orderCode = Number(String(Date.now()).slice(-10));
      await booking.update({ order_code: orderCode });
    }

    // Tìm kiếm giao dịch PayOS đang chờ xử lý cho booking này
    let transaction = await Transaction.findOne({
      where: {
        booking_id: bookingId,
        payment_method: "PAYOS",
        status: "PENDING",
        type: "DEPOSIT",
      },
    });

    // Kiểm tra timeout cho transaction pending (15 phút)
    const TRANSACTION_TIMEOUT = 15 * 60 * 1000; // 15 phút
    if (transaction) {
      const transactionAge =
        Date.now() - new Date(transaction.created_at).getTime();

      if (transactionAge > TRANSACTION_TIMEOUT) {
        console.log(
          "Pending deposit transaction expired. Marking as CANCELLED and creating new one..."
        );
        await transaction.update({
          status: "CANCELLED",
          note: transaction.note + " - Hủy do timeout",
        });
        transaction = null; // Đặt về null để tạo transaction mới
      } else {
        console.log("Existing pending PayOS transaction found. Reusing...");
      }
    }

    if (!transaction) {
      // Nếu không có, tạo một bản ghi giao dịch mới
      console.log("No pending PayOS transaction found. Creating a new one...");
      transaction = await Transaction.create({
        booking_id: bookingId,
        from_user_id: booking.renter_id,
        amount: amount,
        type: "DEPOSIT",
        status: "PENDING",
        payment_method: "PAYOS",
        note: `Thanh toán đặt cọc booking #${bookingId} qua PayOS`,
      });
    }

    // description tối đa 25 ký tự
    const description = `Cọc đơn ${orderCode}`;
    const body = {
      orderCode,
      amount,
      description,
      returnUrl,
      cancelUrl,
    };

    const paymentLinkResponse = await payOS.paymentRequests.create(body);

    if (paymentLinkResponse && paymentLinkResponse.checkoutUrl) {
      return res.json({ payUrl: paymentLinkResponse.checkoutUrl });
    } else {
      console.error("PayOS unexpected response:", paymentLinkResponse);
      return res.status(500).json({
        error: "Không lấy được link thanh toán từ PayOS.",
        payos: paymentLinkResponse,
      });
    }
  } catch (error) {
    console.error(
      "PayOS error:",
      error.response?.data || error.message,
      error.response?.status
    );
    return res.status(500).json({
      error: "Tạo link thanh toán thất bại",
      detail: error.message,
      payos: error.response?.data,
    });
  }
};

// PAYOS: Webhook nhận thông báo thanh toán
const handlePayOSWebhook = async (req, res) => {
  try {
    console.log("PayOS webhook received");
    console.log("chạy web hook lấy data ");
    console.log("Webhook raw body:", req.body);

    const { code, desc, data, signature } = req.body;

    if (
      (code === "00" || code === 0) &&
      desc === "success" &&
      data &&
      data.orderCode
    ) {
      // Tìm booking theo order_code hoặc order_code_remaining
      const booking = await Booking.findOne({
        where: {
          [Op.or]: [
            { order_code: data.orderCode },
            { order_code_remaining: data.orderCode },
          ],
        },
      });

      if (!booking) {
        return res.json({
          success: true,
          message: "No booking found, but webhook received.",
        });
      }

      // Nếu là thanh toán đặt cọc
      if (
        booking.order_code === data.orderCode &&
        booking.status === "pending"
      ) {
        await booking.update({
          status: "deposit_paid",
          total_paid: Number(data.amount),
        });
        console.log("DEBUG PayOS:", {
          bookingId: booking.booking_id,
          amount: data.amount,
        });
        console.log(
          "Booking status updated to deposit_paid:",
          booking.booking_id
        );
      }

      // Nếu là thanh toán phần còn lại

      let totalPaid = Number(data.amount) + Number(booking.total_paid);

      if (
        booking.order_code_remaining === data.orderCode &&
        booking.status === "deposit_paid"
      ) {
        await booking.update({
          status: "fully_paid",
          total_paid: totalPaid,
        });
        console.log(
          "Booking status updated to fully_paid:",
          booking.booking_id
        );
      }

      // Tìm và cập nhật transaction đang pending
      const transactionType =
        booking.order_code === data.orderCode ? "DEPOSIT" : "RENTAL";
      let transaction = await Transaction.findOne({
        where: {
          booking_id: booking.booking_id,
          payment_method: "PAYOS",
          status: "PENDING",
          type: transactionType,
          amount: data.amount,
        },
      });

      if (transaction) {
        // Cập nhật transaction đã có
        await transaction.update({
          status: "COMPLETED",
          processed_at: new Date(),
        });
        console.log(
          "PayOS transaction updated to COMPLETED:",
          transaction.transaction_id
        );
      } else {
        // Tạo transaction mới nếu không tìm thấy (fallback cho các trường hợp cũ)
        const newTx = await Transaction.create({
          booking_id: booking.booking_id,
          from_user_id: booking.renter_id,
          amount: data.amount,
          type: transactionType,
          status: "COMPLETED",
          payment_method: "PAYOS",
          processed_at: new Date(),
          note:
            booking.order_code === data.orderCode
              ? "Thanh toán đặt cọc qua PayOS"
              : "Thanh toán phần còn lại qua PayOS",
        });
        console.log("PayOS transaction created:", newTx.transaction_id);
      }
      // tạo thông báo và gửi email cho renter và owner khi có mà thanh toán thành công
      const isDepositPayment = booking.order_code === data.orderCode;
      const paymentTypeText = isDepositPayment ? "đặt cọc" : "phần còn lại";

      // Lấy thông tin đầy đủ để gửi email
      const vehicle = await db.Vehicle.findByPk(booking.vehicle_id);
      const renter = await db.User.findByPk(booking.renter_id);
      const owner = vehicle ? await db.User.findByPk(vehicle.owner_id) : null;

      if (!vehicle || !renter || !owner) {
        console.error("Missing required data for email:", {
          vehicle: !!vehicle,
          renter: !!renter,
          owner: !!owner,
        });
      }

      // Thông báo cho người thuê
      await Notification.create({
        user_id: booking.renter_id,
        title: "Thanh toán thành công",
        content: `Thanh toán ${paymentTypeText} cho booking #${booking.booking_id} thành công.`,
        type: "rental",
      });

      // Gửi email cho người thuê
      if (renter && vehicle) {
        try {
          await sendEmail({
            from: process.env.GMAIL_USER,
            to: renter.email,
            subject: `Thanh toán ${paymentTypeText} thành công - Booking #${booking.booking_id}`,
            html: paymentSuccessTemplateForRenter(
              booking.booking_id,
              paymentTypeText,
              data.amount,
              vehicle.vehicle_model || vehicle.vehicle_name
            ),
          });
          console.log("Email sent to renter:", renter.email);
        } catch (emailError) {
          console.error("Error sending email to renter:", emailError);
        }
      }

      // Thông báo cho chủ xe
      if (vehicle) {
        await Notification.create({
          user_id: vehicle.owner_id,
          title: "Nhận được thanh toán",
          content: `Nhận được thanh toán ${paymentTypeText} từ ${renter.full_name} cho booking #${booking.booking_id}.`,
          type: "rental",
        });

        // Gửi email cho chủ xe
        if (owner && renter) {
          try {
            await sendEmail({
              from: process.env.GMAIL_USER,
              to: owner.email,
              subject: `Nhận được thanh toán ${paymentTypeText} - Booking #${booking.booking_id}`,
              html: paymentSuccessTemplateForOwner(
                booking.booking_id,
                paymentTypeText,
                data.amount,
                vehicle.vehicle_model,
                renter.full_name || renter.email
              ),
            });
            console.log("Email sent to owner:", owner.email);
          } catch (emailError) {
            console.error("Error sending email to owner:", emailError);
          }
        }
      }

      return res.json({ success: true });
    } else {
      console.log("Webhook body invalid:", req.body);
      return res.json({
        success: true,
        message: "Invalid webhook body, but accepted for test.",
      });
    }
  } catch (error) {
    console.error("PayOS Webhook error:", error);
    return res.json({
      success: false,
      message: "Error, but accepted for test.",
    });
  }
};

// API tạo link PayOS cho phần còn lại
const createPayOSLinkForRemaining = async (req, res) => {
  try {
    const { bookingId, returnUrl, cancelUrl } = req.body;
    if (!bookingId || !returnUrl || !cancelUrl) {
      return res.status(400).json({ error: "Thiếu thông tin." });
    }

    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: User, as: "renter" }],
    });

    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng." });
    }

    if (booking.status !== "deposit_paid") {
      return res
        .status(400)
        .json({ error: "Chỉ thanh toán phần còn lại khi đã đặt cọc." });
    }

    const deposit = Math.floor(booking.total_amount * 0.3);
    const remaining = booking.total_amount - deposit;

    if (remaining < 1000) {
      return res
        .status(400)
        .json({ error: "Số tiền thanh toán phải từ 1.000đ trở lên." });
    }

    let orderCodeRemaining = booking.order_code_remaining;
    if (!orderCodeRemaining) {
      orderCodeRemaining = Number(String(Date.now()).slice(-10));
      await booking.update({ order_code_remaining: orderCodeRemaining });
    }

    // Tìm kiếm giao dịch PayOS đang chờ xử lý cho phần còn lại
    let transaction = await Transaction.findOne({
      where: {
        booking_id: bookingId,
        payment_method: "PAYOS",
        status: "PENDING",
        type: "RENTAL",
      },
    });

    // Kiểm tra timeout cho transaction pending (15 phút)
    const TRANSACTION_TIMEOUT = 15 * 60 * 1000; // 15 phút
    if (transaction) {
      const transactionAge =
        Date.now() - new Date(transaction.created_at).getTime();

      if (transactionAge > TRANSACTION_TIMEOUT) {
        console.log(
          "Pending transaction expired. Marking as CANCELLED and creating new one..."
        );
        await transaction.update({
          status: "CANCELLED",
          note: transaction.note + " - Hủy do timeout",
        });
        transaction = null; // Đặt về null để tạo transaction mới
      } else {
        console.log(
          "Existing pending PayOS RENTAL transaction found. Reusing..."
        );
      }
    }

    if (!transaction) {
      // Nếu không có, tạo một bản ghi giao dịch mới
      console.log(
        "No pending PayOS RENTAL transaction found. Creating a new one..."
      );
      transaction = await Transaction.create({
        booking_id: bookingId,
        from_user_id: booking.renter_id,
        amount: remaining,
        type: "RENTAL",
        status: "PENDING",
        payment_method: "PAYOS",
        note: `Thanh toán phần còn lại booking #${bookingId} qua PayOS`,
      });
    }

    const description = `Con lai ${orderCodeRemaining}`;
    const body = {
      orderCode: orderCodeRemaining,
      amount: remaining,
      description,
      returnUrl,
      cancelUrl,
    };

    const paymentLinkResponse = await payOS.paymentRequests.create(body);

    if (paymentLinkResponse && paymentLinkResponse.checkoutUrl) {
      return res.json({ payUrl: paymentLinkResponse.checkoutUrl });
    } else {
      return res
        .status(500)
        .json({ error: "Không lấy được link thanh toán từ PayOS." });
    }
  } catch (error) {
    return res.status(500).json({
      error: "Tạo link thanh toán phần còn lại thất bại",
      detail: error.message,
    });
  }
};

export { createPayOSLink, handlePayOSWebhook, createPayOSLinkForRemaining };
