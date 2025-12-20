import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../config/axiosInstance.js";
import VehicleCard from "../../../components/renter/vehicles/VehicleCard.jsx";
import { MdDirectionsCar } from "react-icons/md";
import { Bike, Users, Gauge, Settings, ChevronDown, ArrowLeft } from "lucide-react";
import "./OwnerPublicPage.scss";
import { setMessageUserDetails } from "@/redux/features/admin/messageSlice.js";
import { useDispatch } from "react-redux";

const OwnerPublicPage = () => {
  const { ownerId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchOwner = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(
          `/api/renter/owner-public/${ownerId}`
        );
        setData(res.data?.data || null);
        setError(null);
      } catch (e) {
        setError(e.response?.data?.message || e.message || "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchOwner();
  }, [ownerId]);

  const iconSpecsFor = (v) => {
    if (v.vehicle_type === "car") {
      return [
        { icon: <Users size={16} />, value: `${v.seats || 5} chỗ` },
        {
          icon: <Settings size={16} />,
          value: v.transmission === "automatic" ? "Tự động" : "Số tay",
        },
        {
          icon: <Gauge size={16} />,
          value: v.fuel_type === "electric" ? "Điện" : "Xăng",
        },
      ];
    }
    return [
      { icon: <Bike size={16} />, value: v.bike_type || "Xe máy" },
      { icon: <Settings size={16} />, value: "—" },
      { icon: <Gauge size={16} />, value: `${v.engine_capacity || 110} cc` },
    ];
  };

  const ratingSummary = useMemo(() => {
    const avg = Number(data?.metrics?.rating_avg || 0).toFixed(1);
    const count = data?.metrics?.rating_count || 0;
    return { avg, count };
  }, [data]);

  if (loading) {
    return (
      <div className="owner-public-page">
        <div className="owner-public-page__container">
          <div className="owner-public-page__loading">
            Đang tải trang chủ xe...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="owner-public-page">
        <div className="owner-public-page__container">
          <div className="owner-public-page__error">{error}</div>
        </div>
      </div>
    );
  }

  const owner = data?.owner;
  const vehicles = data?.vehicles || [];
  const reviews = data?.reviews || [];
  const metrics = data?.metrics || {};

  // Hiển thị 6 review đầu tiên hoặc tất cả
  const displayReviews = showAllReviews ? reviews : reviews.slice(0, 6);
  const hasMoreReviews = reviews.length > 6;

  return (
    <div className="owner-public-page">
      <div className="owner-public-page__container">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft size={20} className="mr-1" />
          Quay lại
        </button>

        {/* Owner Info Card */}
        <div className="owner-card">
          <div className="owner-card__content">
            <img
              src={owner?.avatar_url || "/default_avt.jpg"}
              alt={owner?.full_name || "Chủ xe"}
              className="owner-card__avatar"
            />
            <div className="owner-card__info">
              <h1 className="owner-card__name">
                {owner?.full_name || "Chủ xe"}
              </h1>
              <div className="owner-card__metrics">
                <div className="owner-card__metric">
                  <MdDirectionsCar className="owner-card__icon owner-card__icon--trips" />
                  <span>{metrics.trips || 0} chuyến</span>
                </div>
                <div className="owner-card__metric">
                  <span className="owner-card__rating">
                    {ratingSummary.avg}
                  </span>
                  <span> ({ratingSummary.count} đánh giá)</span>
                </div>
                <div className="">
                  <button
                    className="text-gray-600 hover:text-green-500 hidden lg:block cursor-pointer transition-colors"
                    title="Messages"
                    onClick={() => {
                      // dispatch to redux store :
                      dispatch(setMessageUserDetails({
                        // userFullNameOrEmail: user.full_name || user.email,
                        userFullNameOrEmail: owner.full_name || owner.email,
                        userIdToChatWith: owner.user_id,
                        userImageURL: owner.avatar_url
                      }));
                      navigate('/messages')
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicles Section */}
        <section className="vehicles-section">
          <h2 className="vehicles-section__title">
            Danh sách xe đang cho thuê
          </h2>
          <div className="vehicles-grid">
            {vehicles.map((v) => (
              <VehicleCard
                key={v.vehicle_id}
                vehicle={v}
                iconSpecs={iconSpecsFor(v)}
                type={v.vehicle_type}
              />
            ))}
            {vehicles.length === 0 && (
              <div className="vehicles-section__empty">
                Chủ xe chưa có xe cho thuê.
              </div>
            )}
          </div>
        </section>

        {/* Reviews Section */}
        <section className="reviews-section">
          <h2 className="reviews-section__title">Đánh giá về chủ xe</h2>
          <div className="reviews-list">
            {displayReviews.length === 0 && (
              <div className="reviews-section__empty">Chưa có đánh giá.</div>
            )}
            {displayReviews.map((rv) => (
              <div key={rv.review_id} className="review-card">
                <img
                  src={rv.renter?.avatar_url || "/default_avt.jpg"}
                  alt={rv.renter?.full_name || "Người thuê"}
                  className="review-card__avatar"
                />
                <div className="review-card__content">
                  <div className="review-card__header">
                    <div className="review-card__name">
                      {rv.renter?.full_name || "Người thuê"}
                    </div>
                    <div className="review-card__date">
                      {rv.created_at
                        ? new Date(rv.created_at).toLocaleDateString("vi-VN")
                        : ""}
                    </div>
                  </div>
                  <div className="review-card__rating">
                    {"★".repeat(Math.round(Number(rv.rating || 0)))}
                  </div>
                  {rv.comment?.trim() && (
                    <p className="review-card__comment">{rv.comment}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Show More Button */}
          {hasMoreReviews && (
            <div className="reviews-section__show-more">
              <button
                className="btn-show-more"
                onClick={() => setShowAllReviews(!showAllReviews)}
              >
                {showAllReviews ? (
                  <>
                    <ChevronDown className="rotate-180" size={18} />
                    Thu gọn
                  </>
                ) : (
                  <>
                    <ChevronDown size={18} />
                    Xem thêm {reviews.length - 6} đánh giá
                  </>
                )}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default OwnerPublicPage;
