import Vehicle from "../../models/Vehicle.js";
import User from "../../models/User.js";
import Brand from "../../models/Brand.js";
import { Op } from "sequelize";

// Get all vehicles for admin management
export const getAllVehicles = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      status,
      vehicle_type,
      approvalStatus
    } = req.query;
    const offset = (page - 1) * limit;

    // Build filter conditions
    const whereConditions = {};
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (vehicle_type) {
      whereConditions.vehicle_type = vehicle_type;
    }
    
    if (approvalStatus) {
      whereConditions.approvalStatus = approvalStatus;
    }

    const vehicles = await Vehicle.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["user_id", "full_name", "email", "phone_number"],
        },
        {
          model: Brand,
          as: "brand",
          attributes: ["brand_id", "name"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      success: true,
      message: "Vehicles retrieved successfully",
      data: {
        vehicles: vehicles.rows,
        totalCount: vehicles.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(vehicles.count / limit),
      },
    });
  } catch (error) {
    console.error("Error getting vehicles:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Search vehicles
export const searchVehicles = async (req, res) => {
  try {
    const { 
      query, 
      status, 
      vehicle_type, 
      approvalStatus,
      page = 1, 
      limit = 10 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Build search conditions
    const whereConditions = {};
    
    if (query) {
      whereConditions[Op.or] = [
        { license_plate: { [Op.like]: `%${query}%` } },
        { model: { [Op.like]: `%${query}%` } },
        { location: { [Op.like]: `%${query}%` } },
      ];
    }
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (vehicle_type) {
      whereConditions.vehicle_type = vehicle_type;
    }
    
    if (approvalStatus) {
      whereConditions.approvalStatus = approvalStatus;
    }

    // Build include conditions for search
    const includeConditions = [
      {
        model: User,
        as: "owner",
        attributes: ["user_id", "full_name", "email", "phone_number"],
        required: false,
      },
      {
        model: Brand,
        as: "brand",
        attributes: ["brand_id", "name"],
        required: false,
      },
    ];

    // If there's a search query, add search conditions to includes
    if (query) {
      includeConditions[0].where = {
        [Op.or]: [
          { full_name: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } },
        ]
      };
      includeConditions[1].where = {
        name: { [Op.like]: `%${query}%` }
      };
    }

    const vehicles = await Vehicle.findAndCountAll({
      where: whereConditions,
      include: includeConditions,
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      success: true,
      message: "Search completed successfully",
      data: {
        vehicles: vehicles.rows,
        totalCount: vehicles.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(vehicles.count / limit),
        searchQuery: query,
      },
    });
  } catch (error) {
    console.error("Error searching vehicles:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update vehicle status (lock/unlock)
export const updateVehicleStatus = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status || !["available", "blocked"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Status must be 'available' or 'blocked'",
      });
    }

    // Find the vehicle
    const vehicle = await Vehicle.findByPk(vehicleId);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Update the status
    await vehicle.update({ 
      status,
      blocked_by: status === 'blocked' ? 'admin' : null
    });

    // Get updated vehicle with associations
    const updatedVehicle = await Vehicle.findByPk(vehicleId, {
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["user_id", "full_name", "email", "phone_number"],
        },
        {
          model: Brand,
          as: "brand",
          attributes: ["brand_id", "name"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: `Vehicle status updated to ${status} successfully`,
      data: {
        vehicle: updatedVehicle,
      },
    });
  } catch (error) {
    console.error("Error updating vehicle status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};