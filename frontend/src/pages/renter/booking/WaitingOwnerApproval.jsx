import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axiosInstance from "../../../config/axiosInstance";
import {
  Clock,
  MapPin,
  DollarSign,
  User,
  Car,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Hourglass,
  ArrowLeft,
  Loader2,
} from "lucide-react";

const statusTextMap = {
  pending: "Đang chờ chủ xe duyệt",
  confirmed: "Chủ xe đã duyệt",
  deposit_required: "Yêu cầu đặt cọc",
  deposit_paid: "Đã đặt cọc",
  canceled: "Đã hủy",
  rejected: "Bị từ chối",
};

const WaitingOwnerApproval = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(true);

  const fetchBooking = async () => {
    try {
      setError(null);
      const res = await axiosInstance.get(`/api/renter/booking/${bookingId}`);
      const payload = res.data.booking || res.data.data;
      if (!res.data.success || !payload) {
        throw new Error("Không thể tải thông tin đơn thuê");
      }
      setBooking(payload);
      const status = payload.status;
      if (status && status !== "pending") {
        setPolling(false);
        navigate(`/payment-deposit/${bookingId}`);
      }
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
    const interval = setInterval(() => {
      if (polling) fetchBooking();
    }, 4000);
    return () => clearInterval(interval);
  }, [bookingId, polling]);

  const handleManualRefresh = async () => {
    await fetchBooking();
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 border border-gray-200 shadow-sm hover:shadow"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Quay lại</span>
          </button>
          <div className="text-right">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Theo dõi đơn thuê
            </h1>
            <p className="text-gray-500 text-sm font-medium">
              Mã: #{bookingId}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-sm">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
              <p className="text-gray-600 text-lg font-medium">
                Đang tải thông tin...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6">
            {error}
          </div>
        ) : (
          <>
            {/* Status Alert */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 mb-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Hourglass
                    className="text-amber-600 animate-pulse"
                    size={28}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-semibold text-lg mb-2">
                    {statusTextMap[booking?.status] ||
                      booking?.status ||
                      "Đang chờ duyệt"}
                  </p>
                  <p className="text-gray-600">
                    Bạn sẽ được chuyển tới trang thanh toán đặt cọc ngay khi chủ
                    xe chấp nhận đơn.
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-amber-200 shadow-sm">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-700 text-sm font-semibold">
                    Đang chờ
                  </span>
                </div>
              </div>
            </div>

            {/* Vehicle Card */}
            {booking?.vehicle && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex gap-6 items-center">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <img
                      src={booking.vehicle.main_image_url || "/default_avt.jpg"}
                      alt={booking.vehicle.model}
                      className="relative w-32 h-24 object-cover rounded-xl border-2 border-gray-200"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Car className="text-gray-600" size={24} />
                      <h3 className="text-2xl font-bold text-gray-900">
                        {booking.vehicle.brand?.name} {booking.vehicle.model}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-gray-600">
                      <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium border border-gray-200">
                        {booking.vehicle.year}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium border border-gray-200">
                        {booking.vehicle.vehicle_type}
                      </span>
                      <span className="font-bold text-gray-900 text-lg">
                        {new Intl.NumberFormat("vi-VN").format(
                          booking.vehicle.price_per_day
                        )}
                        đ/ngày
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Timeline */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              {[
                {
                  icon: CheckCircle2,
                  label: "Đã tạo đơn",
                  color: "emerald",
                  active: true,
                  detail: new Date(booking?.created_at).toLocaleDateString(
                    "vi-VN"
                  ),
                },
                {
                  icon: Hourglass,
                  label: "Chờ duyệt",
                  color: "amber",
                  active: true,
                  detail: statusTextMap[booking?.status],
                },
                {
                  icon: ShieldCheck,
                  label: "Chủ xe duyệt",
                  color: "slate",
                  active: false,
                  detail: "Đang chờ phê duyệt",
                },
                {
                  icon: DollarSign,
                  label: "Thanh toán",
                  color: "slate",
                  active: false,
                  detail: "Chưa thanh toán",
                },
              ].map((step, idx) => {
                const Icon = step.icon;
                const activeColors = {
                  emerald: "bg-emerald-50 border-emerald-200",
                  amber: "bg-amber-50 border-amber-200",
                };
                const iconColors = {
                  emerald: "text-emerald-600 bg-emerald-100",
                  amber: "text-amber-600 bg-amber-100",
                  slate: "text-gray-400 bg-gray-100",
                };
                return (
                  <div
                    key={idx}
                    className={`relative p-5 rounded-xl border transition-all duration-300 shadow-sm ${
                      step.active
                        ? `${activeColors[step.color]} shadow-md`
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${iconColors[step.color]}`}
                      >
                        <Icon size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-semibold mb-1 ${
                            step.active ? "text-gray-900" : "text-gray-400"
                          }`}
                        >
                          {step.label}
                        </p>
                        <p
                          className={`text-xs ${
                            step.active ? "text-gray-600" : "text-gray-400"
                          }`}
                        >
                          {step.detail}
                        </p>
                      </div>
                    </div>
                    {idx < 3 && (
                      <div className="absolute top-1/2 -right-2 w-4 h-0.5 bg-gradient-to-r from-gray-300 to-transparent hidden md:block"></div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Main Content Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {/* Booking Info */}
              <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Clock className="text-gray-600" />
                  Thông tin đơn thuê
                </h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-gray-600 text-sm mb-2 flex items-center gap-2 font-medium">
                        <Clock size={16} />
                        Thời gian nhận xe
                      </p>
                      <p className="text-gray-900 font-semibold">
                        {new Date(
                          booking?.startDate || booking?.start_date
                        ).toLocaleDateString("vi-VN")}
                      </p>
                      <p className="text-gray-600 text-sm font-medium">
                        {booking?.startTime || booking?.start_time}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-gray-600 text-sm mb-2 flex items-center gap-2 font-medium">
                        <Clock size={16} />
                        Thời gian trả xe
                      </p>
                      <p className="text-gray-900 font-semibold">
                        {new Date(
                          booking?.endDate || booking?.end_date
                        ).toLocaleDateString("vi-VN")}
                      </p>
                      <p className="text-gray-600 text-sm font-medium">
                        {booking?.endTime || booking?.end_time}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-gray-600 text-sm mb-3 flex items-center gap-2 font-medium">
                      <MapPin size={16} />
                      Địa điểm giao nhận
                    </p>
                    <p className="text-gray-900 font-semibold mb-2">
                      {(booking?.deliveryOption || booking?.delivery_option) ===
                      "delivery"
                        ? "Giao & nhận tại địa chỉ"
                        : "Nhận tại vị trí xe đậu"}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {booking?.pickupAddress ||
                        booking?.pickup_address ||
                        booking?.vehicle?.location ||
                        "Chưa có địa chỉ"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cost Summary */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  Chi phí
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-white/10 rounded-xl backdrop-blur border border-white/10">
                    <p className="text-gray-600 text-sm mb-1">Giá thuê/ngày</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {new Intl.NumberFormat("vi-VN").format(
                        booking?.pricePerDay ||
                          booking?.vehicle?.price_per_day ||
                          0
                      )}
                      đ
                    </p>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                  <div className="p-4 bg-white/10 rounded-xl backdrop-blur border border-white/10">
                    <p className="text-gray-600 text-sm mb-1">
                      Tổng chi phí dự kiến
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {new Intl.NumberFormat("vi-VN").format(
                        booking?.totalAmount || booking?.total_amount || 0
                      )}
                      đ
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Owner Info */}
            {(booking?.vehicle?.owner || booking?.owner) && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="text-gray-600" />
                  Thông tin chủ xe
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center shadow-md">
                    <User className="text-white" size={32} />
                  </div>
                  <div>
                    <p className="text-gray-900 font-bold text-lg mb-1">
                      {(booking?.vehicle?.owner?.full_name ||
                        booking?.owner?.full_name) ??
                        "Chưa có tên"}
                    </p>
                    {(booking?.vehicle?.owner?.phone_number ||
                      booking?.owner?.phone_number) && (
                      <p className="text-gray-600 text-sm font-medium">
                        📱{" "}
                        {booking?.vehicle?.owner?.phone_number ||
                          booking?.owner?.phone_number}
                      </p>
                    )}
                    {(booking?.vehicle?.owner?.email ||
                      booking?.owner?.email) && (
                      <p className="text-gray-600 text-sm">
                        ✉️{" "}
                        {booking?.vehicle?.owner?.email ||
                          booking?.owner?.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <button
                onClick={handleManualRefresh}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
              >
                <RefreshCw size={20} />
                Kiểm tra lại trạng thái
              </button>
              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-500"></div>
                <span className="text-sm font-medium">
                  Tự động kiểm tra mỗi 4 giây
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WaitingOwnerApproval;
