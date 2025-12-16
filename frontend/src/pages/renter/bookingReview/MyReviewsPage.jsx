// src/pages/renter/MyReviewsPage.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMyReviews,
  clearMyReviews,
} from "../../../redux/features/renter/bookingReview/bookingReviewSlice";
import MyReviewsList from "../../../components/renter/bookingReview/MyReviewsList";
import Pagination from "../../../components/common/Pagination"; // Đảm bảo bạn có component này

const MyReviewsPage = () => {
  const dispatch = useDispatch();
  const {
    myReviews,
    totalReviews,
    currentPage,
    totalPages,
    itemsPerPage,
    loading,
    error,
  } = useSelector((state) => state.bookingReview);

  const [page, setPage] = useState(1);

  const loadReviews = (pageNum = 1) => {
    dispatch(fetchMyReviews({ page: pageNum, limit: 3, sortBy: "created_at" }));
    setPage(pageNum);
  };

  useEffect(() => {
    loadReviews(1);
    return () => {
      dispatch(clearMyReviews()); // Optional: cleanup khi rời trang
    };
  }, [dispatch]);

  // Tự động reload trang hiện tại sau khi xóa (sẽ được gọi từ MyReviewsList)
  const handleReviewDeleted = () => {
    // Nếu đang ở trang cuối mà xóa hết → quay về trang trước
    const newTotalPages = Math.ceil((totalReviews - 1) / itemsPerPage);
    const targetPage =
      page > newTotalPages && newTotalPages > 0 ? newTotalPages : page;
    loadReviews(targetPage > 0 ? targetPage : 1);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Đánh giá của tôi</h1>
        <p className="text-gray-600 mt-2">
          Xem lại những đánh giá bạn đã gửi cho các chủ xe.
        </p>
      </div>

      <MyReviewsList
        reviews={myReviews}
        loading={loading}
        error={error}
        onReviewDeleted={handleReviewDeleted} // Truyền callback
      />

      {/* Phân trang - luôn hiển thị dù chỉ 1 trang */}
      {totalReviews > 0 && (
        <div className="mt-8 flex flex-col items-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(newPage) => loadReviews(newPage)}
          />
        </div>
      )}
    </div>
  );
};

export default MyReviewsPage;
