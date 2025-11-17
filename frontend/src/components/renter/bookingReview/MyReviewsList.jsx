import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Star, Calendar, Car, Trash2, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { deleteReview } from "../../../redux/features/renter/bookingReview/bookingReviewSlice";

const MyReviewsList = ({ reviews, loading, error }) => {
  const dispatch = useDispatch();
  const { loading: globalLoading } = useSelector(
    (state) => state.bookingReview
  );

  // State cho modal confirm xóa
  const [showModal, setShowModal] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState(null);

  const openDeleteModal = (reviewId) => {
    setSelectedReviewId(reviewId);
    setShowModal(true);
  };

  const confirmDelete = () => {
    if (selectedReviewId) {
      dispatch(deleteReview(selectedReviewId));
    }
    setShowModal(false);
    setSelectedReviewId(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedReviewId(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-lg">Đang tải đánh giá...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Lỗi: {error}.{" "}
        <button onClick={() => window.location.reload()}>Thử lại</button>
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <Star className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Chưa có đánh giá nào
        </h3>
        <p className="text-gray-500">
          Hãy thuê xe và đánh giá để chia sẻ trải nghiệm!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.review_id}
            className="border rounded-lg p-4 bg-white shadow-sm"
          >
            {/* Header: Vehicle info */}
            <div className="flex items-center gap-3 mb-2">
              <Car className="h-5 w-5 text-blue-500" />
              <div>
                <h4 className="font-semibold">
                  {review.booking.vehicle.model} (
                  {review.booking.vehicle.license_plate})
                </h4>
                <p className="text-sm text-gray-500">
                  {formatDate(review.booking.start_date)} -{" "}
                  {formatDate(review.booking.end_date)}
                </p>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < review.rating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-gray-600">
                ({review.rating}/5)
              </span>
            </div>

            {/* Content */}
            {review.review_content && (
              <p className="text-gray-700 mb-3 italic">
                "{review.review_content}"
              </p>
            )}

            {/* Footer: Date + Delete Button */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(review.created_at)}
              </div>
              <button
                onClick={() => openDeleteModal(review.review_id)}
                disabled={globalLoading}
                className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 ${
                  globalLoading
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-red-500 hover:text-red-700"
                }`}
                title="Xóa đánh giá"
              >
                <Trash2 className="h-4 w-4" />
                Xóa
              </button>
            </div>
          </div>
        ))}
        <div className="text-center text-sm text-gray-500 mt-4">
          Tổng: {reviews.length} đánh giá
        </div>
      </div>

      {/* Modal Confirm Xóa - Nền trong suốt, không tối */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Xác nhận xóa
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể
              hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                disabled={globalLoading}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {globalLoading ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyReviewsList;
