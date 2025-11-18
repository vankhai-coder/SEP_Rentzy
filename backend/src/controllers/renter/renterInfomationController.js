import { PutObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios'
import FormData from "form-data";
import s3, { getTemporaryImageUrl } from '../../utils/aws/s3.js';
import User from '../../models/User.js';
import { decryptWithSecret, encryptWithSecret } from '../../utils/cryptoUtil.js'
import db from '../../models/index.js';
import { Op } from 'sequelize';
import { v2 as cloudinary } from 'cloudinary';

// Helper function to safely decrypt phone number
const safeDecryptPhoneNumber = (encryptedPhone) => {
    try {
        // Check if the data looks like valid Base64
        if (!encryptedPhone || typeof encryptedPhone !== 'string') {
            return null;
        }

        // Basic Base64 validation
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(encryptedPhone)) {
            console.warn('Phone number is not valid Base64, might be unencrypted:', encryptedPhone);
            return encryptedPhone; // Return as-is if not encrypted
        }

        // Try to decode Base64 to check if it has the right structure
        const decoded = Buffer.from(encryptedPhone, 'base64');
        if (decoded.length < 44) { // salt(16) + iv(12) + tag(16) = 44 minimum
            console.warn('Encrypted phone data too short, might be unencrypted:', encryptedPhone);
            return encryptedPhone; // Return as-is if structure is wrong
        }

        // Attempt decryption
        return decryptWithSecret(encryptedPhone, process.env.ENCRYPT_KEY);
    } catch (error) {
        console.error('Failed to decrypt phone number:', error.message);
        console.warn('Returning phone number as-is, might be unencrypted data');
        return encryptedPhone; // Return original value if decryption fails
    }
};

export const verifyDriverLicenseCard = async (req, res) => {
    try {

        if (!req.file) return res.status(400).json({ message: 'No file send!' });

        //  Create form-data to send image correctly
        const formData = new FormData();
        formData.append("image", req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        //  Send to FPT.AI
        const response = await axios.post(
            "https://api.fpt.ai/vision/dlr/vnm",
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    "api-key": process.env.FPT_AI_API_KEY,
                },
                maxBodyLength: Infinity,
            }
        );
        // if FPT ai can read data , but it is not a driver license : 
        const data = response.data.data?.[0];
        const isDriverLicense = data.class && data.place_issue && !data.sex && !data.nationality;

        if (!isDriverLicense) {
            return res.status(400).json({ message: 'Ảnh này không phải bằng lái xe hoặc bạn chụp chưa rõ' })
        }

        // if success : 
        console.log(" FPT.AI Response success :", response.data);

        return res.json(response.data);

    } catch (error) {
        console.error("Error verifying driver license card :", error.response?.data || error.message);
        return res.status(500).json({ message: error.response?.data?.errorMessage || error.message });
    }
};

export const verifyIdentityCard = async (req, res) => {
    try {
        if (!req.file) return res.status(400).send("No file uploaded!");

        //  Create form-data to send image correctly
        const formData = new FormData();
        formData.append("image", req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });
        console.log(process.env.FPT_AI_API_KEY);

        //  Send to FPT.AI
        const response = await axios.post(
            "https://api.fpt.ai/vision/idr/vnm",
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    "api-key": process.env.FPT_AI_API_KEY,
                },
                maxBodyLength: Infinity,
            }
        );

        // if FPT ai can read data , but it is not a identify card : 
        const data = response.data.data?.[0];
        const isDriverLicense = data.sex && data.nationality

        if (!isDriverLicense) {
            return res.status(400).json({ message: 'Ảnh này không phải căn cước công dân hoặc bạn chụp chưa rõ' })
        }

        // if success : 
        console.log(" FPT.AI Response for verify cccd :", response.data);

        return res.json(response.data);

    } catch (error) {
        console.error("Error verifying identify card :", error.response?.data || error.message);
        return res.status(500).json({ message: error.response?.data?.errorMessage || error.message });
    }
};

