// services/contentModerationService.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

/**
 * Kiểm tra nội dung có chứa từ ngữ nhạy cảm hay không
 * @param {string} content - Nội dung cần kiểm tra
 * @returns {Promise<{isValid: boolean, reason: string}>}
 */
export const checkContentModeration = async (content) => {
  try {
    const completion = await client.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "system",
          content: `Bạn là một AI kiểm duyệt nội dung chuyên nghiệp. Nhiệm vụ của bạn là phân tích nội dung và xác định xem có chứa:
- Từ ngữ tục tĩu, chửi thề, thô bạo
- Xúc phạm cá nhân, kỳ thị giới tính, tôn giáo, dân tộc
- Đe dọa, bạo lực, khiêu dâm
- Nội dung không phù hợp với cộng đồng

Trả lời CHÍNH XÁC theo định dạng JSON:
{
  "isValid": true/false,
  "reason": "Lý do cụ thể nếu không hợp lệ, hoặc 'Nội dung phù hợp' nếu hợp lệ"
}

CHÚ Ý: 
- Chỉ từ chối nếu THỰC SỰ có vấn đề nghiêm trọng
- Cho phép phê bình xây dựng, ý kiến tiêu cực nhẹ
- Tập trung vào từ ngữ tục tĩu, xúc phạm trực tiếp`,
        },
        {
          role: "user",
          content: `Kiểm tra nội dung sau:\n\n"${content}"`,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const response = completion.choices[0].message.content.trim();
    console.log("🤖 AI Response:", response);

    // Parse JSON response
    let result;
    try {
      result = JSON.parse(response);
    } catch (parseError) {
      console.error("❌ Không thể parse JSON từ AI:", response);
      // Nếu parse lỗi, coi như hợp lệ
      return {
        isValid: true,
        reason: "Không thể xác định, tạm thời chấp nhận",
      };
    }

    return {
      isValid: result.isValid === true,
      reason: result.reason || "Không xác định được lý do",
    };
  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra nội dung:", error.message);

    // Nếu AI lỗi, cho phép đánh giá đi qua (fail-open)
    return {
      isValid: true,
      reason: "Không thể kiểm tra nội dung, tạm thời chấp nhận",
    };
  }
};
