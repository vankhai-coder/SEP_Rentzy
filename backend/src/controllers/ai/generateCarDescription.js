import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";
import db from "../../models/index.js";

const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
const baseURL = process.env.OPENAI_BASE_URL || (process.env.OPENROUTER_API_KEY ? "https://openrouter.ai/api/v1" : "https://api.openai.com/v1");

const client = new OpenAI({
    apiKey,
    baseURL,
});
const { Vehicle, Brand, User } = db;

export const generateCarDescription = async (req, res) => {
    try {
        const {
            brand,
            model,
            year,
            
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
            

            Yêu cầu:
            - Viết giọng văn thân thiện, chuyên nghiệp như các website cho thuê xe.
            - Nhấn mạnh ưu điểm, sự thoải mái & trải nghiệm khi thuê.
            - hãy mô tả thêm các thông tin xe thuộc thương hiệu, dòng xe, năm sản xuất trên
            - Không dài dòng, tối đa 5–8 câu.
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
            

            Yêu cầu:
            - Viết giọng văn thân thiện, chuyên nghiệp như các website cho thuê xe.
            - Nhấn mạnh ưu điểm, sự thoải mái & trải nghiệm khi thuê.
            - hãy mô tả thêm các thông tin xe thuộc thương hiệu, dòng xe, năm sản xuất trên
            - Không dài dòng, tối đa 5–8 câu.
            - Không lặp lại dữ liệu thừa.

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

// check information of vehicle by admin

export const checkVehicleInfo = async (req, res) => {
    try {
        const { vehicle_id, brand, model, name, year } = req.body || {};

        let vehicle = null;
        if (vehicle_id) {
            vehicle = await Vehicle.findByPk(vehicle_id, {
                include: [
                    { model: Brand, as: "brand", attributes: ["brand_id", "name"] },
                    { model: User, as: "owner", attributes: ["user_id", "full_name", "email", "phone_number"] },
                ],
            });
            if (!vehicle) {
                return res.status(404).json({ success: false, message: "Không tìm thấy xe" });
            }
        }

        const v = vehicle ? vehicle.toJSON() : {};
        const src = {
            brand: brand ?? v.brand?.name ?? null,
            model: model ?? v.model ?? null,
            name: name ?? v.owner?.full_name ?? null,
            year: year ?? v.year ?? null,
            vehicle_type: v.vehicle_type ?? null,
            seats: v.seats ?? null,
            transmission: v.transmission ?? null,
            body_type: v.body_type ?? null,
            bike_type: v.bike_type ?? null,
            fuel_type: v.fuel_type ?? null,
            fuel_consumption: v.fuel_consumption ?? null,
            engine_capacity: v.engine_capacity ?? null,
            main_image_url: v.main_image_url ?? null,
            extra_images: Array.isArray(v.extra_images)
              ? v.extra_images
              : (typeof v.extra_images === "string"
                ? (() => { try { return JSON.parse(v.extra_images); } catch { return []; } })()
                : []),
            location: v.location ?? null,
        };

        const nowYear = new Date().getFullYear();
        const baseChecks = [];
        const pushBase = (label, status, detail) => { baseChecks.push({ label, status, detail }); };

        if (src.brand) pushBase("Thương hiệu", "pass", src.brand); else pushBase("Thương hiệu", "fail", "Thiếu");
        if (src.model) pushBase("Model", "pass", src.model); else pushBase("Model", "fail", "Thiếu");
        if (src.year && Number.isInteger(Number(src.year)) && Number(src.year) >= 1980 && Number(src.year) <= nowYear + 1) pushBase("Năm sản xuất", "pass", String(src.year)); else pushBase("Năm sản xuất", "fail", "Không hợp lệ");

        const brandLine = `${src.brand || ""} ${src.model || ""}`.trim();
        const seatGuide = src.body_type
          ? `Dựa trên dạng thân xe ${src.body_type}, số chỗ thường gặp: sedan/hatchback ~5, SUV/crossover ~5–7, minivan ~7, pickup ~4–5.`
          : `Số chỗ ngồi phổ biến: sedan/hatchback ~5, SUV/crossover ~5–7, minivan ~7, pickup ~4–5.`;
        const motoGuide = src.engine_capacity
          ? `Dựa trên dung tích ${src.engine_capacity} cc: tay ga thường 50–160 cc, underbone 100–150 cc, sport/touring 150–1000+ cc.`
          : `Đánh giá theo nhóm dung tích: tay ga 50–160 cc, underbone 100–150 cc, sport/touring 150–1000+ cc.`;

        const commonHeader = `Bạn là chuyên gia kiểm định dữ liệu xe.\n`+
          `Đối với xe ${src.name || ""} ${src.year || ""} ${brandLine}, hãy đánh giá độ hợp lý của các thuộc tính dựa trên kiến thức phổ biến cho thương hiệu/dòng xe này (không truy cập internet).\n`+
          `Trả về JSON duy nhất: {\"checks\": [{\"label\": string, \"status\": \"pass\"|\"fail\"|\"warn\", \"detail\": string}], \"summary\": {\"pass\": number, \"fail\": number, \"warn\": number}}. Nếu không chắc, dùng \"warn\".`;

        let attrs = `Thuộc tính để kiểm tra:\n`+
          `- Dáng xe/Loại xe: ${src.body_type || src.bike_type || ""}\n`+
          `- Nhiên liệu: ${src.fuel_type || ""}\n`+
          `- Mức tiêu thụ: ${src.fuel_consumption || ""}\n`+
          `- Dung tích động cơ: ${src.engine_capacity ?? ""}\n`+
          `- Vị trí: ${src.location || ""}`;
        if (src.vehicle_type === "car") {
          attrs = `Thuộc tính để kiểm tra:\n`+
            `- Hộp số: ${src.transmission || ""}\n`+
            `- Dáng xe: ${src.body_type || ""}\n`+
            `- Nhiên liệu: ${src.fuel_type || ""}\n`+
            `- Mức tiêu thụ: ${src.fuel_consumption || ""}\n`+
            `- Số chỗ ngồi: ${src.seats ?? ""}\n`+
            `- Dung tích động cơ: ${src.engine_capacity ?? ""}\n`+
            `- Vị trí: ${src.location || ""}`;
        } else if (src.vehicle_type === "motorbike") {
          attrs = `Thuộc tính để kiểm tra:\n`+
            `- Loại xe: ${src.bike_type || src.body_type || ""}\n`+
            `- Nhiên liệu: ${src.fuel_type || ""}\n`+
            `- Mức tiêu thụ: ${src.fuel_consumption || ""}\n`+
            `- Dung tích động cơ: ${src.engine_capacity ?? ""}\n`+
            `- Vị trí: ${src.location || ""}`;
        }

        const typeCatalog = `Danh mục loại xe tham chiếu: tay ga (scooter), underbone/cub, sport, naked, touring, cruiser, adventure, dual-sport, off-road/dirt.`;
        const explainNote = `Mỗi mục trong checks cần có detail ngắn 1–2 câu giải thích lý do; nếu không chắc, dùng warn với lý do.`;
        let vehicleGuide = "";
        if (src.vehicle_type === "car") {
          vehicleGuide = `Hướng dẫn áp dụng: ${seatGuide} Xem xét đặc điểm phổ biến của ${brandLine} theo phân khúc và đời xe. ${explainNote}`;
        } else if (src.vehicle_type === "motorbike") {
          vehicleGuide = `Hướng dẫn áp dụng: ${motoGuide} ${typeCatalog} Suy luận loại xe theo dung tích nếu chưa rõ. ${explainNote}`;
        } else {
          vehicleGuide = `Hướng dẫn áp dụng chung: đánh giá theo phân khúc và đặc điểm phổ biến của ${brandLine}. ${explainNote}`;
        }

        const prompt = `${commonHeader}\n${vehicleGuide}\n${attrs}`;

        let aiChecks = null;
        try {
          const response = await client.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
          });
          let content = response.choices?.[0]?.message?.content || "";
          if (content.startsWith("```")) {
            const start = content.indexOf("\n");
            const end = content.lastIndexOf("```");
            content = content.substring(start + 1, end);
          }
          try {
            const parsed = JSON.parse(content);
            if (parsed && Array.isArray(parsed.checks) && parsed.summary) {
              aiChecks = parsed;
            }
          } catch {}
        } catch {}

        let checks, summary;
        if (aiChecks) {
          checks = [...baseChecks, ...aiChecks.checks];
          summary = {
            pass: checks.filter(c => c.status === "pass").length,
            fail: checks.filter(c => c.status === "fail").length,
            warn: checks.filter(c => c.status === "warn").length,
          };
        } else {
          if (src.vehicle_type === "car") {
            if (src.seats && src.seats >= 2 && src.seats <= 9) pushBase("Số chỗ ngồi", "pass", String(src.seats)); else pushBase("Số chỗ ngồi", "warn", "Thiếu hoặc bất thường");
            if (src.transmission) pushBase("Hộp số", "pass", src.transmission); else pushBase("Hộp số", "warn", "Thiếu");
            if (src.body_type) pushBase("Dáng xe", "pass", src.body_type); else pushBase("Dáng xe", "warn", "Thiếu");
          } else if (src.vehicle_type === "motorbike") {
            const bt = (src.bike_type || src.body_type || "").toLowerCase();
            const allowedBikeTypes = ["tay ga","scooter","underbone","cub","sport","naked","touring","cruiser","adventure","dual-sport","off-road","dirt"];
            const matchesAllowed = bt ? allowedBikeTypes.some(t => bt.includes(t)) : false;
            if (bt) pushBase("Loại xe", matchesAllowed ? "pass" : "warn", src.bike_type || src.body_type); else pushBase("Loại xe", "warn", "Thiếu");
            if (src.engine_capacity) pushBase("Dung tích", "pass", `${src.engine_capacity} cc`); else pushBase("Dung tích", "warn", "Thiếu");
          }
          if (src.fuel_type) pushBase("Nhiên liệu", "pass", src.fuel_type); else pushBase("Nhiên liệu", "warn", "Thiếu");
          if (src.fuel_consumption) pushBase("Mức tiêu thụ", "pass", src.fuel_consumption); else pushBase("Mức tiêu thụ", "warn", "Thiếu");
          if (src.location) pushBase("Vị trí", "pass", src.location); else pushBase("Vị trí", "warn", "Thiếu");

          checks = baseChecks;
          summary = {
            pass: checks.filter(c => c.status === "pass").length,
            fail: checks.filter(c => c.status === "fail").length,
            warn: checks.filter(c => c.status === "warn").length,
          };
        }

        return res.json({ success: true, data: { vehicle_id: vehicle_id ?? v.vehicle_id ?? null, brand: src.brand, model: src.model, name: src.name, year: src.year, checks, summary } });
    } catch (error) {
        console.error("checkVehicleInfo error:", error?.message || error);
        return res.status(500).json({ success: false, message: "Lỗi khi kiểm tra thông tin xe" });
    }
};
