import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../config/axiosInstance.js';
import { MdStar, MdPerson, MdDirectionsCar, MdCalendarToday, MdFilterList } from 'react-icons/md';
import { useOwnerTheme } from "@/contexts/OwnerThemeContext";
import { createThemeUtils } from "@/utils/themeUtils";

const VehicleReviews = () => {
  const theme = useOwnerTheme();
  const themeUtils = createThemeUtils(theme);
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [filters, setFilters] = useState({
    vehicle_id: '',
    page: 1,
    limit: 10
  });

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('api/owner/dashboard/vehicle-reviews', {
        params: filters
      });

      if (response.data.success) {
        setReviews(response.data.data.reviews);
        setPagination(response.data.data.pagination);
        setAvgRating(response.data.data.avgRating);
        setTotalReviews(response.data.data.totalReviews);
      }
    } catch (error) {
      setError('Không thể tải đánh giá xe');
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <MdStar
          key={i}
          className={`h-4 w-4 ${
            i <= rating ? 'text-yellow-400' : 'text-gray-300'
          }`}
        />
      );
    }
    return stars;
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-yellow-600';
    if (rating >= 2.5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRatingLabel = (rating) => {
    if (rating >= 4.5) return 'Xuất sắc';
    if (rating >= 3.5) return 'Tốt';
    if (rating >= 2.5) return 'Trung bình';
    if (rating >= 1.5) return 'Kém';
    return 'Rất kém';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`p-4 lg:p-6 min-h-screen ${themeUtils.bgMain}`}>
      <div className="mb-6">
        <h1 className={`text-2xl font-bold mb-2 ${themeUtils.textPrimary}`}>Đánh giá về xe của tôi</h1>
        <p className={themeUtils.textSecondary}>Xem và theo dõi các đánh giá từ khách hàng</p>
      </div>

      {/* Overall Rating */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 dark:text-white">{Number.isFinite(avgRating) ? avgRating.toFixed(1) : '0.0'}</div>
              <div className="flex items-center justify-center mt-1">
                {renderStars(Math.round(Number.isFinite(avgRating) ? avgRating : 0))}
              </div>
              <div className={`text-sm font-medium mt-1 ${getRatingColor(Number.isFinite(avgRating) ? avgRating : 0)}`}>
                {getRatingLabel(Number.isFinite(avgRating) ? avgRating : 0)}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Dựa trên {totalReviews} đánh giá
              </div>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviews.filter(r => r.rating === star).length;
                  const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  
                  return (
                    <div key={star} className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-4">{star}</span>
                      <MdStar className="h-4 w-4 text-yellow-400" />
                      <div className="flex-1 bg-gray-200 dark:bg-secondary-700 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-8">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <MdFilterList className="text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bộ lọc:</span>
          </div>
          
          <select
            value={filters.vehicle_id}
            onChange={(e) => handleFilterChange('vehicle_id', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả xe</option>
            {/* You can add vehicle options here if needed */}
          </select>

          <select
            value={filters.limit}
            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5 đánh giá/trang</option>
            <option value={10}>10 đánh giá/trang</option>
            <option value={20}>20 đánh giá/trang</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-secondary-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Danh sách đánh giá</h3>
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <MdStar className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Không có đánh giá nào</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Chưa có đánh giá nào từ khách hàng.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-secondary-700">
            {reviews.map((review) => (
              <div 
                key={review.review_id} 
                className="p-6 hover:bg-gray-50 dark:hover:bg-secondary-700 cursor-pointer transition-colors"
                onClick={() => {
                  if (review.booking?.vehicle?.vehicle_id) {
                    navigate(`/owner/vehicles/${review.booking.vehicle.vehicle_id}`);
                  }
                }}
              >
                <div className="flex items-start space-x-4">
                  {/* Customer Avatar */}
                  <div className="flex-shrink-0">
                    {review.booking?.renter?.avatar_url ? (
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={review.booking.renter.avatar_url}
                        alt={review.booking.renter.full_name}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-secondary-600 flex items-center justify-center">
                        <MdPerson className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Review Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {review.booking?.renter?.full_name || 'Khách hàng ẩn danh'}
                        </h4>
                        <div className="flex items-center">
                          {renderStars(review.rating)}
                        </div>
                        <span className={`text-sm font-medium ${getRatingColor(review.rating)}`}>
                          {getRatingLabel(review.rating)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(review.created_at)}
                      </div>
                    </div>

                    {/* Vehicle Info */}
                    <div className="flex items-center space-x-2 mb-3">
                      <MdDirectionsCar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Đánh giá cho: {review.booking?.vehicle?.model} ({review.booking?.vehicle?.license_plate})
                      </span>
                    </div>

                    {/* Review Content */}
                    {review.review_content && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {review.review_content}
                        </p>
                      </div>
                    )}

                    {/* Booking Info */}
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-secondary-700">
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <MdCalendarToday className="h-3 w-3" />
                          <span>Đơn #{review.booking_id}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>Đánh giá vào: {formatDate(review.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} đến{' '}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} của{' '}
                {pagination.totalItems} kết quả
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Trước
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handleFilterChange('page', page)}
                    className={`px-3 py-1 text-sm border rounded-md ${
                      page === pagination.currentPage
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleReviews;
