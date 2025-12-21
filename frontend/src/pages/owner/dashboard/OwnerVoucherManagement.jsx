import { Ban, Check, ChevronDownIcon, ChevronLeft, ChevronRight, CircleX, DollarSign, Download, Edit, Ellipsis, Eye, Handshake, Loader, Lock, LockKeyholeOpen, ShieldCheck, Trash2, UserPlus, X, FileText, CheckCircle, XCircle, Clock } from "lucide-react"
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
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import CreateVoucherComponent from "@/components/admin/voucher/CreateVoucher"
import { Badge } from "@/components/ui/badge"
import UpdateVoucher from "@/components/admin/voucher/UpdateVoucher"
{/* <Badge variant="default | outline | secondary | destructive">Badge</Badge> */ }

const VoucherManagement = () => {

  const queryClient = useQueryClient();

  // state for pick date "valid from" : 
  const [openDatePickerValidFrom, setOpenDatePickerValidFrom] = useState(false)
  const [dateForValidFrom, setDateForValidFrom] = useState(undefined)

  // state for pick date "valid to" :
  const [openDatePickerValidTo, setOpenDatePickerValidTo] = useState(false)
  const [dateForValidTo, setDateForValidTo] = useState(undefined)

  // state for selected voucher : 
  const [selectedVoucherId, setSelectedVoucherId] = useState(null);
  // state for ban/unban voucher dialog and some fields to display in dialog  like : code , title , description .
  const [isBanUnbanVoucherDialogOpen, setIsBanUnbanVoucherDialogOpen] = useState(false);
  const [displayFieldOfSelectedVoucher, setDisplayFieldOfSelectedVoucher] = useState({
    code: '',
    title: '',
    description: ''
  });
  // state for update voucher dialog :
  const [isUpdateVoucherDialogOpen, setIsUpdateVoucherDialogOpen] = useState(false);
  const [updatedVoucherFields, setUpdatedVoucherFields] = useState({
    code: '',
    title: '',
    description: '',
    usageLimit: '',
    voucher_id: '',
  });
  // state for isLoadingBanUnbanVoucher :
  const [isLoadingBanUnbanVoucher, setIsLoadingBanUnbanVoucher] = useState(false);
  // state to check whether ban or unban voucher : 
  const [isBanAction, setIsBanAction] = useState(true); // true : ban , false : unban


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
  const [limitPerPage, setLimitPerPage] = useState(5);

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

  // PATCH to ban or unban voucher api : /api/admin/voucher-management/ban-unban , with body : { voucher_id, is_active: "true" or "false" }
  const banUnbanVoucher = async (voucherId, isBanAction) => {
    const response = await axiosInstance.patch('/api/admin/voucher-management/ban-unban', {
      voucher_id: voucherId,
      is_active: isBanAction ? "false" : "true"
    });
    return response.data;
  };
  // handle ban or unban voucher
  const handleBanUnbanVoucher = async () => {
    try {
      setIsLoadingBanUnbanVoucher(true);
      await banUnbanVoucher(selectedVoucherId, isBanAction);
      toast.success(`Đã ${isBanAction ? 'khóa' : 'mở khóa'} voucher thành công`);
      // refetch the vouchers list
      queryClient.invalidateQueries(['vouchers']);
    } catch (error) {
      console.error("Error in handleBanUnbanVoucher:", error);
      toast.error(`Lỗi khi ${isBanAction ? 'khóa' : 'mở khóa'} voucher`);
    } finally {
      setIsLoadingBanUnbanVoucher(false);
      setSelectedVoucherId(null);
      setDisplayFieldOfSelectedVoucher({ code: '', title: '', description: '' });
    }
  };

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
      `${pad(date.getDate())} thg` +
      `${pad(date.getMonth() + 1)} ` +
      `${date.getFullYear()}`
    )
  }

  // function to display discount value with % if discount type is PERCENT , else display as amount and currency for matter : 1,000,000 VND
  function formatDiscountValue(discountType, discountValue) {
    if (discountType === 'PERCENT') {
      return `${discountValue}%`;
    } else {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountValue);
    }
  }

  // function to format amount to VND currency
  function formatAmountToVND(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }

  // functon for format number in vietnam : 1,000 for 1000
  function formatNumberInVietnam(number) {
    return new Intl.NumberFormat('vi-VN').format(number);
  }


  return (

    <div className="p-4 lg:p-6 dark:bg-[#020617] min-h-screen ">
      <div className="space-y-6">

        {/* Title */}
        <div className="flex items-center justify-between" >
          {/* User Management Title */}
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">Quản lý voucher</h1>
            <p className="text-secondary-600 dark:text-secondary-400">Quản lý các phiếu giảm giá và khuyến mãi của người dùng</p>
          </div>
          {/* User Management Actions */}
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:ring-primary-500 px-4 py-2 text-base">
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:block"> Xuất dữ liệu</span>
            </button>
            {/* dialog for create new voucher */}
            <CreateVoucherComponent />

          </div>
        </div>


        {/* Voucher Statistics Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total vouchers */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Tổng voucher</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{isLoadingVoucherManagementStats ? 'Loading...' : isErrorVoucherManagementStats ? 'Error' : voucherManagementStats?.totalVouchers}</p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          {/* Active vouchers */}
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Đang hoạt động</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{isLoadingVoucherManagementStats ? 'Loading...' : isErrorVoucherManagementStats ? 'Error' : voucherManagementStats?.activeVouchers}</p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          {/* Expired or locked vouchers */}
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">Đã hết hạn hoặc bị khóa</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">{isLoadingVoucherManagementStats ? 'Loading...' : isErrorVoucherManagementStats ? 'Error' : voucherManagementStats?.expiredVouchers}</p>
              </div>
              <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
          {/* Not started yet vouchers */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Chưa hoạt động</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">{isLoadingVoucherManagementStats ? 'Loading...' : isErrorVoucherManagementStats ? 'Error' : voucherManagementStats?.notStartYet}</p>
              </div>
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
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
                      <TableHead>Thêm</TableHead>
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
                        <TableCell >{(voucher.description || voucher.title) &&
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
                        <TableCell >{voucher.discount_type === 'PERCENT' ? "Phần trăm" : "Số tiền"}</TableCell>
                        <TableCell >
                          <Badge variant="secondary" className={'bg-blue-500 text-white dark:bg-blue-600'} >{formatDiscountValue(voucher.discount_type, voucher.discount_value)}</Badge>
                        </TableCell>
                        <TableCell >
                          <Badge variant="">{formatAmountToVND(voucher.min_order_amount)}</Badge>
                        </TableCell>
                        <TableCell >
                          {/* red badge for max amount */}
                          <Badge variant="">{voucher.discount_type === 'PERCENT' && formatAmountToVND(voucher.max_discount)}</Badge>
                        </TableCell>
                        <TableCell >{formatVietnamDateForDisplay(voucher.valid_from)}</TableCell>
                        <TableCell >{formatVietnamDateForDisplay(voucher.valid_to)}</TableCell>
                        <TableCell >{voucher.is_active ? "Hoạt động" : "Không hoạt động"}</TableCell>
                        <TableCell >{formatNumberInVietnam(voucher.usage_limit)}</TableCell>
                        <TableCell >{formatNumberInVietnam(voucher.used_count)}</TableCell>

                        <TableCell>
                          {/* trigger "view more" in each voucher */}
                          <Popover className="hover:cursor-pointer">

                            <PopoverTrigger>
                              <Button variant={'outline'} className={'hover:cursor-pointer p-6 px-19'}>
                                <Ellipsis />
                              </Button>
                            </PopoverTrigger>

                            <PopoverContent className={'p-0'}>

                              <div className="py-1 flex flex-col">

                                {/* edit voucher */}
                                <PopoverClose>
                                  <button onClick={() => {
                                    setUpdatedVoucherFields({
                                      code: voucher.code,
                                      title: voucher.title,
                                      description: voucher.description,
                                      usageLimit: voucher.usage_limit,
                                      voucher_id: voucher.voucher_id,
                                    });
                                    setIsUpdateVoucherDialogOpen(true);
                                  }} className="group flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors duration-150 cursor-pointer text-secondary-900 dark:text-white  hover:bg-gray-400 hover:text-white  dark:hover:bg-gray-700">
                                    <span className="flex-shrink-0">
                                      <Edit className="lucide lucide-eye h-4 w-4" />
                                    </span>
                                    <span>Chỉnh sửa</span>
                                  </button>
                                </PopoverClose>

                                {/* ban or unban voucher */}
                                <PopoverClose>
                                  <button onClick={() => {
                                    setSelectedVoucherId(voucher.voucher_id);
                                    setDisplayFieldOfSelectedVoucher({
                                      code: voucher.code,
                                      title: voucher.title,
                                      description: voucher.description
                                    });
                                    setIsBanAction(voucher.is_active ? true : false); // if is_active true then ban action
                                    setIsBanUnbanVoucherDialogOpen(true);
                                  }} className="group flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors duration-150 cursor-pointer text-secondary-900 dark:text-white hover:bg-gray-400 hover:text-white  dark:hover:bg-gray-700">
                                    <span className="flex-shrink-0">
                                      {voucher.is_active ? <Lock className="lucide lucide-ban h-4 w-4" /> : <LockKeyholeOpen className="lucide lucide-check h-4 w-4" />}
                                    </span>
                                    <span>{voucher.is_active ? "Khóa" : "Mở khóa"}</span>
                                  </button>
                                </PopoverClose>

                              </div>

                            </PopoverContent>
                          </Popover>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>


              {/* Pagination */}

              {data && data.totalPages && (
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

              {/* dialog for ban/unban voucher */}
              <Dialog
                open={isBanUnbanVoucherDialogOpen} onOpenChange={(open) => {
                  setIsBanUnbanVoucherDialogOpen(open);
                }}
              >
                <DialogTrigger>
                  {/* <Button variant={'outline'} className={'hover:cursor-pointer'}>Xem lý do</Button> */}
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Xác nhận {isBanAction ? 'khóa' : 'mở khóa'}</DialogTitle>
                    <DialogDescription className={'py-8'}>
                      Bạn có chắc chắn muốn {isBanAction ? 'khóa' : 'mở khóa'} voucher này không?
                      {/* display some info of this voucher : */}
                      <div className="mt-4 space-y-2">
                        <p><span className="font-bold">Mã voucher:</span> {displayFieldOfSelectedVoucher.code}</p>
                        <p><span className="font-bold">Tiêu đề:</span> {displayFieldOfSelectedVoucher.title}</p>
                        <p><span className="font-bold">Mô tả:</span> {displayFieldOfSelectedVoucher.description}</p>
                      </div>
                      {/* BUTTONS */}
                      <div className="mt-4 flex justify-end gap-4">
                        <Button variant="outline" onClick={() => {
                          setIsBanUnbanVoucherDialogOpen(false)
                        }}>Hủy</Button>
                        <Button
                          onClick={() => {
                            // call api to ban or unban voucher :
                            handleBanUnbanVoucher();
                            setIsBanUnbanVoucherDialogOpen(false);
                            setSelectedVoucherId(null);
                            setDisplayFieldOfSelectedVoucher({ code: '', title: '', description: '' });
                          }}
                        >
                          {isLoadingBanUnbanVoucher ? <Loader className="animate-spin mx-auto" /> : 'Xác nhận'}
                        </Button>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>

              {/* dialog for update voucher */}
              <Dialog open={isUpdateVoucherDialogOpen} onOpenChange={(open) => {
                setIsUpdateVoucherDialogOpen(open);
              }}>
                <DialogTrigger>
                  {/* <Button variant={'outline'} className={'hover:cursor-pointer'}>Xem lý do</Button> */}
                </DialogTrigger>
                <DialogContent
                className='w-full max-w-3xl md:max-w-4xl lg:max-w-3xl  overflow-y-auto h-[70vh]'
                
                >
                  <DialogHeader>
                    <DialogTitle>Cập nhật voucher</DialogTitle>
                  </DialogHeader>
                  {/* update voucher */}
                  <UpdateVoucher updatedVoucherFields={updatedVoucherFields} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VoucherManagement