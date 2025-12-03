// src/components/renter/bookingReview/MyReviewsList.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Star, Calendar, Car, Trash2, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { deleteReview } from "../../../redux/features/renter/bookingReview/bookingReviewSlice";

const MyReviewsList = ({ reviews, loading, error, onReviewDeleted }) => {
  const dispatch = useDispatch();
  const { loading: globalLoading } = useSelector(
    (state) => state.bookingReview
  );

  const [showModal, setShowModal] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState(null);

  const openDeleteModal = (reviewId) => {
    setSelectedReviewId(reviewId);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (selectedReviewId) {
      const result = await dispatch(deleteReview(selectedReviewId));
      if (deleteReview.fulfilled.match(result)) {
        onReviewDeleted?.();
      }
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        Lỗi: {error}.{" "}
        <button onClick={() => window.location.reload()} className="underline">
          Thử lại
        </button>
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-20">
        <Star className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">
          Chưa có đánh giá nào
        </h3>
        <p className="text-gray-500">
          Hãy thuê xe và đánh giá để chia sẻ trải nghiệm của bạn!
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Danh sách đánh giá */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div
            key={review.review_id}
            className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4 mb-3">
                <Car className="h-6 w-6 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-lg">
                    {review.booking.vehicle.model}
                  </h4>
                  <p className="text-sm text-gray-500">
                    Biển số: {review.booking.vehicle.license_plate} • Thuê từ{" "}
                    {formatDate(review.booking.start_date)} đến{" "}
                    {formatDate(review.booking.end_date)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 my-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-6 w-6 ${
                    i < review.rating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
              <span className="ml-2 text-gray-700 font-medium">
                {review.rating}.0
              </span>
            </div>

            {review.review_content && (
              <p className="text-gray-700 italic bg-gray-50 p-4 rounded-lg leading-relaxed">
                {review.review_content}
              </p>
            )}

            <div className="flex items-center justify-between mt-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Đánh giá ngày {formatDate(review.created_at)}
              </div>

              <button
                onClick={() => openDeleteModal(review.review_id)}
                disabled={globalLoading}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition ${
                  globalLoading
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-red-600 hover:bg-red-50"
                }`}
              >
                <Trash2 className="h-4 w-4" />
                Xóa đánh giá
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal XÓA - KHÔNG nền đen, chỉ nổi lên giữa màn hình */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          {/* Chỉ có modal, không có backdrop */}
          <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Xóa đánh giá này?
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 leading-relaxed">
                  Bạn có chắc chắn muốn <strong>xóa vĩnh viễn</strong> đánh giá
                  này?
                </p>
                <p className="text-sm text-red-600 mt-3 font-medium">
                  Lưu ý: Bạn sẽ bị trừ <strong>5.000 điểm</strong> thưởng.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={globalLoading}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-md"
                >
                  {globalLoading ? "Đang xóa..." : "Xóa vĩnh viễn"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyReviewsList;
