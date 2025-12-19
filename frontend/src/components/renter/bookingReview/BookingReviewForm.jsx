import React, { useState } from "react";
import { Star, AlertTriangle, AlertCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  createReview,
  clearModerationError,
  clearBookingDetail,
} from "../../../redux/features/renter/bookingReview/bookingReviewSlice.js";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

const BookingReviewForm = ({ bookingDetail }) => {
  const [rating, setRating] = useState(0);
  const [reviewContent, setReviewContent] = useState("");
  const [hover, setHover] = useState(0);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { bookingId } = useParams();

  const { loading, moderationError, error } = useSelector(
    (state) => state.bookingReview
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0 || !reviewContent.trim()) {
      toast.error("Vui lòng chọn sao và nhập nội dung đánh giá!");
      return;
    }

    const result = await dispatch(
      createReview({ bookingId, rating, reviewContent })
    );

    if (createReview.fulfilled.match(result)) {
      dispatch(clearBookingDetail());
      navigate("/booking-history");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-3xl shadow-2xl border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Đánh giá xe
      </h2>

      {bookingDetail && (
        <div className="mb-6 p-4 border border-gray-200 rounded-2xl">
          <p className="font-semibold text-gray-800">
            Xe: {bookingDetail.vehicle?.model || "N/A"}
          </p>
          <p className="text-gray-600">
            Ngày nhận:{" "}
            {new Date(bookingDetail.booking?.start_date).toLocaleDateString(
              "vi-VN"
            )}
          </p>
          <p className="text-gray-600">
            Ngày trả:{" "}
            {new Date(bookingDetail.booking?.end_date).toLocaleDateString(
              "vi-VN"
            )}
          </p>
        </div>
      )}

      {/* THÔNG BÁO LỖI MODERATION - NHỎ GỌN, ĐẸP, CHUYÊN NGHIỆP */}
      {moderationError && (
        <div className="mb-5 p-4 bg-red-50 border border-red-300 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-red-800 text-lg">
              Nội dung không được chấp nhận
            </p>
            <p className="text-red-700 mt-1 leading-relaxed">
              {moderationError}
            </p>
            <div className="mt-3 flex items-start gap-1 text-red-600">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">
                Vui lòng chỉnh sửa nội dung cho lịch sự hơn và gửi lại.
              </p>
            </div>
          </div>
          <button
            onClick={() => dispatch(clearModerationError())}
            className="text-red-600 hover:text-red-800 text-xl font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Lỗi hệ thống khác */}
      {error && !moderationError && (
        <div className="mb-5 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-800">Có lỗi xảy ra</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating Stars */}
        <div className="flex justify-center items-center mb-6">
          <div className="flex">
            {[...Array(5)].map((_, i) => {
              const starValue = i + 1;
              return (
                <label key={i}>
                  <input
                    type="radio"
                    name="rating"
                    value={starValue}
                    onChange={() => setRating(starValue)}
                    className="sr-only"
                  />
                  <Star
                    className={`h-10 w-10 cursor-pointer transition-all duration-200 ${
                      starValue <= (hover || rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                    onMouseEnter={() => setHover(starValue)}
                    onMouseLeave={() => setHover(0)}
                  />
                </label>
              );
            })}
          </div>
          <span className="ml-4 text-lg font-medium text-gray-700">
            {rating > 0 ? `${rating} sao` : "Chọn số sao"}
          </span>
        </div>

        {/* Nội dung đánh giá */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Nội dung đánh giá
          </label>
          <textarea
            value={reviewContent}
            onChange={(e) => setReviewContent(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn một cách lịch sự và chân thành..."
            className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none h-36 transition-all text-base ${
              moderationError
                ? "border-red-400 bg-red-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            required
          />
          <div className="mt-2 text-xs text-gray-500">
            Vui lòng sử dụng ngôn từ lịch sự, tránh từ ngữ thô tục, xúc phạm.
          </div>
        </div>

        {/* Nút gửi */}
        <button
          type="submit"
          disabled={loading || rating === 0 || !reviewContent.trim()}
          className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? "Đang kiểm tra nội dung..." : "Gửi đánh giá"}
        </button>
      </form>
    </div>
  );
};

export default BookingReviewForm;
