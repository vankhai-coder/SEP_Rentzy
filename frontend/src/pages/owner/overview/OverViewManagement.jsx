import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../config/axiosInstance.js';
import { 
  MdAttachMoney, 
  MdDirectionsCar, 
  MdAssignment, 
  MdTrendingUp,
  MdPerson,
  MdStar
} from 'react-icons/md';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const OverViewManagement = () => {
  const [overviewData, setOverviewData] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [topRenters, setTopRenters] = useState([]);
  const [topVehicles, setTopVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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
  const fetchRevenueChart = async () => {
    try {
      const response = await axiosInstance.get('/api/owner/overview/revenue-chart', {
        params: { 
          period: selectedPeriod,
          year: selectedYear
        }
      });
      if (response.data.success) {
        setRevenueChart(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching revenue chart:', error);
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
      const response = await axiosInstance.get('/api/owner/overview/top-vehicles', {
        params: { limit: 5 }
      });
      if (response.data.success) {
        setTopVehicles(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching top vehicles:', error);
    }
  };

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOverviewStats(),
        fetchRevenueChart(),
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
    loadAllData();
  }, []);

  useEffect(() => {
    fetchRevenueChart();
  }, [selectedPeriod, selectedYear]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Format chart data based on period
  const formatChartData = (data) => {
    return data.map(item => {
      let label = item.period;
      if (selectedPeriod === 'day') {
        label = new Date(item.period).toLocaleDateString('vi-VN');
      } else if (selectedPeriod === 'month') {
        const [year, month] = item.period.split('-');
        label = `${month}/${year}`;
      }
      return {
        ...item,
        label,
        revenue: item.revenue || 0
      };
    });
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Biểu đồ doanh thu</h2>
            <div className="flex space-x-4">
              {/* Period Selector */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="day">Theo ngày</option>
                <option value="month">Theo tháng</option>
                <option value="year">Theo năm</option>
              </select>

              {/* Year Selector for month view */}
              {selectedPeriod === 'month' && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formatChartData(revenueChart)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
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
            </ResponsiveContainer>
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
                  <div key={renter.user_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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

          {/* Top Vehicles */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <MdDirectionsCar className="mr-2" />
              Xe được thuê nhiều nhất
            </h2>
            <div className="space-y-4">
              {topVehicles.length > 0 ? (
                topVehicles.map((vehicle, index) => (
                  <div key={vehicle.vehicle_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{vehicle.model}</p>
                        <p className="text-sm text-gray-600">{vehicle.license_plate}</p>
                        <p className="text-sm text-gray-500">{vehicle.brand?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-purple-600">{vehicle.rent_count} lượt</p>
                      <p className="text-sm text-gray-600">{formatCurrency(vehicle.totalRevenue)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">Chưa có dữ liệu xe</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverViewManagement;