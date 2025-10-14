import { PutObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios'
import FormData from "form-data";
import s3, { getTemporaryImageUrl } from '../../utils/aws/s3.js';
import User from '../../models/User.js';

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
        console.error("Error verifying identify card ::", error.response?.data || error.message);
        return res.status(500).json({ message: error.response?.data?.errorMessage || error.message });
    }
};

export const check2FaceMatch = async (req, res) => {
    try {
        // check if user exist : 
        const user = await User.findOne({
            where: {
                user_id: req.user?.userId
            }
        });

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
            // const imageUrl = await getTemporaryImageUrl(fileName)
            // console.log("Uploaded to S3:", imageUrl);

        } catch (err) {
            console.error("Error uploading to S3:", err);
            return res.status(500).json({ message: "Upload to S3 failed" });
        }
        // save fileName to db : 
        user.driver_license_image_url = fileName
        user.driver_license_status = 'approved'
        // FIXME : do i need to save other field?

        await user.save()

        // return to client : 
        return res.status(200).json(response.data)

    } catch (error) {
        console.error("Error checking 2 face match :", error.response?.data || error.message);
        return res.status(500).json(error.response?.data);
    }
}