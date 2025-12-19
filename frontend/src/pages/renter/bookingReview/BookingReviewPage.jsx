// src/pages/renter/bookingReview/BookingReviewPage.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  fetchBookingDetail,
  clearBookingDetail,
} from "../../../redux/features/renter/bookingReview/bookingReviewSlice.js";
import BookingReviewForm from "../../../components/renter/bookingReview/BookingReviewForm.jsx";

const BookingReviewPage = () => {
  const { bookingId } = useParams();
  const dispatch = useDispatch();
  const { bookingDetail, loading, error } = useSelector(
    (state) => state.bookingReview
  );

  useEffect(() => {
    dispatch(fetchBookingDetail(bookingId));
    return () => dispatch(clearBookingDetail());
  }, [dispatch, bookingId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-teal-500">Đang tải thông tin...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors"
        >
          Quay lại
        </button>
      </div>
    );
  }

  if (!bookingDetail) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Không tìm thấy thông tin booking.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <BookingReviewForm bookingDetail={bookingDetail} />
      </div>
    </div>
  );
};

export default BookingReviewPage;
