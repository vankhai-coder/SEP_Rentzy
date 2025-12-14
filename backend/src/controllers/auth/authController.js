import { Op } from 'sequelize';
import db from '../../models/index.js'
import { createCookie } from '../../utils/createCookie.js'
import { sendEmail } from '../../utils/email/sendEmail.js';
import { changePasswordSuccessTemplate, resetPasswordTemplate, verifyEmailTemplate } from '../../utils/email/templates/emailTemplate.js';
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { decryptWithSecret, encryptWithSecret } from '../../utils/cryptoUtil.js';
import { getTemporaryImageUrl } from '../../utils/aws/s3.js'
import { v2 as cloudinary } from 'cloudinary';
// redirect user to google login form and ask for permission : 
export const googleLogin = (req, res) => {
    try {
        const scope = ["openid", "profile", "email"].join(" ");
        const authUrl =
            "https://accounts.google.com/o/oauth2/v2/auth" +
            `?client_id=${process.env.GOOGLE_CLIENT_ID}` +
            `&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent(scope)}` +
            `&access_type=offline`;

        // Redirect user to Google login page
        res.redirect(authUrl);
    } catch (error) {
        console.error("Google Login Error:", error);
        res.status(500).send("Server error during Google login");
    }
};

// Handle callback from Google after user login to google account and accept permission :
export const googleCallback = async (req, res) => {
    try {
        // if user not allow to access data : 
        if (req.query.error === 'access_denied') {
            return res.status(400).json({ success: false, message: 'User not provide permisstion to access email,profile... in consent screen!' })
        }
        // get code from google response :
        const code = req.query.code;
        if (!code) return res.status(400).send("No code returned from Google");

        // Exchange code for access token
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_REDIRECT_URI,
                grant_type: "authorization_code",
            }),
        });

        const tokens = await tokenRes.json();

        if (!tokens.access_token) {
            return res.status(400).send("Error fetching access token");
        }
        // Fetch user info
        const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const user = await userRes.json();
        // user = {id , email , name , picture}

        // Check if user already exist : 
        const existUser = await db.User.findOne({
            where: {
                [Op.or]: [
                    { email: user.email },
                    { google_id: user.id }
                ]
            }
        });

        // if user exist but email already in use : 
        if (existUser && (existUser.authMethod === 'email' || existUser.authMethod === 'phone')) {
            return res.status(200).redirect(`${process.env.CLIENT_ORIGIN}?error=emailInUser`)
        }

        // check is band : 
        if (existUser && !existUser.is_active) {
            return res.status(200).redirect(`${process.env.CLIENT_ORIGIN}?error=userBanned`)
        }

        if (existUser) {
            // set cookie : 
            createCookie(res, existUser.user_id, existUser.role, existUser.avatar_url, existUser.email)
        } else {
            // create new user :
            const newUser = await db.User.create({
                email: user.email,
                full_name: user.name,
                avatar_url: user.picture,
                google_id: user.id,
                email_verified: true,
                authMethod: 'oauth'

            });
            // set cookie : 
            createCookie(res, newUser.user_id, 'renter', newUser.avatar_url, newUser.email)
        }
        return res.status(200).redirect(`${process.env.CLIENT_ORIGIN}`)
    } catch (error) {
        console.error("Google Callback Error:", error);
        res.status(500).send("Server error during Google callback");
    }
};

// logout : 
export const logout = (req, res) => {
    try {
        // 1. delete cookie : 
        res.clearCookie('token',
            {
                httpOnly: true,   // cannot be accessed by JavaScript (XSS safe)
                secure: process.env.NODE_ENV === "production", // only HTTPS in production
                sameSite: "strict", // CSRF protection
                maxAge: 10 * 365 * 24 * 60 * 60 * 1000 // 10 years
            }
        )
        // 2. return : 
        return res.status(200).json({
            success: true, message: "Bạn đã đăng xuất thành công!"
        })
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            success: false, message: "Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại!"
        })

    }
}

