import db from "../../models/index.js";

// Thêm xe vào danh sách yêu thích
export const addFavorite = async (req, res) => {
  try {
    const { vehicle_id } = req.body; // Lấy vehicle_id từ body request (từ frontend gửi)
    const user_id = req.user.userId; // Lấy từ middleware verifyJWTToken

    // Kiểm tra xe có tồn tại không
    const vehicle = await db.Vehicle.findByPk(vehicle_id);
    if (!vehicle) {
      return res
        .status(404)
        .json({ success: false, message: "Xe không tồn tại!" });
    }

    // Kiểm tra favorite đã tồn tại chưa (nhờ unique constraint)
    const existingFavorite = await db.Favorite.findOne({
      where: { user_id, vehicle_id },
    });
    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: "Xe đã có trong danh sách yêu thích!",
      });
    }

    // Tạo favorite mới
    const newFavorite = await db.Favorite.create({
      user_id,
      vehicle_id,
    });

    return res.status(201).json({
      success: true,
      message: "Thêm vào danh sách yêu thích thành công!",
      data: newFavorite,
    });
  } catch (error) {
    console.error("Lỗi khi thêm favorite:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server khi thêm favorite!" });
  }
};

// Xóa xe khỏi danh sách yêu thích
export const removeFavorite = async (req, res) => {
  try {
    const { vehicle_id } = req.params; // Lấy vehicle_id từ URL params
    const user_id = req.user.userId;

    // Tìm và xóa favorite
    const deleted = await db.Favorite.destroy({
      where: { user_id, vehicle_id },
    });

    if (deleted === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy favorite để xóa!" });
    }

    return res.status(200).json({
      success: true,
      message: "Xóa khỏi danh sách yêu thích thành công!",
    });
  } catch (error) {
    console.error("Lỗi khi xóa favorite:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server khi xóa favorite!" });
  }
};

// Lấy danh sách xe yêu thích của người dùng
export const getFavorites = async (req, res) => {
  try {
    const user_id = req.user.userId;

    // Lấy tất cả favorites, include chi tiết Vehicle (và Brand nếu có)
    const favorites = await db.Favorite.findAll({
      where: { user_id },
      include: [
        {
          model: db.Vehicle,
          as: "Vehicle", // Giả định bạn đã define association Vehicle.hasMany(Favorite) và Favorite.belongsTo(Vehicle)
          attributes: [
            "vehicle_id",
            "model",
            "year",
            "price_per_day",
            "main_image_url",
            "location",
          ], // Chọn fields cần thiết
        },
      ],
      order: [["created_at", "DESC"]], // Sắp xếp theo mới nhất
    });

    if (favorites.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Danh sách yêu thích rỗng!",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách yêu thích thành công!",
      data: favorites,
    });
  } catch (error) {
    console.error("Lỗi khi lấy favorites:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách yêu thích!",
    });
  }
};
