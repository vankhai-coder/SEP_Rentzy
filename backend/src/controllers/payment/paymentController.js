import { PayOS } from "@payos/node";
import crypto from "crypto";
import { Op } from "sequelize";
import db from "../../models/index.js";
import { sendEmail } from "../../utils/email/sendEmail.js";
import {
  paymentSuccessTemplateForRenter,
  paymentSuccessTemplateForOwner,
} from "../../utils/email/templates/emailTemplate.js";
import { sendContractForBookingServerSide } from "../docusign/docusignController.js";

const { Booking, Transaction, User, Notification, BookingContract, TrafficFineRequest } = db;

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

    // Chỉ cho phép thanh toán khi booking đã được owner xác nhận (confirmed)
    if (booking.status !== "confirmed") {
      return res
        .status(400)
        .json({ 
          error: "Đơn hàng chưa được chủ xe xác nhận. Vui lòng chờ chủ xe chấp nhận đơn đặt xe trước khi thanh toán." 
        });
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

    orderCode = Number(String(Date.now()).slice(-10));
    await booking.update({ order_code: orderCode });

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
    const { code, desc, data, signature } = req.body;
    console.log("PayOS webhook received:", { code, desc, orderCode: data?.orderCode });

    // Xử lý thanh toán thành công
    if (
      (code === "00" || code === 0) &&
      desc === "success" &&
      data &&
      data.orderCode
    ) {
      // Tìm booking theo order_code, order_code_remaining, hoặc traffic fine transaction
      let booking = await Booking.findOne({
        where: {
          [Op.or]: [
            { order_code: data.orderCode },
            { order_code_remaining: data.orderCode },
          ],
        },
      });

      let isTrafficFine = false;

      // Nếu không tìm thấy, có thể là thanh toán phí phạt nguội (parse orderCode để lấy bookingId)
      if (!booking) {
        const orderCodeStr = String(data.orderCode);
        // Format: bookingId + 8 số cuối của timestamp
        if (orderCodeStr.length > 8) {
          const possibleBookingId = orderCodeStr.slice(0, -8);
          if (!isNaN(possibleBookingId)) {
            const b = await Booking.findByPk(possibleBookingId);
            if (b) {
              booking = b;
              isTrafficFine = true;
            }
          }
        }
      }

      if (!booking) {
        return res.json({
          success: true,
          message: "No booking found, but webhook received.",
        });
      }

      // Nếu là thanh toán đặt cọc (chỉ cho phép khi status là confirmed)
      if (
        booking.order_code === data.orderCode &&
        booking.status === "confirmed"
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

        // Gửi hợp đồng DocuSign tự động sau khi đặt cọc thành công
        try {
          const existingContract = await BookingContract.findOne({
            where: { booking_id: booking.booking_id },
          });
          if (!existingContract || !existingContract.contract_number) {
            const { envelopeId, status: envelopeStatus } =
              await sendContractForBookingServerSide(booking.booking_id);
            console.log("DocuSign envelope created:", {
              envelopeId,
              envelopeStatus,
              bookingId: booking.booking_id,
            });
          } else {
            console.log(
              "DocuSign envelope already exists for booking:",
              booking.booking_id
            );
          }
        } catch (docuErr) {
          console.error(
            "DocuSign send contract error:",
            docuErr?.message || docuErr
          );
        }
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

        // Gửi hợp đồng DocuSign nếu chưa gửi ở bước đặt cọc
        try {
          const existingContract = await BookingContract.findOne({
            where: { booking_id: booking.booking_id },
          });
          if (!existingContract || !existingContract.contract_number) {
            const { envelopeId, status: envelopeStatus } =
              await sendContractForBookingServerSide(booking.booking_id);
            console.log("DocuSign envelope created on full payment:", {
              envelopeId,
              envelopeStatus,
              bookingId: booking.booking_id,
            });
          } else {
            console.log(
              "DocuSign envelope already exists for booking:",
              booking.booking_id
            );
          }
        } catch (docuErr) {
          console.error(
            "DocuSign send contract error (full payment):",
            docuErr?.message || docuErr
          );
        }
      }

    // Xử lý Traffic Fine (dựa vào flag isTrafficFine)
    let transactionType;

    if (isTrafficFine) {
      transactionType = "TRAFFIC_FINE";

      // Kiểm tra duplicate (đã có transaction COMPLETED với orderCode này chưa)
      // Transaction model không có order_code, kiểm tra trong note
      const existingTx = await Transaction.findOne({
        where: {
          booking_id: booking.booking_id,
          type: "TRAFFIC_FINE",
          status: "COMPLETED",
          payment_method: "PAYOS",
          note: { [Op.like]: `%${data.orderCode}%` },
        },
      });

      if (existingTx) {
        return res.json({
          success: true,
          message: "Transaction already processed, duplicate webhook ignored.",
        });
      }

      // Cập nhật traffic_fine_paid
      const currentPaid = parseFloat(booking.traffic_fine_paid || 0);
      const newPaid = currentPaid + Number(data.amount);
      await booking.update({
        traffic_fine_paid: newPaid,
      });

      // Tạo transaction mới
      await Transaction.create({
        booking_id: booking.booking_id,
        from_user_id: booking.renter_id,
        amount: data.amount,
        type: "TRAFFIC_FINE",
        status: "COMPLETED",
        payment_method: "PAYOS",
        processed_at: new Date(),
        note: `Thanh toán phí phạt nguội qua PayOS (OrderCode: ${data.orderCode})`,
      });

      // Tạo notification cho owner
      const vehicle = await db.Vehicle.findByPk(booking.vehicle_id);
      if (vehicle) {
        await db.Notification.create({
          user_id: vehicle.owner_id,
          title: "Thanh toán phí phạt nguội",
          content: `Người thuê đã thanh toán phí phạt nguội cho đơn thuê #${
            booking.booking_id
          }. Số tiền: ${Number(data.amount).toLocaleString("vi-VN")} VNĐ.`,
          type: "rental",
        });
      }

      // Thông báo cho người thuê
      await db.Notification.create({
        user_id: booking.renter_id,
        title: "Thanh toán phí phạt nguội thành công",
        content: `Bạn đã thanh toán phí phạt nguội cho booking #${
          booking.booking_id
        }. Số tiền: ${Number(data.amount).toLocaleString("vi-VN")} VNĐ.`,
        type: "rental",
      });

      try {
        const tfReq = await TrafficFineRequest.findOne({
          where: { booking_id: booking.booking_id, status: "approved" },
          order: [["reviewed_at", "DESC"]],
        });
        if (tfReq && tfReq.transfer_status !== "approved") {
          await tfReq.update({ transfer_status: "pending" });
        }
      } catch {}

      return res.json({
        success: true,
        message: "Thanh toán phí phạt nguội thành công",
      });
    } else {
      // Thanh toán bình thường (deposit hoặc rental)
      transactionType =
        booking.order_code === data.orderCode ? "DEPOSIT" : "RENTAL";
    }

      const existingTransaction = await Transaction.findOne({
        where: {
          booking_id: booking.booking_id,
          type: transactionType,
          status: "COMPLETED",
          payment_method: "PAYOS",
          amount: data.amount,
        },
      });

      // Nếu đã có transaction, không tạo mới và không gửi email
      if (existingTransaction) {
        return res.json({
          success: true,
          message: "Transaction already processed, duplicate webhook ignored.",
        });
      }

      // Tạo transaction mới khi thanh toán thành công
      const newTx = await Transaction.create({
        booking_id: booking.booking_id,
        from_user_id: booking.renter_id,
        amount: data.amount,
        type: transactionType,
        status: "COMPLETED",
        payment_method: "PAYOS",
        order_code: data.orderCode,
        processed_at: new Date(),
        note:
          booking.order_code === data.orderCode
            ? "Thanh toán đặt cọc qua PayOS"
            : "Thanh toán phần còn lại qua PayOS",
      });
      console.log("PayOS transaction created:", newTx.transaction_id);
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
              data.amount
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
    }
    // Trường hợp khác (webhook không hợp lệ)
    else {
      console.log("Webhook body invalid or unhandled:", req.body);
      return res.json({
        success: true,
        message: "Invalid or unhandled webhook body, but accepted for test.",
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

    let orderCodeRemaining = Number(String(Date.now()).slice(-10));
    await booking.update({ order_code_remaining: orderCodeRemaining });

    const description = `Con lai ${orderCodeRemaining}`;
    const body = {
      orderCode: orderCodeRemaining,
      amount: remaining,
      description,
      returnUrl,
      cancelUrl,
    };

    const timestamp = new Date().toISOString();
    console.log(`🚀 [${timestamp}] Creating PayOS remaining payment request:`, {
      orderCode: orderCodeRemaining,
      amount: remaining,
      description,
      bookingId,
      paymentType: "RENTAL",
    });

    const paymentLinkResponse = await payOS.paymentRequests.create(body);

    if (paymentLinkResponse && paymentLinkResponse.checkoutUrl) {
      console.log(
        `✅ [${timestamp}] PayOS remaining payment link created successfully:`,
        {
          orderCode: orderCodeRemaining,
          checkoutUrl: paymentLinkResponse.checkoutUrl,
          bookingId,
        }
      );
      return res.json({ payUrl: paymentLinkResponse.checkoutUrl });
    } else {
      console.error(
        `❌ [${timestamp}] PayOS unexpected response for remaining payment:`,
        paymentLinkResponse
      );
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
// Cancel PayOS transaction khi user bấm hủy
const cancelPayOSTransaction = async (req, res) => {
  try {
    const { bookingId, paymentType = "DEPOSIT" } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: "Thiếu booking ID" });
    }

    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
    }

    // Tìm transaction liên quan (nếu có)
    const orderCode =
      paymentType === "DEPOSIT"
        ? booking.order_code
        : booking.order_code_remaining;

    let transaction = null;
    if (orderCode) {
      transaction = await Transaction.findOne({
        where: {
          booking_id: bookingId,
          order_code: orderCode,
          status: "PENDING",
        },
      });
    }

    // Cancel PayOS session (luôn thực hiện để hủy session trên PayOS)
    if (orderCode) {
      await cancelPayOSSession(orderCode, "user_cancelled");
    }

    // Tạo transaction CANCELLED để ghi lại việc hủy
    if (transaction) {
      await Transaction.create({
        booking_id: bookingId,
        transaction_type: paymentType,
        amount: transaction.amount,
        status: "CANCELLED",
        order_code: orderCode,
        payment_method: "PAYOS",
        description: `${paymentType} payment cancelled by user`,
      });
    }

    // Nếu là thanh toán đặt cọc, hủy luôn đơn hàng
    if (paymentType === "DEPOSIT") {
      await booking.update({
        status: "canceled",
      });
    }

    const timestamp = new Date().toISOString();
    console.log(` [${timestamp}] User cancelled PayOS session:`, {
      bookingId,
      transactionId: transaction
        ? transaction.transaction_id
        : "No transaction found",
      orderCode,
      paymentType,
      bookingCancelled: paymentType === "DEPOSIT",
      hadTransaction: !!transaction,
    });

    return res.json({
      success: true,
      message:
        paymentType === "DEPOSIT"
          ? "Đã hủy phiên thanh toán và đơn hàng"
          : "Đã hủy phiên thanh toán",
    });
  } catch (error) {
    console.error("Cancel PayOS transaction error:", error);
    return res.status(500).json({
      error: "Lỗi hệ thống khi hủy giao dịch",
    });
  }
};

// renter trả tiền thuê còn lại bằng  tiền mặt

const paymentByCash = async (req, res) => {
  try {
    const { bookingId } = req.params;
    console.log("booking id", bookingId);
    if (!bookingId) {
      return res.status(400).json({ error: "Thiếu booking ID" });
    }

    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
    }
    if (booking.remaining_paid_by_cash_status === "pending") {
      return res.status(400).json({
        error:
          "Yêu cầu thanh toán đã đang ở trạng thái 'pending'. Vui lòng chờ xác nhận.",
      });
    }

    // Cập nhật trạng thái thanh toán
    const [updatedRows] = await Booking.update(
      { remaining_paid_by_cash_status: "pending" },
      { where: { booking_id: bookingId } }
    );

    if (updatedRows === 0) {
      return res.status(500).json({ error: "Cập nhật thất bại" });
    }

    return res.status(200).json({
      message:
        "Thanh toán tiền còn lại thành công. Vui lòng chờ chủ xe xác nhận.",
    });
  } catch (error) {
    console.error("Error in paymentByCash:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};
const approveRemainingByOwner = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const ownerId = req.user.userId;
    console.log("booking id", bookingId);
    if (!bookingId) {
      return res.status(400).json({ error: "Thiếu booking ID" });
    }

    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
    }
    if (booking.remaining_paid_by_cash_status === "approved") {
      return res.status(400).json({
        error:
          "Yêu cầu thanh toán đã đang ở trạng thái 'pending'. Vui lòng chờ xác nhận.",
      });
    }
    const [updatedRows] = await Booking.update(
      {
        remaining_paid_by_cash_status: "approved",
        status: "fully_paid",
        total_paid: booking.total_amount,
      },
      { where: { booking_id: bookingId } }
    );
    if (updatedRows === 0) {
      return res.status(500).json({ error: "Cập nhật thất bại" });
    }
    // tạo transaction cho renter thanh toán tiền thành công
    const newTransaction = await Transaction.create({
      booking_id: bookingId,
      from_user_id: booking.renter_id,
      to_user_id: ownerId,
      amount: booking.total_amount * 0.7,
      type: "RENTAL",
      status: "COMPLETED",
      payment_method: "CASH",
      processed_at: new Date(),
    });
    if (!newTransaction) {
      return res.status(500).json("có lỗi khi taọ transaction");
    }
    // tạo thông báo đến renter
    const newNotiToRenter = await Notification.create({
      user_id: booking.renter_id,
      title: "Thanh toán thành công tiền còn lại",
      content: `Chủ xe đã xác nhận thanh toán thành công tiền còn lại cho booking #${booking.booking_id}`,
      type: "rental",
    });

    if (!newNotiToRenter) {
      return res.status(409).json("lỗi tạo thông báo ");
    }
    // tạo thông báo đến owner
    const newNotiToOwner = await Notification.create({
      user_id: ownerId,
      title: "Thanh toán thành công tiền còn lại",
      content: `Chủ xe đã xác nhận thanh toán thành công tiền còn lại cho booking #${booking.booking_id}`,
      type: "rental",
    });

    if (!newNotiToOwner) {
      return res.status(409).json("lỗi tạo thông báo ");
    }

    return res.status(200).json({
      message: "Chủ xe đã xác nhận thanh toán tiền còn lại. Cảm ơn bạn!",
    });
  } catch (err) {
    return res.status(500).json("lỗi sever");
  }
};
// PAYOS: Tạo link thanh toán cho phí phạt nguội
const createPayOSLinkForTrafficFine = async (req, res) => {
  try {
    const { bookingId, returnUrl, cancelUrl } = req.body;
    const renterId = req.user.userId;

    if (!bookingId || !returnUrl || !cancelUrl) {
      return res.status(400).json({ error: "Thiếu thông tin." });
    }

    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: User, as: "renter" }],
    });

    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng." });
    }

    // Kiểm tra quyền sở hữu
    if (booking.renter_id !== renterId) {
      return res.status(403).json({ error: "Bạn không có quyền thanh toán đơn này." });
    }

    // Kiểm tra có phí phạt nguội chưa
    const trafficFineAmount = parseFloat(booking.traffic_fine_amount || 0);
    const trafficFinePaid = parseFloat(booking.traffic_fine_paid || 0);
    const remainingFine = trafficFineAmount - trafficFinePaid;

    if (remainingFine <= 0) {
      return res.status(400).json({ 
        error: "Không có phí phạt nguội cần thanh toán." 
      });
    }

    if (remainingFine < 1000) {
      return res.status(400).json({ 
        error: "Số tiền thanh toán phải từ 1.000đ trở lên." 
      });
    }

    // Tạo order code cho phí phạt nguội (sử dụng booking_id + timestamp để unique)
    const orderCode = Number(String(bookingId) + String(Date.now()).slice(-8));

    // Không tạo transaction PENDING nữa (theo yêu cầu mới)
    // Transaction sẽ được tạo khi thanh toán thành công trong webhook

    const description = `Phí phạt nguội đơn #${bookingId}`;
    const body = {
      orderCode,
      amount: Math.floor(remainingFine),
      description,
      returnUrl,
      cancelUrl,
    };

    const paymentLinkResponse = await payOS.paymentRequests.create(body);

    if (paymentLinkResponse && paymentLinkResponse.checkoutUrl) {
      return res.json({ 
        payUrl: paymentLinkResponse.checkoutUrl,
        orderCode,
        amount: remainingFine 
      });
    } else {
      return res.status(500).json({
        error: "Không lấy được link thanh toán từ PayOS.",
        payos: paymentLinkResponse,
      });
    }
  } catch (error) {
    console.error("PayOS traffic fine payment error:", error);
    return res.status(500).json({
      error: "Tạo link thanh toán phí phạt nguội thất bại",
      detail: error.message,
    });
  }
};

export {
  createPayOSLink,
  handlePayOSWebhook,
  createPayOSLinkForRemaining,
  cancelPayOSTransaction,
  paymentByCash,
  approveRemainingByOwner,
  createPayOSLinkForTrafficFine,
};
