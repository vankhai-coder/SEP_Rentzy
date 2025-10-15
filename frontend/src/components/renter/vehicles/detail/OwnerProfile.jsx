import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

// Utility: Render star rating
const renderStars = (rating) =>
  Array.from({ length: 5 }, (_, i) => (
    <span
      key={i}
      className={`inline-block ${i < Math.round(rating) ? 'text-yellow-500' : 'text-gray-300'}`}
    >
      ★
    </span>
  ));

const OwnerProfile = ({ vehicle }) => {
  const { id: idParam } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [owner, setOwner] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [showAll, setShowAll] = useState(false);

  // Fetch owner profile and reviews
  useEffect(() => {
    const fetchOwnerProfile = async () => {
      // Determine vehicle ID from props or URL params
      const vehicleId = vehicle?.vehicle_id ?? vehicle?.id ?? vehicle?.idVehicle ?? idParam;
      if (!vehicleId) {
        setError('Không xác định được mã xe để tải thông tin chủ xe.');
        setLoading(false);
        return;
      }

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      try {
        console.log('Fetching owner profile for vehicle ID:', vehicleId);
        const res = await fetch(`${baseUrl}/api/renter/vehicles/${vehicleId}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Không thể tải thông tin chủ xe.`);
        }

        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          throw new Error('Phản hồi không phải JSON. Kiểm tra VITE_API_URL hoặc đường dẫn API.');
        }

        const json = await res.json();
        const data = json?.data;
        if (!data || !data.owner) {
          throw new Error('Không tìm thấy thông tin chủ xe trong dữ liệu trả về.');
        }

        setOwner(data.owner);
        setReviews(Array.isArray(data.owner_comments) ? data.owner_comments : []);
      } catch (e) {
        console.error('fetchOwnerProfile error:', e);
        setError(e.message || 'Lỗi tải dữ liệu chủ xe.');
      } finally {
        setLoading(false);
      }
    };

    fetchOwnerProfile();
  }, [vehicle, idParam]);

  // Normalize reviews for consistent rendering
  const normalizedReviews = useMemo(() => {
    return (reviews || []).map((r) => ({
      id: r.review_id ?? r.id ?? Math.random().toString(36).substring(2), // Fallback ID
      userName: r.renter?.full_name || 'Người thuê',
      userAvatar: r.renter?.avatar_url || '/default_avt.jpg',
      rating: Number(r.rating) || 0,
      date: r.created_at,
      comment: r.comment || '',
    }));
  }, [reviews]);

  // Calculate average rating
  const avgRating = useMemo(() => {
    const count = normalizedReviews.length;
    if (!count) return 0;
    const sum = normalizedReviews.reduce((s, rv) => s + rv.rating, 0);
    return Number((sum / count).toFixed(1));
  }, [normalizedReviews]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-white p-6">
        <div className="flex items-center justify-center py-8 text-gray-500">
          Đang tải thông tin chủ xe...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white p-6">
        <div className="flex items-center justify-center py-8 text-red-500">
          {error}
        </div>
      </div>
    );
  }

  // Owner data
  const ownerName = owner?.full_name || 'Chủ xe';
  const ownerAvatar = owner?.avatar_url || '/default_avt.jpg';
  const itemsToShow = showAll ? normalizedReviews.length : 2;

  return (
    <div className="bg-white p-6 space-y-6">
      <h3 className="text-xl font-bold">Chủ xe</h3>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={ownerAvatar}
            alt={ownerName}
            className="w-14 h-14 rounded-full object-cover bg-white"
          />
          <div>
            <div className="text-lg font-semibold">{ownerName}</div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-gray-900">{avgRating}</span>
                <div className="ml-1">{renderStars(avgRating)}</div>
              </div>
              <span>•</span>
              <span>{normalizedReviews.length} đánh giá</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-sm text-gray-500">Tỉ lệ phản hồi</div>
            <div className="text-lg font-bold">100%</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Phản hồi trong</div>
            <div className="text-lg font-bold">5 phút</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Tỉ lệ đồng ý</div>
            <div className="text-lg font-bold">100%</div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 text-blue-900 rounded-md p-4 text-sm">
        <span className="font-medium">Chủ xe </span>
        có thời gian phản hồi nhanh chóng, tỉ lệ đồng ý cao, mức giá cạnh tranh & dịch vụ nhận được nhiều đánh giá tốt từ khách hàng.
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {normalizedReviews.slice(0, itemsToShow).map((review) => (
          <div key={review.id} className="border rounded-xl p-4 bg-white">
            <div className="flex items-center gap-3">
              <img
                src={review.userAvatar}
                alt={review.userName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="font-medium">{review.userName}</div>
                <div className="flex items-center gap-2 text-yellow-500">
                  {renderStars(review.rating)}
                  <span className="text-xs text-gray-500">
                    {review.date ? new Date(review.date).toLocaleDateString('vi-VN') : ''}
                  </span>
                </div>
              </div>
            </div>
      
            {review.comment.trim() && <p className="text-sm text-gray-700 mt-3">{review.comment}</p>}
          </div>
        ))}
      </div>

      {normalizedReviews.length > 2 && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="px-4 py-2 border rounded-lg text-green-600 border-green-600 hover:bg-green-50"
          >
            {showAll ? 'Thu gọn' : 'Xem thêm'}
          </button>
        </div>
      )}
    </div>
  );
};

export default OwnerProfile;