// register :
export const register = async (req, res) => {
    try {
        const { email, password } = req.body || {}
        if (!email || !password) {
            return res
                .status(400)
                .json({
                    success: false, message: "Vui lòng nhập đầy đủ email và mật khẩu!"
                });
        }

        // 1. check if email already exist :
        const existEmail = await db.User.findOne({ where: { email } });
        if (existEmail) {
            return res
                .status(400)
                .json({
                    success: false, message: "Email đã tồn tại. Vui lòng sử dụng email khác!"
                });
        }

        // 2. create new account :
        const password_hash = await bcrypt.hash(password, 10); // 10 = salt rounds
        const verifyEmailToken = crypto.randomBytes(32).toString("hex");

        const newUser = await db.User.create({
            email,
            password_hash,
            authMethod: "email",
            verifyEmailToken,
        });

        // 3. send verify email :
        const verifyLink = `${process.env.CLIENT_ORIGIN}/verify-email?email=${encodeURIComponent(
            email
        )}&verifyEmailToken=${verifyEmailToken}`;

        await sendEmail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Verify Your Email",
            html: verifyEmailTemplate(verifyLink),
        });

        // 4. return success
        return res.status(201).json({
            success: true,
            message: "Đăng ký tài khoản thành công. Vui lòng kiểm tra email để xác minh tài khoản của bạn."

        });
    } catch (error) {
        console.error("Register error:", error);
        return res
            .status(500)
            .json({
                success: false, message: "Lỗi hệ thống, vui lòng thử lại sau!"
                ,
            });
    }
};

// verify email : 
export const verifyEmail = async (req, res) => {
    try {
        const { email, verifyEmailToken } = req.body || {};

        // 1. Check if email & token exist in body
        if (!email || !verifyEmailToken) {
            return res
                .status(400)
                .json({
                    success: false, message: "Thiếu email hoặc mã xác minh trong yêu cầu!"
                });
        }

        // 2. Find user by email
        const user = await db.User.findOne({ where: { email } });
        if (!user) {
            return res
                .status(404)
                .json({
                    success: false, message: "Không tìm thấy người dùng!"
                });
        }

        // 3. Check if token matches
        if (user.verifyEmailToken !== verifyEmailToken) {
            return res
                .status(400)
                .json({
                    success: false, message: "Token không hợp lệ hoặc đã hết hạn!"
                });
        }

        // 4. Token matches → update user
        user.verifyEmailToken = null; // delete token
        user.email_verified = true;
        await user.save();

        // 5. Create cookie 
        createCookie(res, user.user_id, user.role, user.avatar_url, user.email)

        // 6. Respond
        return res.status(200).json({
            success: true,
            user: {
                userId: user.user_id,
                role: user.role,
                email: user.email
            }
        })
    } catch (error) {
        console.error("Error verifying email:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi hệ thống, vui lòng thử lại sau!"
            ,
        });
    }
};

// login : 
export const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res
                .status(400)
                .json({
                    success: false, message: "Vui lòng nhập email và mật khẩu!"
                });
        }

        // 1. Check if email exists
        const existUser = await db.User.findOne({ where: { email } });
        if (!existUser) {
            return res.status(400).json({
                success: false, message: "Sai thông tin đăng nhập!"
            });
        }
        // 1.1 check if this email is register by google oauth method : 
        if (existUser && existUser.authMethod === 'oauth') {
            return res.status(400).json({ message: 'Email này đã được dùng để đăng nhập với Google!' })
        }
        // 1.2 check if this email is register by phone method :
        if (existUser && existUser.authMethod === 'phone') {
            return res.status(400).json({ message: 'Email này đã được dùng để đăng nhập với Số điện thoại!' })
        }

        // 1.3 check is band : 
        if (!existUser.is_active) {
            return res.status(400).json({
                success: false, message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên!"
            });
        }

        // 2. Check if email is verified
        if (existUser.email_verified !== true) {
            return res
                .status(400)
                .json({
                    success: false, message: "Email chưa được xác minh!"
                    , isNotVerifyEmailError: true
                });
        }

        // 3. Check password
        const isMatch = await bcrypt.compare(password, existUser.password_hash);
        if (!isMatch) {
            return res.status(400).json({
                success: false, message: "Sai thông tin đăng nhập!"
            });
        }

        // 5. Set cookie
        createCookie(res, existUser.user_id, existUser.role, '', existUser.email)

        // 6. Send response
        return res.json({
            success: true,
            message: "Login successful",
            user: {
                userId: existUser.user_id,
                email: existUser.email,
                role: existUser.role,
                avatar: existUser.avatar,
            },
        });
    } catch (error) {
        console.error("Login error:", error.message);
        return res.status(500).json({
            success: false, message: "Có lỗi từ máy chủ. Vui lòng thử lại."
        });
    }
};

