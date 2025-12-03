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

const UserManagement = () => {

    // FIST CHART : New Register User Data by Month
    // use useQuery to fetch data from backend API using axiosInstance for new register user data by month : api/admin/user-chart/new-registrations , and response {data , labels}
    const [selectedMonths, setSelectedMonths] = useState(6); // default 6 months
    const fetchNewRegisterUserData = async (months = 6) => {
        const response = await axiosInstance.get('/api/admin/user-chart/new-registrations', {
            params: { months }
        })
        return response.data; // { labels: [], data: [] }
    }
    const { data: newRegisterUserData, isLoading: isLoadingNewRegisterUserData, error: errorNewRegisterUserData } = useQuery(
        {
            queryKey: ['newRegisterUserData', selectedMonths],
            queryFn: () => fetchNewRegisterUserData(selectedMonths),
        }
    );

    // SECOND CHART : User Count by Role (renter, owner, admin)
    // usequery to fetch data from backend API using axiosInstance for user count by role : /api/admin/user-chart/user-count-by-role , and response {data , labels}
    const fetchUserCountByRole = async () => {
        const response = await axiosInstance.get('/api/admin/user-chart/user-count-by-role');
        return response.data; // { labels: [], data: [] }
    }
    const { data: userCountByRoleData, isLoading: isLoadingUserCountByRoleData, error: errorUserCountByRoleData } = useQuery(
        {
            queryKey: ['userCountByRoleData'],
            queryFn: fetchUserCountByRole,
        }
    );

    // THIRD CHART : Owner Count by Status (approved, pending, rejected)
    // /api/admin/user-chart/owner-count-by-status 
    const fetchOwnerCountByStatus = async () => {
        const response = await axiosInstance.get('/api/admin/user-chart/owner-count-by-status');
        return response.data; // { labels: [], data: [] }
    }
    const { data: ownerCountByStatusData, isLoading: isLoadingOwnerCountByStatusData, error: errorOwnerCountByStatusData } = useQuery(
        {
            queryKey: ['ownerCountByStatusData'],
            queryFn: fetchOwnerCountByStatus,
        }
    );

    return (

        <div className="p-4  lg:p-6 dark:bg-[#020617] min-h-screen ">
            <div className="space-y-6 pb-40">

                <div className="flex items-center justify-between" >
                    {/* User Management Title */}
                    <div>
                        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">Biểu đồ người dùng</h1>
                        <p className="text-secondary-600 dark:text-secondary-400">Quản lý trực quan số người dùng và các vai trò của họ</p>
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
                        {/* User by role - doughnut chart */}
                        <div>
                            {/* loading :  */}
                            {isLoadingUserCountByRoleData && <Loader className="animate-spin mx-auto" />}
                            {errorUserCountByRoleData && <p className="text-red-500 mx-auto">Lỗi khi tải dữ liệu biểu đồ người dùng theo vai trò.</p>}
                            <DoughnutChart data={userCountByRoleData?.data} labels={userCountByRoleData?.labels} title={"Người dùng theo vai trò"} />
                        </div>
                        {/* new owner registrations */}
                        <div>
                            {/* loading :  */}
                            {isLoadingOwnerCountByStatusData && <Loader className="animate-spin mx-auto" />}
                            {/* error */}
                            {errorOwnerCountByStatusData && <p className="text-red-500 mx-auto">Lỗi khi tải dữ liệu biểu đồ chủ xe theo trạng thái.</p>}
                            {/* chart component here */}
                            <DoughnutChart data={ownerCountByStatusData?.data} labels={ownerCountByStatusData?.labels} title={"Yêu cầu duyệt chủ xe"} />
                        </div>
                        {errorOwnerCountByStatusData && <p className="text-red-500 mx-auto">Lỗi khi tải dữ liệu biểu đồ chủ xe theo trạng thái.</p>}

                    </div>

                      {/* UserLineChart for new register */}
                    <div className="w-full text-center">
                        {/* loading or error : */}
                        {isLoadingNewRegisterUserData && <Loader className="animate-spin mx-auto" />}
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
                        {errorNewRegisterUserData && <p className="text-red-500 mx-auto">Lỗi khi tải dữ liệu biểu đồ người dùng.</p>}
                        {/* chart: */}
                        <LineChartComponent data={newRegisterUserData?.data} labels={newRegisterUserData?.labels} title={'Các lượt đăng ký mới'} label={'Người dùng đã đăng ký'} />
                    </div>

                </div>

            </div>
        </div>
    )
}

export default UserManagement