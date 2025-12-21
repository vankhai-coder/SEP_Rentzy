import OpenAI from "openai";
import Vehicle from "../../models/Vehicle.js";
import Brand from "../../models/Brand.js";
import { Op } from "sequelize";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// Hàm kiểm tra xem có phải yêu cầu NGOÀI phạm vi không
const isOutOfScopeRequest = (message) => {
  const lowercaseMsg = message.toLowerCase();

  const outOfScopeKeywords = [
    "xe đạp",
    "xe dap",
    "xe điện",
    "xe dien",
    "xe tải",
    "xe tai",
    "xe buýt",
    "xe buyt",
    "xe khách",
    "xe khach",
    "limousine",
    "limo",
    "xe bus",
    "xe tuk tuk",
    "xe ba bánh",
    "xe ba banh",
  ];

  return outOfScopeKeywords.some((keyword) => lowercaseMsg.includes(keyword));
};

// Hàm kiểm tra xem có phải câu hỏi CẦN TƯ VẤN thực sự không
const needsVehicleRecommendation = (message) => {
  const lowercaseMsg = message.toLowerCase();

  // Các từ khóa cho thấy người dùng MUỐN xem xe, tư vấn xe
  const recommendationKeywords = [
    "gợi ý",
    "goi y",
    "tư vấn",
    "tu van",
    "xem xe",
    "có xe nào",
    "co xe nao",
    "xe nào phù hợp",
    "xe nao phu hop",
    "cho tôi xem",
    "cho toi xem",
    "list xe",
    "danh sách xe",
    "danh sach xe",
  ];

  // Các từ khóa tìm kiếm cụ thể
  const specificSearchKeywords = [
    "tìm xe",
    "tim xe",
    "cần xe",
    "can xe",
    "muốn thuê xe ô tô",
    "muon thue xe o to",
    "muốn thuê xe máy",
    "muon thue xe may",
    "thuê ô tô",
    "thue o to",
    "thuê xe máy",
    "thue xe may",
  ];

  return (
    recommendationKeywords.some((kw) => lowercaseMsg.includes(kw)) ||
    specificSearchKeywords.some((kw) => lowercaseMsg.includes(kw))
  );
};