// request to create verify email : 
export const requestCreateVerifyEmail = async (req, res) => {
    try {
        const { email } = req.body || {};

        // 0. Check if email is provided
        if (!email) {
            return res
                .status(400)
                .json({
                    success: false, message: "Vui lòng nhập email!"
                });
        }

        // 1. Check if user exists
        const user = await db.User.findOne({ where: { email } });
        if (!user) {
            return res
                .status(404)
                .json({
                    success: false, message: "Không tìm thấy người dùng!"
                });
        }

        // 2. Check if email is already verified
        if (user.email_verified) {
            return res
                .status(400)
                .json({
                    success: false, message: "Email này đã được xác thực rồi!"
                });
        }

        // 3. Create verify email token
        const verifyEmailToken = crypto.randomBytes(32).toString("hex");
        user.verifyEmailToken = verifyEmailToken;
        await user.save();

        // 4. Send verification email
        const verifyLink = `${process.env.CLIENT_ORIGIN}/verify-email?email=${encodeURIComponent(
            email
        )}&verifyEmailToken=${verifyEmailToken}`;
        await sendEmail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Verify Your Email",
            html: verifyEmailTemplate(verifyLink),
        });

        // 5. Response
        return res
            .status(200)
            .json({
                success: true, message: "Đã gửi email xác thực!"
            });
    } catch (error) {
        console.error("Error in requestCreateVerifyEmail:", error.message);
        return res
            .status(500)
            .json({
                success: false, message: "Có lỗi từ máy chủ. Vui lòng thử lại."
            });
    }
};

// request to reset forgot password
export const requestResetPassword = async (req, res) => {
    try {
        const { email } = req.body || {};

        // 1. Validate input
        if (!email) {
            return res.status(400).json({
                success: false, message: "Vui lòng nhập email."
            });
        }

        // 2. Check if user exists
        const user = await db.User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({
                success: false, message: "Không tìm thấy tài khoản nào với email này."
            });
        }

        // 3. Create reset token (expires in 15 minutes)
        const resetPasswordToken = crypto.randomBytes(32).toString("hex");

        // 4. Save token to DB (optional, for invalidation)
        user.resetPasswordToken = resetPasswordToken;
        await user.save();

        // 5. Create link
        const link = `${process.env.CLIENT_ORIGIN}/forgot-password?email=${encodeURIComponent(
            email
        )}&resetPasswordToken=${resetPasswordToken}`;

        // 6. Send email
        await sendEmail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Reset your password!",
            html: resetPasswordTemplate(link),
        });

        // 7. Response
        return res.status(200).json({
            success: true,
            message: "Đã gửi yêu cầu đặt lại mật khẩu. Kiểm tra email để đặt lại!",
        });
    } catch (error) {
        console.error("requestResetPassword error:", error);
        return res.status(500).json({
            success: false, message: "Có lỗi xảy ra từ hệ thống, vui lòng thử lại sau."
        });
    }
};

