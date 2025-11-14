import { ChevronRight, DollarSign, Home, MoveDownRight, MoveUpRight, ShoppingCart, User } from 'lucide-react'
import React from 'react'

const OverViewAdminDashboard = () => {
  const recentOrders = [
    { id: 'BK-1021', customer: 'John Doe', car: 'Toyota Camry 2019', amount: 128.5, status: 'completed' },
    { id: 'BK-1022', customer: 'Jane Smith', car: 'Honda Civic 2020', amount: 92.3, status: 'pending' },
    { id: 'BK-1023', customer: 'Minh Nguyen', car: 'Tesla Model 3 2022', amount: 230, status: 'processing' },
    { id: 'BK-1024', customer: 'Anh Tran', car: 'Ford Ranger 2018', amount: 150.75, status: 'completed' },
    { id: 'BK-1025', customer: 'Michael Lee', car: 'Hyundai Tucson 2021', amount: 175.2, status: 'pending' },
    { id: 'BK-1026', customer: 'Sara Kim', car: 'Kia Seltos 2020', amount: 110, status: 'completed' },
    { id: 'BK-1027', customer: 'David Brown', car: 'Mazda CX-5 2019', amount: 210.4, status: 'cancelled' },
    { id: 'BK-1028', customer: 'Emily Clark', car: 'BMW 3 Series 2017', amount: 99.99, status: 'processing' },
    { id: 'BK-1029', customer: 'Quang Pham', car: 'Mercedes C-Class 2018', amount: 189, status: 'completed' },
    { id: 'BK-1030', customer: 'Linh Vo', car: 'VinFast VF8 2023', amount: 250, status: 'pending' }
  ]

  const statusBadge = {
    completed: 'badge-success',
    pending: 'badge-warning',
    cancelled: 'badge-danger',
    processing: 'badge-primary'
  }

  const formatCurrency = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const revenues = [
    { owner: 'Nguyen Van A', car: 'Toyota Camry', revenue: 1520, period: 'Nov 2025' },
    { owner: 'Tran Thi B', car: 'Honda CR-V', revenue: 980, period: 'Nov 2025' },
    { owner: 'Le Hoang C', car: 'Tesla Model Y', revenue: 2450, period: 'Nov 2025' },
    { owner: 'Pham Quoc D', car: 'Ford Ranger', revenue: 1750, period: 'Nov 2025' },
    { owner: 'Do Minh E', car: 'Hyundai Santa Fe', revenue: 1600, period: 'Nov 2025' },
    { owner: 'Hoang Gia F', car: 'Kia Sorento', revenue: 1320, period: 'Nov 2025' },
    { owner: 'Vu Tuan G', car: 'Mazda 6', revenue: 1190, period: 'Nov 2025' },
    { owner: 'Bui Thu H', car: 'BMW X3', revenue: 2100, period: 'Nov 2025' },
    { owner: 'Dang Khoa I', car: 'Mercedes GLC', revenue: 1990, period: 'Nov 2025' },
    { owner: 'Phan Anh J', car: 'VinFast VF8', revenue: 2680, period: 'Nov 2025' }
  ]
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
          <h1 className='text-3xl font-bold text-secondary-900 dark:text-white mb-2'>Dashboard Overview</h1>
          <p className='text-secondary-600 dark:text-secondary-400'>Welcome back! Here's what's happening with your business today.</p>
        </div>
        {/* overview content : 4 boxes */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 '>
          {/* first box */}
          <div className='card p-6 transition-all duration-200 relative overflow-hidden'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1'>Total Revenue</p>
                <p className='text-3xl font-bold text-secondary-900 dark:text-white mb-2'>$45,231.89</p>
                <div className='flex items-center gap-2'>
                  <span className='badge badge-success px-2 py-0.5 text-xs flex items-center gap-1'>
                    <MoveUpRight />
                    <span>5.2%</span>
                  </span>
                  <span className='text-xs text-secondary-500 dark:text-secondary-400'>Since last month</span>
                </div>
              </div>
              <div className='p-3 rounded-xl bg-green-100 dark:bg-green-900'>
                <DollarSign className='lucide lucide-dollar-sign w-6 h-6 text-green-600 dark:text-green-400' />
              </div>
            </div>
          </div>
          {/* second box */}
          <div className='card p-6 transition-all duration-200 relative overflow-hidden'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1'>Active Users</p>
                <p className='text-3xl font-bold text-secondary-900 dark:text-white mb-2'>1820</p>
                <div className='flex items-center gap-2'>
                  <span className='badge badge-success px-2 py-0.5 text-xs flex items-center gap-1'>
                    <MoveUpRight />
                    <span>3.4%</span>
                  </span>
                  <span className='text-xs text-secondary-500 dark:text-secondary-400'>Since last month</span>
                </div>
              </div>
              <div className='p-3 rounded-xl bg-green-100 dark:bg-green-900'>
                <User className='lucide lucide-dollar-sign w-6 h-6 text-green-600 dark:text-green-400' />
              </div>
            </div>
          </div>
          {/* third box */}
          <div className='card p-6 transition-all duration-200 relative overflow-hidden'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1'>Total Orders</p>
                <p className='text-3xl font-bold text-secondary-900 dark:text-white mb-2'>220</p>
                <div className='flex items-center gap-2'>
                  <span className='badge badge-danger px-2 py-0.5 text-xs flex items-center gap-1'>
                    <MoveDownRight />
                    <span>1.4%</span>
                  </span>
                  <span className='text-xs text-secondary-500 dark:text-secondary-400'>Since last month</span>
                </div>
              </div>
              <div className='p-3 rounded-xl bg-green-100 dark:bg-green-900'>
                <ShoppingCart
                  className='lucide lucide-shopping-cart w-6 h-6 text-green-600 dark:text-green-400' />
              </div>
            </div>
          </div>
          {/* fourth box */}
          <div className='card p-6 transition-all duration-200 relative overflow-hidden'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1'>Active Users</p>
                <p className='text-3xl font-bold text-secondary-900 dark:text-white mb-2'>1820</p>
                <div className='flex items-center gap-2'>
                  <span className='badge badge-success px-2 py-0.5 text-xs flex items-center gap-1'>
                    <MoveUpRight />
                    <span>3.4%</span>
                  </span>
                  <span className='text-xs text-secondary-500 dark:text-secondary-400'>Since last month</span>
                </div>
              </div>
              <div className='p-3 rounded-xl bg-green-100 dark:bg-green-900'>
                <User className='lucide lucide-dollar-sign w-6 h-6 text-green-600 dark:text-green-400' />
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
                Recent Orders
              </h2>
              <div>
                <div className='space-y-4'>
                  {recentOrders.map((o) => (
                    <div key={o.id} className='flex items-center justify-between py-3 border-b border-secondary-200 dark:border-secondary-700 last:border-0'>
                      <div className='flex-1'>
                        <p className='font-medium text-secondary-900 dark:text-white'>{o.customer}</p>
                        <p className='text-sm text-secondary-600 dark:text-secondary-400'>{o.car} • {o.id}</p>
                      </div>
                      <div className='text-right'>
                        <p className='font-medium text-secondary-900 dark:text-white'>{formatCurrency(o.amount)}</p>
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
                Revenue overview
              </h2>
              <div>
                <div className='space-y-4'>
                  {revenues.map((r, idx) => (
                    <div key={`${r.owner}-${idx}`} className='flex items-center justify-between py-3 border-b border-secondary-200 dark:border-secondary-700 last:border-0'>
                      <div className='flex-1'>
                        <p className='font-medium text-secondary-900 dark:text-white'>{r.owner}</p>
                        <p className='text-sm text-secondary-600 dark:text-secondary-400'>{r.car}</p>
                      </div>
                      <div className='text-right'>
                        <p className='font-medium text-secondary-900 dark:text-white'>{formatCurrency(r.revenue)}</p>
                        <span className='badge badge-primary px-2 py-0.5 text-xs'>{r.period}</span>
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