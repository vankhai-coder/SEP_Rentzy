import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../config/axiosInstance.js';
import { MdTrendingUp, MdCalendarToday, MdDirectionsCar, MdFilterList } from 'react-icons/md';
import { DollarSign } from 'lucide-react';
import { useOwnerTheme } from "@/contexts/OwnerThemeContext";
import { createThemeUtils } from "@/utils/themeUtils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const Revenue = () => {
  const theme = useOwnerTheme();
  const themeUtils = createThemeUtils(theme);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  // Tạo danh sách năm (từ năm hiện tại trở về trước 5 năm)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Tạo danh sách quý
  const quarters = [
    { value: 1, label: 'Quý 1' },
    { value: 2, label: 'Quý 2' },
    { value: 3, label: 'Quý 3' },
    { value: 4, label: 'Quý 4' }
  ];

  // Tạo danh sách tháng
  const months = [
    { value: 1, label: 'Tháng 1' },
    { value: 2, label: 'Tháng 2' },
    { value: 3, label: 'Tháng 3' },
    { value: 4, label: 'Tháng 4' },
    { value: 5, label: 'Tháng 5' },
    { value: 6, label: 'Tháng 6' },
    { value: 7, label: 'Tháng 7' },
    { value: 8, label: 'Tháng 8' },
    { value: 9, label: 'Tháng 9' },
    { value: 10, label: 'Tháng 10' },
    { value: 11, label: 'Tháng 11' },
    { value: 12, label: 'Tháng 12' }
  ];

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Revenue: Fetching data with filters:', { 
        period: selectedPeriod, 
        year: selectedYear, 
        quarter: selectedQuarter, 
        month: selectedMonth 
      });
      
      const params = { period: selectedPeriod };
      if (selectedYear) params.year = selectedYear;
      if (selectedQuarter) params.quarter = selectedQuarter;
      if (selectedMonth) params.month = selectedMonth;
      
      const response = await axiosInstance.get('/api/owner/dashboard/revenue', {
        params
      });

      console.log('Revenue: API response:', response.data);
      if (response.data.success) {
        setRevenueData(response.data.data);
      } else {
        setError('Không thể tải dữ liệu doanh thu');
        setRevenueData(null);
      }
    } catch (error) {
      setError('Không thể tải dữ liệu doanh thu');
      console.error('Revenue: Error fetching revenue data:', error);
      // Đảm bảo set revenueData về null nếu có lỗi
      setRevenueData(null);
    } finally {
      setLoading(false);
      console.log('Revenue: Loading finished');
    }
  };

  useEffect(() => {
    console.log('Revenue: Component mounted, fetching data');
    fetchRevenueData();
  }, [selectedPeriod, selectedYear, selectedQuarter, selectedMonth]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatCompactCurrency = (amount) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  };

  // Prepare chart data (monthly - line chart)
  const prepareChartData = () => {
    try {
      if (!revenueData?.monthlyRevenue || !Array.isArray(revenueData.monthlyRevenue)) {
        return [];
      }

      // Sắp xếp theo năm và tháng (từ cũ đến mới)
      const sortedData = [...revenueData.monthlyRevenue].sort((a, b) => {
        if (a.year !== b.year) {
          return a.year - b.year;
        }
        return a.month - b.month;
      });

      return sortedData.map(item => ({
        month: `${item.month}/${item.year}`,
        revenue: parseFloat(item.revenue || 0),
        bookings: parseInt(item.booking_count || 0)
      }));
    } catch (error) {
      console.error('Error preparing chart data:', error);
      return [];
    }
  };

  // Prepare daily chart data (bar chart when month is selected)
  const prepareDailyChartData = () => {
    try {
      if (!revenueData?.dailyRevenue || !Array.isArray(revenueData.dailyRevenue)) {
        return [];
      }

      return revenueData.dailyRevenue.map(item => ({
        day: `${String(item.day).padStart(2, '0')}/${String(item.month).padStart(2, '0')}`,
        revenue: parseFloat(item.revenue || 0),
        bookings: parseInt(item.booking_count || 0)
      }));
    } catch (error) {
      console.error('Error preparing daily chart data:', error);
      return [];
    }
  };

  const prepareVehicleStats = () => {
    try {
      if (!revenueData?.vehicleStats || !Array.isArray(revenueData.vehicleStats)) {
        return [];
      }

      return revenueData.vehicleStats.map(stat => {
        // Hỗ trợ cả cấu trúc mới (từ backend đã serialize) và cấu trúc cũ
        const revenue = parseFloat(stat.totalRevenue || stat.dataValues?.totalRevenue || 0);
        const bookings = parseInt(stat.bookingCount || stat.dataValues?.bookingCount || 0);
        const vehicle = stat.vehicle || stat.dataValues?.vehicle || null;

        return {
          name: `${vehicle?.model || 'N/A'} (${vehicle?.license_plate || 'N/A'})`,
          revenue: revenue,
          bookings: bookings
        };
      }).filter(stat => stat.revenue > 0 || stat.bookings > 0); // Chỉ hiển thị xe có doanh thu hoặc đơn
    } catch (error) {
      console.error('Error preparing vehicle stats:', error);
      return [];
    }
  };

  // Prepare booking status data for donut chart
  const prepareBookingStatusData = () => {
    try {
      if (!revenueData?.bookingStatusStats || !Array.isArray(revenueData.bookingStatusStats)) {
        return [];
      }

      const statusMap = {
        'pending': { name: 'Chờ xác nhận', color: '#FFB6C1' }, // Pink
        'deposit_paid': { name: 'Đã đặt cọc', color: '#FFD700' }, // Yellow
        'fully_paid': { name: 'Đã thanh toán toàn bộ', color: '#87CEEB' }, // Light Blue
        'in_progress': { name: 'Đang thuê', color: '#4169E1' }, // Dark Blue
        'completed': { name: 'Hoàn thành', color: '#9370DB' }, // Purple
        'cancel_requested': { name: 'Yêu cầu hủy', color: '#90EE90' }, // Light Green
        'canceled': { name: 'Đã hủy', color: '#228B22' }, // Dark Green
        'confirmed': { name: 'Đã xác nhận', color: '#FFA500' }, // Orange
      };

      return revenueData.bookingStatusStats.map(stat => ({
        name: statusMap[stat.status]?.name || stat.status,
        value: parseInt(stat.count || 0),
        color: statusMap[stat.status]?.color || '#8884D8'
      })).filter(item => item.value > 0);
    } catch (error) {
      console.error('Error preparing booking status data:', error);
      return [];
    }
  };

  // Prepare disbursement status data for donut chart
  const prepareDisbursementStatusData = () => {
    try {
      if (!revenueData?.disbursementStatusStats || !Array.isArray(revenueData.disbursementStatusStats)) {
        return [];
      }

      const statusMap = {
        'PENDING': { name: 'Chờ xử lý', color: '#FFB6C1' }, // Pink
        'COMPLETED': { name: 'Hoàn thành', color: '#87CEEB' }, // Light Blue
        'FAILED': { name: 'Thất bại', color: '#9370DB' }, // Purple
        'CANCELLED': { name: 'Đã hủy', color: '#4169E1' }, // Dark Blue
      };

      return revenueData.disbursementStatusStats.map(stat => ({
        name: statusMap[stat.status]?.name || stat.status,
        value: parseInt(stat.count || 0),
        color: statusMap[stat.status]?.color || '#8884D8'
      })).filter(item => item.value > 0);
    } catch (error) {
      console.error('Error preparing disbursement status data:', error);
      return [];
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  console.log('Revenue: Rendering, loading:', loading, 'error:', error, 'revenueData:', revenueData);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Đảm bảo component luôn render được, ngay cả khi không có data
  try {
    return (
      <div className={`p-4 lg:p-6 min-h-screen ${themeUtils.bgMain}`}>
      <div className="mb-6">
        <div className="mb-4">
          <h1 className={`text-2xl font-bold mb-2 ${themeUtils.textPrimary}`}>Biểu đồ doanh thu</h1>
          <p className={themeUtils.textSecondary}>Quản lý trực quan doanh thu theo thời gian và các chỉ số liên quan</p>
        </div>
        
        {/* Filters */}
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <MdFilterList className="text-gray-500 dark:text-gray-400" size={20} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bộ lọc:</span>
            </div>
            <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(Number(e.target.value));
                  setSelectedQuarter('');
                  setSelectedMonth('');
                }}
                className="px-3 py-2 min-w-[150px] border border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn năm --</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

            <select
                value={selectedQuarter}
                onChange={(e) => {
                  setSelectedQuarter(e.target.value ? Number(e.target.value) : '');
                  setSelectedMonth('');
                }}
                disabled={!selectedYear}
                className="px-3 py-2 min-w-[150px] border border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">-- Chọn quý --</option>
                {quarters.map(quarter => (
                  <option key={quarter.value} value={quarter.value}>{quarter.label}</option>
                ))}
              </select>

            <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : '')}
                disabled={!selectedYear}
                className="px-3 py-2 min-w-[150px] border border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">-- Chọn tháng --</option>
                {months
                  .filter((month) => {
                    if (selectedQuarter) {
                      const startMonth = (selectedQuarter - 1) * 3 + 1;
                      const endMonth = startMonth + 2;
                      return month.value >= startMonth && month.value <= endMonth;
                    }
                    return true;
                  })
                  .map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
              </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng doanh thu</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(revenueData?.totalRevenue || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <MdTrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đơn hoàn thành</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {revenueData?.completedBookings || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <MdCalendarToday className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Doanh thu TB/tháng</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(
                  revenueData?.monthlyRevenue?.length > 0
                    ? revenueData.monthlyRevenue.reduce((sum, item) => sum + parseFloat(item.revenue || 0), 0) / revenueData.monthlyRevenue.length
                    : 0
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <MdDirectionsCar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Xe có doanh thu</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {revenueData?.vehicleStats?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Booking Status Donut Chart */}
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Trạng thái đặt xe</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={prepareBookingStatusData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {prepareBookingStatusData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => <span style={{ color: entry.color }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Disbursement Status Donut Chart */}
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Trạng thái thanh toán giải ngân</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={prepareDisbursementStatusData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {prepareDisbursementStatusData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => <span style={{ color: entry.color }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Total Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Biểu đồ doanh thu */}
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {revenueData?.dailyRevenue ? 'Biểu đồ doanh thu' : 'Tổng doanh thu theo tháng'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {revenueData?.dailyRevenue 
              ? `Tháng ${selectedMonth}/${selectedYear}`
              : selectedQuarter 
                ? `Quý ${selectedQuarter} - ${selectedYear}`
                : selectedYear 
                  ? `Năm ${selectedYear}`
                  : 'Tất cả thời gian'}
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {revenueData?.dailyRevenue ? (
                <BarChart data={prepareDailyChartData()} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="day" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={Math.floor(prepareDailyChartData().length / 10)}
                  />
                  <YAxis tickFormatter={(value) => formatCompactCurrency(value)} width={70} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="#3B82F6"
                    name="Doanh thu"
                  />
                </BarChart>
              ) : (
                <BarChart data={prepareChartData()} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCompactCurrency(value)} width={70} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="#14B8A6" 
                    name="Doanh thu"
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biểu đồ số đơn đặt xe */}
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Số đơn đặt xe
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {revenueData?.dailyRevenue 
              ? `Tháng ${selectedMonth}/${selectedYear}`
              : selectedQuarter 
                ? `Quý ${selectedQuarter} - ${selectedYear}`
                : selectedYear 
                  ? `Năm ${selectedYear}`
                  : 'Tất cả thời gian'}
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {revenueData?.dailyRevenue ? (
                <BarChart data={prepareDailyChartData()} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="day" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={Math.floor(prepareDailyChartData().length / 10)}
                  />
                  <YAxis allowDecimals={false} width={70} />
                  <Tooltip 
                    formatter={(value) => [value, 'Số đơn']}
                  />
                  <Bar 
                    dataKey="bookings" 
                    fill="#10B981"
                    name="Số đơn"
                  />
                </BarChart>
              ) : (
                <BarChart data={prepareChartData()} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} width={70} />
                  <Tooltip 
                    formatter={(value) => [value, 'Số đơn']}
                  />
                  <Bar 
                    dataKey="bookings" 
                    fill="#10B981" 
                    name="Số đơn"
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Vehicle Performance */}
      <div className="grid grid-cols-1 gap-6">
        {/* Vehicle Stats Table */}
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Thống kê xe</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-secondary-700">
              <thead className="bg-gray-50 dark:bg-secondary-900">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Xe
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Đơn
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Doanh thu
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-secondary-800 divide-y divide-gray-200 dark:divide-secondary-700">
                {prepareVehicleStats().map((stat, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-secondary-700">
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="truncate max-w-32" title={stat.name}>
                        {stat.name}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {stat.bookings}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(stat.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {prepareVehicleStats().length === 0 && (
            <div className="text-center py-8">
              <MdDirectionsCar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có dữ liệu</h3>
              <p className="mt-1 text-sm text-gray-500">Chưa có đơn thuê hoàn thành nào.</p>
            </div>
          )}
        </div>
      </div>
    </div>
    );
  } catch (renderError) {
    console.error('Revenue: Error rendering component:', renderError);
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h2 className="text-xl font-bold text-red-800 mb-2">Lỗi hiển thị trang doanh thu</h2>
          <p className="text-red-600">{renderError.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }
};

export default Revenue;
