import db from '../../models/index.js'

export const createTestData = async (req, res) => {
    try {
        const ownerId = req.params.ownerId || 13; // Default to our test owner
        
        // Tạo notification test đơn giản
        const testNotification = await db.Notification.create({
            user_id: ownerId,
            title: "Chào mừng đến với Rentzy",
            content: "Chào mừng bạn đến với hệ thống quản lý xe Rentzy!",
            type: "system",
            is_read: false
        });

        return res.status(201).json({
            success: true,
            message: "Tạo dữ liệu test thành công",
            data: {
                notification: testNotification
            }
        });

    } catch (error) {
        console.error("Create Test Data Error:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server khi tạo dữ liệu test",
            error: error.message
        });
    }
};
