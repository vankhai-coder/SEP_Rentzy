import Brand from "../../models/Brand.js";

// Lấy tất cả brand
export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.findAll();
    res.status(200).json(brands);
  } catch (error) {
    console.error("Error fetching brands:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Lấy brand theo category (car / motorbike / both)
export const getBrandsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    // validate category
    const validCategories = ["car", "motorbike", "both"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const brands = await Brand.findAll({
      where: { category },
    });

    res.status(200).json(brands);
  } catch (error) {
    console.error("Error fetching brands by category:", error);
    res.status(500).json({ message: "Server error" });
  }
};
