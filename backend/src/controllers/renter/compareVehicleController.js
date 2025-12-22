import Vehicle from "../../models/Vehicle.js";
import { Op } from "sequelize";

const CompareVehicleController = {
  compareVehicles: async (req, res) => {
    try {
      const { vehicle_ids, type } = req.body;

      if (!type || !["car", "motorbike"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Type phải là 'car' hoặc 'motorbike'.",
        });
      }

      if (
        !vehicle_ids ||
        !Array.isArray(vehicle_ids) ||
        vehicle_ids.length < 2 ||
        vehicle_ids.length > 4
      ) {
        return res.status(400).json({
          success: false,
          message: "Số lượng xe phải từ 2 đến 4.",
        });
      }

      const ids = [...new Set(vehicle_ids.map((id) => parseInt(id)))].filter(
        (id) => !isNaN(id)
      );

      const vehicles = await Vehicle.findAll({
        where: {
          vehicle_id: { [Op.in]: ids },
          vehicle_type: type,
          status: "available",
          approvalStatus: "approved",
        },
        attributes: [
          "vehicle_id",
          "model",
          "year",
          "price_per_day",
          "vehicle_type",
          "features",
          "seats",
          "fuel_type",
          "transmission",
          "body_type",
          "bike_type",
          "engine_capacity",
          "rent_count",
          "fuel_consumption",
        ],
        order: [["vehicle_id", "ASC"]],
      });

      if (vehicles.length !== ids.length) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy đủ xe hoặc loại xe không khớp (${type}).`,
        });
      }

      const normalizedVehicles = vehicles.map((v) => {
        const data = v.toJSON();
        return {
          id: data.vehicle_id,
          model: data.model,
          year: data.year,
          price_per_day: parseFloat(data.price_per_day),
          rent_count: data.rent_count || 0,
          features:
            typeof data.features === "string"
              ? JSON.parse(data.features)
              : data.features || [],
          seats: data.seats || null,
          fuel_type: data.fuel_type || null,
          transmission: data.transmission || null,
          body_type: data.body_type || null,
          bike_type: data.bike_type || null,
          engine_capacity: data.engine_capacity || null,
          fuel_consumption: data.fuel_consumption || "N/A",
        };
      });

      // ✅ Tạo bảng so sánh
      const comparisonTable = {
        models: normalizedVehicles.map((v) => v.model),
        years: normalizedVehicles.map((v) => v.year),
        prices: normalizedVehicles.map((v) => v.price_per_day.toFixed(2)),
        rent_counts: normalizedVehicles.map((v) => v.rent_count),

        // ✅ mỗi xe có features riêng
        features: normalizedVehicles.map((v) => v.features || []),
        fuel_consumptions: normalizedVehicles.map(
          (v) => v.fuel_consumption || "N/A"
        ),
      };

      if (type === "car") {
        comparisonTable.seats = normalizedVehicles.map((v) => v.seats || "N/A");
        comparisonTable.fuel_types = normalizedVehicles.map(
          (v) => v.fuel_type || "N/A"
        );
        comparisonTable.transmissions = normalizedVehicles.map(
          (v) => v.transmission || "N/A"
        );
        comparisonTable.body_types = normalizedVehicles.map(
          (v) => v.body_type || "N/A"
        );
      } else {
        comparisonTable.bike_types = normalizedVehicles.map(
          (v) => v.bike_type || "N/A"
        );
        comparisonTable.engine_capacities = normalizedVehicles.map((v) =>
          v.engine_capacity ? `${v.engine_capacity}cc` : "N/A"
        );
      }

      res.status(200).json({
        success: true,
        message: `So sánh ${type === "car" ? "xe ô tô" : "xe máy"} thành công!`,
        type,
        vehicles: normalizedVehicles,
        comparison: comparisonTable,
        count: vehicles.length,
      });
    } catch (error) {
      console.error("Lỗi so sánh xe:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi so sánh xe.",
      });
    }
  },
};

export default CompareVehicleController;
