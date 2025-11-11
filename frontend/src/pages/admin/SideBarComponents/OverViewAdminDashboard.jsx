import { ArrowRight, DollarSign, Home, MoveDownRight, MoveUpRight, ShoppingCart, User } from 'lucide-react'
import React from 'react'

const OverViewAdminDashboard = () => {
  return (
    <div className="p-4 lg:p-6 dark:bg-black min-h-screen">
      <div>
        {/* navigation */}
        <nav className="flex items-center space-x-2 text-sm mb-6">
          <a href="" className="flex items-center text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            <Home />
          </a>
          <div className="flex items-center gap-2">
            <ArrowRight />
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
              <div className='p-3 rounded-xl bg-danger-100 dark:bg-danger-900/20'>
                <ShoppingCart
                  className='lucide lucide-shopping-cart w-6 h-6 text-danger-600 dark:text-danger-400' />
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
              {/* list */}
              <div>
                <div className='space-y-4'>
                  {/* first item */}
                  <div className='flex items-center justify-between py-3 border-b border-secondary-200 dark:border-secondary-700 last:border-0'>
                    <div className='flex-1'>
                      <p className='font-medium text-secondary-900 dark:text-white'>John Doe</p>
                      <p className='text-sm text-secondary-600 dark:text-secondary-400'>Wireless Headphones</p>
                    </div>
                    <div className='text-right'>
                      <p className='font-medium text-secondary-900 dark:text-white'>$123.2</p>
                      <span className='badge badge-success px-2 py-0.5 text-xs'>completed</span>
                    </div>
                  </div>
                  <div className='flex items-center justify-between py-3 border-b border-secondary-200 dark:border-secondary-700 last:border-0'>
                    <div className='flex-1'>
                      <p className='font-medium text-secondary-900 dark:text-white'>John Doe</p>
                      <p className='text-sm text-secondary-600 dark:text-secondary-400'>Wireless Headphones</p>
                    </div>
                    <div className='text-right'>
                      <p className='font-medium text-secondary-900 dark:text-white'>$123.2</p>
                      <span className='badge badge-warning px-2 py-0.5 text-xs'>completed</span>
                    </div>
                  </div>
                  <div className='flex items-center justify-between py-3 border-b border-secondary-200 dark:border-secondary-700 last:border-0'>
                    <div className='flex-1'>
                      <p className='font-medium text-secondary-900 dark:text-white'>John Doe</p>
                      <p className='text-sm text-secondary-600 dark:text-secondary-400'>Wireless Headphones</p>
                    </div>
                    <div className='text-right'>
                      <p className='font-medium text-secondary-900 dark:text-white'>$123.2</p>
                      <span className='badge badge-primary px-2 py-0.5 text-xs'>completed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div></div>
          </div>
          {/* table 2 */}
          <div className='card p-6 transition-all duration-200'>
            <div className='flex flex-col space-y-1.5 mb-4'>
              <h2 className='text-lg font-semibold text-secondary-900 dark:text-white'>
                Recent Orders
              </h2>
              {/* list */}
              <div>
                <div className='space-y-4'>
                  {/* first item */}
                  <div className='flex items-center justify-between py-3 border-b border-secondary-200 dark:border-secondary-700 last:border-0'>
                    <div className='flex-1'>
                      <p className='font-medium text-secondary-900 dark:text-white'>John Doe</p>
                      <p className='text-sm text-secondary-600 dark:text-secondary-400'>Wireless Headphones</p>
                    </div>
                    <div className='text-right'>
                      <p className='font-medium text-secondary-900 dark:text-white'>$123.2</p>
                      <span className='badge badge-success px-2 py-0.5 text-xs'>completed</span>
                    </div>
                  </div>
                  <div className='flex items-center justify-between py-3 border-b border-secondary-200 dark:border-secondary-700 last:border-0'>
                    <div className='flex-1'>
                      <p className='font-medium text-secondary-900 dark:text-white'>John Doe</p>
                      <p className='text-sm text-secondary-600 dark:text-secondary-400'>Wireless Headphones</p>
                    </div>
                    <div className='text-right'>
                      <p className='font-medium text-secondary-900 dark:text-white'>$123.2</p>
                      <span className='badge badge-warning px-2 py-0.5 text-xs'>completed</span>
                    </div>
                  </div>
                  <div className='flex items-center justify-between py-3 border-b border-secondary-200 dark:border-secondary-700 last:border-0'>
                    <div className='flex-1'>
                      <p className='font-medium text-secondary-900 dark:text-white'>John Doe</p>
                      <p className='text-sm text-secondary-600 dark:text-secondary-400'>Wireless Headphones</p>
                    </div>
                    <div className='text-right'>
                      <p className='font-medium text-secondary-900 dark:text-white'>$123.2</p>
                      <span className='badge badge-primary px-2 py-0.5 text-xs'>completed</span>
                    </div>
                  </div>
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