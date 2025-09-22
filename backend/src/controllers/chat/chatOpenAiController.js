import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY, // lấy key từ .env
  baseURL: "https://openrouter.ai/api/v1", // endpoint của OpenRouter
});

export const chatWithOpenAi = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const completion = await client.chat.completions.create({
      model: "openai/gpt-3.5-turbo", // hoặc thử: "anthropic/claude-3.5-sonnet"
      messages: [
        {
          role: "system",
          content: `
  Bạn là trợ lý ảo chuyên nghiệp của một website thuê xe (ô tô và xe máy).
  Nhiệm vụ của bạn:
  - Trả lời các câu hỏi liên quan đến dịch vụ thuê xe: loại xe, giá thuê, điều kiện, thủ tục đặt xe, chính sách thanh toán, bảo hiểm, và quy định sử dụng.
  - Nếu thông tin có trong cơ sở dữ liệu hoặc được cung cấp, hãy trả lời chính xác và rõ ràng.
  - Nếu thông tin không có sẵn, hãy lịch sự thông báo: "Xin lỗi, hiện tại tôi chưa có thông tin về vấn đề này. Bạn có thể liên hệ nhân viên để được hỗ trợ thêm."
  - Nếu người dùng hỏi ngoài phạm vi thuê xe, hãy trả lời: "Xin lỗi, tôi chỉ hỗ trợ trong phạm vi dịch vụ thuê xe."
  - Cách trả lời: ngắn gọn, lịch sự, dễ hiểu, không tạo ra thông tin giả.
  `,
        },
        { role: "user", content: message },
      ],
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error("❌ Lỗi OpenRouter:", error);
    res.status(500).json({ error: "Không thể kết nối GPT qua OpenRouter" });
  }
};
