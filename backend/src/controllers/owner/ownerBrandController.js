import Brand from "../../models/Brand.js";
import { Op } from "sequelize";

// Lấy tất cả brand cho owner
export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.findAll();
    res.status(200).json(brands);
  } catch (error) {
    console.error("Error fetching brands:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Lấy brand theo category (car / motorbike / both) cho owner
export const getBrandsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const validCategories = ["car", "motorbike", "both"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    let condition = {};
    if (category === "car") {
      condition = { category: { [Op.or]: ["car", "both"] } };
    } else if (category === "motorbike") {
      condition = { category: { [Op.or]: ["motorbike", "both"] } };
    } else {
      condition = { category: "both" }; // nếu gọi trực tiếp both
    }

    const brands = await Brand.findAll({ where: condition });
    res.status(200).json(brands);
  } catch (error) {
    console.error("Error fetching brands by category:", error);
    res.status(500).json({ message: "Server error" });
  }
};