import cloudinary from "../config/cloudinary.js";
import fs from "fs";

const uploadFile = async (filePath, folder = "rentzy") => {
  try {
    // Upload file từ path tạm
    const result = await cloudinary.uploader.upload(filePath, {
      folder, // folder trên Cloudinary
      resource_type: "auto", // tự nhận diện image/video/raw
    });

    // Xóa file tạm trên server
    fs.unlinkSync(filePath);

    // Trả về thông tin quan trọng
    return {
      url: result.secure_url, // link ảnh hiển thị
      publicId: result.public_id, // id để xóa hoặc quản lý
    };
  } catch (error) {
    console.error("Upload error:", error);

    // Nếu có file tạm thì cũng xóa luôn để tránh rác
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    throw error;
  }
};

export default uploadFile;
