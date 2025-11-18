import { Ban, ChevronDown, ChevronLeft, ChevronRight, CircleX, Columns2, DollarSign, Download, Ellipsis, Eye, Loader, Search, ShieldCheck, Trash2, Trash2Icon, UserPlus, X } from "lucide-react"
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
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import axiosInstance from "@/config/axiosInstance"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

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

  // pagination states :
  const [currentPage, setCurrentPage] = useState(1);
  const [limitPerPage, setLimitPerPage] = useState(10);

  // use useQuery to fetch list of users from backend api /api/admin/user-management/users with searchFilter using axiosInstance:
  const fetchUsersWithSearchFilter = async () => {
    const response = await axiosInstance.get('/api/admin/user-management/users', {
      params: {
        nameOrEmail: searchFilter.nameOrEmail,
        role: searchFilter.role,
        isActive: searchFilter.isActive,
        page: currentPage,
        limit: limitPerPage,
      }
    });
    return response.data; // response.data : array of users and total pages
    // backend just get fields :    attributes: ['user_id', 'avatar_url', 'full_name', 'email', 'role', 'is_active', 'created_at', 'points']
    // response.data = {
    //   users: [
    //     {
    //       id: 1,
    //       avatar: 'avatar_url',
    //       fullName: 'John Doe',
    //       email: '
    //       role: 'renter',
    //       status: 'active',
    //       createdAt: '2023-10-01',
    //       points: 100
    //     },
    //     ...
    //   ],
    //   totalPages: 5
    // }
  };
  const { data, isLoading: isLoadingFetchingUsers, isError: isErrorFetchingUsers } = useQuery(
    {
      queryKey: ['users', searchFilter, currentPage, limitPerPage],
      queryFn: fetchUsersWithSearchFilter,
      keepPreviousData: true
    }
  );

  // function to change from : 2025-11-15T12:11:35.000Z to 15 thg 11, 2025 , and 12:11 PM
  const formatDateTime = (dateTimeString) => {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    };
    const date = new Date(dateTimeString);
    return date.toLocaleString('vi-VN', options);
  }


  return (

    <div className="p-4 lg:p-6 dark:bg-[#020617] min-h-screen ">
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

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-2  ">
                {/* enter name or email */}
                <div className="flex items-center gap-10 flex-col  md:flex-row ">
                  <input type="text" className="input px-6"
                    value={searchFilter.nameOrEmail}
                    onChange={(e) => {
                      setSearchFilter(prev => ({ ...prev, nameOrEmail: e.target.value }))
                      setCurrentPage(1);
                    }}
                    placeholder="Tìm theo tên hoặc email..." />

                  {/* filter role */}
                  <div className="flex items-center gap-4">
                    {/* select role  */}
                    <Select
                      value={searchFilter.role}
                      onValueChange={(value) => {
                        setSearchFilter(prev => ({ ...prev, role: value }));
                        setCurrentPage(1);
                      }}
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
                      setCurrentPage(1);
                    }}>
                      <CircleX className="size-5 hover:cursor-pointer text-red-400" />
                    </button>
                  </div>

                  {/* filter status(is_active) */}
                  <div className="flex items-center gap-4">
                    {/* select role  */}
                    <Select
                      value={searchFilter.isActive}
                      onValueChange={(value) => {
                        setSearchFilter(prev => ({ ...prev, isActive: value }));
                        setCurrentPage(1);
                      }}
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
                      setCurrentPage(1);
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
                  {/* display loading or error button */}
                  <div>
                    <Button
                      variant={isErrorFetchingUsers ? 'danger' : 'outline'}
                    >
                      {isLoadingFetchingUsers ? <Loader className="animate-spin mx-auto" /> : isErrorFetchingUsers ? "Lỗi tải người dùng" : "Đã tải người dùng"}
                    </Button>
                  </div>
                </div>
              </div>


              {/* table */}
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Avatar</TableHead>
                      <TableHead>Tên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày đăng ký</TableHead>
                      <TableHead>Điểm</TableHead>
                      <TableHead>Thêm </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {data?.users && data?.users.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">
                          <Avatar>
                            <AvatarImage src={user.avatar_url || '/default_avt.jpg'} alt={user.full_name} />
                            <AvatarFallback>{user.full_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>{user.full_name || 'Chưa đặt tên'}</TableCell>
                        <TableCell className={'text-secondary-600 dark:text-secondary-400'}>{user.email || 'Chưa có email'}</TableCell>
                        <TableCell>
                          {/* check if role is admin , owner or renter */}
                          { }                          {user.role === 'admin' && (
                            <span className="px-2 py-1 rounded-full text-sm bg-red-300 text-red-800 ">Quản trị viên</span>
                          )}
                          {user.role === 'owner' && (
                            <span className="px-2 py-1 rounded-full text-sm bg-blue-300 text-blue-800">Chủ xe</span>
                          )}
                          {user.role === 'renter' && (
                            <span className="px-2 py-1 rounded-full text-sm bg-green-300 text-green-800">Người thuê</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {/* check if status is active or inactive */}
                          {user.is_active ? (
                            <span className="px-2 py-1 rounded-full text-sm dark:bg-green-600 bg-green-300 text-green-00">Hoạt động</span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-sm bg-gray-100 text-gray-800">Không hoạt động</span>
                          )}
                        </TableCell>

                        <TableCell className={'text-secondary-600 dark:text-secondary-400'}>{formatDateTime(user.created_at)}</TableCell>

                        <TableCell className={'text-secondary-600 dark:text-secondary-400'}>{user.points}</TableCell>

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
                                  <button onClick={() => { }} className="group flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors duration-150 cursor-pointer text-secondary-900 dark:text-white">
                                    <span className="flex-shrink-0">
                                      <Eye className="lucide lucide-eye h-4 w-4" />
                                    </span>
                                    <span>View Details</span>
                                  </button>
                                </PopoverClose>

                                {/* ban account */}
                                <PopoverClose>
                                  <button onClick={() => { }} className="group flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors duration-150 cursor-pointer text-secondary-900 dark:text-white">
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
                                    <span onClick={() => { }}>View Booking History</span>
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
                </Table>
              </div>


              {/* Pagination */}

              <div className="flex items-center justify-center gap-10 pt-4">
                {/* commment : select max page */}
                <div className="flex items-center gap-3">
                  <p className="text-secondary-600 dark:text-secondary-400">Hiển thị trang {currentPage} trên {data?.totalPages || 1} </p>
                  {/* select max page */}
                  {/* select role  */}
                  <Select
                    value={limitPerPage.toString()}
                    onValueChange={(value) => {
                      setLimitPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="">
                      <SelectValue placeholder="Số mục trên trang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* comment : Pagination controls */}
                <div className="flex items-center justify-center gap-2 ">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Trước
                  </Button>

                  {data?.totalPages && Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      variant={p === currentPage ? "default" : "outline"}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === data?.totalPages || !data?.totalPages}
                    className="flex items-center gap-1"
                  >
                    Tiếp
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserManagement