import Vehicle from "../../models/Vehicle.js";
import User from "../../models/User.js";

// Lấy tất cả vehicles (filter theo type: car/motorbike)
export const getAllVehicles = async (req, res) => {
  try {
    const { type } = req.query; // Ví dụ: /api/renter/vehicles?type=car
    if (type && !["car", "motorbike"].includes(type)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid vehicle type" });
    }
    const where = type ? { vehicle_type: type } : {};
    const vehicles = await Vehicle.findAll({ where });
    res.json({ success: true, data: vehicles });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Lấy chi tiết 1 vehicle theo id
export const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    const vehicle = await Vehicle.findByPk(id);
    console.log(vehicle);
    const owner = await User.findByPk(vehicle.owner_id);
    console.log(owner);

    if (!vehicle) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });
    }

    // Parse JSON strings to arrays
    const vehicleData = vehicle.toJSON();
    if (vehicleData.extra_images && typeof vehicleData.extra_images === 'string') {
      try {
        vehicleData.extra_images = JSON.parse(vehicleData.extra_images);
      } catch (e) {
        vehicleData.extra_images = [];
      }
    }
    if (vehicleData.features && typeof vehicleData.features === 'string') {
      try {
        vehicleData.features = JSON.parse(vehicleData.features);
      } catch (e) {
        vehicleData.features = [];
      }
    }

    // Include owner data in vehicle object
    vehicleData.owner = owner;

    res.json({ success: true, data: vehicleData });
  } catch (error) {
    console.error("Error fetching vehicle by id:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
