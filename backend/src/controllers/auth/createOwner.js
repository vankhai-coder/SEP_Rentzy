import db from '../../models/index.js'
import bcrypt from "bcryptjs";

export const createOwner = async (req, res) => {
    try {
        const { email, password, full_name } = req.body || {}
        
        if (!email || !password || !full_name) {
            return res.status(400).json({
                success: false, 
                message: "Vui lòng nhập đầy đủ email, mật khẩu và họ tên!"
            });
        }

        // 1. check if email already exist :
        const existEmail = await db.User.findOne({ where: { email } });
        if (existEmail) {
            return res.status(400).json({
                success: false, 
                message: "Email đã tồn tại. Vui lòng sử dụng email khác!"
            });
        }

        // 2. create new owner account :
        const password_hash = await bcrypt.hash(password, 10); // 10 = salt rounds

        const newOwner = await db.User.create({
            email,
            password_hash,
            full_name,
            role: "owner",
            authMethod: "email",
            email_verified: true, // Auto verify for testing
        });

        // 3. return success
        return res.status(201).json({
            success: true,
            message: "Tạo tài khoản owner thành công",
            data: {
                user_id: newOwner.user_id,
                email: newOwner.email,
                full_name: newOwner.full_name,
                role: newOwner.role
            }
        });

    } catch (error) {
        console.error("Create Owner Error:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server khi tạo tài khoản owner",
            error: error.message
        });
    }
};
