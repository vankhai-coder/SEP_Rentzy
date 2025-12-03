import { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/config/axiosInstance";
import { toast } from "sonner";

const SystemSettingManagement = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editBuffer, setEditBuffer] = useState({});

  const [form, setForm] = useState({
    feeCode: "",
    name: "",
    percent: 0,
    description: "",
  });
  const feeCodes = useMemo(
    () => [
      "CANCEL_WITHIN_HOLD_1H",
      "CANCEL_BEFORE_7_DAYS",
      "CANCEL_WITHIN_7_DAYS",
      "PLATFORM_FEE_COMPLETE_ORDER",
      "LATE_RETURN_FEE_PER_HOUR",
      "OTHER_FEES",
    ],
    []
  );
  const CORE_CODES = useMemo(
    () =>
      new Set([
        "CANCEL_WITHIN_HOLD_1H",
        "CANCEL_BEFORE_7_DAYS",
        "CANCEL_WITHIN_7_DAYS",
        "PLATFORM_FEE_COMPLETE_ORDER",
      ]),
    []
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/admin/system-settings", {
        params: { q: query },
      });
      setItems(res.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải dữ liệu phí");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    try {
      if (!form.feeCode || !form.name) {
        toast.error("Vui lòng nhập feeCode và name");
        return;
      }
      const payload = {
        feeCode: form.feeCode,
        name: form.name,
        percent: Number(form.percent) || 0,
        description: form.description || "",
      };
      const res = await axiosInstance.post(
        "/api/admin/system-settings",
        payload
      );
      toast.success("Tạo phí thành công");
      setForm({ feeCode: "", name: "", percent: 0, description: "" });
      setItems((prev) => [res.data, ...prev]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể tạo phí");
    }
  };

  const handleUpdate = async (id, patch) => {
    try {
      const res = await axiosInstance.put(
        `/api/admin/system-settings/${id}`,
        patch
      );
      setItems((prev) => prev.map((it) => (it.id === id ? res.data : it)));
      toast.success("Đã lưu");
      setEditingId(null);
      setEditBuffer({});
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể cập nhật");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/api/admin/system-settings/${id}`);
      setItems((prev) => prev.filter((it) => it.id !== id));
      toast.success("Đã xoá");
    } catch (error) {
      toast.error("Không thể xoá", error);
    }
  };

  return (
    <div className="p-4 lg:p-6 dark:bg-[#020617] min-h-screen">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
              Quản lý phí hệ thống
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm..."
              className="px-3 py-2 border rounded-lg bg-transparent text-sm"
            />
            <button
              onClick={fetchData}
              className="px-4 py-2 rounded-lg border-2 border-primary-600 text-primary-600 hover:bg-primary-50"
            >
              Tải lại
            </button>
          </div>
        </div>

        {/* Create form */}
        <div className="bg-white dark:bg-secondary-900 rounded-xl p-4 border border-secondary-200 dark:border-secondary-800">
          <h2 className="text-xl font-semibold mb-4">Tạo phí mới</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              value={form.feeCode}
              onChange={(e) =>
                setForm((f) => ({ ...f, feeCode: e.target.value }))
              }
              className="px-3 py-2 border rounded-lg bg-transparent"
            >
              <option value="">Chọn mã phí</option>
              {feeCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Tên phí"
              className="px-3 py-2 border rounded-lg bg-transparent"
            />
            <input
              type="number"
              value={form.percent}
              onChange={(e) =>
                setForm((f) => ({ ...f, percent: e.target.value }))
              }
              placeholder="%"
              className="px-3 py-2 border rounded-lg bg-transparent"
            />
            <input
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Mô tả"
              className="px-3 py-2 border rounded-lg bg-transparent"
            />
          </div>
          <div className="mt-4">
            <button
              onClick={handleCreate}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            >
              Tạo
            </button>
          </div>
        </div>

        {/* Table list */}
        <div className="bg-white dark:bg-secondary-900 rounded-xl p-4 border border-secondary-200 dark:border-secondary-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Danh sách phí</h2>
            {loading && <span className="text-sm">Đang tải...</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-2">Mã phí</th>
                  <th className="p-2">Tên</th>
                  <th className="p-2">Phần trăm</th>
                  <th className="p-2">Mô tả</th>
                  <th className="p-2">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-b">
                    <td className="p-2">
                      {editingId === it.id ? (
                        <select
                          value={editBuffer.feeCode}
                          onChange={(e) =>
                            setEditBuffer((buf) => ({
                              ...buf,
                              feeCode: e.target.value,
                            }))
                          }
                          className="px-2 py-1 border rounded"
                        >
                          {feeCodes.map((code) => (
                            <option key={code} value={code}>
                              {code}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="px-2 py-1 inline-block">
                          {it.feeCode}
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      {editingId === it.id ? (
                        <input
                          value={editBuffer.name || ""}
                          onChange={(e) =>
                            setEditBuffer((buf) => ({
                              ...buf,
                              name: e.target.value,
                            }))
                          }
                          className="px-2 py-1 border rounded w-full bg-transparent"
                        />
                      ) : (
                        <span className="px-2 py-1 inline-block w-full">
                          {it.name}
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      {editingId === it.id ? (
                        <input
                          type="number"
                          value={editBuffer.percent ?? 0}
                          onChange={(e) =>
                            setEditBuffer((buf) => ({
                              ...buf,
                              percent: Number(e.target.value),
                            }))
                          }
                          className="px-2 py-1 border rounded w-24 bg-transparent"
                        />
                      ) : (
                        <span className="px-2 py-1 inline-block w-24">
                          {it.percent}
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      {editingId === it.id ? (
                        <input
                          value={editBuffer.description || ""}
                          onChange={(e) =>
                            setEditBuffer((buf) => ({
                              ...buf,
                              description: e.target.value,
                            }))
                          }
                          className="px-2 py-1 border rounded w-full bg-transparent"
                        />
                      ) : (
                        <span className="px-2 py-1 inline-block w-full">
                          {it.description}
                        </span>
                      )}
                    </td>
                    <td className="p-2 flex items-center gap-2">
                      {editingId === it.id ? (
                        <>
                          <button
                            onClick={() => handleUpdate(it.id, editBuffer)}
                            className="px-3 py-1 rounded bg-primary-600 text-white hover:bg-primary-700"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditBuffer({});
                            }}
                            className="px-3 py-1 rounded border"
                          >
                            Huỷ
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(it.id);
                              setEditBuffer({
                                feeCode: it.feeCode,
                                name: it.name || "",
                                percent: it.percent ?? 0,
                                description: it.description || "",
                              });
                            }}
                            className="px-3 py-1 rounded bg-secondary-100 hover:bg-secondary-200"
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            onClick={() => handleDelete(it.id)}
                            disabled={CORE_CODES.has(it.feeCode)}
                            className={`px-3 py-1 rounded text-white ${
                              CORE_CODES.has(it.feeCode)
                                ? "bg-red-500/60 cursor-not-allowed opacity-60"
                                : "bg-red-500 hover:bg-red-600"
                            }`}
                            title={
                              CORE_CODES.has(it.feeCode)
                                ? "Không thể xoá phí cốt lõi"
                                : "Xoá"
                            }
                          >
                            Xoá
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan="5"
                      className="p-4 text-center text-secondary-500"
                    >
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingManagement;
