import axios from 'axios'
import FormData from "form-data";

export const verifyDriverLicense = async (req, res) => {
    try {
        if (!req.file) return res.status(400).send("No file uploaded!");

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

        console.log(" FPT.AI Response:", response.data);
        return res.json(response.data);

    } catch (error) {
        console.error("Error verifying driver license:", error.message);
        return res.status(500).json({ error: error.message });
    }
};
