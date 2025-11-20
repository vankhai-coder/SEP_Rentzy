import { Ban, Check, ChevronDownIcon, ChevronLeft, ChevronRight, CircleX, Download, Ellipsis, Eye, Handshake, Loader, ShieldCheck, UserPlus, X } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { PopoverClose } from "@radix-ui/react-popover"
import axiosInstance from "@/config/axiosInstance"
import { useQuery, suseQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"

const VoucherManagement = () => {

  // const queryClient = useQueryClient();

  // state for pick date "valid from" : 
  const [openDatePickerValidFrom, setOpenDatePickerValidFrom] = useState(false)
  const [dateForValidFrom, setDateForValidFrom] = useState(undefined)

  // state for pick date "valid to" :
  const [openDatePickerValidTo, setOpenDatePickerValidTo] = useState(false)
  const [dateForValidTo, setDateForValidTo] = useState(undefined)


  // console
  console.log("dateForValidFrom:", dateForValidFrom);
  console.log("dateForValidTo:", dateForValidTo);

  // use tankstack query to fetch stats from backend api /api/admin/voucher-management/stats using axiosInstance: 
  const fetchVoucherStats = async () => {
    const response = await axiosInstance.get('/api/admin/voucher-management/stats');
    return response.data;
    // response.data : {
    //   "totalVouchers": 11,
    //   "activeVouchers": 9,
    //   "expiredVouchers": 0,
    //   "notStartYet": 2
    // }
  };
  const { data: voucherManagementStats, isLoading: isLoadingVoucherManagementStats, isError: isErrorVoucherManagementStats } = useQuery(
    {
      queryKey: ['voucher-management-stats'],
      queryFn: fetchVoucherStats
    }
  );

  // search filter states : 
  const [searchFilter, setSearchFilter] = useState({
    nameOrDescOrCodeOrTitle: '',
    discountType: '', // 2 type : PERCENT , AMOUNT
    isActive: '',  // active is is_active: true and can use now or later , inactive is is_active: false or expired
    validFrom: '', // date string in Vietnam timezone , and in db store just date+time in Vietnam timezone , must be less than  validTo and from today
    validTo: '', // date string in Vietnam timezone , and in db store just date+time in Vietnam timezone , must be greater than validFrom
  });

  // pagination states :
  const [currentPage, setCurrentPage] = useState(1);
  const [limitPerPage, setLimitPerPage] = useState(10);

  console.log("searchFilter:", searchFilter);

  // use useQuery to fetch list of request from backend api /api/admin/voucher-management/vouchers with searchFilter using axiosInstance:
  const fetchVouchersWithFilter = async () => {
    const response = await axiosInstance.get('/api/admin/voucher-management/vouchers', {
      params: {
        nameOrDescOrCodeOrTitle: searchFilter.nameOrDescOrCodeOrTitle,
        discountType: searchFilter.discountType,
        isActive: searchFilter.isActive,
        validFrom: searchFilter.validFrom,
        validTo: searchFilter.validTo,
        page: currentPage,
        limit: limitPerPage,
      }
    });
    return response.data; // response.data : array of users and total pages
    // response.data = {
    //   "vouchers": [
    //     {
    //   "voucher_id": 2,
    //   "created_by": 8,
    //   "code": "WELCOME10",
    //   "title": "Giảm 10% cho khách hàng mới",
    //   "description": "Áp dụng cho đơn hàng đầu tiên, tối đa 100.000đ.",
    //   "discount_type": "PERCENT",
    //   "discount_value": "10.00",
    //   "min_order_amount": "0.00",
    //   "max_discount": "100000.00",
    //   "valid_from": "2025-10-01T00:00:00.000Z",
    //   "valid_to": "2025-12-31T00:00:00.000Z",
    //   "is_active": false,
    //   "usage_limit": 500,
    //   "used_count": 0,
    //   "image_url": "https://cdn.example.com/vouchers/welcome10.png",
    //   "created_at": "2025-10-14T15:47:33.000Z",
    //   "updated_at": "2025-10-14T15:47:33.000Z"
    // },
    //   ],
    //     "totalPages": 1
    // }
  };
  const { data, isLoading: isLoadingFetchingVouchers, isError: isErrorFetchingVouchers } = useQuery(
    {
      queryKey: ['vouchers', searchFilter, currentPage, limitPerPage],
      queryFn: fetchVouchersWithFilter,
      keepPreviousData: true
    }
  );


  // Format Vietnam date to YYYY-MM-DD HH:mm:ss
  function formatVietnamDateForBackend(date) {
    const pad = (n) => String(n).padStart(2, "0")
    return (
      `${date.getFullYear()}-` +
      `${pad(date.getMonth() + 1)}-` +
      `${pad(date.getDate())} ` +
      `${pad(date.getHours())}:` +
      `${pad(date.getMinutes())}:` +
      `${pad(date.getSeconds())}`
    )
  }

  // function to display data sent from server like : 2025-10-01T00:00:00.000Z	to 01 thg 10 2025
  function formatVietnamDateForDisplay(dateString) {
    const date = new Date(dateString);
    const pad = (n) => String(n).padStart(2, "0")
    return (
      `${pad(date.getDate())} thg ` +
      `${pad(date.getMonth() + 1)} ` +
      `${date.getFullYear()}`
    )
  }


  return (

    <div className="p-4 lg:p-6 dark:bg-[#020617] min-h-screen ">
      <div className="space-y-6">

        {/* Title */}
        <div className="flex items-center justify-between" >
          {/* User Management Title */}
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">Quản lí voucher</h1>
            <p className="text-secondary-600 dark:text-secondary-400">Quản lí các phiếu giảm giá và khuyến mãi của người dùng</p>
          </div>
          {/* User Management Actions */}
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:ring-primary-500 px-4 py-2 text-base">
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:block"> Xuất dữ liệu</span>
            </button>
            <button className="inline-flex items-center gap-2 justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 px-4 py-2 text-base">
              <UserPlus />
              <span className="hidden sm:block"> Thêm voucher</span>
            </button>
          </div>
        </div>


        {/* Voucher Statistics Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total vouchers */}
          <div className="card transition-all duration-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Tổng voucher</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">{isLoadingVoucherManagementStats ? 'Loading...' : isErrorVoucherManagementStats ? 'Error' : voucherManagementStats?.totalVouchers}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <ShieldCheck className="lucide lucide-shield h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>
          {/* Active Users */}
          <div className="card transition-all duration-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Đang hoạt động</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">{isLoadingVoucherManagementStats ? 'Loading...' : isErrorVoucherManagementStats ? 'Error' : voucherManagementStats?.activeVouchers}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <ShieldCheck className="lucide lucide-shield h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>
          {/* Pending Invitations */}
          <div className="card transition-all duration-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Đã hết hạn hoặc bị khóa</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">{isLoadingVoucherManagementStats ? 'Loading...' : isErrorVoucherManagementStats ? 'Error' : voucherManagementStats?.expiredVouchers}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <ShieldCheck className="lucide lucide-shield h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>
          {/* Pending Invitations */}
          <div className="card transition-all duration-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Chưa hoạt động</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">{isLoadingVoucherManagementStats ? 'Loading...' : isErrorVoucherManagementStats ? 'Error' : voucherManagementStats?.notStartYet}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <ShieldCheck className="lucide lucide-shield h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>
        </div>


        {/* List of vouchers  */}
        <div className="card p-6 transition-all duration-200">
          <div className="p-6">
            <div className="w-full space-y-4">

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-2  ">


                {/* enter code or description */}
                <div className="flex items-center gap-10 flex-col  md:flex-row ">
                  <input type="text" className="input px-4"
                    value={searchFilter.nameOrDescOrCodeOrTitle}
                    onChange={(e) => {
                      setSearchFilter(prev => ({ ...prev, nameOrDescOrCodeOrTitle: e.target.value }))
                      setCurrentPage(1);
                    }}
                    placeholder="Tìm theo code, mô tả..." />

                  {/* filter discount type */}
                  <div className="flex items-center gap-4">
                    {/* select discount type  */}
                    <Select
                      value={searchFilter.discountType}
                      onValueChange={(value) => {
                        setSearchFilter(prev => ({ ...prev, discountType: value }));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Loại giảm giá" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENT">Theo phần trăm</SelectItem>
                        <SelectItem value="AMOUNT">Theo số tiền</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* clear discount type that selected */}
                    {searchFilter.discountType &&
                      <button onClick={() => {
                        setSearchFilter(prev => ({ ...prev, discountType: '' }));
                        setCurrentPage(1);
                      }}>
                        <CircleX className="size-5 hover:cursor-pointer text-red-400" />
                      </button>
                    }
                  </div>

                  {/* filter status of voucher is_active : true/false */}
                  <div className="flex items-center gap-4">
                    {/* select   */}
                    <Select
                      value={searchFilter.isActive}
                      onValueChange={(value) => {
                        setSearchFilter(prev => ({ ...prev, isActive: value }));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Hoạt động</SelectItem>
                        <SelectItem value="false">Không hoạt động</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* clear status that selected */}
                    {
                      searchFilter.isActive &&
                      <button onClick={() => {
                        setSearchFilter(prev => ({ ...prev, isActive: '' }));
                        setCurrentPage(1);
                      }}>
                        <CircleX className="size-5 hover:cursor-pointer text-red-400" />
                      </button>
                    }
                  </div>

                </div>

                {/* filter to choose "valid from" date */}
                <div className="flex items-center gap-4">
                  <Popover open={openDatePickerValidFrom} onOpenChange={setOpenDatePickerValidFrom}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="date"
                        className="w-38 justify-between font-normal"
                      >
                        {dateForValidFrom ? formatVietnamDateForDisplay(dateForValidFrom) : "Từ ngày"}
                        <ChevronDownIcon />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateForValidFrom}
                        captionLayout="dropdown"
                        onSelect={(date) => {
                          if (date >= dateForValidTo) {
                            toast.error(`Vui lòng chọn ngày sau ${formatVietnamDateForDisplay(dateForValidTo)}`);
                            return
                          }; // ignore invalid selection
                          setDateForValidFrom(date)
                          setOpenDatePickerValidFrom(false)
                          setSearchFilter(prev => ({ ...prev, validFrom: formatVietnamDateForBackend(date) }));
                          setCurrentPage(1);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {/* clear valid from date that selected */}
                  {
                    searchFilter.validFrom &&
                    <button onClick={() => {
                      setSearchFilter(prev => ({ ...prev, validFrom: '' }));
                      setCurrentPage(1);
                      setDateForValidFrom(undefined);

                    }}>
                      <CircleX className="size-5 hover:cursor-pointer text-red-400" />
                    </button>
                  }
                </div>




                {/* filter to choose "valid to" date */}
                <div className="flex items-center gap-4">
                  <Popover open={openDatePickerValidTo} onOpenChange={setOpenDatePickerValidTo}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="date"
                        className="w-38 justify-between font-normal"
                      >
                        {dateForValidTo ? formatVietnamDateForDisplay(dateForValidTo) : "Đến ngày"}
                        <ChevronDownIcon />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                      {/* must after "valid from" date */}
                      <Calendar
                        mode="single"
                        fromDate={dateForValidFrom}
                        selected={dateForValidTo}
                        captionLayout="dropdown"
                        onSelect={(date) => {
                          if (date <= dateForValidFrom) {
                            toast.error(`Vui lòng chọn ngày trước ${formatVietnamDateForDisplay(dateForValidFrom)}`);
                            return; // ignore invalid selection
                          }
                          setDateForValidTo(date)
                          setOpenDatePickerValidTo(false)
                          setSearchFilter(prev => ({
                            ...prev, validTo: formatVietnamDateForBackend(date)
                          }));
                          setCurrentPage(1);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {/* clear valid to date that selected */}
                 {
                  searchFilter.validTo &&
                   <button onClick={() => {
                    setSearchFilter(prev => ({ ...prev, validTo: '' }));
                    setCurrentPage(1);
                    setDateForValidTo(undefined);
                  }}>
                    <CircleX className="size-5 hover:cursor-pointer text-red-400" />
                  </button>
                 }
                </div>



                {/* display loading or error button */}
                <div>
                  {isLoadingFetchingVouchers && <Loader className="animate-spin mx-auto" />}
                </div>

              </div>


              {/* table */}
              <div>
                <Table  >

                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Loại giảm giá</TableHead>
                      <TableHead>Giá trị</TableHead>
                      <TableHead>Đơn tối thiểu</TableHead>
                      <TableHead>Giảm tối đa</TableHead>
                      <TableHead>Từ ngày </TableHead>
                      <TableHead>Đến ngày </TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Số lượng</TableHead>
                      <TableHead>Đã dùng</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {/* if data.vouchers is empty */}
                    {data?.vouchers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={13} className="text-center py-6 text-secondary-600 dark:text-secondary-400">
                          Không có voucher nào phù hợp với bộ lọc tìm kiếm.
                        </TableCell>
                      </TableRow>
                    )}

                    {/* if error :  */}
                    {isErrorFetchingVouchers && (
                      <TableRow>
                        <TableCell colSpan={13} className="text-center py-6 text-secondary-600 dark:text-secondary-400">
                          Lỗi khi tải danh sách voucher. Vui lòng thử lại.
                        </TableCell>
                      </TableRow>
                    )}

                    {data?.vouchers && data?.vouchers.map((voucher) => (
                      <TableRow key={voucher.voucher_id}>
                        <TableCell>{voucher.code}</TableCell>
                        <TableCell >{voucher.description &&
                          // dialog to show full description when click description
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant={'outline'}>Xem</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Mô tả voucher</DialogTitle>
                                <DialogDescription>
                                  {voucher.title && <p className="my-4 font-bold"> {voucher.title}</p>}
                                  {voucher.description}
                                </DialogDescription>
                              </DialogHeader>
                            </DialogContent>
                          </Dialog>
                        }</TableCell>
                        <TableCell >{voucher.discount_type}</TableCell>
                        <TableCell >{voucher.discount_value}</TableCell>
                        <TableCell >{voucher.min_order_amount}</TableCell>
                        <TableCell >{voucher.max_discount}</TableCell>
                        <TableCell >{formatVietnamDateForDisplay(voucher.valid_from)}</TableCell>
                        <TableCell >{formatVietnamDateForDisplay(voucher.valid_to)}</TableCell>
                        <TableCell >{voucher.is_active ? "Active" : "Inactive"}</TableCell>
                        <TableCell >{voucher.usage_limit}</TableCell>
                        <TableCell >{voucher.used_count}</TableCell>


                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>


              {/* Pagination */}

              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-10 pt-4">
                  {/* commment : select max page */}
                  <div className="flex items-center gap-3">
                    <p className="text-secondary-600 dark:text-secondary-400">Hiển thị trang {currentPage} trên {data?.totalPages || 1} </p>
                    {/* select max page */}
                    {/* select role  */}
                    <Select
                      value={limitPerPage.toString()}
                      onValueChange={(value) => {
                        setLimitPerPage(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="">
                        <SelectValue placeholder="Số mục trên trang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* comment : Pagination controls */}
                  <div className="flex items-center justify-center gap-2 ">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Trước
                    </Button>

                    {data?.totalPages && Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                      <Button
                        key={p}
                        variant={p === currentPage ? "default" : "outline"}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </Button>
                    ))}

                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === data?.totalPages || !data?.totalPages}
                      className="flex items-center gap-1"
                    >
                      Tiếp
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VoucherManagement