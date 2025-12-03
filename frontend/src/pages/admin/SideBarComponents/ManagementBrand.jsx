import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/config/axiosInstance";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FaMotorcycle, FaBorderAll } from "react-icons/fa";
import { CarFront, Pencil, Plus, Trash2, FileText, Car, Bike, Grid3x3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";

import CreateBrandDialog from "../../../components/admin/brand/CreateBrandDialog";
import EditBrandDialog from "../../../components/admin/brand/EditBrandDialog";
import DeleteConfirmDialog from "../../../components/admin/brand/DeleteConfirmDialog ";

const ManagementBrand = () => {
  // === State Management ===
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
  });

  const queryClient = useQueryClient();

  // === API Calls ===
  const fetchBrands = async () => {
    const res = await axiosInstance.get("/api/admin/brands", {
      params: {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        sortBy: sortBy,
      },
    });
    return res.data;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "admin-brands",
      pagination.currentPage,
      pagination.itemsPerPage,
      sortBy,
    ],
    queryFn: fetchBrands,
    onSuccess: (d) => {
      setPagination((p) => ({ ...p, ...d.pagination }));
    },
  });

  const brands = data?.items || [];
  const apiStats = data?.stats;

  const stats = useMemo(() => {
    if (apiStats) return apiStats;
    const total = brands.length;
    const car = brands.filter((b) => b.category === "car").length;
    const motorbike = brands.filter((b) => b.category === "motorbike").length;
    const both = brands.filter((b) => b.category === "both").length;
    return { total, car, motorbike, both };
  }, [brands, apiStats]);

  // === Pagination ===
  const computedTotalItems =
    pagination.totalItems ||
    data?.pagination?.totalItems ||
    stats?.total ||
    brands.length;
  const computedTotalPages =
    pagination.totalPages ||
    Math.ceil((computedTotalItems || 0) / (pagination.itemsPerPage || 10));

  const handlePageChange = (page) => {
    if (page < 1 || page > computedTotalPages) return;
    setPagination((p) => ({ ...p, currentPage: page }));
  };

  // === Delete Brand ===
  const handleDeleteClick = (brand) => {
    setSelectedBrand(brand);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    const toastId = toast.loading("Đang xóa thương hiệu...");

    try {
      await axiosInstance.delete(`/api/admin/brands/${selectedBrand.brand_id}`);
      await queryClient.invalidateQueries({ queryKey: ["admin-brands"] });

      toast.update(toastId, {
        render: "Xóa thương hiệu thành công",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setOpenDelete(false);
      setSelectedBrand(null);
    } catch (error) {
      const errorMsg = error?.response?.data?.message;
      toast.update(toastId, {
        render: errorMsg || "Không thể xóa thương hiệu",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  // === Render Pagination Buttons ===
  const renderPaginationButtons = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(
      1,
      pagination.currentPage - Math.floor(maxVisiblePages / 2)
    );
    let endPage = Math.min(computedTotalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 text-sm border rounded ${
            i === pagination.currentPage
              ? "bg-blue-500 text-white border-blue-500"
              : "border-gray-300 text-black hover:bg-gray-50"
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  // === JSX ===
  return (
    <div className="p-4 lg:p-6 dark:bg-[#020617] min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
              Quản Lý Thương Hiệu
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400">
              Tổng quan số lượng và danh sách tất cả thương hiệu
            </p>
          </div>
          <Button
            onClick={() => setOpenCreate(true)}
            className="gap-2 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4" />
            Thêm Thương Hiệu
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Tổng thương hiệu
                </p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                  {isLoading ? "Loading..." : isError ? "Error" : stats.total}
                </p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Ô tô
                </p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                  {isLoading ? "-" : stats.car}
                </p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                <Car className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg border border-orange-200 dark:border-orange-800 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  Xe máy
                </p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">
                  {isLoading ? "-" : stats.motorbike}
                </p>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg">
                <Bike className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  Cả hai
                </p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                  {isLoading ? "-" : stats.both}
                </p>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                <Grid3x3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Brands Table */}
        <div className="card transition-all duration-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">
              Danh sách thương hiệu
            </h2>

            {/* Dropdown sắp xếp */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Sắp xếp:
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPagination((p) => ({ ...p, currentPage: 1 }));
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="name">Tên (A-Z)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg shadow-sm">
            <Table>
              <TableHeader className="bg-blue-500 text-white">
                <TableRow>
                  <TableHead className="text-white">Logo</TableHead>
                  <TableHead className="text-white">Tên</TableHead>
                  <TableHead className="text-white">Quốc gia</TableHead>
                  <TableHead className="text-white">Loại xe</TableHead>
                  <TableHead className="text-white">Số xe</TableHead>
                  <TableHead className="text-right text-white">
                    Hành động
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                )}
                {isError && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-red-500"
                    >
                      Lỗi tải dữ liệu
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && !isError && brands.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-gray-500"
                    >
                      Không có thương hiệu
                    </TableCell>
                  </TableRow>
                )}
                {brands.map((b) => (
                  <TableRow key={b.brand_id}>
                    <TableCell>
                      {b.logo_url ? (
                        <img
                          src={b.logo_url}
                          alt={b.name}
                          className="w-10 h-10 rounded object-contain bg-white border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-secondary-200 dark:bg-secondary-800 flex items-center justify-center text-secondary-700 dark:text-secondary-300 text-xs font-semibold">
                          {b.name?.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell>{b.country || "-"}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300">
                        {b.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {b.vehicle_count || 0} xe
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 hover:bg-blue-500 hover:text-white"
                          onClick={() => {
                            setSelectedBrand(b);
                            setOpenEdit(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                          Sửa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 hover:bg-red-500 hover:text-white"
                          onClick={() => handleDeleteClick(b)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Xóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {computedTotalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Hiển thị{" "}
                {Math.min(
                  (pagination.currentPage - 1) * pagination.itemsPerPage + 1,
                  computedTotalItems
                )}{" "}
                -{" "}
                {Math.min(
                  pagination.currentPage * pagination.itemsPerPage,
                  computedTotalItems
                )}{" "}
                trong tổng số {computedTotalItems} thương hiệu
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                {renderPaginationButtons()}
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === computedTotalPages}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CreateBrandDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        brands={brands}
      />
      <EditBrandDialog
        open={openEdit}
        onOpenChange={setOpenEdit}
        brand={selectedBrand}
        brands={brands}
      />
      <DeleteConfirmDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        brand={selectedBrand}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default ManagementBrand;
