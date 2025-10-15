import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../../../config/axiosInstance"; // Giả sử bạn có file cấu hình axios

export default function PromoCodeModal({ onConfirm, onCancel }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [promos, setPromos] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const fetchVouchers = async () => {
      setLoading(true);
      try {
        // Gọi API voucher chưa dùng
        const res = await axiosInstance.get("/api/renter/vouchers/unused", {
          headers: { "Accept-Language": "vi" },
        });
        const list = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];

        const now = new Date();
        const mapped = list.map((v) => {
          const start = v.valid_from ? new Date(v.valid_from) : null;
          const end = v.valid_to ? new Date(v.valid_to) : null;
          const activeWindow = start && end ? now >= start && now <= end : true;
          const availableUsage =
            v.usage_limit == null ||
            Number(v.used_count || 0) < Number(v.usage_limit);
          const expired = end ? now > end : false;
          const eligible =
            Boolean(v.is_active) && activeWindow && availableUsage && !expired;

          const type = v.discount_type === "PERCENT" ? "percent" : "flat";
          const value = Number(v.discount_value);
          const maxDiscount =
            v.max_discount != null ? Number(v.max_discount) : undefined;

          const label =
            type === "percent"
              ? `Giảm ${value}%${
                  maxDiscount
                    ? ` (tối đa ${maxDiscount.toLocaleString("vi-VN")}đ)`
                    : ""
                }`
              : `Giảm ${value.toLocaleString("vi-VN")}đ`;

          return {
            code: v.code,
            label,
            type, // 'percent' | 'flat'
            value,
            maxDiscount,
            eligible,
            expired,
            title: v.title,
            image_url: v.image_url,
            minOrderAmount: v.min_order_amount ? Number(v.min_order_amount) : 0,
            raw: v, // giữ raw để cần thì dùng
          };
        });

        if (!cancelled) {
          setPromos(mapped);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            "Không thể tải voucher";
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchVouchers();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return promos;
    return promos.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        (p.title || "").toLowerCase().includes(q) ||
        (p.label || "").toLowerCase().includes(q)
    );
  }, [query, promos]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Mã khuyến mãi</h3>
            <button
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
              onClick={onCancel}
              aria-label="Đóng"
            >
              ×
            </button>
          </div>

          <div className="p-4">
            <input
              type="text"
              placeholder="Nhập mã khuyến mãi"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />

            <div className="mt-4 space-y-3 max-h-72 overflow-auto">
              {loading && (
                <div className="text-sm text-gray-500 px-1">
                  Đang tải mã khuyến mãi...
                </div>
              )}

              {error && !loading && (
                <div className="text-sm text-red-600 px-1">{error}</div>
              )}

              {!loading &&
                !error &&
                filtered.map((p) => {
                  const disabled = p.expired || !p.eligible;
                  return (
                    <div
                      key={p.code}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div>
                        <div
                          className={`text-sm font-semibold ${
                            disabled ? "text-gray-400" : "text-gray-800"
                          }`}
                        >
                          {p.code}
                        </div>
                        <div
                          className={`text-xs ${
                            disabled ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {p.title ? `${p.title} — ${p.label}` : p.label}
                        </div>
                        {p.expired && (
                          <div className="text-xs text-orange-600 mt-1">
                            Hết hạn
                          </div>
                        )}
                        {!p.expired && !p.eligible && (
                          <div className="text-xs text-gray-400 mt-1">
                            Mã khuyến mãi không khả dụng
                          </div>
                        )}
                      </div>
                      <button
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          disabled
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                        disabled={disabled}
                        onClick={() => onConfirm?.(p)}
                      >
                        Áp dụng
                      </button>
                    </div>
                  );
                })}

              {!loading && !error && filtered.length === 0 && (
                <div className="text-sm text-gray-500 px-1">
                  Không có mã phù hợp
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t flex justify-end">
            <button
              className="px-4 py-2 rounded-md bg-gray-200 text-sm"
              onClick={onCancel}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