// check 2 face match and save driver license to aws s3 :
export const check2FaceMatchAndSaveDriverLicenseToAWS = async (req, res) => {
    try {
        // check if user exist : 
        const user = await User.findOne({
            where: {
                user_id: req.user?.userId
            }
        });

        const { driverLicenseName, driverLicenseDob, driverLicenseNumber, driverLicenseClass } = req.query;
        // Check if any parameter is missing
        if (!driverLicenseName || !driverLicenseDob || !driverLicenseNumber || !driverLicenseClass) {
            return res.status(400).json({
                error: true,
                message: "Missing required query parameters: driverLicenseName, driverLicenseDob,driverLicenseClass, driverLicenseNumber",
            });
        }

        if (!user) {
            return res.status(400).json({ message: 'Không tìm thấy người dùng!' })
        }

        if (!req.files) {
            return res.status(400).json({ message: "No files were uploaded!" });
        }

        const image_1 = req.files['image_1']?.[0]
        const image_2 = req.files['image_2']?.[0]

        if (!image_1 || !image_2) {
            return res.status(400).json({ message: "Both images are required!" });
        }
        // add 2 image to formData : 
        const formData = new FormData();
        formData.append("file[]", image_1.buffer, {
            filename: image_1.originalname,
            contentType: image_1.mimetype,
        });
        formData.append("file[]", image_2.buffer, {
            filename: image_2.originalname,
            contentType: image_2.mimetype,
        });

        // send to FPT AI to check if 2 image is come from same person : 
        const response = await axios.post(
            "https://api.fpt.ai/dmp/checkface/v1",
            formData,
            {
                headers: {
                    "api_key": process.env.FPT_AI_API_KEY,
                    ...formData.getHeaders(),
                },
            }
        );

        // check if match : 
        // sample response :
        // {
        //     "code" : "200",
        //     "data" : {
        //         "isMatch": false,
        //         "similarity": 21.25160789489746,
        //         "isBothImgIDCard": false
        //     },
        //     "message": "request successful."
        // }    

        const isMatch = response?.data?.data?.isMatch
        if (!isMatch) {
            return res.status(400).json({ message: 'Ảnh chân dung không khớp với ảnh trên bằng lái xe. Vui lòng thử lại!' })
        }

        // save image to aws s3 server : 
        // Generate unique file name
        const fileName = `driver-licenses/${Date.now()}-${image_1.originalname}`;

        const uploadParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: fileName,
            Body: image_1.buffer,
            ContentType: image_1.mimetype,
            ACL: "private", // keep it private
        };

        try {
            await s3.send(new PutObjectCommand(uploadParams));

            // Create a short-lived signed URL :
            const imageUrl = await getTemporaryImageUrl(fileName)
            console.log("Uploaded to S3:", imageUrl);

        } catch (err) {
            console.error("Error uploading to S3:", err);
            return res.status(500).json({ message: "Upload to S3 failed" });
        }
        // save fileName to db : 
        user.driver_license_image_url = fileName
        user.driver_license_status = 'approved'
        // hash and save other field : 
        user.driver_license_number = encryptWithSecret(driverLicenseNumber, process.env.ENCRYPT_KEY)
        user.driver_license_name = encryptWithSecret(driverLicenseName, process.env.ENCRYPT_KEY)
        user.driver_license_dob = encryptWithSecret(driverLicenseDob, process.env.ENCRYPT_KEY)
        user.driver_class = driverLicenseClass

        await user.save()

        // return to client : 
        return res.status(200).json(response.data)

    } catch (error) {
        console.error("Error checking 2 face match :", error.response?.data || error.message);
        return res.status(500).json(error.response?.data);
    }
}

