import React, { useEffect, useState, useMemo } from "react";
import axiosInstance from "../../../config/axiosInstance.js";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Search, ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";

const TrafficFinePayoutManagement = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [confirming, setConfirming] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const resp = await axiosInstance.get("/api/admin/traffic-fine-requests/payouts", {
        params: { page: currentPage, limit: itemsPerPage, search: searchTerm || undefined },
      });
      if (resp.data?.success) {
        setItems(resp.data.data?.payouts || []);
        setTotalPages(resp.data.data?.pagination?.totalPages || 1);
      }
    } catch (err) {
      setError("Không thể tải danh sách chuyển tiền phạt nguội");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [currentPage]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(amount || 0));
  };

  const handleTransfer = async (bookingId) => {
    try {
      setConfirming(true);
      const resp = await axiosInstance.patch(`/api/admin/traffic-fine-requests/bookings/${bookingId}/transfer`);
      if (resp.data?.success) {
        await fetchItems();
      }
    } catch (err) {
      // noop
    } finally {
      setConfirming(false);
    }
  };

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return items;
    return items.filter((it) => String(it.booking_id).includes(term) || it.owner?.full_name?.toLowerCase().includes(term));
  }, [items, searchTerm]);

  return (
    <div className="p-4 lg:p-6 dark:bg-[#020617] min-h-screen">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">Chuyển tiền phạt nguội</h1>
            <p className="text-secondary-600 dark:text-secondary-400">Xác nhận chuyển tiền phạt nguội cho chủ xe sau khi người thuê đã thanh toán</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-white dark:bg-secondary-900">
              <Search className="w-4 h-4 text-secondary-500" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm booking hoặc chủ xe..."
                className="bg-transparent outline-none text-sm"
              />
            </div>
            <button onClick={fetchItems} className="px-4 py-2 rounded-lg border-2 border-primary-600 text-primary-600 hover:bg-primary-50">Tải lại</button>
          </div>
        </div>

        <div className="bg-white dark:bg-secondary-900 rounded-xl border border-secondary-200 dark:border-secondary-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-secondary-50 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-200">
                  <th className="px-4 py-3 text-left text-xs font-medium">Booking</th>
                  <th className="px-4 py-3 text-left text-xs font-medium">Chủ xe</th>
                  <th className="px-4 py-3 text-left text-xs font-medium">Số tiền phạt</th>
                  <th className="px-4 py-3 text-left text-xs font-medium">Đã thanh toán</th>
                  <th className="px-4 py-3 text-left text-xs font-medium">Đã chuyển</th>
                  <th className="px-4 py-3 text-left text-xs font-medium">Còn phải chuyển</th>
                  <th className="px-4 py-3 text-left text-xs font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-secondary-900">
                {loading ? (
                  <tr><td className="px-4 py-6" colSpan={7}>Đang tải...</td></tr>
                ) : filteredItems.length === 0 ? (
                  <tr><td className="px-4 py-6" colSpan={7}>Không có mục cần chuyển</td></tr>
                ) : (
                  filteredItems.map((it) => (
                    <tr key={it.booking_id} className="border-t border-secondary-100 dark:border-secondary-800">
                      <td className="px-4 py-3">
                        <div className="font-semibold">#{it.booking_id}</div>
                        <div className="text-xs text-secondary-500">Cập nhật {format(new Date(it.updated_at), "dd/MM/yyyy HH:mm", { locale: vi })}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{it.owner?.full_name || "Chủ xe"}</div>
                        <div className="text-xs text-secondary-500">{it.owner?.email}</div>
                      </td>
                      <td className="px-4 py-3">{formatCurrency(it.traffic_fine_amount)}</td>
                      <td className="px-4 py-3">{formatCurrency(it.traffic_fine_paid)}</td>
                      <td className="px-4 py-3">{formatCurrency(it.transferred)}</td>
                      <td className="px-4 py-3 font-bold text-green-700">{formatCurrency(it.remaining_to_transfer)}</td>
                      <td className="px-4 py-3">
                        <button
                          disabled={confirming || it.remaining_to_transfer <= 0}
                          onClick={() => handleTransfer(it.booking_id)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                          title="Xác nhận đã chuyển khoản cho chủ xe"
                        >
                          <CheckCircle className="w-4 h-4" /> Xác nhận chuyển
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-secondary-100 dark:border-secondary-800">
            <div className="text-sm">Trang {currentPage} / {totalPages}</div>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))} disabled={currentPage === 1} className="px-3 py-2 rounded-lg border"> <ChevronLeft className="w-4 h-4" /> </button>
              <button onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-2 rounded-lg border"> <ChevronRight className="w-4 h-4" /> </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficFinePayoutManagement;