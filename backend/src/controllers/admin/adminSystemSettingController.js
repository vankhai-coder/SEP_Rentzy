import db from "../../models/index.js";
import { Op } from "sequelize";

// GET /api/admin/system-settings
export const listSystemSettings = async (req, res) => {
  try {
    const { q } = req.query;
    const where = q
      ? {
          [Op.or]: [
            { feeCode: { [Op.like]: `%${q}%` } },
            { name: { [Op.like]: `%${q}%` } },
            { description: { [Op.like]: `%${q}%` } },
          ],
        }
      : {};

    const items = await db.SystemSetting.findAll({
      where,
      order: [["updated_at", "DESC"]],
    });
    return res.status(200).json(items);
  } catch (error) {
    console.error("listSystemSettings error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/admin/system-settings
export const createSystemSetting = async (req, res) => {
  try {
    const { feeCode, name, percent, description } = req.body || {};

    if (!feeCode || !name) {
      return res
        .status(400)
        .json({ message: "feeCode và name là bắt buộc" });
    }
    const percentNum = Number(percent ?? 0);
    if (Number.isNaN(percentNum) || percentNum < 0 || percentNum > 100) {
      return res.status(400).json({ message: "percent phải từ 0 đến 100" });
    }

    // Unique by feeCode
    const exist = await db.SystemSetting.findOne({ where: { feeCode } });
    if (exist) {
      return res.status(409).json({ message: "feeCode đã tồn tại" });
    }

    const created = await db.SystemSetting.create({
      feeCode,
      name,
      percent: percentNum,
      description: description ?? null,
    });
    return res.status(201).json(created);
  } catch (error) {
    console.error("createSystemSetting error:", error);
    // Handle enum violation or validation errors
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

// PUT /api/admin/system-settings/:id
export const updateSystemSetting = async (req, res) => {
  try {
    const { id } = req.params;
    const { feeCode, name, percent, description } = req.body || {};

    const setting = await db.SystemSetting.findByPk(id);
    if (!setting) {
      return res.status(404).json({ message: "Không tìm thấy bản ghi" });
    }

    const updateData = {};
    if (feeCode) updateData.feeCode = feeCode; // may throw if invalid enum
    if (name) updateData.name = name;
    if (percent !== undefined) {
      const percentNum = Number(percent);
      if (Number.isNaN(percentNum) || percentNum < 0 || percentNum > 100) {
        return res.status(400).json({ message: "percent phải từ 0 đến 100" });
      }
      updateData.percent = percentNum;
    }
    if (description !== undefined) updateData.description = description;

    await setting.update(updateData);
    return res.status(200).json(setting);
  } catch (error) {
    console.error("updateSystemSetting error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

// DELETE /api/admin/system-settings/:id
export const deleteSystemSetting = async (req, res) => {
  try {
    const { id } = req.params;
    const setting = await db.SystemSetting.findByPk(id);
    if (!setting) {
      return res.status(404).json({ message: "Không tìm thấy bản ghi" });
    }
    const NON_DELETABLE = new Set([
      "CANCEL_WITHIN_HOLD_1H",
      "CANCEL_BEFORE_7_DAYS",
      "CANCEL_WITHIN_7_DAYS",
      "PLATFORM_FEE_COMPLETE_ORDER",
    ]);
    if (NON_DELETABLE.has(setting.feeCode)) {
      return res
        .status(400)
        .json({ message: `Không thể xoá phí cốt lõi: ${setting.feeCode}` });
    }
    await setting.destroy();
    return res.status(200).json({ message: "Đã xoá" });
  } catch (error) {
    console.error("deleteSystemSetting error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};