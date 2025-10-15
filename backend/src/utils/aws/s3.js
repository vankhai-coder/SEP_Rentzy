import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const getTemporaryImageUrl = async (fileName) => {
    const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName
    });

    // URL expires in 5 minutes
    const url = await getSignedUrl(s3, command, { expiresIn: 300 });
    return url;
}
export {getTemporaryImageUrl}
export default s3