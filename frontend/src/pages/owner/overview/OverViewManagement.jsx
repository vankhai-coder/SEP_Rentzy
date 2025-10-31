import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../config/axiosInstance.js';
import { 
  MdAttachMoney, 
  MdDirectionsCar, 
  MdAssignment, 
  MdTrendingUp,
  MdPerson,
  MdStar,
  MdCalendarToday
} from 'react-icons/md';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const OverViewManagement = () => {
  const [overviewData, setOverviewData] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [topRenters, setTopRenters] = useState([]);
  const [topVehicles, setTopVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('day');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Fetch overview stats
  const fetchOverviewStats = async () => {
    try {
      const response = await axiosInstance.get('/api/owner/overview/stats');
      if (response.data.success) {
        setOverviewData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching overview stats:', error);
      setError('Đã xảy ra lỗi khi tải dữ liệu tổng quan');
    }
  };

  // Fetch revenue chart data
  const fetchRevenueChart = async (period, year, month) => {
    try {
      const params = { 
        period: period,
        year: year
      };
      
      // Thêm tham số month nếu period là 'day' hoặc 'month'
      if (period === 'day' || period === 'month') {
        params.month = month;
      }
      
      console.log('Fetching revenue chart with params:', params);
      
      const response = await axiosInstance.get('/api/owner/overview/revenue-chart', {
        params
      });
      
      console.log('Revenue chart response:', response.data);
      
      if (response.data.success) {
        setRevenueChart(response.data.data || []);
      } else {
        console.error('Revenue chart API returned error:', response.data.message);
        setRevenueChart([]);
      }
    } catch (error) {
      console.error('Error fetching revenue chart:', error);
      setRevenueChart([]);
    }
  };

  // Fetch top renters
  const fetchTopRenters = async () => {
    try {
      const response = await axiosInstance.get('/api/owner/overview/top-renters', {
        params: { limit: 5 }
      });
      if (response.data.success) {
        setTopRenters(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching top renters:', error);
    }
  };

  // Fetch top vehicles
  const fetchTopVehicles = async () => {
    try {
      console.log('Fetching top vehicles...');
      
      const response = await axiosInstance.get('/api/owner/overview/top-vehicles', {
        params: { limit: 5 }
      });
      
      console.log('Top vehicles response:', response.data);
      
      if (response.data.success) {
        setTopVehicles(response.data.data || []);
      } else {
        console.error('Top vehicles API returned error:', response.data.message);
        setTopVehicles([]);
      }
    } catch (error) {
      console.error('Error fetching top vehicles:', error);
      setTopVehicles([]);
    }
  };

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOverviewStats(),
        fetchRevenueChart(selectedPeriod, selectedYear, selectedMonth),
        fetchTopRenters(),
        fetchTopVehicles()
      ]);
    } catch (error) {
        console.error('Error loading all data:', error);
      setError('Đã xảy ra lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('=== OverViewManagement: Initial load ===');
    loadAllData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log('=== OverViewManagement: Period/Year/Month changed ===');
    console.log('selectedPeriod:', selectedPeriod);
    console.log('selectedYear:', selectedYear);
    console.log('selectedMonth:', selectedMonth);
    fetchRevenueChart(selectedPeriod, selectedYear, selectedMonth);
  }, [selectedPeriod, selectedYear, selectedMonth]);

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '0 ₫';
    
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format currency for chart (shorter format)
  const formatCurrencyShort = (amount) => {
    if (!amount || amount === 0) return '0';
    
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)},000,000 ₫`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}000,000 ₫`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)},000 ₫`;
    }
    
    return `${amount.toLocaleString('vi-VN')} ₫`;
  };

  // Format chart data based on period
  const formatChartData = (data) => {
    console.log('Formatting chart data:', data);
    
    if (!data || data.length === 0) {
      console.log('No chart data to format');
      return [];
    }
    
    const formattedData = data.map(item => {
      if (!item || typeof item.period !== 'string') {
        console.warn('Invalid item:', item);
        return { ...item, label: 'N/A', revenue: 0, bookingCount: 0 };
      }

      const parts = item.period.split('-');
      let label = item.period;

      if (selectedPeriod === 'day' && parts.length === 2) {
        const [month, day] = parts;
        label = `${(day || '').padStart(2, '0')}/${(month || '').padStart(2, '0')}`;
      } else if (selectedPeriod === 'month' && parts.length === 2) {
        const [month, year] = parts;
        label = `Tháng ${parseInt(month)} / ${year}`;
      } else if (selectedPeriod === 'year') {
        label = item.period;
      }

      return {
        ...item,
        label,
        revenue: parseFloat(String(item.revenue).replace(/,/g, '')) || 0,
        bookingCount: parseInt(item.bookingCount) || 0
      };
    });

    
    console.log('Formatted chart data:', formattedData);
    return formattedData;
  };

  // Get month name in Vietnamese
  const getMonthName = (monthNumber) => {
    const months = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    return months[monthNumber - 1];
  };

  // Get period display text
  const getPeriodDisplayText = () => {
    if (selectedPeriod === 'day') {
      return `${getMonthName(selectedMonth)} ${selectedYear}`;
    } else if (selectedPeriod === 'month') {
      return `${getMonthName(selectedMonth)} ${selectedYear}`;
    } else {
      return '5 năm gần nhất';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold">{error}</p>
          <button 
            onClick={loadAllData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tổng quan</h1>
          <p className="text-gray-600">Thống kê tổng quan về hoạt động kinh doanh của bạn</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(overviewData?.totalRevenue || 0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <MdAttachMoney className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Bookings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng số đơn thuê</p>
                <p className="text-2xl font-bold text-blue-600">
                  {overviewData?.totalBookings || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <MdAssignment className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total Vehicles */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng số xe</p>
                <p className="text-2xl font-bold text-purple-600">
                  {overviewData?.totalVehicles || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <MdDirectionsCar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="mb-4 lg:mb-0">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <MdTrendingUp className="mr-2" />
                Biểu đồ doanh thu
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                <MdCalendarToday className="inline mr-1" />
                {getPeriodDisplayText()}
              </p>
            </div>
            
            {/* Enhanced Filter Controls */}
            <div className="flex flex-wrap gap-3">
              {/* Period Selector */}
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Thời gian</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="day">Theo ngày</option>
                  <option value="month">Theo tháng</option>
                  <option value="year">Theo năm</option>
                </select>
              </div>

              {/* Month Selector for day view */}
              {selectedPeriod === 'day' && (
                <>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">Tháng</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>
                          {getMonthName(month)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">Năm</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Month and Year Selector for month view */}
              {selectedPeriod === 'month' && (
                <>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">Tháng</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>
                          {getMonthName(month)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">Năm</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </>
              )}
            </div>
          </div>

          <div className="h-80">
            {formatChartData(revenueChart).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {selectedPeriod === 'day' ? (
                  <BarChart data={formatChartData(revenueChart)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="label" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      fontSize={12}
                    />
                    <YAxis tickFormatter={(value) => formatCurrencyShort(value)} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                      labelFormatter={(label) => `Ngày: ${label}`}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                ) : (
                  <LineChart data={formatChartData(revenueChart)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={(value) => formatCurrencyShort(value)} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                      labelFormatter={(label) => `Thời gian: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6' }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <MdTrendingUp className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-lg font-medium">Chưa có dữ liệu doanh thu</p>
                  <p className="text-sm">Dữ liệu sẽ hiển thị khi có đơn đặt xe</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Renters */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <MdPerson className="mr-2" />
              Khách hàng thuê nhiều nhất
            </h2>
            <div className="space-y-4">
              {topRenters.length > 0 ? (
                topRenters.map((renter, index) => (
                  <div key={renter.user_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{renter.full_name}</p>
                        <p className="text-sm text-gray-600">{renter.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">{renter.rentCount} lượt</p>
                      <p className="text-sm text-gray-600">{formatCurrency(renter.totalSpent)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">Chưa có dữ liệu khách hàng</p>
              )}
            </div>
          </div>

          {/* Top Vehicles - Enhanced with images */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <MdDirectionsCar className="mr-2" />
              Xe được thuê nhiều nhất
            </h2>
            <div className="space-y-4">
              {topVehicles.length > 0 ? (
                topVehicles.map((vehicle, index) => (
                  <div key={vehicle.vehicle_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      {/* Ranking number */}
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {index + 1}
                      </div>
                      
                      {/* Vehicle image */}
                      <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        {vehicle.main_image_url ? (
                          <img 
                            src={vehicle.main_image_url} 
                            alt={`${vehicle.brand?.name || ''} ${vehicle.model}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-full h-full ${vehicle.main_image_url ? 'hidden' : 'flex'} items-center justify-center bg-gray-300`}
                        >
                          <MdDirectionsCar className="text-gray-500 text-xl" />
                        </div>
                      </div>
                      
                      {/* Vehicle info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900 truncate">
                            {vehicle.brand?.name || 'N/A'}
                          </p>
                          <span className="text-gray-400">•</span>
                          <p className="font-medium text-gray-900 truncate">
                            {vehicle.model}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">{vehicle.license_plate}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(vehicle.price_per_day)}/ngày</p>
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-purple-600 text-lg">{vehicle.rent_count} lượt</p>
                      
                      <p className="text-sm text-gray-600 font-medium">{formatCurrency(vehicle.total_paid)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MdDirectionsCar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">Chưa có xe được thuê</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverViewManagement;