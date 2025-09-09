import jwt from 'jsonwebtoken'

export const verifyJWTToken = (req, res, next) => {
    try {
        // 1. get token from cookie : 
        const { token } = req.cookies
        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }
        // 2. decode token : 
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)

        // 3. save the decoded data to req.user : 
        req.user = decoded

        // 4. continue : 
        next()
        
    } catch (error) {
        console.log('Error when verify jwt token :', error.message)
        return res.status(400).json({ success: false, message: 'Error when verify jwt token!' })
    }
}