import { PayOS } from "@payos/node";
import crypto from "crypto";
import db from "../../models/index.js";

const { Booking, Transaction, User } = db;

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
    console.log("DEBUG PayOS:", { bookingId, totalAmount, amount });

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
      booking.order_code &&
      typeof booking.order_code === "number" &&
      booking.order_code > 0 &&
      booking.order_code < 9007199254740991
    ) {
      orderCode = booking.order_code;
    } else {
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

    // Nếu có giao dịch đang chờ xử lý, tái sử dụng
    if (transaction) {
      console.log("Existing pending PayOS transaction found. Reusing...");
    } else {
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
    const description = `Coc don ${orderCode}`;
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
          [db.sequelize.Op.or]: [
            { order_code: data.orderCode },
            { order_code_remaining: data.orderCode },
          ],
        },
      });

      console.log(
        "Booking found:",
        booking ? booking.booking_id : null,
        "Status:",
        booking ? booking.status : null
      );

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
        await booking.update({ status: "deposit_paid" });
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
      if (
        booking.order_code_remaining === data.orderCode &&
        booking.status === "deposit_paid"
      ) {
        await booking.update({ status: "fully_paid" });
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

    // Nếu có giao dịch đang chờ xử lý, tái sử dụng
    if (transaction) {
      console.log(
        "Existing pending PayOS RENTAL transaction found. Reusing..."
      );
    } else {
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
