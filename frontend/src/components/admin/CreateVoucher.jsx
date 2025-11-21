import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { UserPlus } from 'lucide-react'
import { useState } from 'react'

const CreateVoucher = () => {
  const [voucherCode, setVoucherCode] = useState('');
  const [discountType, setDiscountType] = useState('Percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [vehicleTypes, setVehicleTypes] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [minBookingAmount, setMinBookingAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [status, setStatus] = useState('Active');
  const [description, setDescription] = useState('');

  const generatePreviewVoucherCode = () => {
    return 'BFCM2024';
  }

  const generatePreviewExpirationDate = () => {
    if (expirationDate) {
      const date = new Date(expirationDate);
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    return 'N/A';
  }

  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <button className="inline-flex items-center gap-2 justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 px-4 py-2 text-base">
            <UserPlus />
            <span className="hidden sm:block"> Tạo voucher mới</span>
          </button>
        </DialogTrigger>
        <DialogContent className=" sm:max-w-5xl   p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Create New Voucher</DialogTitle>
            <DialogDescription>
              {/* Added h-[80vh] and overflow for better dialog handling on various screens */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[70vh] overflow-y-scroll p-4 border rounded dark:border-gray-700">
                
                {/* Basic Information Section */}
                <div className="flex flex-col gap-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
                  
                  {/* Voucher Code */}
                  <div>
                    <label htmlFor="voucherCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Voucher Code</label>
                    <input
                      type="text"
                      id="voucherCode"
                      className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-base p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      placeholder="e.g., BLACKFRIDAY20"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                    />
                  </div>
                  
                  {/* Discount Type */}
                  <div>
                    <label htmlFor="discountType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount Type</label>
                    <select
                      id="discountType"
                      className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-base p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                    >
                      <option className="bg-white dark:bg-gray-700">Percentage</option>
                      <option className="bg-white dark:bg-gray-700">Fixed Amount</option>
                    </select>
                  </div>
                  
                  {/* Discount Value */}
                  <div>
                    <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount Value</label>
                    <input
                      type="text"
                      id="discountValue"
                      className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-base p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      placeholder="e.g., 30 (for 30% or 20 AUD)"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Value must be a positive number.</p>
                  </div>

                  {/* Applicability Section */}
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">Applicability</h3>
                  
                  {/* Vehicle Types */}
                  <div>
                    <label htmlFor="vehicleTypes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle Types</label>
                    <button className="w-full text-left border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-base p-2 flex justify-between items-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700" onClick={() => alert('Select Vehicle Types clicked')}>
                      Select vehicle Types
                      <span>&gt;</span>
                    </button>
                  </div>
                  
                  {/* Usage Limit */}
                  <div>
                    <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Usage Limit</label>
                    <input
                      type="text"
                      id="usageLimit"
                      className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-base p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      placeholder="e.g., 100 (total sales)"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value)}
                    />
                  </div>
                  
                  {/* Minimum Booking Amount */}
                  <div>
                    <label htmlFor="minBookingAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Minimum Booking Amount (Optional)</label>
                    <input
                      type="text"
                      id="minBookingAmount"
                      className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-base p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      placeholder="e.g., 50 (in AUD)"
                      value={minBookingAmount}
                      onChange={(e) => setMinBookingAmount(e.target.value)}
                    />
                  </div>

                  {/* Validity Period Section */}
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">Validity Period</h3>
                  
                  {/* Start Date */}
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                    <input
                      type="date"
                      id="startDate"
                      className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-base p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  
                  {/* Expiration Date */}
                  <div>
                    <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiration Date</label>
                    <input
                      type="date"
                      id="expirationDate"
                      className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-base p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Pick a date
                    </p>
                  </div>
                  
                  {/* Activate Immediately Checkbox */}
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      id="activateImmediately"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                    />
                    <label htmlFor="activateImmediately" className="ml-2 block text-sm text-gray-900 dark:text-white">
                      Activate Immediately
                    </label>
                  </div>
                </div>

                {/* Live Preview and Status & Control Column */}
                <div className="flex flex-col gap-6">
                  
                  {/* Live Preview Section */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Live Preview</h3>
                    <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex justify-between">
                        <span>Voucher Code:</span>
                        <span className="font-semibold">{voucherCode || generatePreviewVoucherCode()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span className="font-semibold">{discountValue ? `${discountValue}${discountType === 'Percentage' ? '%' : ' AUD'}` : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expiration:</span>
                        <span className="font-semibold">{generatePreviewExpirationDate()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}>
                          {status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Control Section */}
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">Status & Control</h3>
                  
                  {/* Status Dropdown */}
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select
                      id="status"
                      className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-base p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option className="bg-white dark:bg-gray-700">Active</option>
                      <option className="bg-white dark:bg-gray-700">Inactive</option>
                    </select>
                  </div>
                  
                  {/* Description Textarea */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
                    <textarea
                      id="description"
                      rows="4"
                      className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-base p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      placeholder="Add a brief description for this voucher"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                  </div>
                  
                  {/* Submit Button (You can add this outside the scrollable area if preferred) */}
                  <div className="pt-4 border-t dark:border-gray-700">
                    <button className="w-full inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 px-4 py-3 text-base">
                      Create Voucher
                    </button>
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