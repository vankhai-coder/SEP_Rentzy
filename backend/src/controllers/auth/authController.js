import { Op } from 'sequelize';
import db from '../../models/index.js'
import { createCookie } from '../../utils/createCookie.js'
import { sendEmail } from '../../utils/email/sendEmail.js';
import { resetPasswordTemplate, verifyEmailTemplate } from '../../utils/email/templates/emailTemplate.js';
import bcrypt from "bcrypt";
import crypto from "crypto";
import { decryptWithSecret } from '../../utils/cryptoUtil.js';
import { getTemporaryImageUrl } from '../../utils/aws/s3.js'
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
        if (existUser && existUser.authMethod === 'email') {
            return res.status(200).redirect(`${process.env.CLIENT_ORIGIN}?error=emailInUser`)
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

export const getBasicUserInformation = async (req, res) => {
    try {
        const userId = req.user.userId;
        if (!userId) {
            return res.status(400).json({ message: 'Missing userId!' });
        }

        const user = await db.User.findOne({
            where: { user_id: userId },
            attributes: [
                "points",
                "driver_class",
                "driver_license_image_url",
                "driver_license_dob",
                "driver_license_name",
                "driver_license_number",
                "avatar_url",
                "phone_number",
                "email",
                "full_name",
                "created_at"
            ],
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // ✅ Convert to plain object
        const userData = user.get({ plain: true });

        // Decrypt and modify
        // modify data : hash => normal , format date :
        userData.driver_license_number = userData.driver_license_number
            ? decryptWithSecret(userData.driver_license_number, process.env.ENCRYPT_KEY)
            : null;

        userData.driver_license_dob = userData.driver_license_dob
            ? decryptWithSecret(userData.driver_license_dob, process.env.ENCRYPT_KEY)
            : null;

        userData.driver_license_name = userData.driver_license_name
            ? decryptWithSecret(userData.driver_license_name, process.env.ENCRYPT_KEY)
            : null;

        userData.driver_license_image_url = userData.driver_license_name
            ? await getTemporaryImageUrl(userData.driver_license_image_url)
            : null;

        // Add new field (formatted date)
        userData.date_join = new Date(userData.created_at).toLocaleDateString('en-GB'); // dd/mm/yyyy

        // ✅ Return safely
        res.status(200).json({
            success: true,
            user: userData,
        });
    } catch (err) {
        console.error('Error in getBasicUserInformation:', err);
        res.status(500).json({ message: 'Internal server error' });
    }

};

// update avatar to cloudinary :
export const updateAvatarToCloudinary = async (req, res) => {
    try {
        const userId = req.user.userId;
        if (!userId) {
            return res.status(400).json({ message: 'Không thể tìm thấy người dùng!' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'Không tìm thấy avatar đăng lên!' });
        }
        // multer will save file to memory storage , so we can get file buffer from req.file.buffer
        const fileBuffer = req.file.buffer;

        // upload to cloudinary :
        const cloudinary = await import('cloudinary');
        const { v2: cloudinaryV2 } = cloudinary;
        cloudinaryV2.config({
            cloud_name: process.env.CLOUD_NAME,
            api_key: process.env.CLOUD_API_KEY,
            api_secret: process.env.CLOUD_API_SECRET,
        });

        const uploadResult = await cloudinaryV2.uploader.upload_stream(
            {
                folder: 'avatars',
                public_id: `avatar_user_${userId}_${Date.now()}`,
                overwrite: true,
                resource_type: 'image',
            },
            async (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    return res.status(500).json({ message: 'Lỗi khi tải ảnh lên Cloudinary' });
                }
                // update user avatar_url in db :   
                await db.User.update(
                    { avatar_url: result.secure_url },
                    { where: { user_id: userId } }
                );
                return res.status(200).json({
                    success: true,
                    message: 'Cập nhật avatar thành công!',
                    avatarUrl: result.secure_url,
                });
            }
        );

        // Write the file buffer to the upload stream
        uploadResult.end(fileBuffer);


    } catch (err) {
        console.error('Error in updateAvatarToCloudinary:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// sending otp using twilio :
export const sendOTPUsingTwilio = async (req, res) => {
    try {
        const { phoneNumber } = req.body || {};

        // 1. Validate input
        if (!phoneNumber) {
            return res.status(400).json({
                success: false, message: "Vui lòng nhập số điện thoại."
            });
        }
        // 1.1 check if phone number is already in use by another user :
        // unHash phone number to compare :
        // get all users with phone number not null : 
        const usersWithPhoneNumber = await db.User.findAll({
            where: {
                phone_number: {
                    [Op.ne]: null
                }
            }
        });
        for (const user of usersWithPhoneNumber) {
            if (user.phone_number) {
                const decryptedPhoneNumber = decryptWithSecret(user.phone_number, process.env.ENCRYPT_KEY);
                if (decryptedPhoneNumber === phoneNumber) {
                    return res.status(400).json({
                        success: false, message: "Số điện thoại này đã được sử dụng!"
                    });
                }
            }
        }
        // 1.2 format phone number to E.164 format if needed (assuming input is in local format)
        let formattedPhoneNumber = phoneNumber;
        if (!phoneNumber.startsWith('+')) {
            // Assuming country code is +84 (Vietnam) for example
            formattedPhoneNumber = '+84' + phoneNumber.replace(/^0+/, '');
        }

        // 2. Send OTP using Twilio Verify Service
        // add try catch to import twilio error
        try {
            const twilio = await import('twilio');
            const client = twilio.default(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            );

            await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
                .verifications
                .create({ to: formattedPhoneNumber, channel: 'sms' });
        } catch (error) {
            console.error("Twilio error:", error);
            return res.status(500).json({
                success: false, message: "Không thể gửi mã OTP. Vui lòng kiểm tra số điện thoại và thử lại."
            });
        }

        // 3. Response
        return res.status(200).json({
            success: true,
            message: "Mã OTP đã được gửi đến số điện thoại của bạn.",
        });
    } catch (error) {
        console.error("sendOTPUsingTwilio error:", error);
        return res.status(500).json({
            success: false, message: "Có lỗi xảy ra từ hệ thống, vui lòng thử lại sau."
        });
    }
}

// verify OTP using twilio :
export const verifyOTPUsingTwilio = async (req, res) => {
    try {
        const { phoneNumber, otpCode } = req.body || {};

        // 1. Validate input
        if (!phoneNumber || !otpCode) {
            return res.status(400).json({
                success: false, message: "Vui lòng nhập số điện thoại và mã OTP."
            });
        }
        // 2. Verify OTP using Twilio Verify Service
        let verificationCheck;
        try {
            const twilio = await import('twilio');
            const client = twilio.default(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            );

            verificationCheck = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
                .verificationChecks
                .create({ to: phoneNumber, code: otpCode });
        } catch (error) {
            // console.error("Twilio error:", error.message);
            return res.status(500).json({
                success: false, message: "Không thể xác minh mã OTP. Vui lòng thử lại."
            });
        }

        if (verificationCheck.status !== 'approved') {
            return res.status(400).json({
                success: false, message: "Mã OTP không hợp lệ hoặc đã hết hạn."
            });
        }

        // 3. Response
        return res.status(200).json({
            success: true,
            message: "Xác minh mã OTP thành công.",
        });
    } catch (error) {
        console.error("verifyOTPUsingTwilio error:", error);
        return res.status(500).json({
            success: false, message: "Có lỗi xảy ra từ hệ thống, vui lòng thử lại sau."
        });
    }
}