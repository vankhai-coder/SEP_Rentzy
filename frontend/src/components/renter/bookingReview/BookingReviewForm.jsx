// src/components/renter/bookingReview/BookingReviewForm.jsx
import React, { useState } from "react";
import { Star } from "lucide-react";
import { useDispatch } from "react-redux";
import { createReview } from "../../../redux/features/renter/bookingReview/bookingReviewSlice.js"; // Path đúng từ components/
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

const BookingReviewForm = ({ bookingDetail }) => {
  const [rating, setRating] = useState(0);
  const [reviewContent, setReviewContent] = useState("");
  const [hover, setHover] = useState(0);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { bookingId } = useParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0 || !reviewContent.trim()) {
      toast.error("Vui lòng chọn sao và nhập nội dung đánh giá!");
      return;
    }

    // Dispatch create review
    const result = await dispatch(
      createReview({ bookingId, rating, reviewContent })
    );
    if (createReview.fulfilled.match(result)) {
      // Sau success, navigate back và refetch history (dispatch từ bookingHistory slice nếu cần)
      navigate("/booking-history");
      toast.info("Đánh giá đã được lưu! Quay về lịch sử.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border border-teal-200/50">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Đánh giá chuyến đi
      </h2>

      {/* Hiển thị info booking ngắn gọn */}
      {bookingDetail && (
        <div className="mb-6 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl">
          <p className="font-semibold text-teal-700">
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating Stars */}
        <div className="flex justify-center mb-6">
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
                  className={`h-8 w-8 cursor-pointer transition-all duration-200 ${
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
          <p className="ml-4 text-sm text-gray-600">Chọn số sao (1-5)</p>
        </div>

        {/* Review Content */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Nội dung đánh giá
          </label>
          <textarea
            value={reviewContent}
            onChange={(e) => setReviewContent(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn về chuyến đi..."
            className="w-full p-3 border border-teal-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none h-32"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={rating === 0 || !reviewContent.trim()}
          className="w-full py-3 px-6 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Gửi đánh giá
        </button>
      </form>
    </div>
  );
};

export default BookingReviewForm;
