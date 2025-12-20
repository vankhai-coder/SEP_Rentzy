import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";
import db from "../../models/index.js";

const apiKey = process.env.OPENAI_API_KEY || process.env.Generate_API_Key;
const baseURL = process.env.OPENAI_BASE_URL || (process.env.Generate_API_Key ? "https://openrouter.ai/api/v1" : "https://api.openai.com/v1");

const client = new OpenAI({
    apiKey,
    baseURL,
});
const { Vehicle, Brand, User } = db;
const validateCarWithAI = async (brand, model, year) => {
  try {
    const validationPrompt = `
      Bạn là một chuyên gia về xe hơi. Hãy kiểm tra thông tin sau:
      - Thương hiệu: ${brand}
      - Dòng xe: ${model}
      ${year ? `- Năm sản xuất: ${year}` : ''}

      Nhiệm vụ:
      1. Kiểm tra xem "${model}" có phải là dòng xe thực sự của thương hiệu "${brand}" không?
      2. Nếu có năm sản xuất, kiểm tra năm ${year} có hợp lý với dòng xe này không?

      Trả lời CHÍNH XÁC theo định dạng JSON sau (không thêm markdown, không thêm text ngoài JSON):
      {
        "isValid": true/false,
        "message": "Lý do cụ thể nếu không hợp lệ, hoặc 'OK' nếu hợp lệ",
        "suggestion": "Gợi ý dòng xe đúng nếu người dùng nhập sai (hoặc null nếu đúng)"
      }

      Ví dụ:
      - Kia Morning → valid
      - Kia VF8 → invalid, gợi ý "VF8 là dòng xe của VinFast, không phải Kia"
      - Toyota Vios 2030 → invalid, gợi ý "Năm 2030 chưa tồn tại"
      `;

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia kiểm tra thông tin xe hơi. Luôn trả về JSON thuần túy, không thêm markdown hay text khác."
        },
        {
          role: "user",
          content: validationPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 256,
    });

    const aiResponse = response.choices[0].message.content.trim();
    
    // Loại bỏ markdown code blocks nếu có
    const jsonString = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const validation = JSON.parse(jsonString);
    
    return validation;
  } catch (error) {
    console.error("AI validation error:", error);
    // Nếu AI lỗi, cho phép tiếp tục (fallback)
    return {
      isValid: true,
      message: "Không thể xác thực bằng AI, tiếp tục xử lý",
      suggestion: null
    };
  }
};
export const generateCarDescription = async (req, res) => {
  try {
    const { brand, model, year } = req.body;

    // Kiểm tra thiếu thông tin
    if (!brand || !model) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin xe (brand, model)",
      });
    }

    // ===== KIỂM TRA BẰNG AI TRƯỚC KHI TẠO MÔ TẢ =====
    console.log(`🔍 Đang kiểm tra: ${brand} ${model} ${year || ''}`);
    
    const aiValidation = await validateCarWithAI(brand, model, year);
    
    if (!aiValidation.isValid) {
      console.log(`❌ Validation failed: ${aiValidation.message}`);
      return res.status(400).json({
        success: false,
        message: `${brand} không có dòng xe "${model}". ${aiValidation.message}`,
        suggestion: aiValidation.suggestion
      });
    }

    console.log(`✅ Validation passed: ${aiValidation.message}`);

    
    const prompt = `
        Hãy viết một đoạn mô tả **ngắn gọn, chuyên nghiệp, tự nhiên** để đăng xe cho thuê.

        Thông tin xe:
        - Thương hiệu: ${brand}
        - Dòng xe: ${model}
        ${year ? `- Năm sản xuất: ${year}` : ''}

        Yêu cầu:
        - Viết giọng văn thân thiện, chuyên nghiệp như các website cho thuê xe.
        - Nhấn mạnh ưu điểm, sự thoải mái & trải nghiệm khi thuê.
        - Hãy mô tả thêm các thông tin xe thuộc thương hiệu, dòng xe, năm sản xuất trên.
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
      max_tokens: 512,
    });

    const description = response.choices[0].message.content;

    return res.json({
      success: true,
      description,
      validation: aiValidation.message
    });

  } catch (error) {
    console.error("generateCarDescription error:", error?.response?.data || error?.message || error);
    const status = error?.response?.status ?? error?.status ?? 500;

    if (status === 402 || status === 429) {
      const { brand, model, year } = req.body || {};
      const desc = [
        `${brand || "Xe"} ${model || ""} ${year ? `năm ${year}` : ""}`.trim(),
        "Thiết kế hiện đại, vận hành ổn định phù hợp di chuyển trong thành phố và đường dài.",
        "Khoang nội thất thoải mái, tiện nghi đầy đủ, phù hợp gia đình và công việc.",
        "Xe được bảo dưỡng định kỳ, sạch sẽ, giao nhận linh hoạt, hỗ trợ tận tâm.",
        "Lựa chọn tối ưu cho chuyến đi của bạn với chi phí hợp lý."
      ].join(". ");
      return res.json({ success: true, description: desc, validation: "Tạo mô tả bằng bản mẫu do hạn mức AI" });
    }

    const message = error?.response?.data?.error?.message || 
                    error?.response?.data?.message || 
                    (process.env.OPENAI_API_KEY || process.env.Generate_API_Key 
                      ? "Đã xảy ra lỗi khi tạo mô tả xe." 
                      : "Thiếu API key cho AI (OPENAI_API_KEY hoặc Generate_API_Key)");

    return res.status(status).json({ success: false, message });
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
        // ===== KIỂM TRA BẰNG AI TRƯỚC KHI TẠO MÔ TẢ =====
        console.log(`🔍 Đang kiểm tra: ${brand} ${model} ${year || ''}`);
        
        const aiValidation = await validateCarWithAI(brand, model, year);
        
        if (!aiValidation.isValid) {
          console.log(`❌ Validation failed: ${aiValidation.message}`);
          return res.status(400).json({
            success: false,
            message: `${brand} không có dòng xe "${model}". ${aiValidation.message}`,
            suggestion: aiValidation.suggestion
          });
        }

        console.log(`✅ Validation passed: ${aiValidation.message}`);

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
            max_tokens: 512,
        });

        const description = response.choices?.[0]?.message?.content || "";

        return res.json({ success: true, description });
    } catch (error) {
        console.error("generateMotoBikeDescription error:", error?.response?.data || error?.message || error);
        const status = error?.response?.status ?? error?.status ?? 500;
        const message = error?.response?.data?.error?.message || 
                        error?.response?.data?.message || 
                        (process.env.OPENAI_API_KEY || process.env.Generate_API_Key 
                          ? "Đã xảy ra lỗi khi tạo mô tả xe." 
                          : "Thiếu API key cho AI (OPENAI_API_KEY hoặc Generate_API_Key)");

        return res.status(status).json({
          success: false,
          message,
        });
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

        const normalize = (s) => (s || "").toLowerCase().trim();
        const allowedBodyTypes = ["sedan","hatchback","suv","crossover","minivan","pickup","coupe","convertible","wagon","mpv"];
        const allowedTransmissions = ["manual","automatic","cvt","dct"];
        const fuelAlias = (s) => {
          const t = normalize(s);
          if (["xang","xăng","gasoline","petrol"].includes(t)) return "petrol";
          if (["dau","diesel"].includes(t)) return "diesel";
          if (["dien","electric"].includes(t)) return "electric";
          if (["hybrid"].includes(t)) return "hybrid";
          return t;
        };
        const allowedFuelTypes = ["petrol","diesel","hybrid","electric"];
        const brandModelKey = normalize(`${src.brand || ""} ${src.model || ""}`);
        const knownModelGuides = {
          "kia sportage": { body_type: "suv", seats: [5,5], fuel_type: ["petrol","diesel","hybrid"], transmission: ["automatic","manual"] },
          "toyota vios": { body_type: "sedan", seats: [5,5], fuel_type: ["petrol"], transmission: ["automatic","manual"] },
          "vinfast vf8": { body_type: "suv", seats: [5,5], fuel_type: ["electric"], transmission: ["automatic"] },
          "vinfast vf9": { body_type: "suv", seats: [6,7], fuel_type: ["electric"], transmission: ["automatic"] },
        };

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
            `- Số chỗ ngồi: ${src.seats ?? ""}`;
        } else if (src.vehicle_type === "motorbike") {
          attrs = `Thuộc tính để kiểm tra:\n`+
            `- Loại xe: ${src.bike_type || src.body_type || ""}\n`+
            `- Nhiên liệu: ${src.fuel_type || ""}\n`+
            `- Mức tiêu thụ: ${src.fuel_consumption || ""}\n`+
            `- Dung tích động cơ: ${src.engine_capacity ?? ""}`;
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
    let ref = null;
    try {
      const refPrompt = `Trả về JSON duy nhất mô tả thuộc tính phổ biến cho mẫu xe:\n{"fuel_type": "petrol|diesel|hybrid|electric", "body_type": "sedan|suv|hatchback|crossover|minivan|pickup|coupe|convertible|wagon|mpv", "transmission": ["manual","automatic","cvt","dct"], "seats_range": [min,max], "consumption": {"unit": "l/100km|kWh/100km", "range": [min,max]}, "engine_capacity_range": [min,max]}\nKhông thêm văn bản ngoài JSON.\nThương hiệu: ${src.brand || ""}\nModel: ${src.model || ""}\nNăm: ${src.year || ""}`;
      const r = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [{ role: "system", content: "Luôn trả về JSON hợp lệ." }, { role: "user", content: refPrompt }],
        temperature: 0,
      });
      let t = r.choices?.[0]?.message?.content?.trim() || "";
      if (t.startsWith("```")) {
        const s = t.indexOf("\n");
        const e = t.lastIndexOf("```");
        t = t.substring(s + 1, e);
      }
      const parsed = JSON.parse(t);
      if (parsed && parsed.fuel_type) ref = parsed;
    } catch {}

    if (ref) {
      const mismatchChecks = [];
      const pushMismatch = (label, status, detail) => mismatchChecks.push({ label, status, detail });
      if (src.fuel_type) {
        const f = fuelAlias(src.fuel_type);
        const rf = fuelAlias(ref.fuel_type);
        const ok = f === rf;
        pushMismatch("Nhiên liệu", ok ? "pass" : "fail", ok ? src.fuel_type : `${src.fuel_type} không phù hợp với ${brandLine}${src.year ? ` ${src.year}` : ""}. Theo thông tin phổ biến, mẫu này thường dùng ${ref.fuel_type}. Hãy chỉnh lại nhiên liệu hoặc kiểm tra lại model/năm nếu là biến thể khác.`);
      } else {
        pushMismatch("Nhiên liệu", "warn", "Thiếu. Hãy chọn nhiên liệu (petrol/xăng, diesel/dầu, hybrid, electric) để hệ thống đối chiếu chính xác.");
      }
      if (src.vehicle_type === "car") {
        if (src.body_type) {
          const bt = normalize(src.body_type);
          const ok = bt === normalize(ref.body_type);
          pushMismatch("Dáng xe", ok ? "pass" : "fail", ok ? src.body_type : `${src.body_type} không phù hợp với ${brandLine}${src.year ? ` ${src.year}` : ""}. Theo thông tin phổ biến, dáng xe thường là ${ref.body_type}. Hãy chỉnh về ${ref.body_type} hoặc kiểm tra lại model/năm nếu bạn đăng phiên bản khác.`);
        } else {
          pushMismatch("Dáng xe", "warn", "Thiếu. Hãy nhập dáng xe theo danh mục (sedan/suv/crossover/hatchback/coupe/convertible/wagon/mpv/minivan/pickup).");
        }
        if (src.transmission) {
          const tr = normalize(src.transmission);
          const ok = Array.isArray(ref.transmission) ? ref.transmission.map(normalize).includes(tr) : normalize(ref.transmission) === tr;
          const sug = Array.isArray(ref.transmission) ? ref.transmission.join("/") : ref.transmission;
          pushMismatch("Hộp số", ok ? "pass" : "fail", ok ? src.transmission : `${src.transmission} không phù hợp với ${brandLine}${src.year ? ` ${src.year}` : ""}. Theo thông tin phổ biến, hộp số thường là ${sug}. Hãy chọn lại hộp số đúng (manual/automatic/cvt/dct).`);
        } else {
          pushMismatch("Hộp số", "warn", "Thiếu. Hãy chọn hộp số (manual/automatic/cvt/dct) để hệ thống đối chiếu chính xác.");
        }
        const seatsNum = Number(src.seats);
        if (Number.isFinite(seatsNum) && Array.isArray(ref.seats_range)) {
          const ok = seatsNum >= Number(ref.seats_range[0]) && seatsNum <= Number(ref.seats_range[1]);
          pushMismatch("Số chỗ ngồi", ok ? "pass" : "fail", ok ? String(src.seats) : `${src.seats} chỗ không phù hợp với ${brandLine}${src.year ? ` ${src.year}` : ""}. Theo thông tin phổ biến, mẫu này thường có ${ref.seats_range[0]}–${ref.seats_range[1]} chỗ. Hãy chỉnh lại đúng cấu hình thực tế của xe.`);
        } else {
          pushMismatch("Số chỗ ngồi", "warn", "Thiếu. Hãy nhập số chỗ ngồi (2–9). Ví dụ: sedan/hatchback thường 5, SUV/crossover thường 5–7.");
        }
      }
      if (src.fuel_consumption && ref.consumption && ref.consumption.unit && Array.isArray(ref.consumption.range)) {
        const m = String(src.fuel_consumption).match(/\d+(?:\.\d+)?/);
        const fc = m ? parseFloat(m[0]) : NaN;
        const unitEV = /kwh/i.test(String(src.fuel_consumption)) ? "kWh/100km" : "l/100km";
        const unitMatch = unitEV.toLowerCase() === String(ref.consumption.unit).toLowerCase();
        if (!unitMatch) {
          pushMismatch("Mức tiêu thụ", "fail", `${String(src.fuel_consumption)} chưa đúng đơn vị cho ${brandLine}${src.year ? ` ${src.year}` : ""}. Theo thông tin phổ biến, xe này dùng đơn vị ${ref.consumption.unit}. Hãy nhập theo dạng "x ${ref.consumption.unit}" (ví dụ: 6.5 ${ref.consumption.unit}).`);
        } else if (Number.isFinite(fc)) {
          const ok = fc >= Number(ref.consumption.range[0]) && fc <= Number(ref.consumption.range[1]);
          pushMismatch("Mức tiêu thụ", ok ? "pass" : "fail", ok ? String(src.fuel_consumption) : `${String(src.fuel_consumption)} có vẻ không hợp lý cho ${brandLine}${src.year ? ` ${src.year}` : ""}. Theo thông tin phổ biến, mức tiêu thụ thường khoảng ${ref.consumption.range[0]}–${ref.consumption.range[1]} ${ref.consumption.unit}. Hãy kiểm tra lại và nhập theo dạng "x ${ref.consumption.unit}".`);
        } else {
          pushMismatch("Mức tiêu thụ", "warn", `${String(src.fuel_consumption)} thiếu số hoặc sai định dạng. Hãy nhập theo dạng "x ${ref.consumption.unit}" (ví dụ: 6.5 ${ref.consumption.unit}).`);
        }
      } else if (src.fuel_consumption) {
        const m = String(src.fuel_consumption).match(/\d+(?:\.\d+)?/);
        const fc = m ? parseFloat(m[0]) : NaN;
        const isEV = fuelAlias(src.fuel_type) === "electric" || /kwh/i.test(String(src.fuel_consumption));
        const unit = isEV ? "kWh/100km" : "l/100km";
        const ok = Number.isFinite(fc);
        pushMismatch("Mức tiêu thụ", ok ? "pass" : "warn", ok ? String(src.fuel_consumption) : `${String(src.fuel_consumption)} thiếu số hoặc sai định dạng. Hãy nhập theo dạng "x ${unit}" (ví dụ: ${isEV ? "15 kWh/100km" : "6.5 l/100km"}).`);
      } else {
        pushMismatch("Mức tiêu thụ", "warn", "Thiếu. Hãy nhập mức tiêu thụ theo dạng \"x l/100km\" (xe xăng/diesel) hoặc \"x kWh/100km\" (xe điện).");
      }
      if (src.engine_capacity && Array.isArray(ref.engine_capacity_range)) {
        const ec = parseFloat(String(src.engine_capacity).replace(/[^\d\.]+/g, ""));
        if (Number.isFinite(ec)) {
          const ok = ec >= Number(ref.engine_capacity_range[0]) && ec <= Number(ref.engine_capacity_range[1]);
          pushMismatch("Dung tích động cơ", ok ? "pass" : "fail", ok ? `${ec} cc` : `${ec} cc không phù hợp với ${brandLine}${src.year ? ` ${src.year}` : ""}. Theo thông tin phổ biến, dung tích thường khoảng ${ref.engine_capacity_range[0]}–${ref.engine_capacity_range[1]} cc. Hãy kiểm tra lại thông số xe trước khi đăng.`);
        } else {
          pushMismatch("Dung tích động cơ", "warn", "Thiếu hoặc sai định dạng. Hãy nhập dung tích theo cc (ví dụ: 1498 cc) để hệ thống đối chiếu chính xác.");
        }
      }
      checks = baseChecks.concat(mismatchChecks);
      summary = {
        pass: checks.filter(c => c.status === "pass").length,
        fail: checks.filter(c => c.status === "fail").length,
        warn: checks.filter(c => c.status === "warn").length,
      };
    } else if (aiChecks) {
      checks = [...baseChecks, ...aiChecks.checks];
      summary = {
        pass: checks.filter(c => c.status === "pass").length,
        fail: checks.filter(c => c.status === "fail").length,
        warn: checks.filter(c => c.status === "warn").length,
      };
        } else {
          if (src.vehicle_type === "car") {
            const bt = normalize(src.body_type);
            if (bt) {
              const ok = allowedBodyTypes.includes(bt);
              const guide = knownModelGuides[brandModelKey];
              if (!ok) {
                pushBase(
                  "Dáng xe",
                  "fail",
                  `${src.body_type}. Gợi ý: chọn một trong ${allowedBodyTypes.join(", ")}${guide ? ` (mẫu: ${guide.body_type})` : ""}`
                );
              } else if (guide && bt !== guide.body_type) {
                pushBase(
                  "Dáng xe",
                  "fail",
                  `${src.body_type} không phù hợp với ${src.brand} ${src.model}. Gợi ý: mẫu ${guide.body_type} cho ${src.brand} ${src.model}`
                );
              } else {
                pushBase("Dáng xe", "pass", src.body_type);
              }
            } else {
              const guide = knownModelGuides[brandModelKey];
              pushBase("Dáng xe", "warn", `Thiếu. Gợi ý: cung cấp dạng thân xe (ví dụ: sedan, suv)${guide ? ` (mẫu: ${guide.body_type})` : ""}`);
            }
            const tr = normalize(src.transmission);
            if (tr) {
              const ok = allowedTransmissions.includes(tr);
              const guide = knownModelGuides[brandModelKey];
              if (!ok) {
                pushBase("Hộp số", "fail", `${src.transmission}. Gợi ý: ${allowedTransmissions.join(", ")}${guide ? ` (mẫu: ${guide.transmission.join("/")})` : ""}`);
              } else if (guide && !guide.transmission.includes(tr)) {
                pushBase("Hộp số", "fail", `${src.transmission} không phù hợp với ${src.brand} ${src.model}. Gợi ý: hộp số thường là ${guide.transmission.join("/")}. Hãy chọn lại hộp số đúng.`);
              } else {
                pushBase("Hộp số", "pass", src.transmission);
              }
            } else {
              const guide = knownModelGuides[brandModelKey];
              pushBase("Hộp số", "warn", `Thiếu. Gợi ý: manual/automatic/CVT/DCT${guide ? ` (mẫu: ${guide.transmission.join("/")})` : ""}`);
            }
            const seatsNum = Number(src.seats);
            if (Number.isFinite(seatsNum)) {
              const guide = knownModelGuides[brandModelKey];
              const okRange = seatsNum >= 2 && seatsNum <= 9;
              if (!okRange) {
                pushBase("Số chỗ ngồi", "fail", `${src.seats}. Gợi ý: ${seatGuide}`);
              } else if (guide && !(seatsNum >= guide.seats[0] && seatsNum <= guide.seats[1])) {
                pushBase("Số chỗ ngồi", "fail", `${src.seats} chỗ không phù hợp với ${src.brand} ${src.model}. Gợi ý: mẫu thường có ${guide.seats[0]}–${guide.seats[1]} chỗ. Hãy chỉnh lại theo cấu hình thực tế của xe.`);
              } else {
                pushBase("Số chỗ ngồi", "pass", String(src.seats));
              }
            } else {
              pushBase("Số chỗ ngồi", "warn", `Thiếu. Gợi ý: nhập số chỗ ngồi. ${seatGuide}`);
            }
            const f = fuelAlias(src.fuel_type);
            if (src.fuel_type) {
              const ok = allowedFuelTypes.includes(f);
              const guide = knownModelGuides[brandModelKey];
              if (!ok) {
                pushBase("Nhiên liệu", "fail", `${src.fuel_type}. Gợi ý: petrol/xăng, diesel/dầu, hybrid, electric${guide ? ` (mẫu: ${guide.fuel_type.join("/")})` : ""}`);
              } else if (guide && !guide.fuel_type.includes(f)) {
                pushBase("Nhiên liệu", "fail", `${src.fuel_type} không phù hợp với ${src.brand} ${src.model}. Gợi ý: mẫu thường dùng ${guide.fuel_type.join("/")}. Hãy chọn lại nhiên liệu đúng.`);
              } else {
                pushBase("Nhiên liệu", "pass", src.fuel_type);
              }
            } else {
              pushBase("Nhiên liệu", "warn", "Thiếu. Gợi ý: cung cấp loại nhiên liệu (petrol/xăng, diesel/dầu, hybrid, electric)");
            }
            if (src.fuel_consumption) {
              const m = String(src.fuel_consumption).match(/\d+(?:\.\d+)?/);
              const fc = m ? parseFloat(m[0]) : NaN;
              if (Number.isFinite(fc)) {
                const isEV = fuelAlias(src.fuel_type) === "electric" || /kwh/i.test(String(src.fuel_consumption));
                const ok = isEV ? (fc >= 10 && fc <= 30) : (fc >= 3 && fc <= 20);
                const unit = isEV ? "kWh/100km" : "l/100km";
                const range = isEV ? "10–30 kWh/100km" : "3–20 l/100km";
                pushBase("Mức tiêu thụ", ok ? "pass" : "fail", ok ? String(src.fuel_consumption) : `${String(src.fuel_consumption)}. Gợi ý: 'x ${unit}' trong khoảng ${range}`);
              } else {
                const isEV = fuelAlias(src.fuel_type) === "electric" || /kwh/i.test(String(src.fuel_consumption));
                const unit = isEV ? "kWh/100km" : "l/100km";
                pushBase("Mức tiêu thụ", "warn", `${String(src.fuel_consumption)}. Gợi ý: định dạng 'x ${unit}'`);
              }
            } else {
              const isEV = fuelAlias(src.fuel_type) === "electric";
              const eg = isEV ? "ví dụ: 15 kWh/100km" : "ví dụ: 6.5 l/100km";
              pushBase("Mức tiêu thụ", "warn", `Thiếu. Gợi ý: cung cấp mức tiêu thụ nhiên liệu (${eg})`);
            }
            const ec = parseFloat(String(src.engine_capacity || "").replace(/[^\d\.]+/g, ""));
            if (Number.isFinite(ec)) {
              const ok = ec >= 600 && ec <= 7000;
              pushBase("Dung tích động cơ", ok ? "pass" : "fail", ok ? `${ec} cc` : `${ec} cc. Gợi ý: ô tô phổ biến 1000–3000 cc`);
            }
          } else if (src.vehicle_type === "motorbike") {
            const bt = (src.bike_type || src.body_type || "").toLowerCase();
            const allowedBikeTypes = ["tay ga","scooter","underbone","cub","sport","naked","touring","cruiser","adventure","dual-sport","off-road","dirt"];
            const matchesAllowed = bt ? allowedBikeTypes.some(t => bt.includes(t)) : false;
            if (bt) pushBase("Loại xe", matchesAllowed ? "pass" : "fail", matchesAllowed ? (src.bike_type || src.body_type) : `${src.bike_type || src.body_type}. Gợi ý: chọn một trong ${allowedBikeTypes.join(", ")}`); else pushBase("Loại xe", "warn", "Thiếu. Gợi ý: cung cấp loại xe (tay ga, underbone, sport, naked, touring, cruiser, adventure, dual-sport, off-road/dirt)");
            const ec = parseFloat(String(src.engine_capacity || "").replace(/[^\d\.]+/g, ""));
            if (Number.isFinite(ec)) {
              const ok = ec >= 49 && ec <= 2000;
              pushBase("Dung tích", ok ? "pass" : "fail", ok ? `${ec} cc` : `${ec} cc. Gợi ý: xe máy phổ biến 50–1000 cc`);
            } else {
              pushBase("Dung tích", "warn", "Thiếu. Gợi ý: nhập dung tích (ví dụ: 125 cc)");
            }
          }
          // Tránh lặp: chỉ thêm Nhiên liệu/Mức tiêu thụ ở khối chung nếu KHÔNG phải ô tô
          if (src.vehicle_type !== "car") {
            if (src.fuel_type) {
              const f = fuelAlias(src.fuel_type);
              const ok = allowedFuelTypes.includes(f);
              pushBase("Nhiên liệu", ok ? "pass" : "fail", ok ? src.fuel_type : `${src.fuel_type}. Gợi ý: petrol/xăng, diesel/dầu, hybrid, electric`);
            } else {
              pushBase("Nhiên liệu", "warn", "Thiếu. Gợi ý: cung cấp loại nhiên liệu (petrol/xăng, diesel/dầu, hybrid, electric)");
            }
            if (src.fuel_consumption) {
              const m = String(src.fuel_consumption).match(/\d+(?:\.\d+)?/);
              const fc = m ? parseFloat(m[0]) : NaN;
              if (Number.isFinite(fc)) {
                const isEV = fuelAlias(src.fuel_type) === "electric" || /kwh/i.test(String(src.fuel_consumption));
                const ok = isEV ? (fc >= 10 && fc <= 30) : (fc >= 3 && fc <= 20);
                const unit = isEV ? "kWh/100km" : "l/100km";
                const range = isEV ? "10–30 kWh/100km" : "3–20 l/100km";
                pushBase("Mức tiêu thụ", ok ? "pass" : "fail", ok ? String(src.fuel_consumption) : `${String(src.fuel_consumption)}. Gợi ý: 'x ${unit}' trong khoảng ${range}`);
              } else {
                const isEV = fuelAlias(src.fuel_type) === "electric" || /kwh/i.test(String(src.fuel_consumption));
                const unit = isEV ? "kWh/100km" : "l/100km";
                pushBase("Mức tiêu thụ", "warn", `${String(src.fuel_consumption)}. Gợi ý: định dạng 'x ${unit}'`);
              }
            } else {
              const isEV = fuelAlias(src.fuel_type) === "electric";
              const eg = isEV ? "ví dụ: 15 kWh/100km" : "ví dụ: 6.5 l/100km";
              pushBase("Mức tiêu thụ", "warn", `Thiếu. Gợi ý: cung cấp mức tiêu thụ nhiên liệu (${eg})`);
            }
          }
          

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

// Core function to be reused by cron jobs without Express
export const checkVehicleInfoCore = async ({ vehicle, vehicle_id, brand, model, name, year }) => {
  try {
    let v = vehicle || null;
    if (!v && vehicle_id) {
      const found = await Vehicle.findByPk(vehicle_id, {
        include: [
          { model: Brand, as: "brand", attributes: ["brand_id", "name"] },
          { model: User, as: "owner", attributes: ["user_id", "full_name", "email", "phone_number"] },
        ],
      });
      if (!found) throw new Error("Không tìm thấy xe");
      v = found.toJSON();
    }

    const src = {
      brand: brand ?? v?.brand?.name ?? null,
      model: model ?? v?.model ?? null,
      name: name ?? v?.owner?.full_name ?? null,
      year: year ?? v?.year ?? null,
      vehicle_type: v?.vehicle_type ?? null,
      seats: v?.seats ?? null,
      transmission: v?.transmission ?? null,
      body_type: v?.body_type ?? null,
      bike_type: v?.bike_type ?? null,
      fuel_type: v?.fuel_type ?? null,
      fuel_consumption: v?.fuel_consumption ?? null,
      engine_capacity: v?.engine_capacity ?? null,
      main_image_url: v?.main_image_url ?? null,
      extra_images: Array.isArray(v?.extra_images)
        ? v.extra_images
        : (typeof v?.extra_images === "string"
          ? (() => { try { return JSON.parse(v.extra_images); } catch { return []; } })()
          : []),
      location: v?.location ?? null,
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

    const normalize = (s) => (s || "").toLowerCase().trim();
    const allowedBodyTypes = ["sedan","hatchback","suv","crossover","minivan","pickup","coupe","convertible","wagon","mpv"];
    const allowedTransmissions = ["manual","automatic","cvt","dct"];
    const fuelAlias = (s) => {
      const t = normalize(s);
      if (["xang","xăng","gasoline","petrol"].includes(t)) return "petrol";
      if (["dau","diesel"].includes(t)) return "diesel";
      if (["dien","electric"].includes(t)) return "electric";
      if (["hybrid"].includes(t)) return "hybrid";
      return t;
    };
    const allowedFuelTypes = ["petrol","diesel","hybrid","electric"];
    const brandModelKey = normalize(`${src.brand || ""} ${src.model || ""}`);
    const knownModelGuides = {
      "kia sportage": { body_type: "suv", seats: [5,5], fuel_type: ["petrol","diesel","hybrid"], transmission: ["automatic","manual"] },
      "toyota vios": { body_type: "sedan", seats: [5,5], fuel_type: ["petrol"], transmission: ["automatic","manual"] },
      "vinfast vf8": { body_type: "suv", seats: [5,5], fuel_type: ["electric"], transmission: ["automatic"] },
      "vinfast vf9": { body_type: "suv", seats: [6,7], fuel_type: ["electric"], transmission: ["automatic"] },
    };

    const commonHeader = `Bạn là chuyên gia kiểm định dữ liệu xe.\n`+
      `Đối với xe ${src.name || ""} ${src.year || ""} ${brandLine}, hãy đánh giá độ hợp lý của các thuộc tính dựa trên kiến thức phổ biến cho thương hiệu/dòng xe này (không truy cập internet).\n`+
      `Trả về JSON duy nhất: {\"checks\": [{\"label\": string, \"status\": \"pass\"|\"fail\"|\"warn\", \"detail\": string}], \"summary\": {\"pass\": number, \"fail\": number, \"warn\": number}}. Nếu không chắc, dùng \"warn\".`;

    let attrs = `Thuộc tính để kiểm tra:\n`+
      `- Hộp số: ${src.transmission || ""}\n`+
      `- Dáng xe: ${src.body_type || ""}\n`+
      `- Nhiên liệu: ${src.fuel_type || ""}\n`+
      `- Mức tiêu thụ: ${src.fuel_consumption || ""}\n`+
      `- Số chỗ ngồi: ${src.seats ?? ""}`;
    if (src.vehicle_type === "motorbike") {
      attrs = `Thuộc tính để kiểm tra:\n`+
        `- Loại xe: ${src.bike_type || src.body_type || ""}\n`+
        `- Nhiên liệu: ${src.fuel_type || ""}\n`+
        `- Mức tiêu thụ: ${src.fuel_consumption || ""}\n`+
        `- Dung tích động cơ: ${src.engine_capacity ?? ""}`;
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

    let ref = null;
    try {
      const refPrompt = `Trả về JSON duy nhất mô tả thuộc tính phổ biến cho mẫu xe:\n{"fuel_type": "petrol|diesel|hybrid|electric", "body_type": "sedan|suv|hatchback|crossover|minivan|pickup|coupe|convertible|wagon|mpv", "transmission": ["manual","automatic","cvt","dct"], "seats_range": [min,max], "consumption": {"unit": "l/100km|kWh/100km", "range": [min,max]}, "engine_capacity_range": [min,max]}\nKhông thêm văn bản ngoài JSON.\nThương hiệu: ${src.brand || ""}\nModel: ${src.model || ""}\nNăm: ${src.year || ""}`;
      const r = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [{ role: "system", content: "Luôn trả về JSON hợp lệ." }, { role: "user", content: refPrompt }],
        temperature: 0,
      });
      let t = r.choices?.[0]?.message?.content?.trim() || "";
      if (t.startsWith("```")) {
        const s = t.indexOf("\n");
        const e = t.lastIndexOf("```");
        t = t.substring(s + 1, e);
      }
      const parsed = JSON.parse(t);
      if (parsed && parsed.fuel_type) ref = parsed;
    } catch {}

    let checks, summary;
    if (ref) {
      const mismatchChecks = [];
      const pushMismatch = (label, status, detail) => mismatchChecks.push({ label, status, detail });
      if (src.fuel_type) {
        const f = fuelAlias(src.fuel_type);
        const rf = fuelAlias(ref.fuel_type);
        const ok = f === rf;
        pushMismatch("Nhiên liệu", ok ? "pass" : "fail", ok ? src.fuel_type : `${src.fuel_type} không phù hợp với ${brandLine}${src.year ? ` ${src.year}` : ""}. Theo thông tin phổ biến, mẫu này thường dùng ${ref.fuel_type}. Hãy chỉnh lại nhiên liệu hoặc kiểm tra lại model/năm nếu là biến thể khác.`);
      } else {
        pushMismatch("Nhiên liệu", "warn", "Thiếu. Hãy chọn nhiên liệu (petrol/xăng, diesel/dầu, hybrid, electric) để hệ thống đối chiếu chính xác.");
      }
      if (src.vehicle_type === "car") {
        if (src.body_type) {
          const bt = normalize(src.body_type);
          const ok = bt === normalize(ref.body_type);
          pushMismatch("Dáng xe", ok ? "pass" : "fail", ok ? src.body_type : `${src.body_type} không phù hợp với ${brandLine}${src.year ? ` ${src.year}` : ""}. Theo thông tin phổ biến, dáng xe thường là ${ref.body_type}. Hãy chỉnh về ${ref.body_type} hoặc kiểm tra lại model/năm nếu bạn đăng phiên bản khác.`);
        } else {
          pushMismatch("Dáng xe", "warn", "Thiếu. Hãy nhập dáng xe theo danh mục (sedan/suv/crossover/hatchback/coupe/convertible/wagon/mpv/minivan/pickup).");
        }
        if (src.transmission) {
          const tr = normalize(src.transmission);
          const ok = Array.isArray(ref.transmission) ? ref.transmission.map(normalize).includes(tr) : normalize(ref.transmission) === tr;
          const sug = Array.isArray(ref.transmission) ? ref.transmission.join("/") : ref.transmission;
          pushMismatch("Hộp số", ok ? "pass" : "fail", ok ? src.transmission : `${src.transmission} không phù hợp với ${brandLine}${src.year ? ` ${src.year}` : ""}. Theo thông tin phổ biến, hộp số thường là ${sug}. Hãy chọn lại hộp số đúng (manual/automatic/cvt/dct).`);
        } else {
          pushMismatch("Hộp số", "warn", "Thiếu. Hãy chọn hộp số (manual/automatic/cvt/dct) để hệ thống đối chiếu chính xác.");
        }
        const seatsNum = Number(src.seats);
        if (Number.isFinite(seatsNum) && Array.isArray(ref.seats_range)) {
          const ok = seatsNum >= Number(ref.seats_range[0]) && seatsNum <= Number(ref.seats_range[1]);
          pushMismatch("Số chỗ ngồi", ok ? "pass" : "fail", ok ? String(src.seats) : `${src.seats} chỗ không phù hợp với ${brandLine}${src.year ? ` ${src.year}` : ""}. Theo thông tin phổ biến, mẫu này thường có ${ref.seats_range[0]}–${ref.seats_range[1]} chỗ. Hãy chỉnh lại đúng cấu hình thực tế của xe.`);
        } else {
          pushMismatch("Số chỗ ngồi", "warn", "Thiếu. Hãy nhập số chỗ ngồi (2–9). Ví dụ: sedan/hatchback thường 5, SUV/crossover thường 5–7.");
        }
      }
      if (src.fuel_consumption && ref.consumption && ref.consumption.unit && Array.isArray(ref.consumption.range)) {
        const m = String(src.fuel_consumption).match(/\d+(?:\.\d+)?/);
        const fc = m ? parseFloat(m[0]) : NaN;
        const unitEV = /kwh/i.test(String(src.fuel_consumption)) ? "kWh/100km" : "l/100km";
        const unitMatch = unitEV.toLowerCase() === String(ref.consumption.unit).toLowerCase();
        if (!unitMatch) {
          pushMismatch("Mức tiêu thụ", "fail", `${String(src.fuel_consumption)} chưa đúng đơn vị cho ${brandLine}${src.year ? ` ${src.year}` : ""}. Theo thông tin phổ biến, xe này dùng đơn vị ${ref.consumption.unit}. Hãy nhập theo dạng "x ${ref.consumption.unit}" (ví dụ: 6.5 ${ref.consumption.unit}).`);
        } else if (Number.isFinite(fc)) {
          const ok = fc >= Number(ref.consumption.range[0]) && fc <= Number(ref.consumption.range[1]);
          pushMismatch("Mức tiêu thụ", ok ? "pass" : "fail", ok ? String(src.fuel_consumption) : `${String(src.fuel_consumption)} có vẻ không hợp lý cho ${brandLine}${src.year ? ` ${src.year}` : ""}. Theo thông tin phổ biến, mức tiêu thụ thường khoảng ${ref.consumption.range[0]}–${ref.consumption.range[1]} ${ref.consumption.unit}. Hãy kiểm tra lại và nhập theo dạng "x ${ref.consumption.unit}".`);
        } else {
          pushMismatch("Mức tiêu thụ", "warn", `${String(src.fuel_consumption)} thiếu số hoặc sai định dạng. Hãy nhập theo dạng "x ${ref.consumption.unit}" (ví dụ: 6.5 ${ref.consumption.unit}).`);
        }
      } else if (src.fuel_consumption) {
        const m = String(src.fuel_consumption).match(/\d+(?:\.\d+)?/);
        const fc = m ? parseFloat(m[0]) : NaN;
        const isEV = fuelAlias(src.fuel_type) === "electric" || /kwh/i.test(String(src.fuel_consumption));
        const unit = isEV ? "kWh/100km" : "l/100km";
        const ok = Number.isFinite(fc);
        pushMismatch("Mức tiêu thụ", ok ? "pass" : "warn", ok ? String(src.fuel_consumption) : `${String(src.fuel_consumption)} thiếu số hoặc sai định dạng. Hãy nhập theo dạng "x ${unit}" (ví dụ: ${isEV ? "15 kWh/100km" : "6.5 l/100km"}).`);
      } else {
        pushMismatch("Mức tiêu thụ", "warn", "Thiếu. Hãy nhập mức tiêu thụ theo dạng \"x l/100km\" (xe xăng/diesel) hoặc \"x kWh/100km\" (xe điện).");
      }
      if (src.engine_capacity && Array.isArray(ref.engine_capacity_range)) {
        const ec = parseFloat(String(src.engine_capacity).replace(/[^\d\.]+/g, ""));
        if (Number.isFinite(ec)) {
          const ok = ec >= Number(ref.engine_capacity_range[0]) && ec <= Number(ref.engine_capacity_range[1]);
          pushMismatch("Dung tích động cơ", ok ? "pass" : "fail", ok ? `${ec} cc` : `${ec} cc không phù hợp với ${brandLine}${src.year ? ` ${src.year}` : ""}. Theo thông tin phổ biến, dung tích thường khoảng ${ref.engine_capacity_range[0]}–${ref.engine_capacity_range[1]} cc. Hãy kiểm tra lại thông số xe trước khi đăng.`);
        } else {
          pushMismatch("Dung tích động cơ", "warn", "Thiếu hoặc sai định dạng. Hãy nhập dung tích theo cc (ví dụ: 1498 cc) để hệ thống đối chiếu chính xác.");
        }
      }
      checks = baseChecks.concat(mismatchChecks);
      summary = {
        pass: checks.filter(c => c.status === "pass").length,
        fail: checks.filter(c => c.status === "fail").length,
        warn: checks.filter(c => c.status === "warn").length,
      };
    } else if (aiChecks) {
      checks = [...baseChecks, ...aiChecks.checks];
      summary = {
        pass: checks.filter(c => c.status === "pass").length,
        fail: checks.filter(c => c.status === "fail").length,
        warn: checks.filter(c => c.status === "warn").length,
      };
    } else {
      if (src.vehicle_type === "car") {
        const bt = normalize(src.body_type);
        if (bt) {
          const ok = allowedBodyTypes.includes(bt);
          const guide = knownModelGuides[brandModelKey];
          if (!ok) {
            pushBase("Dáng xe", "fail", `${src.body_type}. Gợi ý: chọn một trong ${allowedBodyTypes.join(", ")}${guide ? ` (mẫu: ${guide.body_type})` : ""}`);
          } else if (guide && bt !== guide.body_type) {
            pushBase("Dáng xe", "fail", `${src.body_type}. Gợi ý: mẫu ${guide.body_type} cho ${src.brand} ${src.model}`);
          } else {
            pushBase("Dáng xe", "pass", src.body_type);
          }
        } else {
          const guide = knownModelGuides[brandModelKey];
          pushBase("Dáng xe", "warn", `Thiếu. Gợi ý: cung cấp dạng thân xe (ví dụ: sedan, suv)${guide ? ` (mẫu: ${guide.body_type})` : ""}`);
        }
        const tr = normalize(src.transmission);
        if (tr) {
          const ok = allowedTransmissions.includes(tr);
          const guide = knownModelGuides[brandModelKey];
          if (!ok) {
            pushBase("Hộp số", "fail", `${src.transmission}. Gợi ý: ${allowedTransmissions.join(", ")}${guide ? ` (mẫu: ${guide.transmission.join("/")})` : ""}`);
          } else if (guide && !guide.transmission.includes(tr)) {
            pushBase("Hộp số", "fail", `${src.transmission} không phù hợp với ${src.brand} ${src.model}. Gợi ý: hộp số thường là ${guide.transmission.join("/")}. Hãy chọn lại hộp số đúng.`);
          } else {
            pushBase("Hộp số", "pass", src.transmission);
          }
        } else {
          const guide = knownModelGuides[brandModelKey];
          pushBase("Hộp số", "warn", `Thiếu. Gợi ý: manual/automatic/CVT/DCT${guide ? ` (mẫu: ${guide.transmission.join("/")})` : ""}`);
        }
        const seatsNum = Number(src.seats);
        if (Number.isFinite(seatsNum)) {
          const guide = knownModelGuides[brandModelKey];
          const okRange = seatsNum >= 2 && seatsNum <= 9;
          if (!okRange) {
            pushBase("Số chỗ ngồi", "fail", `${src.seats}. Gợi ý: ${seatGuide}`);
          } else if (guide && !(seatsNum >= guide.seats[0] && seatsNum <= guide.seats[1])) {
            pushBase("Số chỗ ngồi", "fail", `${src.seats} chỗ không phù hợp với ${src.brand} ${src.model}. Gợi ý: mẫu thường có ${guide.seats[0]}–${guide.seats[1]} chỗ. Hãy chỉnh lại theo cấu hình thực tế của xe.`);
          } else {
            pushBase("Số chỗ ngồi", "pass", String(src.seats));
          }
        } else {
          pushBase("Số chỗ ngồi", "warn", `Thiếu. Gợi ý: nhập số chỗ ngồi. ${seatGuide}`);
        }
        const f = fuelAlias(src.fuel_type);
        if (src.fuel_type) {
          const ok = allowedFuelTypes.includes(f);
          const guide = knownModelGuides[brandModelKey];
          if (!ok) {
            pushBase("Nhiên liệu", "fail", `${src.fuel_type}. Gợi ý: petrol/xăng, diesel/dầu, hybrid, electric${guide ? ` (mẫu: ${guide.fuel_type.join("/")})` : ""}`);
          } else if (guide && !guide.fuel_type.includes(f)) {
            pushBase("Nhiên liệu", "fail", `${src.fuel_type} không phù hợp với ${src.brand} ${src.model}. Gợi ý: mẫu thường dùng ${guide.fuel_type.join("/")}. Hãy chọn lại nhiên liệu đúng.`);
          } else {
            pushBase("Nhiên liệu", "pass", src.fuel_type);
          }
        } else {
          pushBase("Nhiên liệu", "warn", "Thiếu. Gợi ý: cung cấp loại nhiên liệu (petrol/xăng, diesel/dầu, hybrid, electric)");
        }
        if (src.fuel_consumption) {
          const m = String(src.fuel_consumption).match(/\d+(?:\.\d+)?/);
          const fc = m ? parseFloat(m[0]) : NaN;
          if (Number.isFinite(fc)) {
            const isEV = fuelAlias(src.fuel_type) === "electric" || /kwh/i.test(String(src.fuel_consumption));
            const ok = isEV ? (fc >= 10 && fc <= 30) : (fc >= 3 && fc <= 20);
            const unit = isEV ? "kWh/100km" : "l/100km";
            const range = isEV ? "10–30 kWh/100km" : "3–20 l/100km";
            pushBase("Mức tiêu thụ", ok ? "pass" : "fail", ok ? String(src.fuel_consumption) : `${String(src.fuel_consumption)}. Gợi ý: 'x ${unit}' trong khoảng ${range}`);
          } else {
            const isEV = fuelAlias(src.fuel_type) === "electric" || /kwh/i.test(String(src.fuel_consumption));
            const unit = isEV ? "kWh/100km" : "l/100km";
            pushBase("Mức tiêu thụ", "warn", `${String(src.fuel_consumption)}. Gợi ý: định dạng 'x ${unit}'`);
          }
        } else {
          const isEV = fuelAlias(src.fuel_type) === "electric";
          const eg = isEV ? "ví dụ: 15 kWh/100km" : "ví dụ: 6.5 l/100km";
          pushBase("Mức tiêu thụ", "warn", `Thiếu. Gợi ý: cung cấp mức tiêu thụ nhiên liệu (${eg})`);
        }
        const ec = parseFloat(String(src.engine_capacity || "").replace(/[^\d\.]+/g, ""));
        if (Number.isFinite(ec)) {
          const ok = ec >= 600 && ec <= 7000;
          pushBase("Dung tích động cơ", ok ? "pass" : "fail", ok ? `${ec} cc` : `${ec} cc. Gợi ý: ô tô phổ biến 1000–3000 cc`);
        }
      } else if (src.vehicle_type === "motorbike") {
        const bt = (src.bike_type || src.body_type || "").toLowerCase();
        const allowedBikeTypes = ["tay ga","scooter","underbone","cub","sport","naked","touring","cruiser","adventure","dual-sport","off-road","dirt"];
        const matchesAllowed = bt ? allowedBikeTypes.some(t => bt.includes(t)) : false;
        if (bt) pushBase("Loại xe", matchesAllowed ? "pass" : "fail", matchesAllowed ? (src.bike_type || src.body_type) : `${src.bike_type || src.body_type}. Gợi ý: chọn một trong ${allowedBikeTypes.join(", ")}`); else pushBase("Loại xe", "warn", "Thiếu. Gợi ý: cung cấp loại xe (tay ga, underbone, sport, naked, touring, cruiser, adventure, dual-sport, off-road/dirt)");
        const ec = parseFloat(String(src.engine_capacity || "").replace(/[^\d\.]+/g, ""));
        if (Number.isFinite(ec)) {
          const ok = ec >= 49 && ec <= 2000;
          pushBase("Dung tích", ok ? "pass" : "fail", ok ? `${ec} cc` : `${ec} cc. Gợi ý: xe máy phổ biến 50–1000 cc`);
        } else {
          pushBase("Dung tích", "warn", "Thiếu. Gợi ý: nhập dung tích (ví dụ: 125 cc)");
        }
      }
      if (!ref) {
        if (src.fuel_type) {
          const f = fuelAlias(src.fuel_type);
          const ok = allowedFuelTypes.includes(f);
          pushBase("Nhiên liệu", ok ? "pass" : "fail", ok ? src.fuel_type : `${src.fuel_type}. Gợi ý: petrol/xăng, diesel/dầu, hybrid, electric`);
        } else {
          pushBase("Nhiên liệu", "warn", "Thiếu. Gợi ý: cung cấp loại nhiên liệu (petrol/xăng, diesel/dầu, hybrid, electric)");
        }
        if (src.fuel_consumption) {
          const m = String(src.fuel_consumption).match(/\d+(?:\.\d+)?/);
          const fc = m ? parseFloat(m[0]) : NaN;
          if (Number.isFinite(fc)) {
            const isEV = fuelAlias(src.fuel_type) === "electric" || /kwh/i.test(String(src.fuel_consumption));
            const ok = isEV ? (fc >= 10 && fc <= 30) : (fc >= 3 && fc <= 20);
            const unit = isEV ? "kWh/100km" : "l/100km";
            const range = isEV ? "10–30 kWh/100km" : "3–20 l/100km";
            pushBase("Mức tiêu thụ", ok ? "pass" : "fail", ok ? String(src.fuel_consumption) : `${String(src.fuel_consumption)}. Gợi ý: 'x ${unit}' trong khoảng ${range}`);
          } else {
            const isEV = fuelAlias(src.fuel_type) === "electric" || /kwh/i.test(String(src.fuel_consumption));
            const unit = isEV ? "kWh/100km" : "l/100km";
            pushBase("Mức tiêu thụ", "warn", `${String(src.fuel_consumption)}. Gợi ý: định dạng 'x ${unit}'`);
          }
        } else {
          const isEV = fuelAlias(src.fuel_type) === "electric";
          const eg = isEV ? "ví dụ: 15 kWh/100km" : "ví dụ: 6.5 l/100km";
          pushBase("Mức tiêu thụ", "warn", `Thiếu. Gợi ý: cung cấp mức tiêu thụ nhiên liệu (${eg})`);
        }
      }
    }
    return { vehicle_id: vehicle_id ?? v?.vehicle_id ?? null, brand: src.brand, model: src.model, name: src.name, year: src.year, checks, summary };
  } catch (error) {
    throw error;
  }
};
