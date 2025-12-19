import { Op, Sequelize } from "sequelize";
import Message from "../../models/Message.js";
import User from "../../models/User.js";
import { sendToUser } from '../../../src/services/wsService.js'
// GET latest chat messages for each conversation partner of a specific user
export const getLatestMessagesForUser = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(400).json({ error: "Yêu cầu ID người dùng" });
        }

        const latestMessages = await Message.findAll({
            where: {
                [Op.or]: [
                    { sender_id: userId },
                    { receiver_id: userId }
                ]
            },
            attributes: [
                "message_id",
                "sender_id",
                "receiver_id",
                "content",
                "created_at",
                [
                    Sequelize.literal(`
            CASE 
              WHEN sender_id = ${userId} THEN receiver_id 
              ELSE sender_id 
            END
          `),
                    "partner_id"
                ]
            ],
            include: [
                {
                    model: User,
                    as: "sender",
                    attributes: ["user_id", "full_name", "email", "avatar_url"]
                },
                {
                    model: User,
                    as: "receiver",
                    attributes: ["user_id", "full_name", "email", "avatar_url"]
                }
            ],
            order: [["created_at", "DESC"]],
        });

        const seenPartners = new Set();
        const latestPerPartner = [];

        for (const msg of latestMessages) {
            const partnerId = msg.get("partner_id");
            if (!seenPartners.has(partnerId)) {
                seenPartners.add(partnerId);

                const partner =
                    msg.sender_id === userId ? msg.receiver : msg.sender;

                latestPerPartner.push({
                    partner_id: partner.user_id,
                    latestContent: msg.content,
                    created_at: msg.created_at,
                    full_name: partner.full_name,
                    email: partner.email,
                    avatar_url: partner.avatar_url
                });
            }
        }

        res.status(200).json(latestPerPartner);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch latest messages" });
    }
};

// GET full conversation between the user and a specific partner
export const getConversationWithPartner = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        const { partnerId } = req.params;
        if (!partnerId) {
            return res.status(400).json({ error: "Partner ID is required" });
        }

        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { sender_id: userId, receiver_id: partnerId },
                    { sender_id: partnerId, receiver_id: userId }
                ]
            },
            order: [["created_at", "ASC"]]
        });

        // Transform into simplified array
        const formatted = messages.map(msg => {
            if (msg.sender_id === userId) {
                return {
                    ownContent: msg.content,
                    partnerContent: null,
                    created_at: msg.created_at
                };
            } else {
                return {
                    ownContent: null,
                    partnerContent: msg.content,
                    created_at: msg.created_at
                };
            }
        });

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch conversation" });
    }
};

export const sendMessageToPartner = async (req, res) => {
    try {
        const userId = req.user.userId;

        const { partnerId, content, message_type } = req.body || {};

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        if (!partnerId) {
            return res.status(400).json({ error: "Partner ID is required" });
        }
        if (!content || content.trim() === "") {
            return res.status(400).json({ error: "Message content or attachment is required" });
        }

        const newMessage = await Message.create({
            sender_id: userId,
            receiver_id: partnerId,
            content: content || "",
            message_type: message_type || "text",
            attachment_url: null,
            is_read: false,
            created_at: new Date()
        });
        console.log('send to userId:', partnerId);
        // send websocket notification to partnerId here if needed
        sendToUser(partnerId, {
            type: "NEW_MESSAGE",
            message: {
                message_id: newMessage.message_id,
                sender_id: newMessage.sender_id,
                receiver_id: newMessage.receiver_id,
                content: newMessage.content,
                created_at: newMessage.created_at
            }
        });
        return res.status(201).json({
            success: true,
            message: {
                message_id: newMessage.message_id,
                sender_id: newMessage.sender_id,
                receiver_id: newMessage.receiver_id,
                content: newMessage.content,
                message_type: newMessage.message_type,
                attachment_url: newMessage.attachment_url,
                created_at: newMessage.created_at
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to send message" });
    }
};



