import React, { useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVehicleById } from "../../../redux/features/renter/vehicles/vehicleSlice";
import {
  VehicleGallery,
  VehicleInfo,
  BookingForm,
  RentalPolicies,
  OwnerProfile
} from '../../../components/renter/vehicles/detail';

const VehicleDetail = () => {
  const { id } = useParams();
  const location = useLocation();

  const dispatch = useDispatch();
  const { currentVehicle: vehicle, detailLoading: loading, detailError: error } = useSelector(state => state.vehicleStore);

  useEffect(() => {
    if (id) {
      console.log('Fetching vehicle with ID:', id);
      dispatch(fetchVehicleById(id));
    }
  }, [dispatch, id]);

  // Debug log để kiểm tra state
  console.log('Redux state:', { vehicle, loading, error });

  // Lấy prefill thời gian thuê từ query params nếu có
  const prefillParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const startDate = params.get('start_date');
    const endDate = params.get('end_date');
    const startTime = params.get('start_time');
    const endTime = params.get('end_time');

    return {
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      start_time: startTime || undefined,
      end_time: endTime || undefined,
    };
  }, [location.search]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white font-inter">
        <div className="max-w-7xl mx-auto p-5">
          <div className="text-center p-16 text-xl font-semibold text-blue-600 bg-white border border-gray-200 relative">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-5">
              <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            Đang tải thông tin xe...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white font-inter">
        <div className="max-w-7xl mx-auto p-5">
          <div className="text-center p-16 text-xl font-semibold text-red-600 bg-white border border-red-200">
            Lỗi: {error}
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-white font-inter">
        <div className="max-w-7xl mx-auto p-5">
          <div className="text-center p-16 text-xl font-semibold text-gray-600 bg-white border border-gray-200">
            Không tìm thấy thông tin xe
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-inter">
      <div className="max-w-7xl mx-auto p-3">

        {/* Image Gallery - Full width at top */}
        <div className="mb-8">
          <VehicleGallery vehicle={vehicle} />
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-13 gap-5 items-start"> {/* gap khoảng cách các item 
          {/* Left Column - 7 parts */}
          <div className="lg:col-span-9 space-y-7">
            <VehicleInfo vehicle={vehicle} />
            <RentalPolicies vehicle={vehicle} />
            <OwnerProfile vehicle={vehicle} />
          </div>

          {/* Right Column - 3 parts */}
          <div className="lg:col-span-4">
            <div className="sticky top-5">
              <BookingForm vehicle={vehicle} prefillParams={prefillParams} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetail;
