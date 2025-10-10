// ... existing code ...

// Lấy lịch xe đã đặt
export const getVehicleBookedDates = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    console.log(vehicleId);
    
    // Kiểm tra xe có tồn tại không
    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy xe'
      });
    }
    
    console.log("id của vehicle", vehicle.vehicle_id);
    
    // Lấy các booking đã được xác nhận
    const bookings = await Booking.findAll({
      where: {
        vehicle_id: vehicleId,
        status: {
          [Op.in]: ['pending', 'RENTAL_PAID', 'DEPOSIT_PAID', 'accepted', 'in_progress']
        }
      },
      attributes: ['start_date', 'end_date', 'start_time', 'end_time']
    });
    
    const bookedDates = bookings.map(booking => {
      const startDateTime = new Date(`${booking.start_date}T${booking.start_time || '00:00:00'}`);
      const endDateTime = new Date(`${booking.end_date}T${booking.end_time || '23:59:59'}`);
      
      // Thêm 1 giờ vào thời gian kết thúc như yêu cầu
      endDateTime.setHours(endDateTime.getHours() + 1);
      
      return {
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        pickupTime: booking.start_time,
        returnTime: booking.end_time
      };
    });
    
    res.status(200).json({
      success: true,
      bookedDates
    });
  } catch (error) {
    console.error('Error getting vehicle booked dates:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin lịch đặt xe',
      error: error.message
    });
  }
};

// ... existing code ...