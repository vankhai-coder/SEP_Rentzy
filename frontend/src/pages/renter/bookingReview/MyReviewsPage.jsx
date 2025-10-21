import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyReviews } from "../../../redux/features/renter/bookingReview/bookingReviewSlice"; // ✅ SỬA: Import thunk mới từ slice
import MyReviewsList from "../../../components/renter/bookingReview/MyReviewsList"; // ✅ SỬA: Import component (điều chỉnh path nếu cần)

const MyReviewsPage = () => {
  const dispatch = useDispatch();
  const { myReviews, loading, error } = useSelector(
    (state) => state.bookingReview
  ); // ✅ SỬA: Selector lấy myReviews từ state mới

  useEffect(() => {
    dispatch(fetchMyReviews()); // ✅ THÊM MỚI: Fetch data khi page mount
  }, [dispatch]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Đánh giá của tôi</h1>
        <p className="text-gray-600">
          Xem lại những đánh giá bạn đã gửi cho các chuyến thuê xe.
        </p>
      </div>
      <MyReviewsList reviews={myReviews} loading={loading} error={error} />{" "}
      {/* ✅ THÊM MỚI: Render component với props */}
    </div>
  );
};

export default MyReviewsPage;
