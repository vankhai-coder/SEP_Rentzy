import { Download, Loader, UserPlus } from "lucide-react"
import axiosInstance from "@/config/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react";

import DoughnutChart from "@/components/admin/chart/DoughnutChart";
import LineChartComponent from "@/components/admin/chart/LineChart";
const RevenueStats = () => {

  // FIST CHART : New Register User Data by Month
  // use useQuery to fetch data from backend API using axiosInstance for total revenue by month : /api/admin/revenue/revenue-stats?months=6 , and response {data , labels}
  const [selectedMonths, setSelectedMonths] = useState(6); // default 6 months

  const fetchTotalRevenueByMonth = async () => {
    const response = await axiosInstance.get(`/api/admin/revenue/revenue-stats?months=${selectedMonths}`);
    return response.data; // { labels: [], data: [] }
  }
  const { data: totalRevenueData, isLoading: isLoadingTotalRevenueData, error: errorTotalRevenueData } = useQuery(
    {
      queryKey: ['totalRevenueData', selectedMonths],
      queryFn: fetchTotalRevenueByMonth,
    }
  );

  

  // Doughnut for status of booking , /api/admin/revenue/booking-status-count 
  const fetchStatusOfBooking = async () => {
    const response = await axiosInstance.get('/api/admin/revenue/booking-status-count');
    return response.data; // { labels: [], data: [] }
  }
  const { data: bookingStatusData, isLoading: isLoadingBookingStatusData, error: errorBookingStatusData } = useQuery(
    {
      queryKey: ['bookingStatusData'],
      queryFn: fetchStatusOfBooking,
    }
  );


  // /api/admin/revenue/booking-payouts
  const fetchBookingPayouts = async () => {
    const response = await axiosInstance.get('/api/admin/revenue/booking-payouts');
    return response.data; // { labels: [], data: [] }
  }
  const { data: bookingPayoutData, isLoading: isLoadingBookingPayoutData, error: errorBookingPayoutData } = useQuery(
    {
      queryKey: ['bookingPayoutData'],
      queryFn: fetchBookingPayouts,
    }
  );

  return (

    <div className="p-4 py-38 lg:p-6 dark:bg-[#020617] min-h-screen ">
      <div className="space-y-6 pb-40">

        <div className="flex items-center justify-between" >
          {/* User Management Title */}
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">Biểu đồ doanh thu</h1>
            <p className="text-secondary-600 dark:text-secondary-400">Quản lý trực quan doanh thu theo thời gian và các chỉ số liên quan</p>
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
        <div className="flex flex-col justify-center items-center">



          <div className=" w-full  mt-4 sm:mt-10 flex flex-col sm:flex-row justify-evenly items-center gap-6 p-4 rounded-lg">

            {/* Booking status - doughnut chart */}
            <div>
              {/* loading :  */}
              {isLoadingBookingStatusData && <Loader className="animate-spin mx-auto" />}
              {errorBookingStatusData && <p className="text-red-500 mx-auto">Lỗi khi tải dữ liệu biểu đồ trạng thái đặt xe.</p>}
              <DoughnutChart data={bookingStatusData?.data} labels={bookingStatusData?.labels} title="Trạng thái đặt xe" />
            </div>

          {/* booking payout - doughnut chart */}
            <div>
              {/* loading :  */}
              {isLoadingBookingPayoutData && <Loader className="animate-spin mx-auto" />}
              {errorBookingPayoutData && <p className="text-red-500 mx-auto">Lỗi khi tải dữ liệu biểu đồ trạng thái thanh toán đặt xe.</p>}
              <DoughnutChart data={bookingPayoutData?.data} labels={bookingPayoutData?.labels} title="Trạng thái thanh toán giải ngân" />
            </div>
          </div>

          {/* UserLineChart for total revenue */}
          <div className="w-full text-center">
            {/* loading or error : */}
            {isLoadingTotalRevenueData && <Loader className="animate-spin mx-auto" />}
            {/* select months */}
            <div className="mx-auto flex justify-center sm:justify-end">
              <Select defaultValue="6" onValueChange={(value) => {
                // set selected months
                setSelectedMonths(Number(value));
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Chọn tháng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 tháng gần nhất</SelectItem>
                  <SelectItem value="6">6 tháng gần nhất</SelectItem>
                  <SelectItem value="12">12 tháng gần nhất</SelectItem>
                  <SelectItem value="24">24 tháng gần nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errorTotalRevenueData && <p className="text-red-500 mx-auto">Lỗi khi tải dữ liệu biểu đồ tổng doanh thu.</p>}
            {/* chart: */}
            <LineChartComponent data={totalRevenueData?.data} labels={totalRevenueData?.labels} title={"Tổng doanh thu theo tháng"} label={"Doanh thu"} />
          </div>

        </div>

      </div>
    </div>
  )
}

export default RevenueStats