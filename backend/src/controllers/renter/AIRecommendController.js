// src/controllers/renter/AIRecommendController.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// ==================== CACHE ĐƠN GIẢN (TRÁNH SPAM) ====================
const requestCache = new Map();
const CACHE_TTL = 60000; // 1 phút

const getCacheKey = (vehicles, survey) => {
  const vehicleIds = vehicles
    .map((v) => v.id)
    .sort()
    .join("-");
  const surveyKey = Object.entries(survey)
    .filter(([_, v]) => v)
    .map(([k]) => k)
    .sort()
    .join("-");
  return `${vehicleIds}:${surveyKey}`;
};

const AIRecommendController = {
  recommendVehicle: async (req, res) => {
    try {
      const { vehicles, survey } = req.body;

      // ==================== VALIDATION ====================
      if (!vehicles || vehicles.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Cần ít nhất 2 xe để gợi ý",
        });
      }

      if (!survey || typeof survey !== "object") {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin khảo sát",
        });
      }

      const hasSelection = Object.values(survey).some((v) => v === true);
      if (!hasSelection) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng chọn ít nhất 1 tiêu chí ưu tiên",
        });
      }

      // ==================== CHECK CACHE ====================
      const cacheKey = getCacheKey(vehicles, survey);
      const cached = requestCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log("✅ Trả về kết quả từ cache");
        return res.json({ success: true, recommendation: cached.data });
      }

      // ==================== TẠO PROMPT CHUẨN ====================
      const vehicleTexts = vehicles
        .map((v, i) => {
          const features = Array.isArray(v.features)
            ? v.features.slice(0, 8).join(", ")
            : "Không có tính năng nổi bật";
          return `${i + 1}. ${v.model} ${v.year}
• Giá thuê: ${v.price_per_day.toLocaleString("vi-VN")}đ/ngày
• Đã thuê: ${v.rent_count || 0} lần
• Tiêu hao nhiên liệu: ${v.fuel_consumption || "Không rõ"}
• Tính năng: ${features}
${v.seats ? `• Số ghế: ${v.seats}` : ""}
${
  v.transmission
    ? `• Hộp số: ${v.transmission === "automatic" ? "Tự động" : "Số sàn"}`
    : ""
}`;
        })
        .join("\n\n");

      const surveyMap = {
        preferCheap: "Ưu tiên giá rẻ",
        preferFuelEfficient: "Tiết kiệm xăng",
        preferSpacious: "Rộng rãi, nhiều chỗ ngồi",
        preferLuxury: "Sang trọng, đầy đủ tiện ích",
        preferPopular: "Xe được nhiều người thuê (uy tín cao)",
        preferSafety: "An toàn, có túi khí/cảm biến",
        preferNewCar: "Xe mới đời, ít hư hỏng",
        preferLongTrip: "Phù hợp đường dài, tốn ít xăng",
      };

      const surveyText =
        Object.keys(survey)
          .filter((k) => survey[k])
          .map((k) => `• ${surveyMap[k] || k}`)
          .join("\n") || "Không có ưu tiên cụ thể";

      // ⚠️ PROMPT CHẶT CHẼ - CHỈ GỢI Ý 1 XE DUY NHẤT
      const prompt = `Bạn là chuyên gia tư vấn thuê xe tại Việt Nam, nói chuyện thân thiện, gần gũi như người Việt thật sự.

Danh sách xe đang được so sánh:
${vehicleTexts}

Khách hàng có các ưu tiên sau:
${surveyText}

📌 YÊU CẦU QUAN TRỌNG:
- GỢI Ý ĐÚNG 1 CHIẾC XE DUY NHẤT phù hợp nhất với khách hàng.
- KHÔNG ĐƯỢC liệt kê nhiều xe, không được nói "tùy vào nhu cầu của bạn".
- Giải thích ngắn gọn 2-3 câu tự nhiên, thuyết phục, có thể thêm emoji.
- Bắt đầu bằng: "Theo mình thì bạn nên thuê..." hoặc "Mình khuyên bạn chọn..."

Ví dụ:
"Theo mình thì bạn nên thuê Toyota Vios 2022 nha! Xe này giá chỉ 500k/ngày, tiết kiệm xăng (chỉ 5.5L/100km), lại có 5 chỗ ngồi rộng rãi, cực hợp cho gia đình 🚗✨"`;

      // ==================== GỌI API VỚI RETRY ====================
      const MAX_RETRIES = 2;
      let lastError = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`🔄 Thử gọi AI lần ${attempt}/${MAX_RETRIES}...`);

          const completion = await client.chat.completions.create({
            model: "anthropic/claude-3.5-sonnet",
            messages: [
              {
                role: "system",
                content:
                  "Bạn là chuyên gia tư vấn thuê xe cực kỳ thân thiện và am hiểu thị trường Việt Nam. BẠN CHỈ ĐƯỢC GỢI Ý 1 XE DUY NHẤT, TUYỆT ĐỐI KHÔNG LIỆT KÊ NHIỀU LỰA CHỌN.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.7, // Giảm xuống để ổn định hơn
            max_tokens: 250,
          });

          const recommendation = completion.choices[0].message.content.trim();

          // ==================== LƯU CACHE ====================
          requestCache.set(cacheKey, {
            data: recommendation,
            timestamp: Date.now(),
          });

          // Tự động xóa cache cũ (sau 5 phút)
          setTimeout(() => requestCache.delete(cacheKey), CACHE_TTL * 5);

          console.log("✅ AI phản hồi thành công!");
          return res.json({ success: true, recommendation });
        } catch (error) {
          lastError = error;
          console.error(`❌ Lần thử ${attempt} thất bại:`, error.message);

          // Rate limit → đợi 3s
          if (error.response?.status === 429 && attempt < MAX_RETRIES) {
            console.log("⏳ Đợi 3 giây trước khi thử lại...");
            await new Promise((resolve) => setTimeout(resolve, 3000));
            continue;
          }

          // Retry sau 1s
          if (attempt < MAX_RETRIES) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      // ==================== TẤT CẢ RETRY THẤT BẠI ====================
      console.error("❌ Tất cả retry thất bại:", lastError);
      res.status(500).json({
        success: false,
        message: "AI đang bận tí xíu, bạn thử lại sau 5 giây nha!",
      });
    } catch (error) {
      console.error("OpenRouter Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra, vui lòng thử lại sau!",
      });
    }
  },
};

export default AIRecommendController;