// check 2 face match and save identity card to aws s3 :
export const check2FaceMatchAndSaveIdentityCardToAWS = async (req, res) => {
    try {
        // check if user exist : 
        const user = await User.findOne({
            where: {
                user_id: req.user?.userId
            }
        });

        const { identityName, identityDob, identityNumber } = req.body;
        // Check if any parameter is missing
        if (!identityName || !identityDob || !identityNumber) {
            return res.status(400).json({
                error: true,
                message: "Missing required query parameters: identityName, identityDob, identityNumber",
            });
        }

        if (!user) {
            return res.status(400).json({ message: 'Không tìm thấy người dùng!' })
        }

        if (!req.files) {
            return res.status(400).json({ message: "No files were uploaded!" });
        }

        const image_1 = req.files['image_1']?.[0]
        const image_2 = req.files['image_2']?.[0]

        if (!image_1 || !image_2) {
            return res.status(400).json({ message: "Both images are required!" });
        }
        // add 2 image to formData : 
        const formData = new FormData();
        formData.append("file[]", image_1.buffer, {
            filename: image_1.originalname,
            contentType: image_1.mimetype,
        });
        formData.append("file[]", image_2.buffer, {
            filename: image_2.originalname,
            contentType: image_2.mimetype,
        });

        // send to FPT AI to check if 2 image is come from same person : 
        const response = await axios.post(
            "https://api.fpt.ai/dmp/checkface/v1",
            formData,
            {
                headers: {
                    "api_key": process.env.FPT_AI_API_KEY,
                    ...formData.getHeaders(),
                },
            }
        );

        // check if match : 
        // sample response :
        // {
        //     "code" : "200",
        //     "data" : {
        //         "isMatch": false,
        //         "similarity": 21.25160789489746,
        //         "isBothImgIDCard": false
        //     },
        //     "message": "request successful."
        // }    

        const isMatch = response?.data?.data?.isMatch
        if (!isMatch) {
            return res.status(400).json({ message: 'Ảnh chân dung không khớp với ảnh trên căn cước công dân. Vui lòng thử lại!' })
        }

        // save image to aws s3 server : 
        // Generate unique file name
        const fileName = `identity-cards/${Date.now()}-${image_1.originalname}`;

        const uploadParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: fileName,
            Body: image_1.buffer,
            ContentType: image_1.mimetype,
            ACL: "private", // keep it private
        };

        try {
            // await s3.send(new PutObjectCommand(uploadParams));

            // // Create a short-lived signed URL :
            // const imageUrl = await getTemporaryImageUrl(fileName)
            // console.log("Uploaded to S3:", imageUrl);

            // console log : 
            console.log("Simulating upload to S3 , upload to aws success :)) :", fileName);

        } catch (err) {
            console.error("Error uploading to S3:", err);
            return res.status(500).json({ message: "Upload to S3 failed" });
        }
        // save fileName to db : 
        user.national_id_image_url = fileName
        user.national_id_status = 'approved'
        // hash and save other field : 
        user.national_id_number = encryptWithSecret(identityNumber, process.env.ENCRYPT_KEY)
        user.national_id_name = encryptWithSecret(identityName, process.env.ENCRYPT_KEY)
        user.national_id_dob = encryptWithSecret(identityDob, process.env.ENCRYPT_KEY)

        await user.save()

        // return to client : 
        return res.status(200).json(response.data)

    } catch (error) {
        console.error("Error checking 2 face match :", error.response?.data || error.message);
        return res.status(500).json(error.response?.data);
    }
};

