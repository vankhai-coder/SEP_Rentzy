
import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import axiosInstance from "@/config/axiosInstance"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FaMotorcycle , FaBorderAll  } from "react-icons/fa"
import{
  CarFront ,
  MonitorCheck,
  Pencil
} from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


const ManagementBrand = () => {
  const [openEdit, setOpenEdit] = useState(false)
  const [selected, setSelected] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  const queryClient = useQueryClient()
  const [pagination, setPagination] = useState({ currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0 })

  const fetchBrands = async () => {
    const res = await axiosInstance.get("/api/admin/brands", { params: { page: pagination.currentPage, limit: pagination.itemsPerPage } })
    return res.data
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-brands", pagination.currentPage, pagination.itemsPerPage],
    queryFn: fetchBrands,
    onSuccess: (d) => {
      setPagination((p) => ({ ...p, ...d.pagination }))
    }
  })

  const brands = data?.items || []
  const apiStats = data?.stats

  const stats = useMemo(() => {
    if (apiStats) return apiStats
    const total = brands.length
    const car = brands.filter((b) => b.category === "car").length
    const motorbike = brands.filter((b) => b.category === "motorbike").length
    const both = brands.filter((b) => b.category === "both").length
    return { total, car, motorbike, both }
  }, [brands, apiStats])

  const handlePageChange = (page) => {
    if (page < 1 || page > computedTotalPages) return
    setPagination((p) => ({ ...p, currentPage: page }))
  }

  const computedTotalItems = pagination.totalItems || data?.pagination?.totalItems || stats?.total || brands.length
  const computedTotalPages = pagination.totalPages || Math.ceil((computedTotalItems || 0) / (pagination.itemsPerPage || 10))

  return (
    <div className="p-4 lg:p-6 dark:bg-[#020617] min-h-screen ">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">Quản Lý Thương Hiệu</h1>
            <p className="text-secondary-600 dark:text-secondary-400">Tổng quan số lượng và danh sách tất cả thương hiệu</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card transition-all duration-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Tổng thương hiệu</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">{isLoading ? "Loading..." : isError ? "Error" : stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <img src="/rentzy_logo.png" alt="logo" className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="card transition-all duration-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Ô tô</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">{isLoading ? "-" : stats.car}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center">
                <CarFront className="text-secondary-700 dark:text-secondary-300">CAR</CarFront>
              </div>
            </div>
          </div>
          <div className="card transition-all duration-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Xe máy</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">{isLoading ? "-" : stats.motorbike}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center">
                <FaMotorcycle className="text-secondary-700 dark:text-secondary-300">BIKE</FaMotorcycle>
              </div>
            </div>
          </div>
          <div className="card transition-all duration-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Cả hai</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">{isLoading ? "-" : stats.both}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center">
                <FaBorderAll  className="text-secondary-700 dark:text-secondary-300">BOTH</FaBorderAll>
              </div>
            </div>
          </div>
        </div>

        <div className="card transition-all duration-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">Danh sách thương hiệu</h2>
          </div>

          <div className="overflow-x-auto rounded-lg shadow-sm">
            <Table>
              <TableHeader className="bg-blue-500  text-white">
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Quốc gia</TableHead>
                  <TableHead>Loại xe</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Đang tải...</TableCell>
                  </TableRow>
                )}
                {isError && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Lỗi tải dữ liệu</TableCell>
                  </TableRow>
                )}
                {!isLoading && !isError && brands.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Không có thương hiệu</TableCell>
                  </TableRow>
                )}
                {brands.map((b) => (
                  <TableRow key={b.brand_id}>
                    <TableCell>
                      {b.logo_url ? (
                        <img src={b.logo_url} alt={b.name} className="w-10 h-10 rounded object-contain bg-white" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-secondary-200 dark:bg-secondary-800 flex items-center justify-center text-secondary-700 dark:text-secondary-300">
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
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        className="gap-2 hover:bg-blue-500 hover:text-white"
                        onClick={() => {
                          setSelected(b)
                          setOpenEdit(true)
                          setSelectedFile(null)
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                        Chỉnh Sửa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {computedTotalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, computedTotalItems)} trong tổng số {computedTotalItems} thương hiệu
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="px-3 py-1 border border-gray-300 rounded text-sm text-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Trước</button>
                {(() => {
                  const pages = []
                  const maxVisiblePages = 5
                  let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2))
                  let endPage = Math.min(computedTotalPages, startPage + maxVisiblePages - 1)
                  if (endPage - startPage + 1 < maxVisiblePages) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1)
                  }
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button key={i} onClick={() => handlePageChange(i)} className={`px-3 py-1 text-sm border rounded ${i === pagination.currentPage ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 text-black hover:bg-gray-50'}`}>{i}</button>
                    )
                  }
                  return pages
                })()}
                <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === computedTotalPages} className="px-3 py-1 border border-gray-300 rounded text-sm text-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Sau</button>
              </div>
            </div>
          )}
        </div>

        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa thương hiệu</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">Tên</p>
                  <Input value={selected?.name || ""} onChange={(e) => setSelected({ ...selected, name: e.target.value })} />
                </div>
                <div>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">Quốc gia</p>
                  <Input value={selected?.country || ""} onChange={(e) => setSelected({ ...selected, country: e.target.value })} />
                </div>
                <div>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">Logo URL</p>
                  <Input value={selected?.logo_url || ""} onChange={(e) => setSelected({ ...selected, logo_url: e.target.value })} />
                  <div className="mt-2">
                    <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">Loại xe</p>
                  <Select value={selected?.category || ""} onValueChange={(v) => setSelected({ ...selected, category: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Loại xe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">car</SelectItem>
                      <SelectItem value="motorbike">motorbike</SelectItem>
                      <SelectItem value="both">both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setOpenEdit(false)}>Đóng</Button>
                <Button onClick={async () => {
                  if (!selected) return
                  if (selectedFile) {
                    const fd = new FormData()
                    fd.append("name", selected.name || "")
                    fd.append("country", selected.country || "")
                    fd.append("category", selected.category || "both")
                    fd.append("logo", selectedFile)
                    await axiosInstance.patch(`/api/admin/brands/${selected.brand_id}`, fd, { headers: { "Content-Type": "multipart/form-data" } })
                  } else {
                    const payload = {
                      name: selected.name,
                      country: selected.country,
                      logo_url: selected.logo_url,
                      category: selected.category,
                    }
                    await axiosInstance.patch(`/api/admin/brands/${selected.brand_id}`, payload)
                  }
                  setOpenEdit(false)
                  setSelected(null)
                  setSelectedFile(null)
                  queryClient.invalidateQueries({ queryKey: ["admin-brands"] })
                }}>Lưu</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default ManagementBrand
