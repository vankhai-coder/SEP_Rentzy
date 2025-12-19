import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getMyVehicleReports,
  resetReportState,
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const MyReportedVehicles = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userId } = useSelector((state) => state.userStore);
  const { myReports, myReportsLoading, error, myReportsTotalPages } =
    useSelector((state) => state.vehicleReport);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (!userId) {
      navigate("/login", { replace: true });
      return;
    }

    dispatch(getMyVehicleReports({ page: currentPage, limit: ITEMS_PER_PAGE }));

    return () => dispatch(resetReportState());
  }, [dispatch, userId, navigate, currentPage]);

  const processedReports = useMemo(() => {
    if (!myReports || myReportsLoading) return [];

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

    return myReports.map((report) => ({
      ...report,
      reasonVN: reasonMap[report.reason] || report.reason,
      statusVN: statusMap[report.status] || report.status,
      adminNote: report.admin_note || "Chưa có ghi chú",
    }));
  }, [myReports, myReportsLoading]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= myReportsTotalPages && page !== currentPage) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(myReportsTotalPages, startPage + maxButtons - 1);

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

    if (endPage < myReportsTotalPages) {
      if (endPage < myReportsTotalPages - 1) pages.push("...");
      pages.push(myReportsTotalPages);
    }

    return pages;
  };

  if (myReportsLoading && processedReports.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && error.includes("Phiên đăng nhập hết hạn")) {
    localStorage.removeItem("user_id");
    navigate("/login", { replace: true });
    return (
      <div className="text-center py-8">Đang chuyển hướng đăng nhập...</div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-red-600 bg-red-50 rounded-lg border border-red-200 p-6">
        <AlertCircle className="h-6 w-6 mr-2 flex-shrink-0" />
        <span className="text-sm">Lỗi: {error}</span>
      </div>
    );
  }

  if (processedReports.length === 0 && !myReportsLoading) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
        <AlertCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Chưa có báo cáo nào
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Bạn chưa báo cáo xe nào. Hãy duyệt xe và báo cáo nếu phát hiện vấn đề
          để giúp cộng đồng.
        </p>
      </div>
    );
  }

  const pageNumbers = getPageNumbers();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Xe đã báo cáo
              </h1>
              <p className="text-sm text-gray-600">
                Danh sách báo cáo ({myReports.length} báo cáo) - Trang{" "}
                {myReportsTotalPages > 0 ? currentPage : 0}/
                {myReportsTotalPages}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bảng */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Ngày tạo</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <CarFront className="h-4 w-4" />
                    <span>Biển số xe</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Tên xe
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <UserCheck className="h-4 w-4" />
                    <span>Chủ xe</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Lý do</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>Tin nhắn</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <BadgeCheck className="h-4 w-4" />
                    <span>Trạng thái</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Ghi chú admin
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedReports.map((report) => (
                <tr
                  key={report.report_id}
                  className="hover:bg-blue-50 transition-colors duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {report.vehicle?.license_plate || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {report.vehicle?.model || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="h-4 w-4 text-green-500" />
                      <span>{report.vehicle?.owner?.full_name || "N/A"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        report.reason === "Thông tin giả mạo"
                          ? "bg-orange-100 text-orange-800"
                          : report.reason === "Vi phạm pháp luật"
                          ? "bg-red-100 text-red-800"
                          : report.reason === "Chủ xe kém hợp tác"
                          ? "bg-yellow-100 text-yellow-800"
                          : report.reason === "Xe nguy hiểm"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {report.reasonVN}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
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
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        report.statusVN === "Chờ xử lý"
                          ? "bg-yellow-100 text-yellow-800"
                          : report.statusVN === "Đang xem xét"
                          ? "bg-blue-100 text-blue-800"
                          : report.statusVN === "Đã giải quyết"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {report.statusVN}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                    <div className="flex items-center space-x-2">
                      <UserX className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span
                        className="truncate italic"
                        title={report.adminNote}
                      >
                        {report.adminNote}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {myReportsTotalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-6 border-t border-gray-200">
          {/* Trái: Thông tin trang */}
          <div className="text-sm text-gray-700 order-2 sm:order-1">
            Hiển thị trang <strong>{currentPage}</strong> trên{" "}
            <strong>{myReportsTotalPages}</strong>
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
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100 cursor-pointer hover:shadow-sm"
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
                    className="px-3 text-gray-500 select-none"
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
                        ? "bg-black text-white cursor-default shadow-md"
                        : "hover:bg-gray-100 cursor-pointer hover:shadow-sm text-gray-700"
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
              disabled={currentPage === myReportsTotalPages}
              className={`
                w-10 h-10 flex items-center justify-center rounded-md transition-all duration-200
                ${
                  currentPage === myReportsTotalPages
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100 cursor-pointer hover:shadow-sm"
                }
              `}
              title="Trang sau"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
        Dữ liệu được cập nhật theo thời gian thực. Báo cáo mới nhất ở trên cùng.
      </div>
    </div>
  );
};

export default MyReportedVehicles;
