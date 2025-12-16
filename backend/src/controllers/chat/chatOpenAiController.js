import OpenAI from "openai";
import Vehicle from "../../models/Vehicle.js";
import Brand from "../../models/Brand.js";
import { Op } from "sequelize";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// Hàm truy vấn xe từ database với filter location
const queryVehicles = async (message) => {
  try {
    const lowercaseMsg = message.toLowerCase();

    let whereCondition = {
      status: "available",
      approvalStatus: "approved",
    };

    // 1. Xác định loại xe
    if (
      lowercaseMsg.includes("ô tô") ||
      lowercaseMsg.includes("xe hơi") ||
      lowercaseMsg.includes("xe ô tô") ||
      lowercaseMsg.includes("4 chỗ") ||
      lowercaseMsg.includes("7 chỗ") ||
      lowercaseMsg.includes("chỗ")
    ) {
      whereCondition.vehicle_type = "car";
    } else if (
      lowercaseMsg.includes("xe máy") ||
      lowercaseMsg.includes("motor")
    ) {
      whereCondition.vehicle_type = "motorbike";
    }

    // 2. Lọc theo vị trí/địa điểm
    const locationKeywords = [
      "hà nội",
      "hanoi",
      "hn",
      "hồ chí minh",
      "sài gòn",
      "saigon",
      "hcm",
      "tp hcm",
      "đà nẵng",
      "da nang",
      "đn",
      "hải phòng",
      "hai phong",
      "cần thơ",
      "can tho",
      "huế",
      "hue",
      "nha trang",
      "vũng tàu",
      "vung tau",
      "đà lạt",
      "da lat",
      "phú quốc",
      "phu quoc",
    ];

    let detectedLocation = null;
    for (const loc of locationKeywords) {
      if (lowercaseMsg.includes(loc)) {
        detectedLocation = loc;
        // Tìm xe có location chứa keyword này
        whereCondition.location = { [Op.like]: `%${loc}%` };
        break;
      }
    }

    // 3. Lọc theo giá
    let priceOrder = null;
    if (
      lowercaseMsg.includes("rẻ") ||
      lowercaseMsg.includes("giá thấp") ||
      lowercaseMsg.includes("tiết kiệm")
    ) {
      priceOrder = "ASC";
    } else if (
      lowercaseMsg.includes("đắt") ||
      lowercaseMsg.includes("cao cấp") ||
      lowercaseMsg.includes("sang")
    ) {
      priceOrder = "DESC";
    }

    // 4. Lọc theo số chỗ ngồi (với ô tô)
    if (whereCondition.vehicle_type === "car") {
      const numberMatch = lowercaseMsg.match(/(\d+)\s*(chỗ|người)/);
      if (numberMatch) {
        const seatCount = parseInt(numberMatch[1]);
        whereCondition.seats = { [Op.gte]: seatCount };
      }
    }

    // 5. Lọc theo hãng xe
    const brandMatch = lowercaseMsg.match(
      /(toyota|honda|vinfast|hyundai|kia|mazda|ford|mercedes|bmw|audi|yamaha|suzuki|sym|piaggio)/i
    );
    if (brandMatch) {
      const brandName = brandMatch[1];
      const brand = await Brand.findOne({
        where: { name: { [Op.like]: `%${brandName}%` } },
      });
      if (brand) {
        whereCondition.brand_id = brand.brand_id;
      }
    }

    // 6. Thực hiện query
    const orderBy = [];
    if (priceOrder) {
      orderBy.push(["price_per_day", priceOrder]);
    }
    orderBy.push(["rent_count", "DESC"]);

    const vehicles = await Vehicle.findAll({
      where: whereCondition,
      include: [{ model: Brand, as: "brand" }],
      order: orderBy,
      limit: 10,
    });

    return { vehicles, detectedLocation };
  } catch (error) {
    console.error("Lỗi query vehicles:", error);
    return { vehicles: [], detectedLocation: null };
  }
};

// Hàm lấy tất cả địa điểm có xe
const getAvailableLocations = async () => {
  try {
    const locations = await Vehicle.findAll({
      attributes: [
        [
          Vehicle.sequelize.fn("DISTINCT", Vehicle.sequelize.col("location")),
          "location",
        ],
      ],
      where: {
        status: "available",
        approvalStatus: "approved",
      },
      raw: true,
    });
    return locations.map((l) => l.location).filter(Boolean);
  } catch (error) {
    console.error("Lỗi lấy locations:", error);
    return [];
  }
};

