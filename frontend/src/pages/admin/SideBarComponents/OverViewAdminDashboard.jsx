import axiosInstance from '@/config/axiosInstance'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, DollarSign, Home, MoveDownRight, MoveUpRight, ShoppingCart, User, Users, Car } from 'lucide-react'
import React from 'react'

const OverViewAdminDashboard = () => {

  // use react query to get 10 current bookings from : GET /api/admin/overview/current-bookings
  const getRecentOrders = async () => {
    const res = await axiosInstance.get('/api/admin/overview/current-bookings');
    return res.data.bookings;
    // res.data.bookings = [
    //   {
    //   "total_amount": "30000.00",
    //   "status": "completed",
    //   "renter": {
    //     "full_name": "Pham Le Tien Vu (K17 DN)",
    //     "email": "vupltde170269@fpt.edu.vn"
    //   },
    //   "vehicle": {
    //     "model": "VF9"
    //   }
    // },
    //   ...
    // ]
  };
  const { data: recentOrders, isLoading: isLoadingBookings, isError: isErrorBookings } = useQuery({
    queryKey: ["admin-recent-bookings"],
    queryFn: getRecentOrders
  });

  console.log("recentOrders", recentOrders);


  // all possible status from backend Booking model :
  const statusBadge = {
    completed: 'badge-success',
    pending: 'badge-warning',
    canceled: 'badge-danger',
    in_progress: 'badge-primary',
    cancel_requested: 'badge-info',
    fully_paid: 'badge-success',
    deposit_paid: 'badge-warning',
  }
  // format currency function to VND : 
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };
  // format day like : 12 tháng 9, 2023
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  // use react query to get current-registered-users from : GET /api/admin/overview/current-registered-users
  const getRecentRegisteredUsers = async () => {
    const res = await axiosInstance.get('/api/admin/overview/current-registered-users');
    return res.data.users;
    // res.data.users = [
    //   {
    //     "full_name": "Nguyen Van A",
    //     "email": "
    //     "role": "renter",
    //     "created_at": "2023-09-12T10:20:30.000Z",
    //     "user_id": 123
    //   },
    //   ...
    // ]
  }
  const { data: recentRegisteredUsers, isLoading: isLoadingRegisteredUsers, isError: isErrorRegisteredUsers } = useQuery({
    queryKey: ["admin-recent-registered-users"],
    queryFn: getRecentRegisteredUsers
  });

  // function to get percentage change , eg : previous = 100 , current = 120 => return 20 (%)
  const getPercentageChange = (previous, current) => {
    if (previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous * 100).toFixed(1);
  };


  // use tank query to get stats from : GET /api/admin/overview/stats
  const getAdminOverviewStats = async () => {
    const res = await axiosInstance.get('/api/admin/overview/stats');
    return res.data;
    // res.data = 
    // {
    //   totalRevenue: 123456.78,
    //   totalRenters: {
    //       count: 1820,
    //       previousMonth: 1760,
    //       currentMonth: 60,
    //   },
    //   totalOwners: {
    //       count: 320,
    //       previousMonth: 310,
    //       currentMonth: 10,
    //   },
    //   totalCompletedBookings: {
    //       count: 2200,
    //       previousMonth: 2100,
    //       currentMonth: 100,
    //   },
    // }
  };
  const { data: overviewStats, isLoading: isLoadingOverviewStats, isError: isErrorOverviewStats } = useQuery({
    queryKey: ["admin-overview-stats"],
    queryFn: getAdminOverviewStats
  });

  // css for each type of badge for role : 
  const statusBadgeForRole = {
    renter: 'badge-primary',
    owner: 'badge-success',
    admin: 'badge-danger',
  }

  return (
    <div className="p-4 lg:p-6 dark:bg-black min-h-screen">
      <div>
        {/* navigation */}
        <nav className="flex items-center space-x-2 text-sm mb-6">
          <a href="" className="flex items-center text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            <Home />
          </a>
          <div className="flex items-center gap-2">
            <ChevronRight />
            <span className="text-secondary-900 dark:text-white font-medium">Tổng Quan</span>
          </div>
        </nav>
        {/* title */}
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-secondary-900 dark:text-white mb-2'>Tổng Quan Hệ Thống</h1>
          <p className='text-secondary-600 dark:text-secondary-400'>Chào mừng bạn quay lại! Đây là những thông tin nổi bật về hoạt động kinh doanh của bạn hôm nay.</p>
        </div>
        {/* overview content : 4 boxes */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 '>
          {/* first box */}
          <div className='bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800 transition-all duration-200 relative overflow-hidden'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-green-600 dark:text-green-400 mb-1'>Tổng doanh thu</p>
                <p className='text-3xl font-bold text-green-700 dark:text-green-300 mb-2'>{isLoadingOverviewStats ? "Loading..." : isErrorOverviewStats ? "Error" : overviewStats?.totalRevenue}</p>
                <div className='flex items-center gap-2'>
                </div>
              </div>
              <div className='p-2 bg-green-100 dark:bg-green-900/40 rounded-lg'>
                <DollarSign className='w-6 h-6 text-green-600 dark:text-green-400' />
              </div>
            </div>
          </div>
          {/* second box */}
          <div className='bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 transition-all duration-200 relative overflow-hidden'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-blue-600 dark:text-blue-400 mb-1'>Tổng người thuê</p>
                <p className='text-3xl font-bold text-blue-700 dark:text-blue-300 mb-2'>{isLoadingOverviewStats ? "Loading..." : isErrorOverviewStats ? "Error" : overviewStats?.totalRenters?.count}</p>
                <div className='flex items-center gap-2'>
                  <span className={`  badge ${getPercentageChange(overviewStats?.totalRenters?.previousMonth, overviewStats?.totalRenters?.currentMonth) >= 0 ? "badge-success" : "badge-danger"}  px-2 py-0.5 text-xs flex items-center gap-1`}>
                    {getPercentageChange(overviewStats?.totalRenters?.previousMonth, overviewStats?.totalRenters?.currentMonth) >= 0 ? <MoveUpRight /> : <MoveDownRight />}
                    <span>{getPercentageChange(overviewStats?.totalRenters?.previousMonth, overviewStats?.totalRenters?.currentMonth)}%</span>
                  </span>
                  <span className='text-xs text-blue-500 dark:text-blue-400'>So với tháng trước</span>

                </div>
                <div className='flex flex-col mt-2 gap-1'>
                  <span className='text-xs text-blue-500 dark:text-blue-400'>Tháng trước : {isLoadingOverviewStats ? "Loading..." : isErrorOverviewStats ? "Error" : overviewStats?.totalRenters?.previousMonth}</span>
                  <span className='text-xs text-blue-500 dark:text-blue-400'>Tháng nay : {isLoadingOverviewStats ? "Loading..." : isErrorOverviewStats ? "Error" : overviewStats?.totalRenters?.currentMonth}</span>
                </div>
              </div>
              <div className='p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg'>
                <Users className='w-6 h-6 text-blue-600 dark:text-blue-400' />
              </div>
            </div>
          </div>
          {/* third box */}
          <div className='bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800 transition-all duration-200 relative overflow-hidden'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-purple-600 dark:text-purple-400 mb-1'>Tổng số đặt xe</p>
                <p className='text-3xl font-bold text-purple-700 dark:text-purple-300 mb-2'>{isLoadingOverviewStats ? "Loading..." : isErrorOverviewStats ? "Error" : overviewStats?.totalCompletedBookings?.count}</p>
                <div className='flex items-center gap-2'>
                  <span className={`badge ${getPercentageChange(overviewStats?.totalCompletedBookings?.previousMonth, overviewStats?.totalCompletedBookings?.currentMonth) >= 0 ? "badge-success" : "badge-danger"} px-2 py-0.5 text-xs flex items-center gap-1`}>
                    {getPercentageChange(overviewStats?.totalCompletedBookings?.previousMonth, overviewStats?.totalCompletedBookings?.currentMonth) >= 0 ? <MoveUpRight /> : <MoveDownRight />}
                    <span>{getPercentageChange(overviewStats?.totalCompletedBookings?.previousMonth, overviewStats?.totalCompletedBookings?.currentMonth)}%</span>
                  </span>
                  <span className='text-xs text-purple-500 dark:text-purple-400'>So với tháng trước</span>

                </div>
                <div className='flex flex-col mt-2 gap-1'>
                  <span className='text-xs text-purple-500 dark:text-purple-400'>Tháng trước : {isLoadingOverviewStats ? "Loading..." : isErrorOverviewStats ? "Error" : overviewStats?.totalCompletedBookings?.previousMonth}</span>
                  <span className='text-xs text-purple-500 dark:text-purple-400'>Tháng nay : {isLoadingOverviewStats ? "Loading..." : isErrorOverviewStats ? "Error" : overviewStats?.totalCompletedBookings?.currentMonth}</span>
                </div>
              </div>
              <div className='p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg'>
                <ShoppingCart className='w-6 h-6 text-purple-600 dark:text-purple-400' />
              </div>
            </div>
          </div>
          {/* fourth box */}
          <div className='bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg border border-orange-200 dark:border-orange-800 transition-all duration-200 relative overflow-hidden'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-orange-600 dark:text-orange-400 mb-1'>Tổng người cho thuê</p>
                <p className='text-3xl font-bold text-orange-700 dark:text-orange-300 mb-2'>{isLoadingOverviewStats ? "Loading..." : isErrorOverviewStats ? "Error" : overviewStats?.totalOwners?.count}</p>
                <div className='flex items-center gap-2'>
                  <span className={`badge ${getPercentageChange(overviewStats?.totalOwners?.previousMonth, overviewStats?.totalOwners?.currentMonth) >= 0 ? "badge-success" : "badge-danger"} px-2 py-0.5 text-xs flex items-center gap-1`}>
                    {getPercentageChange(overviewStats?.totalOwners?.previousMonth, overviewStats?.totalOwners?.currentMonth) >= 0 ? <MoveUpRight /> : <MoveDownRight />}
                    <span>{getPercentageChange(overviewStats?.totalOwners?.previousMonth, overviewStats?.totalOwners?.currentMonth)}%</span>
                  </span>
                  <span className='text-xs text-orange-500 dark:text-orange-400'>So với tháng trước</span>

                </div>
                <div className='flex flex-col mt-2 gap-1'>
                  <span className='text-xs text-orange-500 dark:text-orange-400'>Tháng trước : {isLoadingOverviewStats ? "Loading..." : isErrorOverviewStats ? "Error" : overviewStats?.totalOwners?.previousMonth}</span>
                  <span className='text-xs text-orange-500 dark:text-orange-400'>Tháng nay : {isLoadingOverviewStats ? "Loading..." : isErrorOverviewStats ? "Error" : overviewStats?.totalOwners?.currentMonth}</span>
                </div>
              </div>
              <div className='p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg'>
                <Car className='w-6 h-6 text-orange-600 dark:text-orange-400' />
              </div>
            </div>
          </div>

        </div>
        {/*2 chart  */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
          {/* 2 chart */}
          <div>chart 1</div>
          <div>chart 2</div>

        </div>
        {/* 2 table */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/*  table 1 */}
          <div className='card p-6 transition-all duration-200'>
            <div className='flex flex-col space-y-1.5 mb-4'>
              <h2 className='text-lg font-semibold text-secondary-900 dark:text-white'>
                Các đặt xe gần đây
              </h2>
              <div>
                <div className='space-y-4'>
                  {isLoadingBookings && <p>Loading...</p>}
                  {isErrorBookings && <p>Error loading bookings.</p>}
                  {recentOrders && recentOrders.map((o) => (
                    <div key={o.id} className='flex items-center justify-between py-3 border-b border-secondary-200 dark:border-secondary-700 last:border-0'>
                      <div className='flex-1'>
                        <p className='font-medium text-secondary-900 dark:text-white'>{o.renter.full_name || o.renter.email}</p>
                        <p className='text-sm text-secondary-600 dark:text-secondary-400'>{o.vehicle.model}</p>
                      </div>
                      <div className='text-right'>
                        <p className='font-medium text-secondary-900 dark:text-white'>{formatCurrency(o.total_amount)}</p>
                        <span className={`badge ${statusBadge[o.status]} px-2 py-0.5 text-xs`}>{o.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div></div>
          </div>
          {/* table 2 */}
          <div className='card p-6 transition-all duration-200'>
            <div className='flex flex-col space-y-1.5 mb-4'>
              <h2 className='text-lg font-semibold text-secondary-900 dark:text-white'>
                Các đăng ký người dùng gần đây
              </h2>
              <div>
                <div className='space-y-4'>
                  {isLoadingRegisteredUsers && <p>Loading...</p>}
                  {isErrorRegisteredUsers && <p>Error loading registered users.</p>}
                  {recentRegisteredUsers && recentRegisteredUsers.map((user, idx) => (
                    <div key={`${user.email}-${idx}`} className='flex items-center justify-between py-3 border-b border-secondary-200 dark:border-secondary-700 last:border-0'>
                      <div className='flex-1'>
                        <p className='font-medium text-secondary-900 dark:text-white'>{user.full_name || user.email || user.user_id}</p>
                        <p className='text-sm text-secondary-600 dark:text-secondary-400'>{user.email || user.role}</p>
                      </div>
                      <div className='text-right'>
                        <p className='font-medium text-secondary-900 dark:text-white'>{formatDate(user.created_at)}</p>
                        <span className={`badge ${statusBadgeForRole[user.role]} px-2 py-0.5 text-xs`}>{user.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OverViewAdminDashboard