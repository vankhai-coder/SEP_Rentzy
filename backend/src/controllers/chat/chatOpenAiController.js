import OpenAI from "openai";
import Vehicle from "../../models/Vehicle.js";
import { Op } from "sequelize";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// Hàm truy vấn xe từ database
const queryVehicles = async (message) => {
  try {
    const lowercaseMsg = message.toLowerCase();

    // Điều kiện cơ bản: chỉ lấy xe available và approved
    let whereCondition = {
      status: "available",
      approvalStatus: "approved",
    };

    // 1. Xác định loại xe (car hoặc motorbike)
    if (
      lowercaseMsg.includes("ô tô") ||
      lowercaseMsg.includes("xe hơi") ||
      lowercaseMsg.includes("xe ô tô")
    ) {
      whereCondition.vehicle_type = "car";
    } else if (
      lowercaseMsg.includes("xe máy") ||
      lowercaseMsg.includes("motor")
    ) {
      whereCondition.vehicle_type = "motorbike";
    }

    // 2. Lọc theo giá (tìm từ khóa về giá)
    let priceOrder = null;
    if (
      lowercaseMsg.includes("rẻ") ||
      lowercaseMsg.includes("giá thấp") ||
      lowercaseMsg.includes("tiết kiệm")
    ) {
      priceOrder = "ASC"; // Giá tăng dần
    } else if (
      lowercaseMsg.includes("đắt") ||
      lowercaseMsg.includes("cao cấp") ||
      lowercaseMsg.includes("sang")
    ) {
      priceOrder = "DESC"; // Giá giảm dần
    }

    // 3. Lọc theo số chỗ ngồi (CHỈ với ô tô)
    if (whereCondition.vehicle_type === "car") {
      // Tìm số trong câu hỏi
      const numberMatch = lowercaseMsg.match(/(\d+)\s*(chỗ|người)/);
      if (numberMatch) {
        const seatCount = parseInt(numberMatch[1]);
        whereCondition.seats = { [Op.gte]: seatCount }; // Tìm xe có >= số chỗ yêu cầu
      }
    }

    // 4. Thực hiện query
    const orderBy = [];
    if (priceOrder) {
      orderBy.push(["price_per_day", priceOrder]);
    }
    orderBy.push(["rent_count", "DESC"]); // Ưu tiên xe được thuê nhiều

    const vehicles = await Vehicle.findAll({
      where: whereCondition,
      order: orderBy,
      limit: 10,
    });

    return vehicles;
  } catch (error) {
    console.error("❌ Lỗi query vehicles:", error);
    return [];
  }
};

// Hàm format thông tin xe
const formatVehicleList = (vehicles) => {
  if (!vehicles || vehicles.length === 0) {
    return null;
  }

  return vehicles
    .map((v, index) => {
      const baseInfo = `${index + 1}. ${v.model} (${v.year})
   - Giá: ${Number(v.price_per_day).toLocaleString("vi-VN")}đ/ngày
   - Vị trí: ${v.location}
   - Biển số: ${v.license_plate}`;

      // Thêm thông tin riêng theo loại xe
      if (v.vehicle_type === "car") {
        return (
          baseInfo +
          `
   - Số chỗ: ${v.seats} chỗ
   - Hộp số: ${v.transmission === "automatic" ? "Tự động" : "Số sàn"}
   - Loại xe: ${v.body_type || "N/A"}`
        );
      } else {
        return (
          baseInfo +
          `
   - Loại xe máy: ${v.bike_type || "N/A"}
   - Dung tích: ${v.engine_capacity || "N/A"}cc`
        );
      }
    })
    .join("\n\n");
};

