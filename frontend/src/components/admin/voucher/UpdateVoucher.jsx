import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog'
import { Loader, Loader2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../ui/button';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Calendar } from '../../ui/calendar';
import { ChevronDownIcon } from 'lucide-react';
import axiosInstance from '@/config/axiosInstance';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { set } from 'date-fns';
const UpdateVoucher = ({ updatedVoucherFields }) => {
  //  const [updatedVoucherFields, setUpdatedVoucherFields] = useState({
  //     code: '',
  //     title: '',
  //     description: '',
  //     usageLimit: '',
  //   });
  const [loadingUpdateVoucher, setLoadingUpdateVoucher] = useState(false);

  // 3 state for each field
  const [updatedVoucherCode, setUpdatedVoucherCode] = useState(updatedVoucherFields.code || '');
  const [updatedVoucherTitle, setUpdatedVoucherTitle] = useState(updatedVoucherFields.title || '');
  const [updatedVoucherDescription, setUpdatedVoucherDescription] = useState(updatedVoucherFields.description || '');
  const [updatedUsageLimit, setUpdatedUsageLimit] = useState(updatedVoucherFields.usageLimit || '');
  const [voucher_id, setVoucher_id] = useState(updatedVoucherFields.voucher_id || '');

  // fucntion to display number that have comma separator : vd : 1000000 => 1,000,000 . number <1000 => no change
  const formatNumberWithCommas = (value) => {
    if (!value) return '';
    const number = Number(value.toString().replace(/,/g, ''));
    if (!isNaN(number)) {
      return number.toLocaleString('en-US');
    }
    return value;
  }
  // uss react query client mutation to update voucher : 
  // PATCH /api/admin/voucher-management/update
  const queryClient = useQueryClient();
  // React Query mutation
  const updateVoucherMutation = useMutation({
    mutationFn: async (payload) => {
      setLoadingUpdateVoucher(true);
      const { data } = await axiosInstance.patch(
        "/api/admin/voucher-management/update",
        payload
      );
      return data;
    },
    onSuccess: () => {
      // Refresh vouchers list if cached
      queryClient.invalidateQueries(["vouchers"]);
      toast.success("Cập nhật voucher thành công!");
    },
    onError: (error) => {
      toast.error("Cập nhật voucher thất bại. Vui lòng thử lại.");
      console.error("Error updating voucher:", error);
    },
    onSettled: () => {
      setLoadingUpdateVoucher(false);
    }
  });

  const handleUpdateVoucher = () => {
    const payload = {
      code: updatedVoucherCode,
      title: updatedVoucherTitle,
      description: updatedVoucherDescription,
      usageLimit: Number(updatedUsageLimit),
      voucher_id: voucher_id,
    };
    console.log("payload: ", payload);
    updateVoucherMutation.mutate(payload);
  };
  return (
    <div>
      {/* Added h-[80vh] and overflow for better dialog handling on various screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[60vh] overflow-y-scroll p-4 border rounded dark:border-gray-700">

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
              value={updatedVoucherCode}
              onChange={(e) => setUpdatedVoucherCode(e.target.value.trim())}
            />
            {/* display error text inform that voucher code should not be empty */}
            {/* {voucherCode === '' && <p className="text-red-400 text-sm mt-2">Mã voucher không được để trống.</p>} */}
          </div>

          {/* Voucher Title */}
          <div>
            <label htmlFor="voucherTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tiêu đề voucher</label>
            <textarea
              id="voucherTitle"
              className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-base p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="ví dụ: Giảm giá 20% cho Black Friday"
              value={updatedVoucherTitle}
              onChange={(e) => setUpdatedVoucherTitle(e.target.value)}
            />
            {/* display error text inform that voucher title should not be empty */}
            {/* {voucherTitle === '' && <p className="text-red-400 text-sm mt-2">Tiêu đề voucher không được để trống.</p>} */}
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
              value={formatNumberWithCommas(updatedUsageLimit)}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, "");
                if (/^\d*$/.test(raw)) { // only allow numbers
                  setUpdatedUsageLimit(raw);
                }
              }}
            />
            {/* {!usageLimit && <p className="text-red-400 text-sm mt-2">Số lượng voucher không được để trống.</p>} */}
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
                <span className="font-semibold">{updatedVoucherCode}</span>
              </div>
              <div className="flex justify-between">
                <span>Tiêu đề:</span>
                <span className="font-semibold ml-3">{updatedVoucherTitle}</span>
              </div>
              {/* number of vouchers */}
              <div className="flex justify-between">
                <span>Số lượng voucher:</span>
                <span className="font-semibold">{updatedUsageLimit && `${formatNumberWithCommas(updatedUsageLimit)}`}</span>
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
              value={updatedVoucherDescription}
              onChange={(e) => setUpdatedVoucherDescription(e.target.value)}
            />
          </div>

          {/* Submit Button (You can add this outside the scrollable area if preferred) */}
          <div >
            <Button
              className={'w-full  py-4 sm:py-6'}
              disabled={updatedVoucherCode !== updatedVoucherFields.code ||
                updatedVoucherTitle !== updatedVoucherFields.title ||
                updatedVoucherDescription !== updatedVoucherFields.description ||
                updatedUsageLimit !== updatedVoucherFields.usageLimit ? false : true}

              onClick={handleUpdateVoucher}
            >
              {loadingUpdateVoucher ? <Loader className="animate-spin size-6" /> : 'Cập nhật voucher'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UpdateVoucher;