// reset password : 
export const resetPassword = async (req, res) => {
    try {
        const { email, resetPasswordToken, password } = req.body || {};

        // 1. Validate input
        if (!email || !resetPasswordToken || !password) {
            return res.status(400).json({
                success: false, message: "Vui lòng điền đầy đủ tất cả các trường."
            });
        }

        // 2. Verify token

        // 3. Find user
        const user = await db.User.findOne({ where: { email, resetPasswordToken } });
        if (!user) {
            return res.status(404).json({
                success: false, message: "Không tìm thấy người dùng hoặc mã xác thực không hợp lệ."
            });
        }

        // 5. Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 6. Update password and clear token
        user.password_hash = hashedPassword;
        user.resetPasswordToken = '';
        await user.save();

        // 7. Response
        return res.status(200).json({
            success: true,
            message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay bây giờ."
        });
    } catch (error) {
        console.error("resetPassword error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// request to create verify email : 
export const requestUpdateEmail = async (req, res) => {
    try {
        const { updatedEmail } = req.body || {};

        // 0. Check if updatedEmail is provided
        if (!updatedEmail) {
            return res
                .status(400)
                .json({
                    success: false, message: "Vui lòng nhập email!"
                });
        }

        // 1. Check if user exists by user_id from req.user in verifyJWTToken : 
        const user_id = req.user.userId
        if (!user_id) {
            console.log('Can not get user_id from req.user')
            return res.status(400).json({ message: 'Không thể tìm thấy user!' })
        }
        const user = await db.User.findOne({ where: { user_id } });
        if (!user) {
            return res
                .status(404)
                .json({
                    success: false, message: "Không tìm thấy người dùng!"
                });
        }
        // 2. check if updateEmail is already in use ! : 
        const updatedEmailAlreadyInUse = await db.User.findOne({
            where: {
                [Op.or]: [
                    { email: updatedEmail },
                    { updatedEmail: updatedEmail }
                ]
            }
        });
        if (updatedEmailAlreadyInUse) {
            return res.status(400).json({ message: 'Email này đã được sử dụng!' })
        }
        // save updatedEmail : 
        user.updatedEmail = updatedEmail

        // 3. Create verify email token
        const verifyEmailToken = crypto.randomBytes(32).toString("hex");
        user.verifyEmailToken = verifyEmailToken;
        await user.save();

        // 4. Send verification email
        const verifyLink = `${process.env.CLIENT_ORIGIN}/verify-updated-email?email=${encodeURIComponent(
            updatedEmail
        )}&verifyEmailToken=${verifyEmailToken}`;
        await sendEmail({
            from: process.env.GMAIL_USER,
            to: updatedEmail,
            subject: "Verify Your Email",
            html: verifyEmailTemplate(verifyLink),
        });

        // 5. Response
        return res
            .status(200)
            .json({
                success: true, message: "Đã gửi email xác thực!"
            });
    } catch (error) {
        console.error("Error in requestUpdateEmail:", error.message);
        return res
            .status(500)
            .json({
                success: false, message: "Có lỗi từ máy chủ. Vui lòng thử lại."
            });
    }
};

// verify updated email : 
export const verifyUpdatedEmail = async (req, res) => {
    try {
        const { updatedEmail, verifyEmailToken } = req.body || {};

        // 1. Check if email & token exist in body
        if (!updatedEmail || !verifyEmailToken) {
            return res
                .status(400)
                .json({
                    success: false, message: "Thiếu email hoặc mã xác minh trong yêu cầu!"
                });
        }

        // 2. Find user by email
        const user = await db.User.findOne({ where: { updatedEmail } });
        if (!user) {
            return res
                .status(404)
                .json({
                    success: false, message: "Không tìm thấy người dùng!"
                });
        }

        // 3. Check if token matches
        if (user.verifyEmailToken !== verifyEmailToken) {
            return res
                .status(400)
                .json({
                    success: false, message: "Token không hợp lệ hoặc đã hết hạn!"
                });
        }

        // 4. Token matches → update user
        user.verifyEmailToken = null; // delete token
        user.email_verified = true;
        user.email = updatedEmail
        user.updatedEmail = ''
        await user.save();

        // 5. Create cookie 
        createCookie(res, user.user_id, user.role, user.avatar_url, user.email)

        // 6. Respond
        return res.status(200).json({
            success: true,
            user: {
                userId: user.user_id,
                role: user.role,
                email: user.email
            }
        })
    } catch (error) {
        console.error("Error verifying email:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi hệ thống, vui lòng thử lại sau!"
            ,
        });
    }
};

// register with phone number :
export const registerWithPhoneNumber = async (req, res) => {
    // 1. get phone number from req.body
    const { phoneNumber } = req.body || {};

    // log  : 
    console.log("Register with phone number request received for:", phoneNumber);

    // 2. Validate phone number
    if (!phoneNumber) {
        return res.status(400).json({ message: "Bạn phải cung cấp số điện thoại!" });
    }

    // 3 fotmat phone number here if needed : 
    let formattedPhoneNumber = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
        // Assuming country code is +84 (Vietnam) for example
        formattedPhoneNumber = '+84' + phoneNumber.replace(/^0+/, '');
    }

    // log  : 
    console.log("Formatted phone number:", formattedPhoneNumber);

    // 4. check if phone number already exist and decrypted value match , and phone_verified is true  :
    // select all users that have phone number , phone_verified = true and decrypt phone number to compare :
    const users = await db.User.findAll(
        {
            where: {
                phone_number: {
                    [Op.ne]: null
                },
            }
        }
    );
    for (const user of users) {
        if (user.phone_number) {
            const decryptedPhoneNumber = decryptWithSecret(user.phone_number, process.env.ENCRYPT_KEY);
            if (decryptedPhoneNumber === formattedPhoneNumber) {
                return res.status(400).json({ message: "Số điện thoại này đã được sử dụng!" });
            }
        }
    }
    // log : 
    console.log("Phone number is available for registration:", formattedPhoneNumber);

    // 5. create otp and save to db resetPasswordToken field :
    // generate 6 digit otp : 
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Generated OTP:", otp);
    // save otp to db in resetPasswordToken field :
    try {
        // create new user with phone number only (phone_verified is false by default) :
        const tempUser = await db.User.create({
            phone_number: encryptWithSecret(formattedPhoneNumber, process.env.ENCRYPT_KEY),
            resetPasswordToken: otp,
            authMethod: "phone",
            phone_verified: false
        });
        // log temp user created :
        console.log("Temporary user created with ID:", tempUser.user_id);
    } catch (error) {
        console.error("Save OTP to temp user error:", error);
        return res.status(500).json({
            success: false, message: "Lỗi hệ thống, vui lòng thử lại sau!"
        });
    }
    // send otp using mocean sms api with MOCEAN_TOKEN : 
    try {
        const response = await fetch("https://rest.moceanapi.com/rest/2/sms", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.MOCEAN_API_TOKEN}`,
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            },
            body: new URLSearchParams({
                "mocean-from": "RENTZY",
                "mocean-to": formattedPhoneNumber, // 84xxxxxxxxx
                "mocean-text": `RENTZY OTP: ${otp}. Khong chia se.`
            })
        });

        const data = await response.json();
        // log mocean response :
        console.log("Mocean SMS response:", data);
        return res.status(201).json({
            success: true,
            message: "Mã OTP đã được gửi đến số điện thoại của bạn. Vui lòng kiểm tra tin nhắn."
        });

    } catch (err) {
        console.error("Mocean SMS exception:", err);
        return res.status(500).json({
            success: false,
            message: "Không thể gửi mã OTP."
        });
    }

}

// verify phone number for registration :
export const verifyPhoneNumberForRegistration = async (req, res) => {
    // 1. get phone number and otp from req.body
    const { phoneNumber, otp } = req.body;

    // 2. Validate input
    if (!phoneNumber || !otp) {
        return res.status(400).json({ message: "Vui lòng cung cấp số điện thoại và mã OTP!" });
    }

    // 3. format phone number if needed : 
    let formattedPhoneNumber = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
        // Assuming country code is +84 (Vietnam) for example
        formattedPhoneNumber = '+84' + phoneNumber.replace(/^0+/, '');
    }

    // 4. find user by phone number (decrypt phone number to compare) :
    const users = await db.User.findAll(
        {
            where: {
                phone_number: {
                    [Op.ne]: null
                },
                authMethod: 'phone',
                phone_verified: false
            }
        }
    );
    let foundUser = null;
    for (const user of users) {
        if (user.phone_number) {
            const decryptedPhoneNumber = decryptWithSecret(user.phone_number, process.env.ENCRYPT_KEY);
            if (decryptedPhoneNumber === formattedPhoneNumber) {
                foundUser = user;
                break;
            }
        }
    }
    if (!foundUser) {
        return res.status(400).json({ message: "Số điện thoại này chưa được đăng ký!" });
    }

    // 5. verify otp using field resetPasswordToken in db :

    // 6. if otp is valid :
    if (foundUser.resetPasswordToken === otp) {
        // 5. update user phone_verified to true
        try {
            foundUser.phone_verified = true;
            foundUser.resetPasswordToken = null; // clear otp
            await foundUser.save();

            // create cookie
            createCookie(res, foundUser.user_id, foundUser.role, foundUser.avatar_url, foundUser.email);

            return res.status(200).json({
                success: true,
                message: "Xác minh số điện thoại thành công!"
            });

        } catch (error) {
            console.error("Verify phone number error:", error);
            return res.status(500).json({
                success: false, message: "Lỗi hệ thống, vui lòng thử lại sau!"
            });
        }

    }
}

// login with phone number :
export const loginWithPhoneNumber = async (req, res) => {
    //1 . get phone number and otp from req.body
    const { phoneNumber, otp } = req.body || {};

    // 2. Validate input
    if (!phoneNumber || !otp) {
        return res.status(400).json({ message: "Vui lòng cung cấp số điện thoại và mã OTP!" });
    }

    // 3. format phone number if needed : 
    let formattedPhoneNumber = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
        // Assuming country code is +84 (Vietnam) for example
        formattedPhoneNumber = '+84' + phoneNumber.replace(/^0+/, '');
    }

    // log : 
    console.log("Login with phone number request for:", formattedPhoneNumber);

    // 4. find user by phone number and phone_verified = true
    const users = await db.User.findAll(
        {
            where: {
                phone_number: {
                    [Op.ne]: null
                },
                phone_verified: true,
                authMethod: 'phone'
            }
        }
    );

    let foundUser = null;
    // decrypt and compare phone number :
    for (const user of users) {
        if (user.phone_number) {
            const decryptedPhoneNumber = decryptWithSecret(user.phone_number, process.env.ENCRYPT_KEY);
            if (decryptedPhoneNumber === formattedPhoneNumber) {
                foundUser = user;
                break;
            }
        }
    }
    if (!foundUser) {
        return res.status(404).json({ message: "Không tìm thấy người dùng với số điện thoại này!" });
    }

    // check if user is baned : 
    if (!foundUser.is_active) {
        return res.status(400).json({
            success: false, message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên!"
        });
    }

    // 5. verify otp using field resetPasswordToken in db :
    if (foundUser.resetPasswordToken !== otp) {
        return res.status(400).json({ message: "Mã OTP không hợp lệ!" });
    }
    // 6. create cookie 
    createCookie(res, foundUser.user_id, foundUser.role, foundUser.avatar_url, foundUser.email)

    // 7. respond success
    return res.status(200).json({
        success: true,
        message: "Đăng nhập thành công!"
    });
}

// request send otp for login with phone number :
export const requestLoginWithPhoneNumber = async (req, res) => {
    // 1. get phone number from req.body
    const { phoneNumber } = req.body || {};

    // 2. Validate phone number
    if (!phoneNumber) {
        return res.status(400).json({ message: "Bạn phải cung cấp số điện thoại!" });
    }

    // 3 fotmat phone number here if needed : 
    let formattedPhoneNumber = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
        // Assuming country code is +84 (Vietnam) for example
        formattedPhoneNumber = '+84' + phoneNumber.replace(/^0+/, '');
    }

    // log  : 
    console.log("Formatted phone number for login request:", formattedPhoneNumber);

    // 4. check if phone number exist and decrypted value match , and phone_verified is true  :
    // select all users that have phone number , phone_verified = true and decrypt phone number to compare :
    const users = await db.User.findAll(
        {
            where: {
                phone_number: {
                    [Op.ne]: null
                },
                phone_verified: true,
                authMethod: 'phone'
            }
        }
    );
    let userFound = false;
    for (const user of users) {
        if (user.phone_number) {
            const decryptedPhoneNumber = decryptWithSecret(user.phone_number, process.env.ENCRYPT_KEY);
            if (decryptedPhoneNumber === formattedPhoneNumber) {
                userFound = true;
                break;
            }
        }
    }
    if (!userFound) {
        console.log("User not found for phone number:", formattedPhoneNumber);
        return res.status(400).json({ message: "Số điện thoại này chưa được đăng ký!" });
    }

    // 5. send otp using mocean sms api with MOCEAN_TOKEN :
    // generate 6 digit otp : 
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Generated OTP for login:", code);

    // save otp to db in resetPasswordToken field for that user :
    try {
        // find user again to update otp :
        for (const user of users) {
            if (user.phone_number) {
                const decryptedPhoneNumber = decryptWithSecret(user.phone_number, process.env.ENCRYPT_KEY);
                if (decryptedPhoneNumber === formattedPhoneNumber) {
                    user.resetPasswordToken = code;
                    await user.save();
                    console.log("Saved OTP to user ID:", user.user_id);
                    break;
                }
            }
        }
    } catch (error) {
        console.error("Save OTP to user error:", error);
        return res.status(500).json({
            success: false, message: "Lỗi hệ thống, vui lòng thử lại sau!"
        });
    }

    // send otp via mocean sms api :
    try {
        const response = await fetch("https://rest.moceanapi.com/rest/2/sms", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.MOCEAN_API_TOKEN}`,
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            },
            body: new URLSearchParams({
                "mocean-from": "RENTZY",
                "mocean-to": formattedPhoneNumber, // 84xxxxxxxxx
                "mocean-text": `RENTZY OTP: ${code}. Khong chia se.`
            })
        });

        const data = await response.json();
        // log mocean response :
        console.log("Mocean SMS response for login OTP:", data);
    } catch (err) {
        console.error("Mocean SMS exception for login OTP:", err);
        return res.status(500).json({
            success: false,
            message: "Không thể gửi mã OTP."
        });
    }

    // 6. response success 
    return res.status(200).json({
        success: true,
        message: "Mã OTP đã được gửi đến số điện thoại của bạn. Vui lòng kiểm tra tin nhắn."
    });
}

// function to check if user auth method is email : 
export const checkUserAuthMethodIsEmail = async (req, res) => {
    try {
        const user_id = req.user.userId;
        if (!user_id) {
            console.log('Can not get user_id from req.user')
            return res.status(400).json({ message: 'Không thể tìm thấy user!' })
        }
        const user = await db.User.findOne({ where: { user_id } });
        if (!user) {
            console.log("User not found for user_id:", user_id);
            return res.status(404).json({ message: "User not found for user_id: " + user_id });
        }
        const isEmailAuth = user.authMethod === 'email';
        return res.status(200).json({ isEmailAuth });
    } catch (error) {
        console.error("Error checking user auth method:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// function to change new password for email auth user :
export const changeNewPasswordForEmailAuthUser = async (req, res) => {
    try {
        const user_id = req.user.userId;
        const { oldPassword, newPassword } = req.body || {};

        if (!user_id) {
            console.log('Can not get user_id from req.user')
            return res.status(400).json({ message: 'Không thể tìm thấy user!' })
        }
        if (!newPassword) {
            return res.status(400).json({ message: 'Vui lòng nhập mật khẩu mới!' })
        }

        if (!oldPassword) {
            return res.status(400).json({ message: 'Vui lòng nhập mật khẩu cũ!' })
        }

        // find user :
        const user = await db.User.findOne({ where: { user_id } });
        if (!user) {
            console.log("User not found for user_id:", user_id);
            return res.status(404).json({ message: "User not found for user_id: " + user_id });
        }
        if (user.authMethod !== 'email') {
            return res.status(400).json({ message: 'Chỉ người dùng đăng ký bằng email mới có thể thay đổi mật khẩu tại đây!' })
        }
        // check old password :
        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({
                success: false, message: "Mật khẩu cũ không đúng!"
            });
        }
        // hash new password : 
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        // update password : 
        user.password_hash = hashedPassword;
        await user.save();

        // send email notification about password change :
        await sendEmail({
            from: process.env.GMAIL_USER,
            to: user.email,
            subject: "Bạn đã đổi mật khẩu thành công!",
            html: changePasswordSuccessTemplate(),
        });

        // respond success :
        return res.status(200).json({
            success: true,
            message: "Thay đổi mật khẩu thành công!"
        });
    } catch (error) {
        console.error("Error changing password for email auth user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// delete account :
export const deleteAccount = async (req, res) => {
    try {
        const user_id = req.user.userId;

        if (!user_id) {
            console.log('Can not get user_id from req.user')
            return res.status(400).json({ message: 'Không thể tìm thấy user!' })
        }

        // find user :
        const user = await db.User.findOne({ where: { user_id } });
        if (!user) {
            console.log("User not found for user_id:", user_id);
            return res.status(404).json({ message: "User not found for user_id: " + user_id });
        }

        // delete user :
        await user.destroy();

        // clear cookie
        res.clearCookie('token',
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 10 * 365 * 24 * 60 * 60 * 1000
            }
        )

        // respond success :
        return res.status(200).json({
            success: true,
            message: "Xóa tài khoản thành công!"
        });
    } catch (error) {
        console.error("Error deleting account:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}