// Hàm truy vấn xe từ database với filter location
const queryVehicles = async (message) => {
  try {
    const lowercaseMsg = message.toLowerCase();

    let whereCondition = {
      status: "available",
      approvalStatus: "approved",
    };

    // 1. Xác định loại xe (CHỈ ô tô hoặc xe máy)
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

    // LOGIC MỚI: Kiểm tra xem có cần query xe không
    let vehicleData = null;
    let vehicleCount = 0;
    let detectedLocation = null;
    let shouldQueryVehicles = false;

    // 1. Kiểm tra nếu là yêu cầu NGOÀI phạm vi -> KHÔNG query xe
    const isOutOfScope = isOutOfScopeRequest(message);

    // 2. Kiểm tra nếu thực sự CẦN tư vấn/gợi ý xe -> MỚI query xe
    const needsRecommendation = needsVehicleRecommendation(message);

    // CHỈ query xe khi:
    // - KHÔNG phải yêu cầu ngoài phạm vi
    // - VÀ người dùng thực sự cần tư vấn/xem xe
    shouldQueryVehicles = !isOutOfScope && needsRecommendation;

    if (shouldQueryVehicles) {
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
Bạn là trợ lý ảo chuyên nghiệp của Rentzy - nền tảng cho thuê Ô TÔ và XE MÁY.

⚠️ QUAN TRỌNG: Rentzy CHỈ cho thuê 2 loại phương tiện:
1. Ô TÔ (xe hơi, xe 4 bánh)
2. XE MÁY (xe 2 bánh)

KHÔNG có: xe đạp điện, xe tải, xe khách, xe buýt, xe limousine riêng, hay bất kỳ phương tiện nào khác.

${
  vehicleData
    ? `
DANH SÁCH XE PHÙ HỢP (${vehicleCount} xe${
        detectedLocation ? ` tại ${detectedLocation}` : ""
      }):
${JSON.stringify(vehicleData, null, 2)}

⚠️ CHỈ HIỂN THỊ danh sách xe này khi người dùng THỰC SỰ CẦN xem/tư vấn xe.
`
    : `
KHÔNG CÓ DANH SÁCH XE - Người dùng chưa yêu cầu xem xe cụ thể.
`
}

CÁC ĐỊA ĐIỂM CÓ XE: ${
      locationList || "Hà Nội, TP HCM, Đà Nẵng, Huế, Nha Trang, Cần Thơ..."
    }

CÁC HÃNG XE CÓ SẴN: ${brandList}

NHIỆM VỤ CHÍNH:

1. ⚠️ QUAN TRỌNG - XỬ LÝ YÊU CẦU NGOÀI PHẠM VI:
   Nếu khách hỏi về xe đạp điện, xe tải, xe buýt, limousine, hoặc phương tiện KHÔNG PHẢI ô tô/xe máy:
   
   TRẢ LỜI NGẮN GỌN:
   "Xin lỗi, Rentzy hiện tại chỉ cho thuê ô tô và xe máy.
   
   Chúng tôi không có dịch vụ cho thuê [tên phương tiện khách hỏi].
   
   Bạn có muốn xem các xe ô tô hoặc xe máy của chúng tôi không?"
   
   ⚠️ TUYỆT ĐỐI KHÔNG list xe ra trong trường hợp này!

2. HỎI VỀ ĐỊA ĐIỂM:
   Khi người dùng hỏi về thuê xe mà CHƯA nói rõ địa điểm, hỏi:
   "Bạn cần thuê xe tại thành phố/tỉnh nào?"

3. CHỈ LIST XE KHI:
   - Người dùng nói: "gợi ý xe", "tư vấn xe", "cho tôi xem xe", "có xe nào phù hợp"
   - Người dùng tìm kiếm cụ thể: "tìm xe Toyota tại Đà Nẵng", "xe máy Honda ở Hà Nội"
   - Người dùng hỏi: "có xe gì", "list xe cho tôi"

4. KHÔNG LIST XE KHI:
   - Hỏi về xe NGOÀI phạm vi (xe đạp, xe tải...)
   - Chỉ hỏi thông tin chung: "giá thuê xe thế nào", "quy trình thuê xe"
   - Chào hỏi, trao đổi thông thường

5. FORMAT TRẢ LỜI:
   - Xuống dòng rõ ràng giữa các ý
   - KHÔNG dùng icon/emoji
   - Ngắn gọn, súc tích
   - Nếu có xe, kết thúc: "Bạn có thể nhấn nút bên dưới để xem chi tiết từng xe."

QUY TẮC:
- Ngắn gọn, lịch sự, chuyên nghiệp
- KHÔNG dùng icon/emoji
- Xuống dòng rõ ràng
- Luôn nhắc: Rentzy CHỈ có ô tô và xe máy
- Từ chối lịch sự nếu hỏi phương tiện khác
- CHỈ list xe khi thực sự cần thiết

THÔNG TIN DỊCH VỤ RENTZY:
- Phương tiện: CHỈ ô tô và xe máy
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
Ngày giờ bắt đầu/kết thúc
Địa điểm nhận/trả xe
Ghi chú mục đích thuê

Bước 4 - Thanh toán
Đặt cọc 30%
Thanh toán qua QR, tiền mặt
Chính sách hoàn cọc rõ ràng

Bước 5 - Xác nhận hợp đồng
Chủ xe xác nhận
Ký hợp đồng điện tử
Kiểm tra xe + chụp ảnh hiện trạng

VÍ DỤ CÂU TRẢ LỜI CHUẨN:

User: "Tôi muốn thuê xe đạp"
Bot: "Xin lỗi, Rentzy hiện tại chỉ cho thuê ô tô và xe máy.

Chúng tôi không có dịch vụ cho thuê xe đạp.

Bạn có muốn xem các xe ô tô hoặc xe máy của chúng tôi không?"

⚠️ KHÔNG list xe trong trường hợp này!

---

User: "Tôi cần thuê xe tải"
Bot: "Xin lỗi, Rentzy chỉ chuyên cho thuê ô tô và xe máy.

Chúng tôi không có xe tải trong dịch vụ.

Nếu bạn cần thuê xe ô tô để chở đồ, tôi có thể tư vấn giúp bạn."

⚠️ KHÔNG list xe trong trường hợp này!

---

User: "Tôi muốn thuê xe đi du lịch"
Bot: "Chào bạn! Rentzy chuyên cho thuê ô tô và xe máy.

Bạn cần thuê xe tại thành phố/tỉnh nào?"

⚠️ KHÔNG list xe - chưa đủ thông tin, chỉ hỏi thêm!

---

User: "Tôi ở Đà Nẵng, gợi ý xe cho tôi"
Nếu CÓ xe:
Bot: "Rentzy có nhiều ô tô và xe máy tại Đà Nẵng.

Để tư vấn chính xác hơn, bạn cho tôi biết:
- Bạn muốn thuê ô tô hay xe máy?
- Ngân sách dự kiến?"

✅ Có thể list xe nếu hệ thống đã query được

---

User: "Gợi ý xe máy Honda ở Đà Nẵng"
Nếu CÓ xe:
Bot: "Tuyệt vời! Rentzy có các xe máy Honda tại Đà Nẵng:

1. Honda Vision 2023
Giá: 100.000đ/ngày
Vị trí: Đà Nẵng

2. Honda SH 2024
Giá: 200.000đ/ngày
Vị trí: Đà Nẵng

Bạn có thể nhấn nút bên dưới để xem chi tiết từng xe."

✅ List xe - người dùng YÊU CẦU gợi ý cụ thể!

---

User: "Giá thuê xe thế nào?"
Bot: "Giá thuê xe tại Rentzy phụ thuộc vào loại xe và thời gian thuê:

Xe máy: từ 80.000đ - 250.000đ/ngày
Ô tô 4 chỗ: từ 400.000đ - 1.200.000đ/ngày
Ô tô 7 chỗ: từ 800.000đ - 2.500.000đ/ngày

Bạn muốn tìm xe tại thành phố nào để tôi tư vấn chi tiết hơn?"

⚠️ KHÔNG list xe - chỉ hỏi thông tin chung!
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