// Controller chính
export const chatWithOpenAi = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Truy vấn database nếu câu hỏi liên quan đến xe
    let vehicleData = null;
    let vehicleCount = 0;

    const needVehicleQuery =
      message.toLowerCase().includes("xe") ||
      message.toLowerCase().includes("thuê") ||
      message.toLowerCase().includes("giá") ||
      message.toLowerCase().includes("tìm") ||
      message.toLowerCase().includes("có");

    if (needVehicleQuery) {
      const vehicles = await queryVehicles(message);
      if (vehicles.length > 0) {
        vehicleData = formatVehicleList(vehicles);
        vehicleCount = vehicles.length;
      }
    }

    // Xây dựng system prompt động
    const systemPrompt = `
Bạn là trợ lý ảo chuyên nghiệp của website thuê xe (ô tô và xe máy).

${
  vehicleData
    ? `
📋 DANH SÁCH XE TỪ HỆ THỐNG (${vehicleCount} xe):
${vehicleData}

Hãy dựa vào danh sách xe trên để trả lời khách hàng.
`
    : ""
}

NHIỆM VỤ:
- Trả lời các câu hỏi về dịch vụ thuê xe: loại xe, giá thuê, điều kiện, thủ tục đặt xe, chính sách, bảo hiểm
- Nếu có thông tin xe từ hệ thống, hãy giới thiệu rõ ràng và chính xác
- Nếu không có thông tin: "Xin lỗi, hiện tại tôi chưa có thông tin về vấn đề này. Bạn có thể liên hệ nhân viên để được hỗ trợ thêm."
- Nếu hỏi ngoài phạm vi thuê xe: "Xin lỗi, tôi chỉ hỗ trợ trong phạm vi dịch vụ thuê xe."

QUY TẮC:
✅ Ngắn gọn, lịch sự, dễ hiểu
✅ Không tạo thông tin giả
✅ Chỉ dựa vào dữ liệu thực tế từ hệ thống
✅ Không đề cập đến việc "tôi có dữ liệu" hay "hệ thống", chỉ trả lời trực tiếp
❌ Không tự ý thêm thông tin không có trong dữ liệu
📌 Không dùng icon trong các câu trả lời

THÔNG TIN DỊCH VỤ:
- Đặt cọc: 30% giá trị hợp đồng
- Bảo hiểm: Bảo hiểm vật chất xe và trách nhiệm dân sự
- Yêu cầu: Bằng lái hợp lệ, CMND/CCCD
- Liên hệ: 0865842453 | rentzy.vehicle@gmail.com

QUY TRÌNH THUÊ XE CHI TIẾT (5 bước):
✅ Bước 1 - Xác minh giấy phép lái xe
* Yêu cầu upload bằng lái mặt trước
* Phân biệt rõ: Ô tô (B) vs Xe máy (A, 18+)
* Thời gian xác minh: 5-10 phút

✅ Bước 2 - Chọn xe và xem chi tiết
* Tìm kiếm theo nhiều tiêu chí
* Xem đánh giá từ người thuê trước
* Kiểm tra lịch trống

✅ Bước 3 - Điền thông tin thuê xe
* Ngày giờ bắt đầu/kết thúc (tối thiểu 4h trước, tối đa 30 ngày)
* Địa điểm nhận/trả xe (tại chỗ hoặc giao tận nơi)
* Ghi chú mục đích thuê

✅ Bước 4 - Thanh toán
* Đặt cọc 30% (hoặc giữ CMND)
* 3 phương thức: chuyển khoản, ví điện tử, tiền mặt
* Chính sách hoàn cọc rõ ràng

✅ Bước 5 - Xác nhận hợp đồng
* Chủ xe xác nhận (nếu cần)
* Ký hợp đồng điện tử
* Kiểm tra xe + chụp ảnh hiện trạng
`;

    // Gọi API OpenRouter
    const completion = await client.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    res.json({
      reply: completion.choices[0].message.content,
      vehicleCount: vehicleCount,
    });
  } catch (error) {
    console.error("❌ Lỗi OpenRouter:", error);
    res.status(500).json({
      error: "Không thể kết nối GPT qua OpenRouter",
    });
  }
};
