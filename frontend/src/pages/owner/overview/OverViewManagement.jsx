import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../config/axiosInstance.js';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ChevronRight, 
  DollarSign, 
  Home, 
  MoveDownRight, 
  MoveUpRight, 
  ShoppingCart, 
  User,
  Car,
  TrendingUp,
  Calendar,
  X,
  Mail
} from 'lucide-react';
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
  
  const [revenueChart, setRevenueChart] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('year');
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleHistory, setVehicleHistory] = useState([]);

  // Fetch overview stats using react-query
  const getOverviewStats = async () => {
    const res = await axiosInstance.get('/api/owner/overview/stats');
    return res.data.data;
  };
  const { data: overviewData, isLoading: isLoadingOverviewStats, isError: isErrorOverviewStats } = useQuery({
    queryKey: ["owner-overview-stats"],
    queryFn: getOverviewStats
  });

  // Fetch recent bookings using react-query
  const getRecentBookings = async () => {
    const res = await axiosInstance.get('/api/owner/dashboard/bookings', {
      params: { limit: 10, page: 1, sortBy: 'created_at', sortOrder: 'DESC' }
    });
    return res.data.data.bookings || [];
  };
  const { data: recentBookings, isLoading: isLoadingBookings, isError: isErrorBookings } = useQuery({
    queryKey: ["owner-recent-bookings"],
    queryFn: getRecentBookings
  });

  // Fetch top renters using react-query
  const getTopRenters = async () => {
    const res = await axiosInstance.get('/api/owner/overview/top-renters', {
      params: { limit: 5 }
    });
    return res.data.data || [];
  };
  const { data: topRenters, isLoading: isLoadingTopRenters, isError: isErrorTopRenters } = useQuery({
    queryKey: ["owner-top-renters"],
    queryFn: getTopRenters
  });

  // Fetch top vehicles using react-query
  const getTopVehicles = async () => {
    const res = await axiosInstance.get('/api/owner/overview/top-vehicles', {
      params: { limit: 5 }
    });
    return res.data.data || [];
  };
  const { data: topVehicles, isLoading: isLoadingTopVehicles, isError: isErrorTopVehicles } = useQuery({
    queryKey: ["owner-top-vehicles"],
    queryFn: getTopVehicles
  });

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

  useEffect(() => {
    console.log('=== OverViewManagement: Period/Year/Month changed ===');
    console.log('selectedPeriod:', selectedPeriod);
    console.log('selectedYear:', selectedYear);
    console.log('selectedMonth:', selectedMonth);
    console.log('selectedQuarter:', selectedQuarter);
    fetchRevenueChart(selectedPeriod, selectedYear, selectedMonth, selectedQuarter);
  }, [selectedPeriod, selectedYear, selectedMonth, selectedQuarter]);

  // Format currency function to VND
  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Format compact currency for charts (1.3M, 104.2K, etc.) - without đ
  const formatCompactCurrency = (amount) => {
    if (!amount || amount === 0) return '0';
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  };

  // Format date like : 12 tháng 9, 2023
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  // All possible status from backend Booking model
  const statusBadge = {
    completed: 'badge-success',
    pending: 'badge-warning',
    canceled: 'badge-danger',
    in_progress: 'badge-primary',
    cancel_requested: 'badge-info',
    fully_paid: 'badge-success',
    deposit_paid: 'badge-warning',
    ongoing: 'badge-primary',
  };

  // Function to get percentage change
  const getPercentageChange = (previous, current) => {
    if (previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous * 100).toFixed(1);
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
        bookingCount: Math.floor(parseInt(String(item.bookingCount).replace(/,/g, '')) || 0)
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

  const formatDateShort = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format date with optional time (HH:mm)
  const formatDateTime = (dateStr, timeStr) => {
    const date = formatDateShort(dateStr);
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

  return (
    <div className="p-4 lg:p-6 min-h-screen bg-white">
      <div>
        {/* navigation */}
        <nav className="flex items-center space-x-2 text-sm mb-6">
          <a href="" className="flex items-center text-gray-600 hover:text-primary-600 transition-colors">
            <Home />
          </a>
          <div className="flex items-center gap-2">
            <ChevronRight />
            <span className="text-black font-medium">Tổng Quan Hệ Thống</span>
          </div>
        </nav>
        {/* title */}
        <div className='mb-6'>
          <h1 className="text-3xl font-bold mb-2 text-black">Tổng Quan Hệ Thống</h1>
          <p className="text-gray-700">Chào mừng bạn quay lại! Đây là những thông tin nổi bật về hoạt động kinh doanh của bạn hôm nay.</p>
        </div>
        {/* overview content : 3 boxes */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 '>
          {/* first box - Total Revenue */}
          <div className='card p-6 transition-all duration-200 relative overflow-hidden border border-gray-200 shadow-md'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <p className="text-sm font-medium mb-1 text-gray-700">Tổng doanh thu</p>
                <p className="text-3xl font-bold mb-2 text-black">{isLoadingOverviewStats ? "Loading..." : isErrorOverviewStats ? "Error" : formatCurrency(overviewData?.totalRevenue || 0)}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <DollarSign className="lucide lucide-dollar-sign w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          {/* second box - Total Bookings */}
          <div className='card p-6 transition-all duration-200 relative overflow-hidden border border-gray-200 shadow-md'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <p className="text-sm font-medium mb-1 text-gray-700">Tổng số đơn đặt xe</p>
                <p className="text-3xl font-bold mb-2 text-black">{isLoadingOverviewStats ? "Loading..." : isErrorOverviewStats ? "Error" : overviewData?.totalBookings || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <ShoppingCart className="lucide lucide-shopping-cart w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          {/* third box - Total Vehicles */}
          <div className='card p-6 transition-all duration-200 relative overflow-hidden border border-gray-200 shadow-md'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <p className="text-sm font-medium mb-1 text-gray-700">Tổng số xe</p>
                <p className="text-3xl font-bold mb-2 text-black">{isLoadingOverviewStats ? "Loading..." : isErrorOverviewStats ? "Error" : overviewData?.totalVehicles || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <Car className="lucide lucide-car w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/*2 chart  */}
        {/* Bộ lọc chung cho cả 2 biểu đồ */}
        <div className="mb-6">
          <div className="card p-4 transition-all duration-200 border border-gray-200 shadow-md">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Dropdown chọn năm (10 năm) */}
              <div className="flex flex-col">
                <select
                  value={selectedYear ?? ''}
                  onChange={(e) => { const y = parseInt(e.target.value); setSelectedYear(y); setSelectedPeriod('month'); setSelectedQuarter(null); }}
                  className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-black text-sm min-w-[110px]"
                >
                  <option value="">-- Chọn năm --</option>
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
 
              {/* Dropdown chọn quý */}
              <div className="flex flex-col">
                <select
                  value={selectedQuarter ?? ''}
                  onChange={(e) => { const q = parseInt(e.target.value); if (!isNaN(q)) { setSelectedQuarter(q); setSelectedPeriod('quarter'); } else { setSelectedQuarter(null); } }}
                  className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-black text-sm min-w-[110px]"
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
                <select
                  value={selectedMonth ?? ''}
                  onChange={(e) => { const m = parseInt(e.target.value); setSelectedMonth(m); setSelectedPeriod('day'); }}
                  className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-black text-sm min-w-[130px]"
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
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
          {/* Revenue Chart */}
          <div className='card p-6 transition-all duration-200 border border-gray-200 shadow-md'>
            <div className='flex flex-col space-y-1.5 mb-4'>
              <h2 className="text-lg font-semibold flex items-center text-black">
                <TrendingUp className="mr-2" />
                Biểu đồ doanh thu
              </h2>
              <p className="text-sm text-gray-700">
                <Calendar className="inline mr-1" />
                {getPeriodDisplayText()}
              </p>
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
                      <YAxis tickFormatter={(value) => formatCompactCurrency(value)} />
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
                    <BarChart data={formatChartData(revenueChart)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis tickFormatter={(value) => formatCompactCurrency(value)} />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                        labelFormatter={(label) => `Thời gian: ${label}`}
                      />
                      <Bar 
                        dataKey="revenue" 
                        fill="#3B82F6" 
                        name="Doanh thu"
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-700">
                    <TrendingUp className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-lg font-medium">Chưa có dữ liệu doanh thu</p>
                    <p className="text-sm">Dữ liệu sẽ hiển thị khi có đơn đặt xe</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Booking Statistics Chart */}
          <div className='card p-6 transition-all duration-200 border border-gray-200 shadow-md'>
            <div className='flex flex-col space-y-1.5 mb-4'>
              <h2 className="text-lg font-semibold flex items-center text-black">
                <ShoppingCart className="mr-2" />
                Số đơn đặt xe
              </h2>
              <p className="text-sm text-gray-700">
                <Calendar className="inline mr-1" />
                {getPeriodDisplayText()}
              </p>
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
                      <YAxis 
                        allowDecimals={false}
                        tickFormatter={(value) => Math.round(value).toString()}
                      />
                      <Tooltip 
                        formatter={(value) => [Math.round(value), 'Số đơn']}
                        labelFormatter={(label) => `Ngày: ${label}`}
                      />
                      <Bar 
                        dataKey="bookingCount" 
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  ) : (
                    <BarChart data={formatChartData(revenueChart)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis 
                        allowDecimals={false}
                        tickFormatter={(value) => Math.round(value).toString()}
                      />
                      <Tooltip 
                        formatter={(value) => [Math.round(value), 'Số đơn']}
                        labelFormatter={(label) => `Thời gian: ${label}`}
                      />
                      <Bar 
                        dataKey="bookingCount" 
                        fill="#10B981" 
                        name="Số đơn"
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-700">
                    <ShoppingCart className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-lg font-medium">Chưa có dữ liệu đơn đặt</p>
                    <p className="text-sm">Dữ liệu sẽ hiển thị khi có đơn đặt xe</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* 2 table */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* table 1 - Recent Bookings */}
          <div className='card p-6 transition-all duration-200 border border-gray-200 shadow-md'>
            <div className='flex flex-col space-y-1.5 mb-4'>
              <h2 className="text-lg font-semibold text-black">
                Các đặt xe gần đây
              </h2>
              <div>
                <div className='space-y-4'>
                  {isLoadingBookings && <p className="text-gray-700">Loading...</p>}
                  {isErrorBookings && <p className="text-gray-700">Error loading bookings.</p>}
                  {recentBookings && recentBookings.length > 0 ? recentBookings.map((booking) => (
                    <div key={booking.booking_id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
                      <div className='flex-1'>
                        <p className="font-medium text-black">{booking.renter?.full_name || booking.renter?.email || 'N/A'}</p>
                        <p className="text-sm text-gray-700">{booking.vehicle?.model || 'N/A'}</p>
                      </div>
                      <div className='text-right'>
                        <p className="font-medium text-black">{formatCurrency(booking.total_amount || 0)}</p>
                        <span className={`badge ${statusBadge[booking.status] || 'badge-warning'} px-2 py-0.5 text-xs`}>{booking.status || 'N/A'}</span>
                      </div>
                    </div>
                  )) : !isLoadingBookings && !isErrorBookings && (
                    <p className="text-gray-700 text-center py-4">Chưa có đặt xe gần đây</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* table 2 - Top Renters */}
          <div className='card p-6 transition-all duration-200 border border-gray-200 shadow-md'>
            <div className='flex flex-col space-y-1.5 mb-4'>
              <h2 className="text-lg font-semibold text-black">
                Khách hàng thuê nhiều nhất
              </h2>
              <div>
                <div className='space-y-4'>
                  {isLoadingTopRenters && <p className="text-gray-700">Loading...</p>}
                  {isErrorTopRenters && <p className="text-gray-700">Error loading top renters.</p>}
                  {topRenters && topRenters.length > 0 ? topRenters.map((renter, index) => (
                    <div key={renter.user_id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
                      <div className='flex-1'>
                        <p className="font-medium text-black">{renter.full_name || renter.email || 'N/A'}</p>
                        <p className="text-sm text-gray-700">{renter.email || 'N/A'}</p>
                      </div>
                      <div className='text-right'>
                        <p className="font-medium text-black">{renter.rentCount || 0} lượt</p>
                        <p className="text-xs text-gray-700">{formatCurrency(renter.totalSpent || 0)}</p>
                      </div>
                    </div>
                  )) : !isLoadingTopRenters && !isErrorTopRenters && (
                    <p className="text-gray-700 text-center py-4">Chưa có dữ liệu khách hàng</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Top Vehicles Section */}
        <div className='mt-6'>
          <div className='card p-6 transition-all duration-200 border border-gray-200 shadow-md'>
            <div className='flex flex-col space-y-1.5 mb-4'>
              <h2 className="text-lg font-semibold text-black flex items-center">
                <Car className="mr-2" />
                Xe được thuê nhiều nhất
              </h2>
            </div>
            <div className='space-y-4'>
              {isLoadingTopVehicles && <p className="text-gray-700">Loading...</p>}
              {isErrorTopVehicles && <p className="text-gray-700">Error loading top vehicles.</p>}
              {topVehicles && topVehicles.length > 0 ? (
                topVehicles.map((vehicle, index) => (
                  <div 
                    key={vehicle.vehicle_id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:ring-2 hover:ring-primary-300 transition cursor-pointer"
                    onClick={() => fetchVehicleRentalHistory(vehicle.vehicle_id)}
                    title="Xem lịch sử thuê của xe"
                  >
                    <div className='flex items-center space-x-4'>
                      {/* Ranking number */}
                      <div className='w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm'>
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
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-full h-full ${vehicle.main_image_url ? 'hidden' : 'flex'} items-center justify-center bg-gray-300`}
                        >
                          <Car className="text-gray-700 text-xl" />
                        </div>
                      </div>
                      
                      {/* Vehicle info */}
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center space-x-2'>
                          <p className="font-medium text-black truncate">
                            {vehicle.brand?.name || 'N/A'}
                          </p>
                          <span className="text-gray-700">•</span>
                          <p className="font-medium text-black truncate">
                            {vehicle.model}
                          </p>
                        </div>
                        <p className="text-sm text-gray-700">{vehicle.license_plate}</p>
                        <p className="text-xs text-gray-700">{formatCurrency(vehicle.price_per_day)}/ngày</p>
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className='text-right flex-shrink-0'>
                      <p className="font-semibold text-primary-600 text-lg">{vehicle.rent_count || 0} lượt</p>
                      <p className="text-sm text-gray-700 font-medium">{formatCurrency(vehicle.total_paid || 0)}</p>
                    </div>
                  </div>
                ))
              ) : !isLoadingTopVehicles && !isErrorTopVehicles && (
                <div className='text-center py-8'>
                  <Car className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-700">Chưa có xe được thuê</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Rental History Modal */}
      {historyModalOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeHistoryModal();
          }}
        >
          <div className="bg-white backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-3xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-semibold text-black flex items-center">
                <Car className="mr-2 text-primary-600" />
                Lịch sử thuê xe
              </h3>
              <button
                onClick={closeHistoryModal}
                className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
                aria-label="Đóng"
              >
                <X className="text-lg" />
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
                      <Car className="text-gray-700 text-2xl" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-black truncate">
                    {selectedVehicle.license_plate}
                  </p>
                  <p className="text-sm text-gray-700 truncate">{selectedVehicle.model}</p>
                </div>
              </div>
            ) : null}

            {/* Content */}
            {historyLoading ? (
              <div className="py-10 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mx-auto"></div>
              </div>
            ) : historyError ? (
              <div className="py-6 text-center text-red-600 text-sm">{historyError}</div>
            ) : vehicleHistory && vehicleHistory.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {vehicleHistory.map((bk) => (
                  <div key={bk.booking_id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0">
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center overflow-hidden">
                          {bk.renter?.avatar_url ? (
                            <img src={bk.renter.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-black truncate">
                            {bk.renter?.full_name || bk.renter?.email || 'Khách ẩn danh'}
                          </p>
                          {bk.renter?.email && (
                            <p className="text-xs text-gray-700 flex items-center">
                              <Mail className="mr-1 w-3 h-3" /> {bk.renter.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-700 flex items-center justify-end">
                          <Calendar className="mr-1 w-3 h-3" /> {formatDateTime(bk.start_date, bk.start_time)} - {formatDateTime(bk.end_date, bk.end_time)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(bk.booking_id);
                      }}
                      className="mt-2 text-xs text-black hover:text-primary-600 hover:underline"
                      title="Xem chi tiết đơn thuê"
                    >
                      Mã đơn: #{bk.booking_id}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-gray-700 text-sm">Không có lịch sử thuê cho xe này</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverViewManagement;
 