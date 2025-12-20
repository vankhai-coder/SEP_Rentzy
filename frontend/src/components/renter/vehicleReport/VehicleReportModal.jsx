import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  createReport,
  resetReportState,
} from "../../../redux/features/renter/vehicleReport/vehicleReportSlice";

const VehicleReportModal = ({ isOpen, onClose, vehicleId }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  const { loading, error, success } = useSelector(
    (state) => state.vehicleReport
  );

  const reasonOptions = [
    { value: "fake_info", label: "Thông tin giả mạo" },
    { value: "illegal", label: "Vi phạm pháp luật" },
    { value: "bad_owner", label: "Chủ xe kém hợp tác" },
    { value: "dangerous", label: "Xe nguy hiểm" },
    { value: "other", label: "Khác" },
  ];

  useEffect(() => {
    if (success) {
      toast.success("Báo cáo xe thành công. Cảm ơn bạn đã góp ý!");
      handleClose();
      dispatch(resetReportState());
    }
  }, [success, dispatch]);

  useEffect(() => {
    if (error && error.includes("đăng nhập")) {
      toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      navigate("/login");
      dispatch(resetReportState());
    }
  }, [error, navigate, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason || !message.trim()) {
      toast.error("Vui lòng chọn lý do và nhập mô tả.");
      return;
    }

    dispatch(createReport({ vehicleId, reason, message: message.trim() }));
  };

  const handleClose = () => {
    setReason("");
    setMessage("");
    dispatch(resetReportState());
    onClose();
  };

  if (!isOpen) return null;

  return typeof document !== "undefined"
    ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-red-600 text-white">
              <h3 className="text-xl font-bold">Báo cáo xe vi phạm</h3>
              <button
                type="button"
                onClick={handleClose}
                className="text-white hover:text-gray-200 transition text-2xl font-bold leading-none"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-6 max-h-[70vh] overflow-y-auto"
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do báo cáo *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">Chọn lý do</option>
                  {reasonOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  placeholder="Mô tả chi tiết về vấn đề..."
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading || !reason || !message.trim()}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Đang gửi..." : "Gửi báo cáo"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )
    : null;
};

export default VehicleReportModal;
