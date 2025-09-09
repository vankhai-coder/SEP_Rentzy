
export const allowRoleAccess = (arrayRole) => {
    return (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ success: false, message: 'Unauthorized: user not found in req.user' });
            }

            if (arrayRole.includes(user.role)) {
                return next();
            }

            return res.status(403).json({ success: false, message: 'Forbidden: user not allowed!' });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Server Error!' });
        }
    };
};
