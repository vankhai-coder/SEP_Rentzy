import { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllVehicleReports,
  updateVehicleReport,
  resetAdminReportState,
} from "../../../redux/features/renter/vehicleReport/vehicleReportSlice";
import {
  AlertCircle,
  Loader2,
  Calendar,
  CarFront,
  UserCheck,
  AlertTriangle,
  MessageCircle,
  BadgeCheck,
  UserX,
  Edit3,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

const Reports = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { role } = useSelector((state) => state.userStore);
  const {
    allReports,
    allReportsLoading,
    allReportsCount,
    allReportsTotalPages,
    error,
    adminSuccess,
    updateLoading,
  } = useSelector((state) => state.vehicleReport);

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [formData, setFormData] = useState({ status: "", admin_note: "" });
  const [filterStatus, setFilterStatus] = useState(null);

  const debounceFilter = useCallback(
    (params) => {
      const timer = setTimeout(() => {
        dispatch(getAllVehicleReports(params));
      }, 300);
      return () => clearTimeout(timer);
    },
    [dispatch]
  );

  useEffect(() => {
    if (role !== "admin") {
      navigate("/login", { replace: true });
      return;
    }

    const status = searchParams.get("status") || null;
    const page = parseInt(searchParams.get("page")) || 1;
    setCurrentPage(page);
    setFilterStatus(status);
    debounceFilter({ status, page, limit: ITEMS_PER_PAGE });

    return () => dispatch(resetAdminReportState());
  }, [dispatch, role, navigate, searchParams, debounceFilter]);

  useEffect(() => {
    if (adminSuccess) {
      toast.success("Cập nhật báo cáo thành công!");
      dispatch(resetAdminReportState());
      const status = searchParams.get("status") || null;
      debounceFilter({ status, page: currentPage, limit: ITEMS_PER_PAGE });
    }
  }, [adminSuccess, dispatch, searchParams, debounceFilter, currentPage]);

  const handleFilterStatus = useCallback(
    (newStatus) => {
      setFilterStatus(newStatus);
      setCurrentPage(1);
      const newParams = new URLSearchParams(searchParams);
      if (newStatus) {
        newParams.set("status", newStatus);
      } else {
        newParams.delete("status");
      }
      newParams.set("page", "1");
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const handlePageChange = useCallback(
    (page) => {
      if (page < 1 || page > allReportsTotalPages) return;
      setCurrentPage(page);
      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", page.toString());
      setSearchParams(newParams);
      const status = searchParams.get("status") || null;
      debounceFilter({ status, page, limit: ITEMS_PER_PAGE });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [searchParams, setSearchParams, debounceFilter, allReportsTotalPages]
  );

  const handleOpenModal = (report) => {
    setSelectedReport(report);
    setFormData({ status: report.status, admin_note: report.admin_note || "" });
    setIsModalOpen(true);
  };

  const handleSubmitUpdate = (e) => {
    e.preventDefault();
    if (!formData.status || !selectedReport) return;
    dispatch(
      updateVehicleReport({
        report_id: selectedReport.report_id,
        status: formData.status,
        admin_note: formData.admin_note,
      })
    );
    setIsModalOpen(false);
  };

  const processedReports = useMemo(() => {
    if (!allReports || allReportsLoading) return [];

    const reasonMap = {
      fake_info: "Thông tin giả mạo",
      illegal: "Vi phạm pháp luật",
      bad_owner: "Chủ xe kém hợp tác",
      dangerous: "Xe nguy hiểm",
      other: "Khác",
    };

    const statusMap = {
      pending: "Chờ xử lý",
      reviewing: "Đang xem xét",
      resolved: "Đã giải quyết",
      rejected: "Bị từ chối",
    };

    return allReports.map((report) => ({
      ...report,
      reasonVN: reasonMap[report.reason] || report.reason,
      statusVN: statusMap[report.status] || report.status,
      adminNote: report.admin_note || "Chưa có ghi chú",
      isViolation:
        report.admin_note?.toLowerCase().includes("vi phạm") ||
        report.admin_note?.toLowerCase().includes("block"),
    }));
  }, [allReports, allReportsLoading]);

  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(allReportsTotalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < allReportsTotalPages) {
      if (endPage < allReportsTotalPages - 1) pages.push("...");
      pages.push(allReportsTotalPages);
    }

    return pages;
  };

  if (allReportsLoading && processedReports.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-pulse space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 dark:text-blue-400" />
          <p className="text-gray-600 dark:text-gray-400">Đang tải báo cáo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6">
        <AlertCircle className="h-6 w-6 mr-2 flex-shrink-0" />
        <span className="text-sm">Lỗi: {error}</span>
      </div>
    );
  }

  if (processedReports.length === 0 && allReportsCount === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <AlertCircle className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Chưa có báo cáo nào
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Hiện tại không có báo cáo nào trong hệ thống. Hãy kiểm tra lại sau.
        </p>
      </div>
    );
  }

  const pageNumbers = getPageNumbers();

  return (
    <div className="space-y-6 p-4 md:p-6 bg-white dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-full">
              <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Xử Lý Báo Cáo Xe
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Danh sách báo cáo ({allReports.length} báo cáo) - Trang{" "}
                {allReportsTotalPages > 0 ? currentPage : 0}/
                {allReportsTotalPages}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Lọc theo trạng thái:
            </label>
            <select
              value={filterStatus || ""}
              onChange={(e) => handleFilterStatus(e.target.value || null)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Tất cả</option>
              <option value="pending">Chờ xử lý</option>
              <option value="reviewing">Đang xem xét</option>
              <option value="resolved">Đã giải quyết</option>
              <option value="rejected">Bị từ chối</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Ngày tạo</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <CarFront className="h-4 w-4" />
                    <span>Biển số xe</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Model xe
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <UserCheck className="h-4 w-4" />
                    <span>Chủ xe</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <UserCheck className="h-4 w-4" />
                    <span>Người báo cáo</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Lý do</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>Tin nhắn</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <BadgeCheck className="h-4 w-4" />
                    <span>Trạng thái</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Ghi chú admin
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {processedReports.map((report) => (
                <tr
                  key={report.report_id}
                  className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-700 dark:hover:to-blue-900/20 transition-all duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span>
                        {new Date(report.created_at).toLocaleDateString(
                          "vi-VN",
                          {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                    <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs">
                      {report.vehicle?.license_plate || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {report.vehicle?.model || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="h-4 w-4 text-green-500" />
                      <span>{report.vehicle?.owner?.full_name || "N/A"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="h-4 w-4 text-blue-500" />
                      <span>{report.reporter?.full_name || "N/A"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        report.reasonVN === "Thông tin giả mạo"
                          ? "bg-orange-100 text-orange-800"
                          : report.reasonVN === "Vi phạm pháp luật"
                          ? "bg-red-100 text-red-800"
                          : report.reasonVN === "Chủ xe kém hợp tác"
                          ? "bg-yellow-100 text-yellow-800"
                          : report.reasonVN === "Xe nguy hiểm"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {report.reasonVN}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      <span
                        className="truncate"
                        title={report.message || "Không có"}
                      >
                        {report.message || "Không có mô tả"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
                        report.statusVN === "Chờ xử lý"
                          ? "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800"
                          : report.statusVN === "Đang xem xét"
                          ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800"
                          : report.statusVN === "Đã giải quyết"
                          ? "bg-gradient-to-r from-green-100 to-green-200 text-green-800"
                          : "bg-gradient-to-r from-red-100 to-red-200 text-red-800"
                      }`}
                    >
                      {report.statusVN}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs">
                    <div className="flex items-center space-x-2">
                      <UserX className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      <span
                        className="truncate italic"
                        title={report.adminNote}
                      >
                        {report.adminNote}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {report.status === "pending" ||
                    report.status === "reviewing" ? (
                      <button
                        onClick={() => handleOpenModal(report)}
                        disabled={updateLoading}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <Edit3 className="h-3 w-3" /> Xử lý
                      </button>
                    ) : report.isViolation ? (
                      <button
                        onClick={() =>
                          navigate(
                            `/admin/managementvehicle?vehicle_id=${report.vehicle_id}`
                          )
                        }
                        className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-xs rounded-full hover:bg-red-700 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" /> Quản lý PT
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">Hoàn tất</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {allReportsTotalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-6 border-t border-gray-200 dark:border-gray-700">
          {/* Trái: Thông tin trang */}
          <div className="text-sm text-gray-700 dark:text-gray-300 order-2 sm:order-1">
            Hiển thị trang <strong>{currentPage}</strong> trên{" "}
            <strong>{allReportsTotalPages}</strong>
          </div>

          {/* Phải: Các nút phân trang */}
          <div className="flex items-center gap-1 order-1 sm:order-2">
            {/* Nút Trước */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`
                w-10 h-10 flex items-center justify-center rounded-md transition-all duration-200
                ${
                  currentPage === 1
                    ? "opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer hover:shadow-sm text-gray-700 dark:text-gray-300"
                }
              `}
              title="Trang trước"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Các số trang */}
            {pageNumbers.map((page, index) => {
              if (page === "...") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-3 text-gray-500 dark:text-gray-400 select-none"
                  >
                    ...
                  </span>
                );
              }
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`
                    w-10 h-10 flex items-center justify-center rounded-md font-medium transition-all duration-200
                    ${
                      page === currentPage
                        ? "bg-black dark:bg-primary-600 text-white cursor-default shadow-md"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer hover:shadow-sm text-gray-700 dark:text-gray-300"
                    }
                  `}
                  title={`Trang ${page}`}
                >
                  {page}
                </button>
              );
            })}

            {/* Nút Tiếp */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === allReportsTotalPages}
              className={`
                w-10 h-10 flex items-center justify-center rounded-md transition-all duration-200
                ${
                  currentPage === allReportsTotalPages
                    ? "opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer hover:shadow-sm text-gray-700 dark:text-gray-300"
                }
              `}
              title="Trang sau"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Xử lý báo cáo</h2>
            <form onSubmit={handleSubmitUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Trạng thái mới
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Chọn trạng thái</option>
                  <option value="reviewing">Đang xem xét</option>
                  <option value="resolved">Đã giải quyết</option>
                  <option value="rejected">Bị từ chối</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Ghi chú admin
                </label>
                <textarea
                  value={formData.admin_note}
                  onChange={(e) =>
                    setFormData({ ...formData, admin_note: e.target.value })
                  }
                  rows={4}
                  placeholder="Ghi chú xử lý (ví dụ: 'Xe vi phạm, đã block')"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updateLoading || !formData.status}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {updateLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Cập nhật"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
        Dữ liệu được cập nhật theo thời gian thực. Báo cáo mới nhất ở trên cùng.
      </div>
    </div>
  );
};

export default Reports;