// Hàm lấy tất cả hãng xe
const getAllBrands = async () => {
  try {
    const brands = await Brand.findAll({
      attributes: ["name", "category"],
      order: [["name", "ASC"]],
    });
    return brands;
  } catch (error) {
    console.error("Lỗi lấy brands:", error);
    return [];
  }
};

// Hàm format danh sách xe
const formatVehicleList = (vehicles) => {
  if (!vehicles || vehicles.length === 0) {
    return null;
  }

  return vehicles.map((v) => {
    const baseInfo = {
      vehicle_id: v.vehicle_id,
      model: v.model,
      year: v.year,
      price_per_day: Number(v.price_per_day),
      location: v.location,
      license_plate: v.license_plate,
      brand: v.brand?.name || "N/A",
    };

    if (v.vehicle_type === "car") {
      return {
        ...baseInfo,
        seats: v.seats,
        transmission: v.transmission === "automatic" ? "Tự động" : "Số sàn",
        body_type: v.body_type || "N/A",
      };
    } else {
      return {
        ...baseInfo,
        bike_type: v.bike_type || "N/A",
        engine_capacity: v.engine_capacity || "N/A",
      };
    }
  });
};

// Controller chính
export const chatWithOpenAi = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Truy vấn database
    let vehicleData = null;
    let vehicleCount = 0;
    let detectedLocation = null;

    const needVehicleQuery =
      message.toLowerCase().includes("xe") ||
      message.toLowerCase().includes("thuê") ||
      message.toLowerCase().includes("giá") ||
      message.toLowerCase().includes("tìm") ||
      message.toLowerCase().includes("có") ||
      message.toLowerCase().includes("chỗ") ||
      message.toLowerCase().includes("du lịch") ||
      message.toLowerCase().includes("ở");

    if (needVehicleQuery) {
      const { vehicles, detectedLocation: location } = await queryVehicles(
        message
      );
      detectedLocation = location;

      if (vehicles.length > 0) {
        vehicleData = formatVehicleList(vehicles);
        vehicleCount = vehicles.length;
      }
    }

    // Lấy danh sách địa điểm và hãng xe
    const availableLocations = await getAvailableLocations();
    const brands = await getAllBrands();
    const brandList = brands.map((b) => b.name).join(", ");
    const locationList = availableLocations.join(", ");

    // Xây dựng system prompt
    const systemPrompt = `
Bạn là trợ lý ảo chuyên nghiệp của Rentzy - nền tảng cho thuê xe (ô tô và xe máy).

${
  vehicleData
    ? `
DANH SÁCH XE TỪ HỆ THỐNG (${vehicleCount} xe${
        detectedLocation ? ` tại ${detectedLocation}` : ""
      }):
${JSON.stringify(vehicleData, null, 2)}
`
    : ""
}

CÁC ĐỊA ĐIỂM CÓ XE: ${
      locationList || "Hà Nội, TP HCM, Đà Nẵng, Huế, Nha Trang, Cần Thơ..."
    }

CÁC HÃNG XE CÓ SẴN: ${brandList}

NHIỆM VỤ CHÍNH:

1. QUAN TRỌNG - HỎI VỀ ĐỊA ĐIỂM:
   Khi người dùng hỏi về thuê xe mà CHƯA nói rõ địa điểm, BẮT BUỘC phải hỏi:
   "Bạn cần thuê xe tại thành phố/tỉnh nào?"
   
   Ví dụ:
   - User: "Tôi muốn thuê xe đi du lịch"
   - Bot: "Chào bạn! Bạn cần thuê xe tại thành phố/tỉnh nào? (Hà Nội, TP HCM, Đà Nẵng, Huế...)"

2. CHẤT LƯỢNG HỎI THÔNG TIN:
   Sau khi biết địa điểm, hãy hỏi thêm:
   - Loại xe: ô tô hay xe máy?
   - Số chỗ ngồi (nếu là ô tô): 4 chỗ, 7 chỗ?
   - Hãng xe mong muốn (nếu có)
   - Ngân sách dự kiến

3. XỬ LÝ KẾT QUẢ:
   - Nếu có xe phù hợp: giới thiệu chi tiết
   - Nếu KHÔNG có xe tại địa điểm đó: 
     "Xin lỗi, hiện tại Rentzy chưa có xe tại [địa điểm]. 
     Bạn có thể xem xe tại các địa điểm khác: [list địa điểm có xe]"
   - Nếu không có xe hãng đó: gợi ý hãng khác

4. FORMAT TRẢ LỜI:
   - Xuống dòng rõ ràng giữa các ý
   - KHÔNG dùng icon/emoji
   - Nếu có xe, kết thúc bằng: "Bạn có thể nhấn nút bên dưới để xem chi tiết từng xe."

QUY TẮC:
- Ngắn gọn, lịch sự, chuyên nghiệp
- KHÔNG dùng icon/emoji trong câu trả lời
- Xuống dòng rõ ràng giữa các ý
- Luôn ưu tiên hỏi địa điểm trước tiên nếu chưa có
- Chỉ dựa vào dữ liệu thực tế từ hệ thống

THÔNG TIN DỊCH VỤ RENTZY:
- Đặt cọc: 30% giá trị hợp đồng
- Bảo hiểm: Bảo hiểm vật chất xe và trách nhiệm dân sự
- Yêu cầu: Bằng lái hợp lệ
- Liên hệ: 0865842453 | rentzy.vehicle@gmail.com

QUY TRÌNH THUÊ XE (5 bước):

Bước 1 - Xác minh giấy phép lái xe
Upload bằng lái mặt trước
Phân biệt: Ô tô (B) vs Xe máy (A, từ 18 tuổi)
Thời gian xác minh: 5-10 phút

Bước 2 - Chọn xe và xem chi tiết
Tìm kiếm theo nhiều tiêu chí
Xem đánh giá từ người thuê trước
Kiểm tra lịch trống

Bước 3 - Điền thông tin thuê xe
Ngày giờ bắt đầu/kết thúc (tối thiểu 4h trước, tối đa 30 ngày)
Địa điểm nhận/trả xe (tại chỗ hoặc giao tận nơi)
Ghi chú mục đích thuê

Bước 4 - Thanh toán
Đặt cọc 30%
Thanh toán qua quét mã QR, tiền mặt
Chính sách hoàn cọc rõ ràng

Bước 5 - Xác nhận hợp đồng
Chủ xe xác nhận (nếu cần)
Ký hợp đồng điện tử
Kiểm tra xe + chụp ảnh hiện trạng

VÍ DỤ CÂU TRẢ LỜI CHUẨN:

User: "Tôi muốn thuê xe đi du lịch"
Bot: "Chào bạn! Tôi sẽ giúp bạn tìm xe phù hợp.

Bạn cần thuê xe tại thành phố/tỉnh nào?
Hiện tại Rentzy có xe tại: Hà Nội, TP HCM, Đà Nẵng, Huế, Nha Trang, Cần Thơ..."

User: "Tôi ở Đà Nẵng"
Bot: "Rất tốt! Rentzy có nhiều xe tại Đà Nẵng.

Để tìm xe phù hợp, bạn cho tôi biết:
- Bạn muốn thuê ô tô hay xe máy?
- Nếu là ô tô, cần bao nhiêu chỗ ngồi?
- Bạn có hãng xe yêu thích không?"

User: "Xe Toyota 4 chỗ ở Đà Nẵng"
Nếu CÓ xe:
"Tuyệt vời! Rentzy có các xe Toyota 4 chỗ tại Đà Nẵng:

1. Toyota Vios 2023
Giá: 500.000đ/ngày
Vị trí: Đà Nẵng
Số chỗ: 4 chỗ
Hộp số: Tự động

Bạn có thể nhấn nút bên dưới để xem chi tiết từng xe."

Nếu KHÔNG có xe:
"Xin lỗi, hiện tại Rentzy chưa có xe Toyota tại Đà Nẵng.

Tuy nhiên, bạn có thể xem:
- Xe Toyota tại Hà Nội, TP HCM
- Hoặc xe hãng Honda, VinFast tại Đà Nẵng

Bạn có muốn xem các lựa chọn này không?"
`;

    // Gọi API OpenRouter
    const completion = await client.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    res.json({
      reply: completion.choices[0].message.content,
      vehicleCount: vehicleCount,
      vehicles: vehicleData,
      detectedLocation: detectedLocation,
    });
  } catch (error) {
    console.error("Lỗi OpenRouter:", error);
    res.status(500).json({
      error: "Không thể kết nối GPT qua OpenRouter",
    });
  }
};
