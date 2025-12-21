import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog'
import { Loader, Loader2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../ui/button';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Calendar } from '../../ui/calendar';
import { ChevronDownIcon } from 'lucide-react';
import axiosInstance from '@/config/axiosInstance';
import { useQueryClient } from '@tanstack/react-query';
const CreateVoucher = () => {
  const queryClient = useQueryClient();

  const [voucherCode, setVoucherCode] = useState('');
  const [voucherTitle, setVoucherTitle] = useState('');
  const [voucherDescription, setVoucherDescription] = useState('');
  const [discountType, setDiscountType] = useState('PERCENT');
  const [discountValue, setDiscountValue] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [minBookingAmount, setMinBookingAmount] = useState('');

  // state for open dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // state for loading when submit form
  const [isSubmitting, setIsSubmitting] = useState(false);

  // state for pick date "valid from" : 
  const [openDatePickerValidFrom, setOpenDatePickerValidFrom] = useState(false)
  const [dateForValidFrom, setDateForValidFrom] = useState(undefined)

  // state for pick date "valid to" :
  const [openDatePickerValidTo, setOpenDatePickerValidTo] = useState(false)
  const [dateForValidTo, setDateForValidTo] = useState(undefined)

  // function to check if a input is number from 1-99 : 
  const isNumberFrom1To99 = (value) => {
    const numberRegex = /^(?:[1-9]|[1-9][0-9])$/;
    return numberRegex.test(value);
  }
  // function to check if a input in number > 10000
  const isNumberGreaterThan10000 = (value) => {
    const num = Number(value.toString().replace(/,/g, ""));
    return !isNaN(num) && num > 10000;
  };

  // fucntion to display number that have comma separator : vd : 1000000 => 1,000,000 . number <1000 => no change
  const formatNumberWithCommas = (value) => {
    if (!value) return '';
    const number = Number(value.toString().replace(/,/g, ''));
    if (!isNaN(number)) {
      return number.toLocaleString('en-US');
    }
    return value;
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

  // function to handle submit form to create new voucher : backend will revcieve data in format : {image_url,usage_limit,valid_to,valid_from,max_discount,min_order_amount,discount_value,discount_type,description,title,code}
  const handleSubmit = async () => {
    setIsSubmitting(true);
    const payload = {
      code: voucherCode,
      title: voucherTitle,
      description: voucherDescription,
      discount_type: discountType,
      discount_value: Number(discountValue.toString().replace(/,/g, "")),
      min_order_amount: Number(minBookingAmount.toString().replace(/,/g, "")),
      max_discount: discountType === 'PERCENT' ? Number(maxDiscount.toString().replace(/,/g, "")) : null,
      valid_from: formatVietnamDateForBackend(dateForValidFrom),
      valid_to: formatVietnamDateForBackend(dateForValidTo),
      usage_limit: Number(usageLimit.toString().replace(/,/g, "")),
      // TODO : add image upload feature later
      image_url: null,
    };

    try {
      // send payload to backend API to create new voucher
      // api/admin/voucher-management/create
      await axiosInstance.post('/api/admin/voucher-management/create', payload);

      toast.success('Tạo voucher thành công!');
      // reset form
      setVoucherCode('');
      setVoucherTitle('');
      setVoucherDescription('');
      setDiscountType('PERCENT');
      setDiscountValue('');
      setMaxDiscount('');
      setUsageLimit('');
      setMinBookingAmount('');
      setDateForValidFrom(undefined);
      setDateForValidTo(undefined);
      // invalider voucher list cache in react query or reload page to fetch new data
      queryClient.invalidateQueries(['vouchers']);
    } catch (error) {
      console.error('Error creating voucher:', error);
      toast.error('Tạo voucher thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
      setIsDialogOpen(false);
    }
  };
  // log all states for debug :
  // console.log({
  //   voucherCode,
  //   voucherTitle,
  //   voucherDescription,
  //   discountType,
  //   discountValue,
  //   maxDiscount,
  //   usageLimit,
  //   minBookingAmount,
  //   dateForValidFrom,
  //   dateForValidTo
  // })

  return (
    <div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <button className="inline-flex items-center gap-2 justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 px-4 py-2 text-base">
            <UserPlus />
            <span className="hidden sm:block"> Tạo voucher mới</span>
          </button>
        </DialogTrigger>
        <DialogContent className=" sm:max-w-5xl   p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Tạo voucher mới</DialogTitle>
            <DialogDescription>
              {/* Added h-[80vh] and overflow for better dialog handling on various screens */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[70vh] overflow-y-scroll p-4 border rounded dark:border-gray-700">

                {/* Basic Information Section */}
                <div className="flex flex-col gap-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Thông tin cơ bản</h3>

                  {/* Voucher Code */}
                  <div>
                    <label htmlFor="voucherCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mã voucher</label>
                    <input
                      type="text"
                      id="voucherCode"
                      className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-base p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      placeholder="ví dụ: BLACKFRIDAY20"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.trim())}
                    />
                    {/* display error text inform that voucher code should not be empty */}
                    {voucherCode === '' && <p className="text-red-400 text-sm mt-2">Mã voucher không được để trống.</p>}
                  </div>

                  {/* Voucher Title */}
                  <div>
                    <label htmlFor="voucherTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tiêu đề voucher</label>
                    <textarea
                      id="voucherTitle"
                      className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-base p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      placeholder="ví dụ: Giảm giá 20% cho Black Friday"
                      value={voucherTitle}
                      onChange={(e) => setVoucherTitle(e.target.value)}
                    />
                    {/* display error text inform that voucher title should not be empty */}
                    {voucherTitle === '' && <p className="text-red-400 text-sm mt-2">Tiêu đề voucher không được để trống.</p>}
                  </div>


                  {/* Discount Type */}
                  <div>
                    <label htmlFor="discountType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loại giảm giá</label>
                    <select
                      id="discountType"
                      className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-base p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                    >
                      <option className="bg-white dark:bg-gray-700" value="PERCENT">Phần trăm</option>
                      <option className="bg-white dark:bg-gray-700" value="AMOUNT">Số tiền cố định</option>
                    </select>
                  </div>
                  {/* Money (only for percentage type) */}
                  {
                    discountType === 'PERCENT' &&
                    <div>
                      <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giá trị giảm giá (%)</label>
                      <input
                        type="number"
                        id="discountValue"
                        className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-base p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="ví dụ: 20%"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value.trim())}
                      />
                      {/* display error text inform that discount value should not be empty */}
                      {discountValue === '' && <p className="text-red-400 text-sm mt-2">Giá trị giảm giá không được để trống.</p>}
                      {discountValue && isNumberFrom1To99(discountValue) === false && <p className="text-red-400 text-sm mt-2">Phần trăm giảm giá phải là số từ 1 đến 99.</p>}
                    </div>
                  }

                  {/* Max discount (only for percentage type) */}
                  {
                    discountType === 'PERCENT' &&
                    <div>
                      <label htmlFor="maxDiscount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giảm giá tối đa VND (chỉ áp dụng cho loại phần trăm)</label>
                      <input
                        type="text"
                        id="maxDiscount"
                        className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-base p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formatNumberWithCommas(maxDiscount)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/,/g, "");
                          if (/^\d*$/.test(raw)) {
                            setMaxDiscount(raw); // <-- always raw
                          }
                        }}
                        placeholder="ví dụ: 50,000 VNĐ"
                      />
                      {!maxDiscount && <p className="text-red-400 text-sm mt-2">Giá trị giảm giá tối đa không được để trống.</p>}

                      {maxDiscount && isNumberGreaterThan10000(maxDiscount) === false && <p className="text-red-400 text-sm mt-2">Giá trị giảm giá tối đa phải lớn hơn 10,000 VNĐ.</p>}
                    </div>
                  }


                  {/*  Discount (only for amount type) */}
                  {
                    discountType === 'AMOUNT' &&
                    <div>
                      <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giá trị giảm giá (VND)</label>
                      <input
                        type="text"
                        id="discountValue"
                        className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-base p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="ví dụ: 200,000 VNĐ"
                        value={formatNumberWithCommas(discountValue)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/,/g, "");
                          if (/^\d*$/.test(raw)) {  // only allow numbers
                            setDiscountValue(raw); // <-- always raw
                          }
                        }}
                      />
                      {!discountValue && <p className="text-red-400 text-sm mt-2">Giá trị giảm giá không được để trống.</p>}

                      {discountValue && isNumberGreaterThan10000(discountValue) === false && <p className="text-red-400 text-sm mt-2">Giá trị giảm giá phải lớn hơn 10,000 VNĐ.</p>}
                    </div>

                  }
                  {/* Conditions to apply this voucher : eg : min_order_amount*/}
                  <div>
                    <label htmlFor="minBookingAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giá đơn tối thiểu để áp dụng voucher (VND)</label>
                    <input
                      type="text"
                      id="minBookingAmount"
                      className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-base p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="ví dụ: 800,000 VNĐ"
                      value={formatNumberWithCommas(minBookingAmount)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, "");
                        if (/^\d*$/.test(raw)) { // only allow numbers
                          setMinBookingAmount(raw);
                        }
                      }}
                    />
                    {!minBookingAmount && <p className="text-red-400 text-sm mt-2">Giá đơn tối thiểu không được để trống.</p>}

                  </div>

                  {/* Applicability Section */}
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">Số lượng voucher</h3>


                  {/* Usage Limit */}
                  <div>
                    <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số lượng voucher</label>
                    <input
                      type="text"
                      id="usageLimit"
                      className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-base p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      placeholder="ví dụ: 100 (tổng số lượng voucher)"
                      value={formatNumberWithCommas(usageLimit)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, "");
                        if (/^\d*$/.test(raw)) { // only allow numbers
                          setUsageLimit(raw);
                        }
                      }}
                    />
                    {!usageLimit && <p className="text-red-400 text-sm mt-2">Số lượng voucher không được để trống.</p>}
                  </div>

                  {/* Validity Period Section */}
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">Thời gian hiệu lực</h3>

                  {/* example choose "start date" */}

                  {/* Start Date */}
                  <div>
                    <Popover open={openDatePickerValidFrom} onOpenChange={setOpenDatePickerValidFrom}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          id="date"
                          className="w-full justify-between font-normal"
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
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Expiration Date */}
                  <div>
                    <Popover open={openDatePickerValidTo} onOpenChange={setOpenDatePickerValidTo}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          id="date"
                          className="w-full justify-between font-normal"
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
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                </div>

                {/* Live Preview and Status & Control Column */}
                <div className="flex flex-col gap-6">

                  {/* Live Preview Section */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Xem trước</h3>
                    <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex justify-between">
                        <span>Mã voucher:</span>
                        <span className="font-semibold">{voucherCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Giảm giá:</span>
                        <span className="font-semibold">{discountType === "AMOUNT" ?
                          discountValue ? `${discountValue} VND` : '' : discountValue ? `${isNumberFrom1To99(discountValue) ? `${discountValue} %` : ""} `
                            : ''}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ngày bắt đầu:</span>
                        <span className="font-semibold">{dateForValidFrom ? formatVietnamDateForDisplay(dateForValidFrom) : ""}</span>
                      </div> <div className="flex justify-between">
                        <span>Ngày hết hạn:</span>
                        <span className="font-semibold">{dateForValidTo ? formatVietnamDateForDisplay(dateForValidTo) : ""}</span>
                      </div>
                      {/* Max discount : (only for PERCENT) */}
                      {
                        discountType === 'PERCENT' &&
                        <div className="flex justify-between">
                          <span>Giảm giá tối đa:</span>
                          <span className="font-semibold">{maxDiscount && `${formatNumberWithCommas(maxDiscount)} VND`}</span>
                        </div>
                      }
                      {/* min order price to apply :  */}
                      <div className="flex justify-between">
                        <span>Giá đơn tối thiểu để áp dụng voucher:</span>
                        <span className="font-semibold">{minBookingAmount && `${formatNumberWithCommas(minBookingAmount)} VND`}</span>
                      </div>

                      {/* number of vouchers */}
                      <div className="flex justify-between">
                        <span>Số lượng voucher:</span>
                        <span className="font-semibold">{usageLimit && `${formatNumberWithCommas(usageLimit)}`}</span>
                      </div>


                    </div>
                  </div>

                  {/* Description  */}
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">Mô tả (không bắt buộc)</h3>


                  {/* Voucher Description */}
                  <div>
                    <label htmlFor="voucherDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả voucher</label>
                    <textarea
                      id="voucherDescription"
                      rows="3"
                      className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-base p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      placeholder="ví dụ: Giảm giá 20% cho tất cả các đặt chỗ từ ngày 25 đến 30 tháng 11"
                      value={voucherDescription}
                      onChange={(e) => setVoucherDescription(e.target.value)}
                    />
                  </div>

                  {/* Submit Button (You can add this outside the scrollable area if preferred) */}
                  <div className="py-4 border-t dark:border-gray-700">
                    <Button
                      className={'w-full  py-4 sm:py-6'}
                      // disabled condition : if any required field is empty or invalid
                      disabled={
                        voucherCode === '' ||
                        voucherTitle === '' ||
                        discountValue === '' ||
                        (discountType === 'PERCENT' && isNumberFrom1To99(discountValue) === false) ||
                        (discountType === 'PERCENT' && (maxDiscount === '' || isNumberGreaterThan10000(maxDiscount) === false)) ||
                        (discountType === 'AMOUNT' && (discountValue === '' || isNumberGreaterThan10000(discountValue) === false)) ||
                        minBookingAmount === '' ||
                        usageLimit === '' ||
                        !dateForValidFrom ||
                        !dateForValidTo
                      }
                      onClick={handleSubmit}
                    >
                      {isSubmitting ? <Loader className="animate-spin size-6" /> : 'Tạo mã giảm giá'}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CreateVoucher;