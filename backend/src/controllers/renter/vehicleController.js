import Vehicle from "../../models/Vehicle.js";

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

    if (!vehicle) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });
    }

    res.json({ success: true, data: vehicle });
  } catch (error) {
    console.error("Error fetching vehicle by id:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
