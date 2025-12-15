import { PutObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios'
import FormData from "form-data";
import s3, { getTemporaryImageUrl } from '../../utils/aws/s3.js';
import User from '../../models/User.js';
import { decryptWithSecret, encryptWithSecret } from '../../utils/cryptoUtil.js'
import db from '../../models/index.js';
import { Op } from 'sequelize';
import { v2 as cloudinary } from 'cloudinary';
import RegisterOwner from '../../models/RegisterOwner.js';
import { createCookie } from '../../utils/createCookie.js';

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
        // get type from query params : (typeOfDriverLicense is driver-license-for-motobike or driver-license-for-car )
        const typeOfDriverLicense = req.query.typeOfDriverLicense;
        if (!typeOfDriverLicense || (typeOfDriverLicense !== 'driver-license-for-motobike' && typeOfDriverLicense !== 'driver-license-for-car')) {
            return res.status(400).json({ message: 'type query parameter is required and must be either driver-license-for-motobike or driver-license-for-car' });
        }

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
        // sample response :
        //{
        //     "errorCode": 0,
        //     "errorMessage": "",
        //     "data": [{
        //         "id": "xxxx",
        //         "id_prob": "xxxx",
        //         "name": "xxxx",
        //         "name_prob": "xxxx",
        //         "dob": "xxxx",
        //         "dob_prob": "xxxx",
        //         "nation": "xxxx",
        //         "nation_prob": "xxxx",
        //         "address": "xxxx",
        //         "address_prob": "xxxx",
        //         "place_issue": "xxxx",
        //         "place_issue_prob": "xxxx",
        //         "date": "xxxx",
        //         "date_prob": "xxxx",
        //         "class": "xxxx",
        //         "class_prob": "xxxx",
        //         "doe": "xxxx",
        //         "doe_prob": "xxxx"
        //         "type": "xxxx"
        //     }]
        // }

        // class for motobike 	A1, A2, A3
        // class for car	B1, B2, C, D, E, F

        // if FPT ai can read data , but it is not a driver license : 
        const data = response.data.data?.[0];
        const isDriverLicense = data.class && data.place_issue && !data.sex && !data.nationality;

        if (!isDriverLicense) {
            return res.status(400).json({ message: 'Ảnh này không phải bằng lái xe hoặc bạn chụp chưa rõ' })
        }

        // check if type match class :
        const driverClass = data.class.toUpperCase();
        if (typeOfDriverLicense === 'driver-license-for-motobike') {
            const validMotobikeClasses = ['A1', 'A2', 'A3', 'A'];
            if (!validMotobikeClasses.includes(driverClass)) {
                return res.status(400).json({ message: `Bằng lái xe không phải hạng xe máy. Vui lòng tải lên bằng lái xe máy (hạng A1, A2, A3).` })
            }
        } else {
            const validCarClasses = ['B1', 'B2', 'C', 'D', 'E', 'F'];
            if (!validCarClasses.includes(driverClass)) {
                return res.status(400).json({ message: `Bằng lái xe không phải hạng ô tô. Vui lòng tải lên bằng lái xe ô tô (hạng B1, B2, C, D, E, F).` })
            }
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

        // get type from query params : (typeOfDriverLicense is driver-license-for-motobike or driver-license-for-car )
        const typeOfDriverLicense = req.query.typeOfDriverLicense;
        if (!typeOfDriverLicense || (typeOfDriverLicense !== 'driver-license-for-motobike' && typeOfDriverLicense !== 'driver-license-for-car')) {
            return res.status(400).json({ message: 'type query parameter is required and must be either driver-license-for-motobike or driver-license-for-car' });
        }

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
        // check type to save to correct field in db :
        if (typeOfDriverLicense === 'driver-license-for-motobike') {
            // save fileName to db :
            user.driver_license_image_url_for_motobike = fileName
            user.driver_license_status_for_motobike = 'approved'
            // hash and save other field for motobike:
            user.driver_license_number_for_motobike = encryptWithSecret(driverLicenseNumber, process.env.ENCRYPT_KEY)
            user.driver_license_name_for_motobike = encryptWithSecret(driverLicenseName, process.env.ENCRYPT_KEY)
            user.driver_license_dob_for_motobike = encryptWithSecret(driverLicenseDob, process.env.ENCRYPT_KEY)
            user.driver_class_for_motobike = driverLicenseClass
            await user.save()
            console.log("Saved driver license for motobike to db");
            // return to client :
            return res.status(200).json(response.data)
        } else {
            // save fileName to db :
            user.driver_license_image_url_for_car = fileName
            user.driver_license_status_for_car = 'approved'
            // hash and save other field for car:
            user.driver_license_number_for_car = encryptWithSecret(driverLicenseNumber, process.env.ENCRYPT_KEY)
            user.driver_license_name_for_car = encryptWithSecret(driverLicenseName, process.env.ENCRYPT_KEY)
            user.driver_license_dob_for_car = encryptWithSecret(driverLicenseDob, process.env.ENCRYPT_KEY)
            user.driver_class_for_car = driverLicenseClass
            await user.save()
            console.log("Saved driver license for car to db");
            // return to client :
            return res.status(200).json(response.data)
        }
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

// check if user is verify email :
export const checkIfUserIsVerifyEmail = async (req, res) => {
    try {
        // check if user exist :
        const user = await User.findOne({
            where: { user_id: req.user?.userId }
        });

        if (!user) {
            return res.status(400).json({ message: 'Không tìm thấy người dùng!' })
        }

        return res.status(200).json({ isVerifyEmail: user.email_verified });

    } catch (error) {
        console.error("Error checking if user is verify email :", error.message);
        return res.status(500).json({ message: error.message, isVerifyEmail: false });
    }
};

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
                // driver license for motobike : 
                "driver_class_for_motobike",
                "driver_license_image_url_for_motobike",
                "driver_license_dob_for_motobike",
                "driver_license_name_for_motobike",
                "driver_license_number_for_motobike",
                // driver license for car :
                "driver_license_image_url_for_car",
                "driver_license_dob_for_car",
                "driver_license_name_for_car",
                "driver_license_number_for_car",
                "driver_class_for_car",
                // 
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
        userData.driver_license_number_for_motobike = userData.driver_license_number_for_motobike
            ? decryptWithSecret(userData.driver_license_number_for_motobike, process.env.ENCRYPT_KEY)
            : null;

        userData.driver_license_dob_for_motobike = userData.driver_license_dob_for_motobike
            ? decryptWithSecret(userData.driver_license_dob_for_motobike, process.env.ENCRYPT_KEY)
            : null;

        userData.driver_license_name_for_motobike = userData.driver_license_name_for_motobike
            ? decryptWithSecret(userData.driver_license_name_for_motobike, process.env.ENCRYPT_KEY)
            : null;

        userData.driver_license_image_url_for_motobike = userData.driver_license_image_url_for_motobike
            ? await getTemporaryImageUrl(userData.driver_license_image_url_for_motobike)
            : null;

        // for car :
        userData.driver_license_number_for_car = userData.driver_license_number_for_car
            ? decryptWithSecret(userData.driver_license_number_for_car, process.env.ENCRYPT_KEY)
            : null;
        userData.driver_license_dob_for_car = userData.driver_license_dob_for_car
            ? decryptWithSecret(userData.driver_license_dob_for_car, process.env.ENCRYPT_KEY)
            : null;
        userData.driver_license_name_for_car = userData.driver_license_name_for_car

            ? decryptWithSecret(userData.driver_license_name_for_car, process.env.ENCRYPT_KEY)
            : null;
        userData.driver_license_image_url_for_car = userData.driver_license_image_url_for_car
            ? await getTemporaryImageUrl(userData.driver_license_image_url_for_car)
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
export const sendOTPUsingMoceanForUpdatePhoneNumber = async (req, res) => {
    try {
        const { phoneNumber } = req.body || {};

        // 0. get user : 
        const user = await db.User.findOne({
            where: {
                user_id: req.user?.userId
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Không tìm thấy người dùng cho số điện thoại này theo id=' + req.user?.userId + '!' })
        }

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

        console.log("usersWithPhoneNumber:", usersWithPhoneNumber);

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
        // 5. create otp and save to db resetPasswordToken field :
        // generate 6 digit otp : 
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log("Generated OTP:", otp);
        // save otp to db in resetPasswordToken field :

        user.resetPasswordToken = otp;
        user.phone_number = encryptWithSecret(formattedPhoneNumber, process.env.ENCRYPT_KEY);
        await user.save();

        console.log('user : ', user.user_id, user.phone_number, user.resetPasswordToken);

        // user.phoneNumber
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
    } catch (error) {
        console.error("sendOTPUsingMoceanForUpdatePhoneNumber error:", error);
        return res.status(500).json({
            success: false, message: "Có lỗi xảy ra từ hệ thống, vui lòng thử lại sau."
        });
    }
}

// verify OTP using twilio :
export const verifyOTPUsingMoceanForUpdatePhoneNumber = async (req, res) => {
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

        // 2. Verify OTP using MoceanSMS Verify Service
        // 6. if otp is valid :
        if (user.resetPasswordToken === otpCode) {
            // 5. update user phone_verified to true
            try {
                user.phone_verified = true;
                user.resetPasswordToken = null; // clear otp
                await user.save();

                // create cookie
                createCookie(res, user.user_id, user.role, user.avatar_url, user.email);

                return res.status(200).json({
                    success: true,
                    message: "Xác minh số điện thoại thành công!",
                    phone_number: formattedPhoneNumber
                });

            } catch (error) {
                console.error("Verify phone number error:", error);
                return res.status(500).json({
                    success: false, message: "Lỗi hệ thống, vui lòng thử lại sau!"
                });
            }

        }
    } catch (error) {
        console.error("verifyOTPUsingMoceanForUpdatePhoneNumber error:", error);
        return res.status(500).json({
            success: false, message: "Có lỗi xảy ra từ hệ thống, vui lòng thử lại sau."
        });
    }
}

// check if user is verify identity card :
export const checkIfUserIsVerifyIdentityCard = async (req, res) => {
    try {
        // check if user exist :
        const user = await User.findOne({
            where: { user_id: req.user?.userId }
        });

        if (!user) {
            return res.status(400).json({ message: 'Không tìm thấy người dùng!' })
        }

        const isVerified = !!user.national_id_number;

        return res.status(200).json({ isVerifyIdentityCard: isVerified });

    } catch (error) {
        console.error("Error checking if user is verify identity card :", error.message);
        return res.status(500).json({ message: error.message, isVerifyIdentityCard: false });
    }
}

// check if user register bank account :
export const checkIfUserRegisterBankAccount = async (req, res) => {


    // const Bank = sequelize.define( 
    //   "Bank",
    //   {
    //     bank_id: {
    //       type: DataTypes.BIGINT.UNSIGNED,
    //       primaryKey: true,
    //       autoIncrement: true,
    //     },
    //     user_id: {
    //       type: DataTypes.BIGINT.UNSIGNED,
    //       allowNull: false,
    //       references: {
    //         model: "users", // table name
    //         key: "user_id",
    //       },
    //       onDelete: "CASCADE",
    //     },
    try {
        // check if user exist :
        const user = await User.findOne({
            where: { user_id: req.user?.userId }
        });

        if (!user) {
            return res.status(400).json({ message: 'Không tìm thấy người dùng!' })
        }

        const bankAccount = await db.Bank.findOne({
            where: { user_id: user.user_id }
        });

        const isRegisterBankAccount = !!bankAccount;

        return res.status(200).json({ isRegisterBankAccount: isRegisterBankAccount });

    } catch (error) {
        console.error("Error checking if user register bank account :", error.message);
        return res.status(500).json({ message: error.message, isRegisterBankAccount: false });
    }
}

// check if this user is already request to become owner :

// import { DataTypes } from "sequelize";
// import sequelize from "../config/db.js";

// const RegisterOwner = sequelize.define(
//   "RegisterOwner",
//   {
//     register_owner_id: {
//       type: DataTypes.BIGINT.UNSIGNED,
//       primaryKey: true,
//       autoIncrement: true,
//     },
//     user_id: {
//       type: DataTypes.BIGINT.UNSIGNED,
//       allowNull: false,
//       references: {
//         model: "users", // table name
//         key: "user_id",
//       },
//     },
//     status: {
//       type: DataTypes.ENUM("pending", "approved", "rejected"),
//       defaultValue: "pending",
//     },
export const checkStatusForRequestToBecomeOwner = async (req, res) => {
    try {
        // check if user exist :
        const user = await User.findOne({
            where: { user_id: req.user?.userId }
        });

        if (!user) {
            return res.status(400).json({ message: 'Không tìm thấy người dùng!' })
        }

        // check user_id and get status :
        const registerOwnerRequest = await RegisterOwner.findOne({
            where: {
                user_id: user.user_id,
            }
        });

        if (!registerOwnerRequest) {
            return res.status(200).json({ status: "no_request" });
        }

        return res.status(200).json({ status: registerOwnerRequest.status, reason_rejected: registerOwnerRequest.reason_rejected || null });

    } catch (error) {
        console.error("Error checking status for request to become owner :", error.message);
        return res.status(500).json({ message: error.message });
    }
}

// check if user is is_agree_to_terms :
export const checkIfUserIsAgreeToTerms = async (req, res) => {
    try {
        // check if user exist :
        const user = await User.findOne({
            where: { user_id: req.user?.userId }
        });

        if (!user) {
            return res.status(400).json({ message: 'Không tìm thấy người dùng!' })
        }

        // check user_id and get is_agree_to_terms :
        const registerOwnerRequest = await RegisterOwner.findOne({
            where: {
                user_id: user.user_id,
            }
        });

        const isAgreeToTerms = registerOwnerRequest ? registerOwnerRequest.is_agree_to_terms : false;

        return res.status(200).json({ isAgreeToTerms: isAgreeToTerms });

    } catch (error) {
        console.error("Error checking if user is agree to terms :", error.message);
        return res.status(500).json({ message: error.message });
    }
}

// agreeToTerms
export const agreeToTerms = async (req, res) => {
    try {
        // check if user exist :
        const user = await User.findOne({
            where: { user_id: req.user?.userId }
        });

        if (!user) {
            return res.status(400).json({ message: 'Không tìm thấy người dùng!' })
        }

        // check user_id and update is_agree_to_terms :
        let registerOwnerRequest = await RegisterOwner.findOne({
            where: {
                user_id: user.user_id,
            }
        });

        if (!registerOwnerRequest) {
            // create new request if not exist
            registerOwnerRequest = await RegisterOwner.create({
                user_id: user.user_id,
                is_agree_to_terms: true,
                status: 'pending'
            });
        } else {
            registerOwnerRequest.is_agree_to_terms = true;
            await registerOwnerRequest.save();
        }

        return res.status(200).json({ message: 'Đã đồng ý với các điều khoản.' });

    } catch (error) {
        console.error("Error agreeing to terms :", error.message);
        return res.status(500).json({ message: error.message });
    }
}

// send request to become owner :
export const sendRequestToBecomeOwner = async (req, res) => {
    try {
        // check if user exist :
        const user = await User.findOne({
            where: { user_id: req.user?.userId }
        });

        if (!user) {
            return res.status(400).json({ message: 'Không tìm thấy người dùng!' })
        }

        // check if user already has a pending request
        const existingRequest = await RegisterOwner.findOne({
            where: {
                user_id: user.user_id,
                status: 'pending'
            }
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'Bạn đã có một yêu cầu đang chờ xử lý.' });
        }

        // create new request
        await RegisterOwner.create({
            user_id: user.user_id,
            status: 'pending'
        });

        return res.status(200).json({ message: 'Yêu cầu trở thành chủ xe đã được gửi thành công.' });
    } catch (error) {
        console.error("Error sending request to become owner :", error.message);
        return res.status(500).json({ message: error.message });
    }
}
