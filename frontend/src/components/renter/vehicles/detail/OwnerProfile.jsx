import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Utility: Render star rating
const renderStars = (rating) =>
  Array.from({ length: 5 }, (_, i) => (
    <span
      key={i}
      className={`inline-block ${
        i < Math.round(rating) ? "text-yellow-500" : "text-gray-300"
      }`}
    >
      ★
    </span>
  ));

const OwnerProfile = ({ vehicle }) => {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [owner, setOwner] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [showAll, setShowAll] = useState(false);

  // Fetch vehicle-specific reviews; owner info comes from vehicle prop
  useEffect(() => {
    const fetchVehicleReviews = async () => {
      const vehicleId =
        vehicle?.vehicle_id ?? vehicle?.id ?? vehicle?.idVehicle ?? idParam;
      if (!vehicleId) {
        setError("Không xác định được mã xe để tải đánh giá.");
        setLoading(false);
        return;
      }

      // Owner info can be read directly from the loaded vehicle
      setOwner(vehicle?.owner || null);

      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      try {
        const res = await fetch(
          `${baseUrl}/api/renter/reviews/vehicle/${vehicleId}`
        );
        if (!res.ok) {
          throw new Error(
            `HTTP ${res.status}: Không thể tải đánh giá của xe.`
          );
        }

        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          throw new Error(
            "Phản hồi không phải JSON. Kiểm tra VITE_API_URL hoặc đường dẫn API."
          );
        }

        const json = await res.json();
        const data = json?.reviews ?? [];
        setReviews(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("fetchVehicleReviews error:", e);
        setError(e.message || "Lỗi tải đánh giá xe.");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleReviews();
  }, [vehicle, idParam]);

  // Normalize reviews for consistent rendering
  const normalizedReviews = useMemo(() => {
    return (reviews || []).map((r) => ({
      id: r.review_id ?? r.id ?? Math.random().toString(36).substring(2),
      userName: r.booking?.renter?.full_name || "Người thuê",
      userAvatar: r.booking?.renter?.avatar_url || "/default_avt.jpg",
      rating: Number(r.rating) || 0,
      date: r.created_at,
      comment: r.review_content || "",
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
  const ownerName = owner?.full_name || "Chủ xe";
  const ownerAvatar = owner?.avatar_url || "/default_avt.jpg";
  const itemsToShow = showAll ? normalizedReviews.length : 2;

  const handleOwnerClick = () => {
    const ownerId = owner?.user_id || vehicle?.owner_id;
    if (!ownerId) return;
    navigate(`/owner-public/${ownerId}`);
  };

  return (
    <div className="bg-white p-6 space-y-6">
      <h3 className="text-xl font-bold">Chủ xe</h3>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={ownerAvatar}
            alt={ownerName}
            className="w-14 h-14 rounded-full object-cover bg-white"
            onClick={handleOwnerClick}
          />
          <div>
            <div className="text-lg font-semibold" onClick={handleOwnerClick}>{ownerName}</div>
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
                    {review.date
                      ? new Date(review.date).toLocaleDateString("vi-VN")
                      : ""}
                  </span>
                </div>
              </div>
            </div>

            {review.comment.trim() && (
              <p className="text-sm text-gray-700 mt-3">{review.comment}</p>
            )}
          </div>
        ))}
      </div>

      {normalizedReviews.length > 2 && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="px-4 py-2 border rounded-lg text-green-600 border-green-600 hover:bg-green-50"
          >
            {showAll ? "Thu gọn" : "Xem thêm"}
          </button>
        </div>
      )}
    </div>
  );
};

export default OwnerProfile;
