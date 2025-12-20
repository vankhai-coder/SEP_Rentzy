import { Ban, ChevronDown, ChevronLeft, ChevronRight, CircleX, Columns2, DollarSign, Download, Ellipsis, Eye, Loader, Lock, LockKeyholeOpen, Search, ShieldCheck, Trash2, Trash2Icon, UserPlus, X, Users, UserCheck, Car, UserCircle, MessageCircle } from "lucide-react"
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PopoverClose } from "@radix-ui/react-popover"
import axiosInstance from "@/config/axiosInstance"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { useDispatch } from "react-redux"
import { setMessageUserDetails } from "@/redux/features/admin/messageSlice"
import { useNavigate } from "react-router-dom"

const UserManagement = () => {

  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // selected user for view details or ban/unban , view booking history : 
  const [selectedUserId, setSelectedUserId] = useState(null);
  // states for ban/unban dialog :
  const [isBanUnbanUserDialogOpen, setIsBanUnbanUserDialogOpen] = useState(false);
  const [isBanAction, setIsBanAction] = useState(true);
  const [selectedUserFieldsForDisplayInBanUnban, setSelectedUserFieldsForDisplayInBanUnban] = useState({
    fullName: '',
    email: '',
    role: ''
  });
  // state for loading when ban/unban user
  const [isLoadingBanUnbanUser, setIsLoadingBanUnbanUser] = useState(false);


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
        nameOrEmail: searchFilter.nameOrEmail.trim(),
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

  // function to ban or unban user account to api : /api/admin/user-management/users/19/ban-unban using Patch method
  const toggleUserActiveStatus = async (userId) => {
    try {
      setIsLoadingBanUnbanUser(true);
      await axiosInstance.patch(`/api/admin/user-management/users/${userId}/ban-unban`);
      // revalidate : 
      queryClient.invalidateQueries(['users']);
      toast.info(`Đã ${isBanAction ? 'khóa' : 'mở khóa'} tài khoản người dùng thành công.`);
      setIsBanUnbanUserDialogOpen(false);

    } catch (error) {
      setIsBanUnbanUserDialogOpen(false);
      console.error("Error toggling user active status:", error);
      toast.error(`Có lỗi xảy ra khi ${isBanAction ? 'khóa' : 'mở khóa'} tài khoản người dùng.`);

    } finally {
      setIsLoadingBanUnbanUser(false);
      setSelectedUserId(null);
      setSelectedUserFieldsForDisplayInBanUnban(null);
      setIsBanAction(null);
    }
  };


  return (

    <div className="p-4 lg:p-6 dark:bg-[#020617] min-h-screen ">
      <div className="space-y-6">

        <div className="flex items-center justify-between" >
          {/* User Management Title */}
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">Quản lý người dùng</h1>
            <p className="text-secondary-600 dark:text-secondary-400">Quản lý các thành viên trong nhóm và quyền truy cập tài khoản của họ</p>
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
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Tổng người dùng</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{isLoadingUserStats ? 'Loading...' : isErrorUserStats ? 'Error' : userStats?.totalUsers}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          {/* Active Users */}
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Tổng người dùng hoạt động</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{isLoadingUserStats ? 'Loading...' : isErrorUserStats ? 'Error' : userStats?.activeUsers}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          {/* Total Owners */}
          <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">Tổng chủ xe</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">{isLoadingUserStats ? 'Loading...' : isErrorUserStats ? 'Error' : userStats?.ownerUsers}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                <Car className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
          {/* Total Renters */}
          <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg border border-orange-200 dark:border-orange-800 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400">Tổng người thuê</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">{isLoadingUserStats ? 'Loading...' : isErrorUserStats ? 'Error' : userStats?.renterUsers}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                <UserCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
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
                    {

                      searchFilter.role && (
                        <button onClick={() => {
                          setSearchFilter(prev => ({ ...prev, role: '' }));
                          setCurrentPage(1);
                        }}>
                          <CircleX className="size-5 hover:cursor-pointer text-red-400" />
                        </button>
                      )
                    }
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
                    {
                      searchFilter.isActive && (
                        <button onClick={() => {
                          setSearchFilter(prev => ({ ...prev, isActive: '' }));
                          setCurrentPage(1);
                        }}>
                          <CircleX className="size-5 hover:cursor-pointer text-red-400" />
                        </button>
                      )
                    }
                  </div>

                </div>

                <div className="flex gap-6">
                  {/* filter clear all */}
                  {
                    (searchFilter.nameOrEmail || searchFilter.role || searchFilter.isActive) && (
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
                    )
                  }
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
                      <TableHead>Nhắn</TableHead>
                      <TableHead>Thêm </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {/* if error */}
                    {isErrorFetchingUsers && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-red-500">
                          Lỗi khi tải danh sách người dùng.
                        </TableCell>
                      </TableRow>
                    )}

                    {/* if loading */}
                    {isLoadingFetchingUsers && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">
                          Đang tải...
                        </TableCell>
                      </TableRow>
                    )}

                    {/* if no users found */}
                    {!isLoadingFetchingUsers && !isErrorFetchingUsers && data?.users?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">
                          Không tìm thấy người dùng.
                        </TableCell>
                      </TableRow>
                    )}

                    {/* display users */}
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

                        <TableCell className={'text-secondary-600 dark:text-secondary-400'}>
                          {/* reducers: {
                            // function that add 3 state : action.payload = { userFullNameOrEmail, userIdToChatWith, userImageURL } 
                            // and call by dispatch(setMessageUserDetails({ userFullNameOrEmail, userIdToChatWith, userImageURL }))
                            setMessageUserDetails: (state, action) => {
                            state.userFullNameOrEmail = action.payload.userFullNameOrEmail;
                          state.userIdToChatWith = action.payload.userIdToChatWith;
                          state.userImageURL = action.payload.userImageURL;
        }
    }, */}
                          <MessageCircle
                            onClick={
                              () => {
                                // dispatch to redux store :
                                dispatch(setMessageUserDetails({
                                  userFullNameOrEmail: user.full_name || user.email,
                                  userIdToChatWith: user.user_id,
                                  userImageURL: user.avatar_url
                                }));
                                // navigate to admin/messages page
                                navigate('/admin/messages');
                              }
                            }
                          />
                        </TableCell>

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
                                  <button onClick={() => { }} className="group flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors duration-150 cursor-pointer text-secondary-900 dark:text-white  hover:bg-gray-400 hover:text-white  dark:hover:bg-gray-700 ">
                                    <span className="flex-shrink-0">
                                      <Eye className="lucide lucide-eye h-4 w-4" />
                                    </span>
                                    <span>Xem chi tiết</span>
                                  </button>
                                </PopoverClose>

                                {/* ban account */}
                                <PopoverClose>
                                  <button onClick={() => {
                                    setSelectedUserId(user.user_id);
                                    setIsBanAction(user.is_active); // if active, then ban action
                                    setSelectedUserFieldsForDisplayInBanUnban({
                                      fullName: user.full_name,
                                      email: user.email,
                                      role: user.role
                                    });
                                    setIsBanUnbanUserDialogOpen(true);
                                  }} className="group flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors duration-150 cursor-pointer text-secondary-900 dark:text-white hover:bg-gray-400 hover:text-white  dark:hover:bg-gray-700 ">
                                    <span className="flex-shrink-0">
                                      {user.is_active ? <Lock className="lucide lucide-ban h-4 w-4" /> : <LockKeyholeOpen className="lucide lucide-shield-check h-4 w-4" />}
                                    </span>
                                    <span>{user.is_active ?
                                      'Khóa tài khoản'
                                      :
                                      'Mở khóa tài khoản'
                                    }</span>
                                  </button>
                                </PopoverClose>

                                {/* view booking history */}
                                <PopoverClose>
                                  <button className="group flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors duration-150 cursor-pointer text-secondary-900 dark:text-white hover:bg-gray-400 hover:text-white  dark:hover:bg-gray-700 ">
                                    <span className="flex-shrink-0">
                                      <DollarSign className="lucide lucide-dollar-sign h-4 w-4" />
                                    </span>
                                    <span onClick={() => {

                                    }}>Xem lịch sử đặt xe</span>
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

              {data && data.totalPages &&
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
              }

              {/* dialog for ban/unban user */}
              <Dialog open={isBanUnbanUserDialogOpen} onOpenChange={(open) => {
                setIsBanUnbanUserDialogOpen(open);
              }}>
                <DialogTrigger>
                  {/* <Button variant={'outline'} className={'hover:cursor-pointer'}>Xem lý do</Button> */}
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Xác nhận {isBanAction ? 'khóa' : 'mở khóa'}</DialogTitle>
                    <DialogDescription className={'py-8'}>
                      Bạn có chắc chắn muốn {isBanAction ? 'khóa' : 'mở khóa'} người dùng này không?
                      {/* display some info of this user : */}
                      <div className="mt-4 space-y-2">
                        <p><span className="font-bold">Họ và tên:</span> {selectedUserFieldsForDisplayInBanUnban?.fullName}</p>
                        <p><span className="font-bold">Email:</span> {selectedUserFieldsForDisplayInBanUnban?.email}</p>
                        <p><span className="font-bold">Vai trò:</span> {selectedUserFieldsForDisplayInBanUnban?.role}</p>
                      </div>
                      {/* BUTTONS */}
                      <div className="mt-4 flex justify-end gap-4">
                        <Button variant="outline" onClick={() => {
                          setIsBanUnbanUserDialogOpen(false)
                        }}>Hủy</Button>
                        <Button
                          onClick={() => {
                            // call api to ban or unban user :
                            toggleUserActiveStatus(selectedUserId);
                            setSelectedUserFieldsForDisplayInBanUnban({
                              fullName: '',
                              email: '',
                              role: ''
                            });
                          }}
                        >
                          {isLoadingBanUnbanUser ? <Loader className="animate-spin mx-auto" /> : 'Xác nhận'}
                        </Button>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
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