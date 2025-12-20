import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

// Ưu tiên key riêng cho Traffic Fine nếu có, nếu không thì dùng key chung
  const apiKey =
    process.env.OPENROUTER_API_KEY_TRAFFIC_FINE ||
    process.env.OPENAI_API_KEY ||
    process.env.OPENROUTER_API_KEY;

  const baseURL =
    process.env.OPENAI_BASE_URL ||
    (process.env.OPENROUTER_API_KEY_TRAFFIC_FINE || process.env.OPENROUTER_API_KEY
      ? "https://openrouter.ai/api/v1"
      : "https://api.openai.com/v1");

const client = new OpenAI({
  apiKey,
  baseURL,
});

/**
 * POST /api/owner/dashboard/extract-traffic-fine-info
 * Trích xuất thông tin từ ảnh phạt nguội sử dụng AI Vision
 */
export const extractTrafficFineInfo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng upload một hình ảnh phạt nguội",
      });
    }

    // Kiểm tra API key
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message:
          "Thiếu API key cho AI (OPENAI_API_KEY hoặc OPENROUTER_API_KEY)",
      });
    }

    // Chuyển đổi ảnh sang base64
    const imageBase64 = req.file.buffer.toString("base64");
    const imageMimeType = req.file.mimetype;

    // Prompt cho AI để trích xuất thông tin
    const prompt = `Bạn là chuyên gia đọc và phân tích giấy phạt nguội (vi phạm giao thông) tại Việt Nam. 
Hãy đọc KỸ LƯỠNG và TRÍCH XUẤT TẤT CẢ các thông tin có trong hình ảnh giấy phạt nguội, bao gồm:

**THÔNG TIN BẮT BUỘC CẦN TÌM:**
1. **Ngày tháng năm vi phạm**: Tìm mọi thông tin về ngày, tháng, năm vi phạm (có thể ở bất kỳ đâu trong giấy, format: DD/MM/YYYY)
2. **Biển số xe**: Tìm biển số xe bị phạt (có thể viết dạng: 30A-12345, 51G-12345, 99A32507, 30A.12345, v.v.)
3. **Màu biển số**: Tìm mô tả màu sắc biển số nếu có (ví dụ: "Nền màu trắng, chữ và số màu đen", "Biển số màu xanh", v.v.)
4. **Tốc độ tối đa cho phép**: Tìm tốc độ tối đa cho phép (có thể viết: "80 km/h", "80km/h", "80", v.v.)
5. **Hành vi vi phạm**: Tìm mô tả CHI TIẾT và ĐẦY ĐỦ hành vi vi phạm (ví dụ: "Điều khiển xe chạy quá tốc độ quy định từ 10km/h đến 20 km/h", "Không đội mũ bảo hiểm khi điều khiển xe mô tô", v.v.)
6. **Lý do bị phạt (tóm tắt)**: Tóm tắt ngắn gọn lý do (ví dụ: "Vượt quá tốc độ", "Không đội mũ bảo hiểm", "Đi sai làn đường")
7. **Số tiền phạt**: Tìm số tiền phạt (có thể viết: "500.000 VNĐ", "500000", "500.000đ", v.v.)
8. **Đơn vị vận hành hệ thống**: Tìm đơn vị/đội tuần tra phát hiện vi phạm (có thể là: "Đội tuần tra, kiểm soát giao thông đường bộ cao tốc số 1", "Phòng Hướng dẫn tuần tra...", v.v.)
9. **Địa điểm vi phạm**: Tìm địa điểm vi phạm nếu có (tên đường, km, v.v.)

**HƯỚNG DẪN ĐỌC:**
- ĐỌC TẤT CẢ VĂN BẢN trong hình ảnh, không bỏ sót bất kỳ thông tin nào
- Thông tin có thể nằm ở BẤT KỲ VỊ TRÍ NÀO trong giấy phạt (đầu, giữa, cuối, bên trái, bên phải)
- Đọc cả các trường không chuẩn, các ghi chú, các thông tin bổ sung
- Nếu thấy bất kỳ thông tin nào liên quan đến các trường trên, hãy trích xuất
- Giữ nguyên format và cách viết như trong giấy phạt (không tự ý thay đổi)

**QUAN TRỌNG:**
- Trả về kết quả dưới dạng JSON thuần túy, không có markdown hay text khác
- Nếu không tìm thấy thông tin nào, để giá trị là null
- Định dạng ngày tháng: DD/MM/YYYY
- Biển số xe: giữ nguyên format như trong giấy (có thể có dấu gạch ngang, dấu chấm, hoặc không)
- Số tiền: chuyển về số nguyên (loại bỏ dấu chấm, phẩy, ký tự VNĐ/đ)
- Trích xuất TẤT CẢ thông tin có trong giấy, không bỏ sót

Định dạng JSON cần trả về:
{
  "violationDate": "DD/MM/YYYY hoặc null",
  "licensePlate": "biển số xe hoặc null",
  "licensePlateColor": "mô tả màu biển số hoặc null",
  "maxAllowedSpeed": "tốc độ tối đa cho phép hoặc null",
  "violationBehavior": "hành vi vi phạm chi tiết và đầy đủ hoặc null",
  "violationReason": "lý do bị phạt tóm tắt hoặc null",
  "fineAmount": số tiền phạt (số nguyên) hoặc null,
  "operatingUnit": "đơn vị vận hành hệ thống hoặc null",
  "violationLocation": "địa điểm vi phạm hoặc null"
}`;

    // Gọi OpenAI Vision API
    // Sử dụng model hỗ trợ vision tốt nhất
    // gpt-4o và gpt-4o-mini đều hỗ trợ vision
    let visionModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
    
    // Đảm bảo model hỗ trợ vision
    // Nếu model không phải là gpt-4o hoặc gpt-4o-mini, fallback về gpt-4o-mini
    if (!visionModel.includes("gpt-4o") && !visionModel.includes("gpt-4-turbo") && !visionModel.includes("gpt-4-vision")) {
      visionModel = "gpt-4o-mini";
    }

    const response = await client.chat.completions.create({
      model: visionModel,
      messages: [
        {
          role: "system",
          content:
            "Bạn là chuyên gia đọc giấy phạt nguội tại Việt Nam. BẠN PHẢI đọc TẤT CẢ văn bản trong hình ảnh và trích xuất mọi thông tin có thể. Luôn trả về JSON thuần túy, không có markdown hay text khác. Nếu thấy bất kỳ thông tin nào liên quan đến các trường được yêu cầu, hãy trích xuất nó.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${imageMimeType};base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      temperature: 0.1, // Giảm temperature để kết quả chính xác hơn
      max_tokens: 600, // Đủ để trả về thông tin chi tiết nhưng không vượt quá credits
    });

    const aiResponse = response.choices[0].message.content.trim();
    console.log("[ExtractTrafficFine] Raw AI response:", aiResponse);

    // Loại bỏ markdown code blocks nếu có
    let jsonString = aiResponse
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Tìm JSON trong response nếu có text thêm
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    console.log("[ExtractTrafficFine] Parsed JSON string:", jsonString);

    let extractedInfo;
    try {
      extractedInfo = JSON.parse(jsonString);
      console.log("[ExtractTrafficFine] Parsed data:", JSON.stringify(extractedInfo, null, 2));
    } catch (parseError) {
      console.error("[ExtractTrafficFine] JSON parse error:", parseError);
      console.error("[ExtractTrafficFine] JSON string that failed:", jsonString);
      throw new Error("Không thể phân tích dữ liệu từ AI. Vui lòng thử lại.");
    }

    // Validate và format dữ liệu
    const result = {
      violationDate: extractedInfo.violationDate || null,
      licensePlate: extractedInfo.licensePlate || null,
      licensePlateColor: extractedInfo.licensePlateColor || null,
      maxAllowedSpeed: extractedInfo.maxAllowedSpeed || null,
      violationBehavior: extractedInfo.violationBehavior || null,
      violationReason: extractedInfo.violationReason || null,
      fineAmount: extractedInfo.fineAmount || null,
      operatingUnit: extractedInfo.operatingUnit || null,
      violationLocation: extractedInfo.violationLocation || null,
    };

    // Format ngày tháng nếu có
    if (result.violationDate) {
      // Chuyển đổi các format khác nhau về DD/MM/YYYY
      const dateStr = result.violationDate;
      // Nếu là format YYYY-MM-DD, chuyển sang DD/MM/YYYY
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateStr.split("-");
        result.violationDate = `${day}/${month}/${year}`;
      }
    }

    // Format biển số xe (loại bỏ khoảng trắng thừa)
    if (result.licensePlate) {
      result.licensePlate = result.licensePlate.trim().toUpperCase();
    }

    // Format số tiền phạt (chuyển sang số nếu là string)
    if (result.fineAmount) {
      if (typeof result.fineAmount === "string") {
        // Loại bỏ các ký tự không phải số
        const amountStr = result.fineAmount.replace(/[^\d]/g, "");
        result.fineAmount = amountStr ? parseInt(amountStr, 10) : null;
      }
    }

    console.log("[ExtractTrafficFine] Final result:", JSON.stringify(result, null, 2));

    // Kiểm tra xem có ít nhất một trường có dữ liệu không
    const hasData = Object.values(result).some(value => value !== null && value !== "");
    if (!hasData) {
      console.warn("[ExtractTrafficFine] No data extracted from image");
      return res.json({
        success: false,
        message: "Không thể đọc được thông tin từ ảnh. Vui lòng kiểm tra lại chất lượng ảnh hoặc thử ảnh khác.",
        data: result,
      });
    }

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error extracting traffic fine info:", error);

    // Xử lý lỗi JSON parse
    if (error instanceof SyntaxError) {
      return res.status(500).json({
        success: false,
        message:
          "Không thể đọc thông tin từ ảnh. Vui lòng kiểm tra lại chất lượng ảnh hoặc thử ảnh khác.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }

    // Xử lý lỗi không đủ credits (402)
    if (error?.status === 402 || error?.code === 402) {
      return res.status(402).json({
        success: false,
        message:
          "Tài khoản AI không đủ credits để xử lý. Vui lòng liên hệ quản trị viên để nạp thêm credits hoặc thử lại sau.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }

    // Xử lý lỗi API khác
    const status = error?.status || error?.response?.status || 500;
    const message =
      error?.error?.message ||
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      "Lỗi khi xử lý ảnh bằng AI. Vui lòng thử lại sau.";

    return res.status(status).json({
      success: false,
      message,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

