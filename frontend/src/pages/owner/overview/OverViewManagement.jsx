import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../config/axiosInstance.js';
import { useNavigate } from 'react-router-dom';
import { 
  MdAttachMoney, 
  MdDirectionsCar, 
  MdAssignment, 
  MdTrendingUp,
  MdPerson,
  MdStar,
  MdCalendarToday,
  MdClose,
  MdEmail
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
  const navigate = useNavigate();
  const [overviewData, setOverviewData] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [topRenters, setTopRenters] = useState([]);
  const [topVehicles, setTopVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('year');
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleHistory, setVehicleHistory] = useState([]);

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
  const fetchRevenueChart = async (period, year, month, quarter) => {
    try {
      const params = { 
        period: period,
        year: year
      };
      
      // Thêm tham số month nếu period là 'day'
      if (period === 'day') {
        params.month = month;
      }

      // Thêm tham số quarter nếu period là 'quarter'
      if (period === 'quarter' && quarter) {
        params.quarter = quarter;
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

  // Open booking detail in a new browser tab
  const handleRowClick = (bookingId) => {
    navigate(`/owner/booking-management/detail/${bookingId}`);
  };

  // Fetch rental history for a specific vehicle
  const fetchVehicleRentalHistory = async (vehicleId) => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);
      setHistoryModalOpen(true);

      const response = await axiosInstance.get('/api/owner/overview/top-vehicles/rental-history', {
        params: { vehicle_id: vehicleId, limit: 10 }
      });

      if (response.data.success) {
        setSelectedVehicle(response.data.data?.vehicle || null);
        setVehicleHistory(response.data.data?.bookings || []);
      } else {
        setSelectedVehicle(null);
        setVehicleHistory([]);
        setHistoryError(response.data.message || 'Không thể tải lịch sử thuê');
      }
    } catch (error) {
      console.error('Error fetching vehicle rental history:', error);
      setSelectedVehicle(null);
      setVehicleHistory([]);
      setHistoryError('Đã xảy ra lỗi khi tải lịch sử thuê');
    } finally {
      setHistoryLoading(false);
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
    console.log('selectedQuarter:', selectedQuarter);
    fetchRevenueChart(selectedPeriod, selectedYear, selectedMonth, selectedQuarter);
  }, [selectedPeriod, selectedYear, selectedMonth, selectedQuarter]);

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

      if (selectedPeriod === 'day' && parts.length === 3) {
        const [ y, m, d] = parts;
        label = `${(d || '').padStart(2, '0')}/${(m || '').padStart(2, '0')}`;
      } else if ((selectedPeriod === 'month' || selectedPeriod === 'quarter') && parts.length === 2) {
        const [y, m] = parts;
        label = `Tháng ${parseInt(m)} / ${y}`;
      } else if (selectedPeriod === 'year') {
        label = parts[0];
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
      return `12 tháng của năm ${selectedYear}`;
    } else if (selectedPeriod === 'quarter') {
      return `Quý ${selectedQuarter} - ${selectedYear}`;
    } else {
      return '5 năm gần nhất';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format date with optional time (HH:mm)
  const formatDateTime = (dateStr, timeStr) => {
    const date = formatDate(dateStr);
    if (!timeStr) return date;
    try {
      const parts = String(timeStr).split(':');
      const hh = parts[0]?.padStart(2, '0') || '00';
      const mm = parts[1]?.padStart(2, '0') || '00';
      return `${date} ${hh}:${mm}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return date;
    }
  };

  const closeHistoryModal = () => {
    setHistoryModalOpen(false);
    setHistoryError(null);
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeHistoryModal();
    };
    if (historyModalOpen) {
      window.addEventListener('keydown', onKeyDown);
    }
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [historyModalOpen]);

  // Lock scroll when modal open
  useEffect(() => {
    if (historyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [historyModalOpen]);

  // const statusLabel = (s) => {
  //   const map = {
  //     completed: 'Hoàn thành',
  //   };
  //   return map[s] || s;
  // };

  // const statusStyle = (s) => {
  //   const styles = {
  //     completed: 'bg-green-100 text-green-700 border-green-200',
  //   };
  //   return styles[s] || 'bg-gray-100 text-gray-700 border-gray-200';
  // };

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
            
            {/* Bộ lọc hiển thị theo yêu cầu: chuyển nhóm nút thành dropdown */}
            <div className="flex flex-wrap gap-4 items-end w-full lg:w-auto lg:ml-auto lg:justify-end">
              {/* Nút xem 5 năm gần nhất */}
              {/* <div className="flex items-center gap-2">
                <button
                  onClick={() => { setSelectedPeriod('year'); setSelectedQuarter(null); }}
                  className={`px-3 py-2 rounded-md text-sm border ${selectedPeriod === 'year' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  Xem 5 năm gần nhất
                </button>
              </div> */}

              {/* Dropdown chọn năm (10 năm) */}
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Chọn năm</label>
                <select
                  value={selectedYear ?? ''}
                  onChange={(e) => { const y = parseInt(e.target.value); setSelectedYear(y); setSelectedPeriod('month'); setSelectedQuarter(null); }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm min-w-[120px]"
                >
                  <option value="">-- Chọn năm --</option>
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Dropdown chọn quý */}
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Chọn quý</label>
                <select
                  value={selectedQuarter ?? ''}
                  onChange={(e) => { const q = parseInt(e.target.value); if (!isNaN(q)) { setSelectedQuarter(q); setSelectedPeriod('quarter'); } else { setSelectedQuarter(null); } }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm min-w-[120px]"
                >
                  <option value="">-- Chọn quý --</option>
                  <option value={1}>Quý 1</option>
                  <option value={2}>Quý 2</option>
                  <option value={3}>Quý 3</option>
                  <option value={4}>Quý 4</option>
                </select>
              </div>

              {/* Dropdown chọn tháng: 12 tháng hoặc theo quý đã chọn */}
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Chọn tháng</label>
                <select
                  value={selectedMonth ?? ''}
                  onChange={(e) => { const m = parseInt(e.target.value); setSelectedMonth(m); setSelectedPeriod('day'); }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm min-w-[140px]"
                >
                  <option value="">-- Chọn tháng --</option>
                  {(() => {
                    const months = selectedQuarter
                      ? Array.from({ length: 3 }, (_, i) => (selectedQuarter - 1) * 3 + 1 + i)
                      : Array.from({ length: 12 }, (_, i) => i + 1);
                    return months.map(m => (
                      <option key={m} value={m}>{getMonthName(m)}</option>
                    ));
                  })()}
                </select>
              </div>
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
                  <div 
                    key={vehicle.vehicle_id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:ring-2 hover:ring-purple-300 transition cursor-pointer"
                    onClick={() => fetchVehicleRentalHistory(vehicle.vehicle_id)}
                    title="Xem lịch sử thuê của xe"
                  >
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
          {/* Rental History Modal */}
          {historyModalOpen && (
            <div 
              class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeHistoryModal();
              }}
            >
              <div class="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-3xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <MdDirectionsCar className="mr-2 text-purple-600" />
                    Lịch sử thuê xe
                  </h3>
                  <button
                    onClick={closeHistoryModal}
                    className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
                    aria-label="Đóng"
                  >
                    <MdClose className="text-lg" />
                  </button>
                </div>

                {/* Vehicle header */}
                {selectedVehicle ? (
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      {selectedVehicle.main_image_url ? (
                        <img
                          src={selectedVehicle.main_image_url}
                          alt={selectedVehicle.model}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300">
                          <MdDirectionsCar className="text-gray-500 text-2xl" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {selectedVehicle.license_plate}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{selectedVehicle.model}</p>
                    </div>
                  </div>
                ) : null}

                {/* Content */}
                {historyLoading ? (
                  <div className="py-10 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                ) : historyError ? (
                  <div className="py-6 text-center text-red-600 text-sm">{historyError}</div>
                ) : vehicleHistory && vehicleHistory.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {vehicleHistory.map((bk) => (
                      <div key={bk.booking_id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 min-w-0">
                            {/* Avatar */}
                            <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center overflow-hidden">
                              {bk.renter?.avatar_url ? (
                                <img src={bk.renter.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                              ) : (
                                <MdPerson />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {bk.renter?.full_name || bk.renter?.email || 'Khách ẩn danh'}
                              </p>
                              {bk.renter?.email && (
                                <p className="text-xs text-gray-600 flex items-center">
                                  <MdEmail className="mr-1" /> {bk.renter.email}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-700 flex items-center justify-end">
                              <MdCalendarToday className="mr-1" /> {formatDateTime(bk.start_date, bk.start_time)} - {formatDateTime(bk.end_date, bk.end_time)}
                            </p>
                            {/* <div className={`inline-flex text-xs mt-2 px-2 py-1 rounded border ${statusStyle(bk.status)}`}>
                              {statusLabel(bk.status)}
                            </div> */}
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(bk.booking_id);
                          }}
                          className="mt-2 text-xs text-black hover:text-blue-600 hover:underline"
                          title="Xem chi tiết đơn thuê"
                        >
                          Mã đơn: #{bk.booking_id}
                        </button>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-gray-600 text-sm">Không có lịch sử thuê cho xe này</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverViewManagement;
 