// update full name  : 
export const updateFullName = async (req, res) => {
    try {
        const { fullName } = req.body;

        // check if fullName is provided
        if (!fullName || fullName.trim() === '') {
            return res.status(400).json({ message: 'Vui lòng cung cấp tên đầy đủ hợp lệ!' });
        }

        // check if user exist : 
        const user = await User.findOne({
            where: {
                user_id: req.user?.userId
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Không tìm thấy người dùng!' })
        }

        user.full_name = fullName;
        await user.save();

        return res.status(200).json({ message: 'Cập nhật tên thành công!', fullName: user.full_name });

    } catch (error) {
        console.error("Error updating full name :", error.message);
        return res.status(500).json({ message: error.message });
    }
}

// get basic user information :
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

        // Safe phone number decryption with validation
        userData.phone_number = userData.phone_number
            ? safeDecryptPhoneNumber(userData.phone_number)
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
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(400).json({ message: 'Không thể tìm thấy người dùng!' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Không tìm thấy avatar đăng lên!' });
        }

        // Configure Cloudinary
        cloudinary.config({
            cloud_name: process.env.CLOUD_NAME,
            api_key: process.env.CLOUD_API_KEY,
            api_secret: process.env.CLOUD_API_SECRET,
        });

        const fileBuffer = req.file.buffer;

        // Get current user info (to delete old avatar if exists)
        const user = await db.User.findOne({ where: { user_id: userId } });

        // Upload the new avatar (wrap upload_stream in a Promise)
        const result = await new Promise((resolve, reject) => {
            console.log('Uploading avatar to Cloudinary...');
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: 'avatars',
                    public_id: `avatar_user_${userId}_${Date.now()}`,
                    overwrite: true,
                    resource_type: 'image',
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );

            // send file buffer to the stream
            stream.end(fileBuffer);
        });

        // Delete old avatar from Cloudinary (if exists)
        if (user?.avatar_public_id) {
            try {
                console.log('Deleting old avatar from Cloudinary...');
                await cloudinary.uploader.destroy(user.avatar_public_id);
                console.log('Old avatar deleted from Cloudinary');
            } catch (err) {
                console.warn('Failed to delete old avatar:', err);
            }
        }

        // Update user in DB
        await db.User.update(
            {
                avatar_url: result.secure_url,
                avatar_public_id: result.public_id,
            },
            { where: { user_id: userId } }
        );

        return res.status(200).json({
            success: true,
            message: 'Cập nhật avatar thành công!',
            avatarUrl: result.secure_url,
        });
    } catch (err) {
        console.error('Error in updateAvatarToCloudinary:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// sending otp using twilio :
export const sendOTPUsingTwilioForUpdatePhoneNumber = async (req, res) => {
    try {
        const { phoneNumber } = req.body || {};

        // 1. Validate input
        if (!phoneNumber) {
            return res.status(400).json({
                success: false, message: "Vui lòng nhập số điện thoại."
            });
        }
        // 1.2 format phone number to E.164 format if needed (assuming input is in local format)
        let formattedPhoneNumber = phoneNumber;
        if (!phoneNumber.trim().startsWith('+84')) {
            // Assuming country code is +84 (Vietnam) for example
            formattedPhoneNumber = '+84' + phoneNumber.replace(/^0+/, '');
        }

        // 1.1 check if phone number is already in use by another user :
        // unHash phone number to compare :
        // get all users with phone number not null and phone_verified = true  : 
        const usersWithPhoneNumber = await db.User.findAll({
            where: {
                phone_number: { [Op.ne]: null },
                phone_verified: true,
                user_id: { [Op.ne]: req.user?.userId } // exclude current user
            }
        });
        for (const user of usersWithPhoneNumber) {
            if (user.phone_number) {
                const decryptedPhoneNumber = decryptWithSecret(user.phone_number, process.env.ENCRYPT_KEY);
                if (decryptedPhoneNumber === formattedPhoneNumber) {
                    return res.status(400).json({
                        success: false, message: "Số điện thoại này đã được sử dụng!"
                    });
                }
            }
        }

        // log : 
        console.log("Sending OTP to phone number:", formattedPhoneNumber);

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
        console.error("sendOTPUsingTwilioForUpdatePhoneNumber error:", error);
        return res.status(500).json({
            success: false, message: "Có lỗi xảy ra từ hệ thống, vui lòng thử lại sau."
        });
    }
}

// verify OTP using twilio :
export const verifyOTPUsingTwilioForUpdatePhoneNumber = async (req, res) => {
    try {
        // check if user exist : 
        const user = await db.User.findOne({
            where: {
                user_id: req.user?.userId
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Không tìm thấy người dùng!' })
        }

        const { phoneNumber, otpCode } = req.body || {};

        // 1. Validate input
        if (!phoneNumber || !otpCode) {
            return res.status(400).json({
                success: false, message: "Vui lòng nhập số điện thoại và mã OTP."
            });
        }

        // 1.1 format phone number to E.164 format if needed (assuming input is in local format)
        let formattedPhoneNumber = phoneNumber;
        if (!phoneNumber.startsWith('+')) {
            // Assuming country code is +84 (Vietnam) for example
            formattedPhoneNumber = '+84' + phoneNumber.replace(/^0+/, '');
        }

        // log : 
        console.log("Verifying OTP for phone number:", formattedPhoneNumber, "with OTP:", otpCode);

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
                .create({ to: formattedPhoneNumber, code: otpCode });
        } catch (error) {
            console.error("Twilio error:", error.message);
            return res.status(500).json({
                success: false, message: "Không thể xác minh mã OTP. Vui lòng thử lại."
            });
        }

        if (verificationCheck.status !== 'approved') {
            return res.status(400).json({
                success: false, message: "Mã OTP không hợp lệ hoặc đã hết hạn."
            });
        }

        // 2.1 save phone number to user db
        // encrypt phone number before save to db
        const encryptedPhoneNumber = encryptWithSecret(formattedPhoneNumber, process.env.ENCRYPT_KEY)
        user.phone_number = encryptedPhoneNumber
        user.phone_verified = true

        await user.save()

        // 3. Response
        return res.status(200).json({
            success: true,
            message: "Xác minh mã OTP thành công.",
            phone_number: formattedPhoneNumber
        });
    } catch (error) {
        console.error("verifyOTPUsingTwilioForUpdatePhoneNumber error:", error);
        return res.status(500).json({
            success: false, message: "Có lỗi xảy ra từ hệ thống, vui lòng thử lại sau."
        });
    }
}