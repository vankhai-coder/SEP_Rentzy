import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
const baseURL = process.env.OPENAI_BASE_URL || (process.env.OPENROUTER_API_KEY ? "https://openrouter.ai/api/v1" : "https://api.openai.com/v1");

const client = new OpenAI({
    apiKey,
    baseURL,
});

export const generateCarDescription = async (req, res) => {
    try {
        const {
            brand,
            model,
            year,
            bodyType,
            transmission,
            fuelType,
            fuelConsumption,
            seats,
        } = req.body;

        if (!brand || !model){
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin xe (brand, model)",
            });
        }

        const prompt = `
            Hãy viết một đoạn mô tả **ngắn gọn, chuyên nghiệp, tự nhiên** để đăng xe cho thuê.

            Thông tin xe:
            - Thương hiệu: ${brand}
            - Dòng xe: ${model}
            - Năm sản xuất: ${year}
            - Dạng thân xe: ${bodyType}
            - Hộp số: ${transmission}
            - Nhiên liệu: ${fuelType}
            - Mức tiêu hao nhiên liệu: ${fuelConsumption}
            - Số chỗ ngồi: ${seats}

            Yêu cầu:
            - Viết giọng văn thân thiện, chuyên nghiệp như các website cho thuê xe.
            - Nhấn mạnh ưu điểm, sự thoải mái & trải nghiệm khi thuê.
            - Không dài dòng, tối đa 4–6 câu.
            - Không lặp lại dữ liệu thừa.

            Bắt đầu viết:
            `;

                const response = await client.chat.completions.create({
                model: process.env.OPENAI_MODEL || "gpt-4o-mini",
                messages: [
                    {
                    role: "user",
                    content: prompt,
                    },
                ],
                temperature: 0.7,
                });

                const description = response.choices[0].message.content;

                return res.json({
                success: true,
                description,
                });
    } catch (error) {
        console.error("generateCarDescription error:", error?.response?.data || error?.message || error);
        const status = error?.response?.status || 500;
        const message =
            error?.response?.data?.error?.message ||
            error?.response?.data?.message ||
            (apiKey ? "Đã xảy ra lỗi khi tạo mô tả xe." : "Thiếu API key cho AI (OPENAI_API_KEY hoặc OPENROUTER_API_KEY)");
        return res.status(status).json({
            success: false,
            message,
        });
    }
};


export const generateMotoBikeDescription = async (req, res) => {
    try {
        const {
            brand,
            model,
            year,
            bikeType,
            engineCapacity,
            fuelType,
            fuelConsumption,
        } = req.body;

        if (!brand || !model) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin xe máy (brand, model)",
            });
        }

        const prompt = `
            Hãy viết một đoạn mô tả ngắn gọn, chuyên nghiệp, tự nhiên để đăng xe máy cho thuê.

            Thông tin xe máy:
            - Thương hiệu: ${brand}
            - Dòng xe: ${model}
            - Năm sản xuất: ${year}
            - Loại xe: ${bikeType}
            - Dung tích động cơ: ${engineCapacity} cc
            - Nhiên liệu: ${fuelType}
            - Mức tiêu hao nhiên liệu: ${fuelConsumption}

            Yêu cầu:
            - Giọng văn thân thiện, chuyên nghiệp như các website cho thuê xe.
            - Nhấn mạnh độ linh hoạt, tiết kiệm và việc di chuyển tiện lợi.
            - Không dài dòng, tối đa 4–6 câu, không lặp dữ liệu.

            Bắt đầu viết:
        `;

        const response = await client.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
                { role: "user", content: prompt },
            ],
            temperature: 0.7,
        });

        const description = response.choices?.[0]?.message?.content || "";

        return res.json({ success: true, description });
    } catch (error) {
        console.error("generateMotoBikeDescription error:", error?.response?.data || error?.message || error);
        const status = error?.response?.status || 500;
        const message =
            error?.response?.data?.error?.message ||
            error?.response?.data?.message ||
            (apiKey ? "Đã xảy ra lỗi khi tạo mô tả xe máy." : "Thiếu API key cho AI (OPENAI_API_KEY hoặc OPENROUTER_API_KEY)");
        return res.status(status).json({ success: false, message });
    }
};