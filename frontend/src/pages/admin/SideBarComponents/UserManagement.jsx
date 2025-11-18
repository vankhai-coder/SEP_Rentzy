import { Ban, ChevronDown, ChevronLeft, ChevronRight, CircleX, Columns2, DollarSign, Download, Ellipsis, Eye, Search, ShieldCheck, Trash2, Trash2Icon, UserPlus, X } from "lucide-react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { TableFooter } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PopoverClose } from "@radix-ui/react-popover"
import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import axiosInstance from "@/config/axiosInstance"
import { useQuery } from "@tanstack/react-query"

const UserManagement = () => {


  // use tankstack query to fetch stats from backend api /api/admin/user-management/stats using axiosInstance: 
  const fetchUserStats = async () => {
    const response = await axiosInstance.get('/api/admin/user-management/stats');
    return response.data;
    // response.data : {
    //   totalUsers: 100,
    //   activeUsers: 80,
    //   renterUsers: 60,
    //   ownerUsers: 40
    // }
  };
  const { data: userStats, isLoading: isLoadingUserStats, isError: isErrorUserStats } = useQuery(
    {
      queryKey: ['user-stats'],
      queryFn: fetchUserStats
    }
  );

  // search filter states : include : nameOrEmail, role, isActive
  const [searchFilter, setSearchFilter] = useState({
    nameOrEmail: '',
    role: '',
    isActive: ''
  });

  const [users, setUsers] = useState([
    { id: 1, avatar: 'JD', name: 'John Doe', email: 'john.doe@example.com', role: 'admin', status: 'active', lastLogin: '2025-11-01', point: 120, phone: '0901234567', driverNumber: 'DL-123456789', bookings: 12, banned: false },
    { id: 2, avatar: 'AS', name: 'Alice Smith', email: 'alice.smith@example.com', role: 'owner', status: 'inactive', lastLogin: '2025-10-28', point: 85, phone: '0912345678', driverNumber: 'DL-987654321', bookings: 5, banned: false },
    { id: 3, avatar: 'BW', name: 'Bob Williams', email: 'bob.williams@example.com', role: 'renter', status: 'active', lastLogin: '2025-11-02', point: 95, phone: '0987654321', driverNumber: 'DL-222333444', bookings: 7, banned: true },
    { id: 4, avatar: 'MN', name: 'Minh Nguyen', email: 'minh.nguyen@example.com', role: 'owner', status: 'active', lastLogin: '2025-11-03', point: 140, phone: '0934567890', driverNumber: 'DL-555666777', bookings: 20, banned: false },
    { id: 5, avatar: 'AT', name: 'Anh Tran', email: 'anh.tran@example.com', role: 'renter', status: 'active', lastLogin: '2025-11-04', point: 60, phone: '0945678901', driverNumber: 'DL-101112131', bookings: 3, banned: false },
    { id: 6, avatar: 'ML', name: 'Michael Lee', email: 'michael.lee@example.com', role: 'admin', status: 'inactive', lastLogin: '2025-10-25', point: 200, phone: '0956789012', driverNumber: 'DL-141516171', bookings: 18, banned: false },
    { id: 7, avatar: 'SK', name: 'Sara Kim', email: 'sara.kim@example.com', role: 'owner', status: 'active', lastLogin: '2025-11-05', point: 88, phone: '0967890123', driverNumber: 'DL-181920212', bookings: 9, banned: false },
    { id: 8, avatar: 'DB', name: 'David Brown', email: 'david.brown@example.com', role: 'renter', status: 'inactive', lastLogin: '2025-10-20', point: 45, phone: '0978901234', driverNumber: 'DL-222324252', bookings: 1, banned: true },
    { id: 9, avatar: 'EC', name: 'Emily Clark', email: 'emily.clark@example.com', role: 'owner', status: 'active', lastLogin: '2025-11-06', point: 110, phone: '0989012345', driverNumber: 'DL-262728293', bookings: 14, banned: false },
    { id: 10, avatar: 'QP', name: 'Quang Pham', email: 'quang.pham@example.com', role: 'renter', status: 'active', lastLogin: '2025-11-07', point: 72, phone: '0990123456', driverNumber: 'DL-303132333', bookings: 4, banned: false },
    { id: 11, avatar: 'LV', name: 'Linh Vo', email: 'linh.vo@example.com', role: 'owner', status: 'inactive', lastLogin: '2025-10-15', point: 66, phone: '0902345678', driverNumber: 'DL-343536373', bookings: 2, banned: false },
    { id: 12, avatar: 'NH', name: 'Nam Hoang', email: 'nam.hoang@example.com', role: 'renter', status: 'active', lastLogin: '2025-11-07', point: 54, phone: '0913456789', driverNumber: 'DL-383940414', bookings: 6, banned: false },
    { id: 13, avatar: 'TT', name: 'Thu Tran', email: 'thu.tran@example.com', role: 'owner', status: 'active', lastLogin: '2025-11-08', point: 123, phone: '0924567890', driverNumber: 'DL-424344454', bookings: 11, banned: false },
    { id: 14, avatar: 'KL', name: 'Khoa Le', email: 'khoa.le@example.com', role: 'renter', status: 'inactive', lastLogin: '2025-10-10', point: 39, phone: '0935678901', driverNumber: 'DL-464748494', bookings: 0, banned: true },
    { id: 15, avatar: 'TH', name: 'Tuan Ho', email: 'tuan.ho@example.com', role: 'owner', status: 'active', lastLogin: '2025-11-09', point: 97, phone: '0946789012', driverNumber: 'DL-505152535', bookings: 8, banned: false },
    { id: 16, avatar: 'HB', name: 'Hoa Bui', email: 'hoa.bui@example.com', role: 'admin', status: 'active', lastLogin: '2025-11-09', point: 210, phone: '0957890123', driverNumber: 'DL-545556575', bookings: 22, banned: false },
    { id: 17, avatar: 'PS', name: 'Phuong Son', email: 'phuong.son@example.com', role: 'renter', status: 'active', lastLogin: '2025-11-09', point: 68, phone: '0968901234', driverNumber: 'DL-585960616', bookings: 5, banned: false },
    { id: 18, avatar: 'HT', name: 'Hieu Tran', email: 'hieu.tran@example.com', role: 'owner', status: 'inactive', lastLogin: '2025-10-05', point: 74, phone: '0979012345', driverNumber: 'DL-626364656', bookings: 3, banned: false },
    { id: 19, avatar: 'PL', name: 'Phuc Le', email: 'phuc.le@example.com', role: 'renter', status: 'active', lastLogin: '2025-11-10', point: 81, phone: '0980123456', driverNumber: 'DL-666768696', bookings: 10, banned: false },
    { id: 20, avatar: 'TT', name: 'Trang Truong', email: 'trang.truong@example.com', role: 'owner', status: 'active', lastLogin: '2025-11-10', point: 132, phone: '0991234567', driverNumber: 'DL-707172737', bookings: 13, banned: false },
    { id: 21, avatar: 'DH', name: 'Duc Hoang', email: 'duc.hoang@example.com', role: 'renter', status: 'inactive', lastLogin: '2025-10-02', point: 40, phone: '0903456789', driverNumber: 'DL-747576777', bookings: 1, banned: false },
    { id: 22, avatar: 'HB', name: 'Hanh Bui', email: 'hanh.bui@example.com', role: 'owner', status: 'active', lastLogin: '2025-11-10', point: 99, phone: '0914567890', driverNumber: 'DL-787980818', bookings: 9, banned: false },
    { id: 23, avatar: 'QN', name: 'Quy Nguyen', email: 'quy.nguyen@example.com', role: 'renter', status: 'active', lastLogin: '2025-11-11', point: 71, phone: '0925678901', driverNumber: 'DL-828384858', bookings: 6, banned: false },
    { id: 24, avatar: 'LT', name: 'Ly Tran', email: 'ly.tran@example.com', role: 'owner', status: 'inactive', lastLogin: '2025-10-01', point: 55, phone: '0936789012', driverNumber: 'DL-868788898', bookings: 2, banned: false },
    { id: 25, avatar: 'TV', name: 'Thanh Vu', email: 'thanh.vu@example.com', role: 'renter', status: 'active', lastLogin: '2025-11-11', point: 77, phone: '0947890123', driverNumber: 'DL-909192939', bookings: 7, banned: false },
    { id: 26, avatar: 'HN', name: 'Huong Nguyen', email: 'huong.nguyen@example.com', role: 'owner', status: 'active', lastLogin: '2025-11-11', point: 115, phone: '0958901234', driverNumber: 'DL-949596979', bookings: 12, banned: false },
    { id: 27, avatar: 'DD', name: 'Duy Do', email: 'duy.do@example.com', role: 'renter', status: 'inactive', lastLogin: '2025-09-29', point: 35, phone: '0969012345', driverNumber: 'DL-989900001', bookings: 0, banned: true },
    { id: 28, avatar: 'PT', name: 'Phuc Tran', email: 'phuc.tran@example.com', role: 'owner', status: 'active', lastLogin: '2025-11-12', point: 128, phone: '0970123456', driverNumber: 'DL-010203040', bookings: 16, banned: false },
    { id: 29, avatar: 'VH', name: 'Van Ho', email: 'van.ho@example.com', role: 'admin', status: 'active', lastLogin: '2025-11-12', point: 205, phone: '0981234567', driverNumber: 'DL-050607080', bookings: 21, banned: false },
    { id: 30, avatar: 'TN', name: 'Tien Nguyen', email: 'tien.nguyen@example.com', role: 'renter', status: 'active', lastLogin: '2025-11-12', point: 69, phone: '0992345678', driverNumber: 'DL-091011121', bookings: 8, banned: false },
  ])
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8
  const totalPages = useMemo(() => Math.ceil(users.length / pageSize), [users.length])
  const start = (currentPage - 1) * pageSize
  const paginatedUsers = users.slice(start, start + pageSize)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [selectedBookings, setSelectedBookings] = useState([])

  const generateBookingsForUser = (u) => {
    const baseId = u.id * 1000
    const sample = [
      { booking_id: baseId + 1, vehicle: 'Toyota Camry • 30A-12345', start_date: '2025-10-20', end_date: '2025-10-22', total_days: 2, total_amount: 320.0, status: 'completed', pickup_location: 'Hà Nội' },
      { booking_id: baseId + 2, vehicle: 'Honda CR-V • 31B-54321', start_date: '2025-10-25', end_date: '2025-10-28', total_days: 3, total_amount: 450.0, status: 'fully_paid', pickup_location: 'Đà Nẵng' },
      { booking_id: baseId + 3, vehicle: 'Tesla Model 3 • 88A-00088', start_date: '2025-11-01', end_date: '2025-11-03', total_days: 2, total_amount: 600.0, status: 'deposit_paid', pickup_location: 'TP.HCM' },
      { booking_id: baseId + 4, vehicle: 'Ford Ranger • 29C-77777', start_date: '2025-11-05', end_date: '2025-11-08', total_days: 3, total_amount: 390.0, status: 'in_progress', pickup_location: 'Cần Thơ' },
      { booking_id: baseId + 5, vehicle: 'Mazda CX-5 • 30G-22222', start_date: '2025-11-10', end_date: '2025-11-12', total_days: 2, total_amount: 260.0, status: 'pending', pickup_location: 'Hải Phòng' },
      { booking_id: baseId + 6, vehicle: 'VinFast VF8 • 99A-68686', start_date: '2025-11-12', end_date: '2025-11-15', total_days: 3, total_amount: 810.0, status: 'cancel_requested', pickup_location: 'Quảng Ninh' },
    ]
    return sample
  }
  const handleDelete = (id) => {
    const next = users.filter(u => u.id !== id)
    const nextTotalPages = Math.ceil(next.length / pageSize)
    const nextPage = Math.min(currentPage, Math.max(1, nextTotalPages))
    setUsers(next)
    setCurrentPage(nextPage)
  }
  const goToPage = (p) => { if (p >= 1 && p <= totalPages) setCurrentPage(p) }
  const handlePrev = () => goToPage(currentPage - 1)
  const handleNext = () => goToPage(currentPage + 1)
  return (
    <div className="p-4 lg:p-6 dark:bg-[#020617] ">
      <div className="space-y-6">
        <div className="flex items-center justify-between" >
          {/* User Management Title */}
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">Quản lí người dùng</h1>
            <p className="text-secondary-600 dark:text-secondary-400">Quản lí các thành viên trong nhóm và quyền truy cập tài khoản của họ</p>
          </div>
          {/* User Management Actions */}
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:ring-primary-500 px-4 py-2 text-base">
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:block"> Xuất dữ liệu</span>
            </button>
            <button className="inline-flex items-center gap-2 justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 px-4 py-2 text-base">
              <UserPlus />
              <span className="hidden sm:block"> Thêm người dùng</span>
            </button>
          </div>
        </div>
        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Users */}
          <div className="card transition-all duration-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Tổng người dùng</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">{isLoadingUserStats ? 'Loading...' : isErrorUserStats ? 'Error' : userStats?.totalUsers}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <ShieldCheck className="lucide lucide-shield h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>
          {/* Active Users */}
          <div className="card transition-all duration-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Tổng người dùng hoạt động</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">{isLoadingUserStats ? 'Loading...' : isErrorUserStats ? 'Error' : userStats?.activeUsers}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <ShieldCheck className="lucide lucide-shield h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>
          {/* Pending Invitations */}
          <div className="card transition-all duration-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Tổng chủ xe</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">{isLoadingUserStats ? 'Loading...' : isErrorUserStats ? 'Error' : userStats?.ownerUsers}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <ShieldCheck className="lucide lucide-shield h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>
          {/* Pending Invitations */}
          <div className="card transition-all duration-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Tổng người thuê</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">{isLoadingUserStats ? 'Loading...' : isErrorUserStats ? 'Error' : userStats?.renterUsers}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <ShieldCheck className="lucide lucide-shield h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>
        </div>
        {/* List of users  */}
        <div className="card p-6 transition-all duration-200">
          <div className="p-6">
            <div className="w-full space-y-4">
              {/* Search and filter */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-2  ">
                {/* enter name or email */}
                <div className="flex items-center gap-10 flex-col  md:flex-row ">
                  <input type="text" className="input px-6"
                    value={searchFilter.nameOrEmail}
                    onChange={(e) => setSearchFilter(prev => ({ ...prev, nameOrEmail: e.target.value }))}
                    placeholder="Tìm theo tên hoặc email..." />

                  {/* filter role */}
                  <div className="flex items-center gap-4">
                    {/* select role  */}
                    <Select
                      value={searchFilter.role}
                      onValueChange={(value) => setSearchFilter(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Vai trò" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="renter">Người thuê</SelectItem>
                        <SelectItem value="owner">Chủ xe</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* clear role that selected */}
                    <button onClick={() => {
                      setSearchFilter(prev => ({ ...prev, role: '' }));
                    }}>
                      <CircleX className="size-5 hover:cursor-pointer text-red-400" />
                    </button>
                  </div>

                  {/* filter status(is_active) */}
                  <div className="flex items-center gap-4">
                    {/* select role  */}
                    <Select
                      value={searchFilter.isActive}
                      onValueChange={(value) => setSearchFilter(prev => ({ ...prev, isActive: value }))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Hoạt động</SelectItem>
                        <SelectItem value="inactive">Không hoạt động</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* clear role that selected */}
                    <button onClick={() => {
                      setSearchFilter(prev => ({ ...prev, isActive: '' }));
                    }}>
                      <CircleX className="size-5 hover:cursor-pointer text-red-400" />
                    </button>
                  </div>

                </div>

                <div className="flex gap-6">
                  {/* filter clear all */}
                  <div className="flex items-center text-red-500">
                    <Button
                      onClick={() => {
                        setSearchFilter({
                          nameOrEmail: '',
                          role: '',
                          isActive: ''
                        });
                      }}
                      variant={'outline'}>
                      <Trash2 className="w-4 h-4" />
                      Xóa tất cả
                    </Button>
                  </div>
                  {/* search button */}
                  <div>
                    <Button
                      onClick={() => {
                        // Add search functionality here
                        console.log('Searching with filters:', searchFilter);
                      }}
                    >
                      <Search className="w-4 h-4" /> Tìm kiếm
                    </Button>
                  </div>
                </div>


              </div>
              {/* table */}
              <div>

                <Table>
                  <TableCaption>A list of your recent users.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Avatar</TableHead>
                      <TableHead>NAME</TableHead>
                      <TableHead>EMAIL</TableHead>
                      <TableHead>ROLE</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead>LAST LOGIN</TableHead>
                      <TableHead>POINT</TableHead>
                      <TableHead>ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.avatar}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell className={'text-secondary-600 dark:text-secondary-400'}>{user.email}</TableCell>
                        <TableCell>
                          {/* check if role is admin , owner or renter */}
                          { }                          {user.role === 'admin' && (
                            <span className="px-2 py-1 rounded-full text-sm bg-red-100 text-red-800">Admin</span>
                          )}
                          {user.role === 'owner' && (
                            <span className="px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800">Owner</span>
                          )}
                          {user.role === 'renter' && (
                            <span className="px-2 py-1 rounded-full text-sm bg-green-100 text-green-800">Renter</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {/* check if status is active or inactive */}
                          {user.status === 'active' ? (
                            <span className="px-2 py-1 rounded-full text-sm bg-green-100 text-green-800">Active</span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-sm bg-gray-100 text-gray-800">Inactive</span>
                          )}
                        </TableCell>
                        <TableCell className={'text-secondary-600 dark:text-secondary-400'}>{user.lastLogin}</TableCell>
                        <TableCell className={'text-secondary-600 dark:text-secondary-400'}>{user.point}</TableCell>
                        <TableCell>

                          {/* trigger "view more" in each user */}
                          <Popover className="hover:cursor-pointer">
                            <PopoverTrigger>
                              <Button variant={'outline'} className={'hover:cursor-pointer p-6 px-19'}>
                                <Ellipsis />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className={'p-0'}>
                              <div className="py-1 flex flex-col">
                                {/* view details */}
                                <PopoverClose>
                                  <button onClick={() => { setSelectedUser(user); setDialogOpen(true) }} className="group flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors duration-150 cursor-pointer text-secondary-900 dark:text-white">
                                    <span className="flex-shrink-0">
                                      <Eye className="lucide lucide-eye h-4 w-4" />
                                    </span>
                                    <span>View Details</span>
                                  </button>
                                </PopoverClose>
                                {/* ban account */}
                                <PopoverClose>
                                  <button onClick={() => handleDelete(user.id)} className="group flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors duration-150 cursor-pointer text-secondary-900 dark:text-white">
                                    <span className="flex-shrink-0">
                                      <Trash2 className="lucide h-4 w-4" />
                                    </span>
                                    <span>Delete User</span>
                                  </button>
                                </PopoverClose>
                                {/* view booking history */}
                                <PopoverClose>
                                  <button className="group flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors duration-150 cursor-pointer text-secondary-900 dark:text-white">
                                    <span className="flex-shrink-0">
                                      <DollarSign className="lucide lucide-dollar-sign h-4 w-4" />
                                    </span>
                                    <span onClick={() => { setSelectedBookings(generateBookingsForUser(user)); setBookingDialogOpen(true) }}>View Booking History</span>
                                  </button>
                                </PopoverClose>
                              </div>
                            </PopoverContent>
                          </Popover>

                        </TableCell>
                        <TableCell className="text-right">{user.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={8}>Total</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>


              </div>
              {/*  */}
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button variant="outline" onClick={handlePrev} disabled={currentPage === 1} className="flex items-center gap-1">
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button key={p} variant={p === currentPage ? "default" : "outline"} onClick={() => goToPage(p)}>
                    {p}
                  </Button>
                ))}
                <Button variant="outline" onClick={handleNext} disabled={currentPage === totalPages} className="flex items-center gap-1">
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>User Details</DialogTitle>
                    <DialogDescription></DialogDescription>
                  </DialogHeader>
                  {selectedUser && (
                    <div className="space-y-3">
                      <div className="flex justify-between"><span className="text-sm">Name</span><span className="font-medium">{selectedUser.name}</span></div>
                      <div className="flex justify-between"><span className="text-sm">Email</span><span className="font-medium">{selectedUser.email}</span></div>
                      <div className="flex justify-between"><span className="text-sm">Phone</span><span className="font-medium">{selectedUser.phone}</span></div>
                      <div className="flex justify-between"><span className="text-sm">Driver number</span><span className="font-medium">{selectedUser.driverNumber}</span></div>
                      <div className="flex justify-between"><span className="text-sm">Number of bookings</span><span className="font-medium">{selectedUser.bookings}</span></div>
                      <div className="flex justify-between"><span className="text-sm">Ban</span><span className={`px-2 py-1 rounded-full text-xs ${selectedUser.banned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{selectedUser.banned ? 'Banned' : 'Active'}</span></div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
              <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Booking History</DialogTitle>
                    <DialogDescription></DialogDescription>
                  </DialogHeader>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Booking ID</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead>Total Days</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Pickup Location</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedBookings.map(b => (
                          <TableRow key={b.booking_id}>
                            <TableCell>{b.booking_id}</TableCell>
                            <TableCell>{b.vehicle}</TableCell>
                            <TableCell>{b.start_date}</TableCell>
                            <TableCell>{b.end_date}</TableCell>
                            <TableCell>{b.total_days}</TableCell>
                            <TableCell>${Number(b.total_amount).toFixed(2)}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${b.status === 'completed' ? 'bg-green-100 text-green-800' : b.status === 'canceled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{b.status}</span>
                            </TableCell>
                            <TableCell>{b.pickup_location}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserManagement