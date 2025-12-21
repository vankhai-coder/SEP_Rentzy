import { Op } from "sequelize";
import Voucher from "../../models/Voucher.js";

export const getVoucherManagementStats = async (req, res) => {
    try {
        const now = new Date();

        const userId = req.user?.userId 
        if(!userId){
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const [
            totalVouchers,
            activeVouchers,
            expiredVouchers,
            notStartYet,
        ] = await Promise.all([
            // 1. total vouchers with created_by = userId
            Voucher.count({
                where: {
                    created_by: userId
                }
            }),

            // Voucher.count(),

            // 2. active (started, not expired, active)
            Voucher.count({
                where: {
                    is_active: true,
                    valid_from: { [Op.lte]: now },
                    valid_to: { [Op.gte]: now },
                    created_by : userId
                }
            }),

            // 3. expired
            Voucher.count({
                where: {
                    [Op.or]: [
                        { valid_to: { [Op.lt]: now } },
                        { is_active: false },
                    ] ,
                    created_by : userId
                }
            }),

            // 4. not started yet
            Voucher.count({
                where: {
                    valid_from: { [Op.gt]: now },
                    created_by : userId
                }
            }),
        ]);

        return res.status(200).json({
            totalVouchers,
            activeVouchers,
            expiredVouchers,
            notStartYet,
        });
    } catch (error) {
        console.error("Error in getVoucherManagementStats:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getVouchersWithFilter = async (req, res) => {
    try {
        // userId : 
        const userId = req.user?.userId 
        if(!userId){
            return res.status(400).json({ message: "Invalid user ID" });
        }
        // useQuery in frontend will send request like :
        // const response = await axiosInstance.get('/api/admin/owner-approval/requests', {
        //     params: {
        //         nameOrDescOrCodeOrTitle: searchFilter.nameOrDescOrCodeOrTitle,
        //         discountType: searchFilter.discountType,
        //         isActive: searchFilter.isActive,
        //         validFrom: searchFilter.validFrom,
        //         validTo: searchFilter.validTo,
        //         page: currentPage,
        //         limit: limitPerPage,
        //     }
        // });
        const { nameOrDescOrCodeOrTitle, discountType, isActive,
            validFrom, validTo, page = 1, limit = 10 } = req.query;

        const whereClause = {};
        whereClause.created_by = userId;
        if (nameOrDescOrCodeOrTitle && nameOrDescOrCodeOrTitle.trim()) {
            whereClause[Op.or] = [
                { description: { [Op.like]: `%${nameOrDescOrCodeOrTitle.trim()}%` } },
                { title: { [Op.like]: `%${nameOrDescOrCodeOrTitle.trim()}%` } },
                { code: { [Op.like]: `%${nameOrDescOrCodeOrTitle.trim()}%` } },
            ];
        }

        if (discountType) {
            // check role is either : AMOUNT or PERCENT
            if (discountType === 'AMOUNT' || discountType === 'PERCENT') {
                whereClause.discount_type = discountType;
            }
        }

        if (isActive) {
            // check if isActive is either 'true' or 'false'
            whereClause.is_active = isActive === 'true' ? true : false;
        }

        // TODO : validFrom, validTo
        if (validFrom) {
            // check if validFrom is a valid date follow format YYYY-MM-DD HH:mm:ss
            const validFromDate = new Date(validFrom);
            if (!isNaN(validFromDate)) {
                whereClause.valid_from = { [Op.gte]: validFromDate };
            }
        }

        if (validTo) {
            const validToDate = new Date(validTo);
            if (!isNaN(validToDate)) {
                whereClause.valid_to = { [Op.lte]: validToDate };
            }
        }

        const offset = (page - 1) * limit;

        const { rows: vouchers, count: totalVouchers } = await Voucher.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            //  TODO : add filter order : 
            order: [['created_at', 'DESC']],
        });

        const totalPages = Math.ceil(totalVouchers / limit);

        res.status(200).json({
            vouchers,
            totalPages
        });

    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// function to ban or unban voucher : is_active field to false or true , req.body = { voucher_id, is_active: "true" or "false" }
export const toggleVoucherActiveStatus = async (req, res) => {
    try {
        const { voucher_id, is_active } = req.body || {};

        // validate voucher_id and is_active
        if (!voucher_id || !["true", "false"].includes(is_active)) {
            return res.status(400).json({ message: "Invalid voucher_id or is_active value" });
        }
        console.log("Toggling voucher_id:", voucher_id, "to is_active:", is_active);

        const voucher = await Voucher.findByPk(voucher_id);
        if (!voucher) {
            return res.status(404).json({ message: `Voucher not found for voucher_id : ${voucher_id}` });
        }

        voucher.is_active = is_active === 'true' ? true : false;
        await voucher.save();

        return res.status(200).json({ message: `Voucher has been ${voucher.is_active ? 'activated' : 'deactivated'}` });
    } catch (error) {
        console.error("Error toggling voucher active status:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// create voucher : 
export const createVoucher = async (req, res) => {
    // frontend will send req.body like :
    //  const payload = {
    //   code: voucherCode,
    //   title: voucherTitle,
    //   description: voucherDescription,
    //   discount_type: discountType,
    //   discount_value: Number(discountValue.toString().replace(/,/g, "")),
    //   min_order_amount: Number(minBookingAmount.toString().replace(/,/g, "")),
    //   max_discount: discountType === 'PERCENT' ? Number(maxDiscount.toString().replace(/,/g, "")) : null,
    //   valid_from: formatVietnamDateForBackend(dateForValidFrom),
    //   valid_to: formatVietnamDateForBackend(dateForValidTo),
    //   usage_limit: Number(usageLimit.toString().replace(/,/g, "")),
    //   // TODO : add image upload feature later
    //   image_url: null,
    // };

    // validate input fields here if needed

    try {

        const {
            code,
            title,
            description, // optional
            discount_type,
            discount_value,
            min_order_amount,
            max_discount,
            valid_from,
            valid_to,
            usage_limit,
            image_url, // TODO : implement image upload later
        } = req.body || {};

        // validate required fields
        // validate code : 
        if (!code || code.trim() === "") {
            return res.status(400).json({ message: "Voucher code is required" });
        }
        // validate title : 
        if (!title || title.trim() === "") {
            return res.status(400).json({ message: "Voucher title is required" });
        }
        // validate discount_type : 
        if (!["PERCENT", "AMOUNT"].includes(discount_type)) {
            return res.status(400).json({ message: "Invalid discount type , must be either 'PERCENT' or 'AMOUNT'" });
        }
        // validate discount_value : 
        if (isNaN(discount_value) || Number(discount_value) <= 0) {
            return res.status(400).json({ message: "Invalid discount value , must be a positive number" });
        }
        // if discount_type is PERCENT , validate max_discount : 
        if (discount_type === "PERCENT") {
            if (isNaN(max_discount) || Number(max_discount) <= 0) {
                return res.status(400).json({ message: "Invalid max discount , must be a positive number for PERCENT discount type" });
            }
        }
        // if discount_type is AMOUNT , that discount_value must be number : 
        if (discount_type === "AMOUNT") {
            if (isNaN(discount_value) || Number(discount_value) <= 0) {
                return res.status(400).json({ message: "Invalid discount value , must be a positive number for AMOUNT discount type" });
            }
        }
        // validate valid_from and valid_to : 
        if (!valid_from || !valid_to) {
            return res.status(400).json({ message: "valid_from and valid_to dates are required" });
        }

        // validate valid_from and valid_to : 
        const fromDate = new Date(valid_from);
        const toDate = new Date(valid_to);
        if (isNaN(fromDate) || isNaN(toDate) || fromDate >= toDate) {
            return res.status(400).json({ message: "Invalid valid_from or valid_to date" });
        }

        // check if voucher code already exists
        const existingVoucher = await Voucher.findOne({ where: { code } });
        if (existingVoucher) {
            return res.status(409).json({ message: `Voucher code already exists for code: ${code}` });
        }



        // create new voucher
        const newVoucher = await Voucher.create({
            code,
            title,
            description,
            discount_type,
            discount_value,
            min_order_amount,
            max_discount,
            valid_from,
            valid_to,
            usage_limit,
            image_url,
            created_by: req.user?.userId || 2,
        });

        return res.status(201).json({ message: "Voucher created successfully", voucher: newVoucher });
    } catch (error) {
        console.error("Error creating voucher:", error);
        return res.status(500).json({ message: "Internal server error" });
    }

}

// update voucher : 
// frontend will send req.body like :
// payload:  {code: 'FLASH20', title: 'Flash Sale Discount', description: '', usageLimit: 100 , voucher_id: 1}
export const updateVoucher = async (req, res) => {
    try {
        const { voucher_id, code, title, description, usageLimit } = req.body || {};

        // validate voucher_id
        if (!voucher_id) {
            return res.status(400).json({ message: "voucher_id is required" });
        }
        // validate code
        if (!code || code.trim() === "") {
            return res.status(400).json({ message: "Voucher code is required" });
        }
        // validate title
        if (!title || title.trim() === "") {
            return res.status(400).json({ message: "Voucher title is required" });
        }
        // validate usageLimit
        if (isNaN(usageLimit) || Number(usageLimit) < 0) {
            return res.status(400).json({ message: "Invalid usage limit , must be a non-negative number" });
        }

        const voucher = await Voucher.findByPk(voucher_id);
        if (!voucher) {
            return res.status(404).json({ message: `Voucher not found for voucher_id : ${voucher_id}` });
        }

        // check if code is being updated to an existing code
        if (voucher.code !== code) {
            const existingVoucher = await Voucher.findOne({ where: { code } });
            if (existingVoucher) {
                return res.status(409).json({ message: `Voucher code already exists for code: ${code}` });
            }
        }

        // update voucher fields
        voucher.code = code;
        voucher.title = title;
        voucher.description = description;
        voucher.usage_limit = usageLimit;

        await voucher.save();
        console.log("Voucher updated:", voucher);

        return res.status(200).json({ message: "Voucher updated successfully", voucher });
    } catch (error) {
        console.error("Error updating voucher:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}