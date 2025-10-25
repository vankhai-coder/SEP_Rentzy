import React from "react";
import { Star, Calendar, Car } from "lucide-react";
import { formatDate } from "@/lib/utils";

const MyReviewsList = ({ reviews, loading, error }) => {
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

          {/* Footer: Date */}
          <div className="flex items-center justify-end text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            {formatDate(review.created_at)}
          </div>
        </div>
      ))}
      <div className="text-center text-sm text-gray-500 mt-4">
        Tổng: {reviews.length} đánh giá
      </div>
    </div>
  );
};

export default MyReviewsList;
