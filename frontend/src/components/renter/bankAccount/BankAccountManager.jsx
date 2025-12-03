import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Star, StarOff, CreditCard, Building2, Upload, Image } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { toast } from 'sonner';
import axiosInstance from '@/config/axiosInstance';

const BankAccountManager = () => {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    bank_name: '',
    account_number: '',
    account_holder_name: '',
    qr_code_url: '',
    is_primary: false
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch bank accounts
  const fetchBankAccounts = async () => {
    try {
      const response = await axiosInstance.get('/api/bank-accounts');

      if (response.data.success) {
        setBankAccounts(response.data.data || []);
      } else {
        toast.error(response.data.message || 'Không thể tải danh sách tài khoản');
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      toast.error('Lỗi khi tải danh sách tài khoản ngân hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Chỉ chấp nhận file ảnh định dạng JPEG, JPG, PNG, WEBP');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload QR code image
  const uploadQRCode = async () => {
    if (!selectedFile) {
      toast.error('Vui lòng chọn ảnh QR code');
      return null;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('qrImage', selectedFile);

      const response = await axiosInstance.post('/api/bank-accounts/upload-qr', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success('Upload ảnh QR code thành công');
        return response.data.data.url;
      } else {
        toast.error(response.data.message || 'Lỗi khi upload ảnh');
        return null;
      }
    } catch (error) {
      console.error('Error uploading QR code:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi upload ảnh QR code');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.bank_name || !formData.account_number || !formData.account_holder_name) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setSubmitting(true);
    try {
      let qrCodeUrl = formData.qr_code_url;
      
      // Upload QR code if file is selected
      if (selectedFile) {
        const uploadedUrl = await uploadQRCode();
        if (uploadedUrl) {
          qrCodeUrl = uploadedUrl;
        } else {
          setSubmitting(false);
          return; // Stop if upload failed
        }
      }

      const dataToSubmit = {
        ...formData,
        qr_code_url: qrCodeUrl
      };

      let response;
      
      if (editingAccount) {
        response = await axiosInstance.put(`/api/bank-accounts/${editingAccount.bank_id}`, dataToSubmit);
      } else {
        response = await axiosInstance.post('/api/bank-accounts', dataToSubmit);
      }

      if (response.data.success) {
        toast.success(response.data.message);
        fetchBankAccounts();
        handleCloseDialog();
      } else {
        toast.error(response.data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error saving bank account:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi lưu tài khoản ngân hàng');
    } finally {
      setSubmitting(false);
    }
  };

  // Set primary account
  const handleSetPrimary = async (bankId) => {
    try {
      const response = await axiosInstance.patch(`/api/bank-accounts/${bankId}/set-primary`);

      if (response.data.success) {
        toast.success(response.data.message);
        fetchBankAccounts();
      } else {
        toast.error(response.data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error setting primary account:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi đặt tài khoản chính');
    }
  };

  // Delete account
  const handleDelete = async (bankId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      return;
    }

    try {
      const response = await axiosInstance.delete(`/api/bank-accounts/${bankId}`);

      if (response.data.success) {
        toast.success(response.data.message);
        fetchBankAccounts();
      } else {
        toast.error(response.data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error deleting bank account:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi xóa tài khoản ngân hàng');
    }
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAccount(null);
    setFormData({
      bank_name: '',
      account_number: '',
      account_holder_name: '',
      qr_code_url: '',
      is_primary: false
    });
    setSelectedFile(null);
    setPreviewUrl('');
  };

  // Handle edit
  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      bank_name: account.bank_name,
      account_number: account.account_number,
      account_holder_name: account.account_holder_name,
      qr_code_url: account.qr_code_url || '',
      is_primary: account.is_primary
    });
    setSelectedFile(null);
    setPreviewUrl(account.qr_code_url || '');
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý tài khoản ngân hàng</h2>
          <p className="text-gray-600 mt-1">Thêm và quản lý các tài khoản ngân hàng của bạn</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Thêm tài khoản
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản ngân hàng'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên ngân hàng *
                </label>
                <Input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                  placeholder="VD: Vietcombank, BIDV, Techcombank..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số tài khoản *
                </label>
                <Input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                  placeholder="Nhập số tài khoản"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên chủ tài khoản *
                </label>
                <Input
                  type="text"
                  value={formData.account_holder_name}
                  onChange={(e) => setFormData({...formData, account_holder_name: e.target.value})}
                  placeholder="Nhập tên chủ tài khoản"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã QR thanh toán (tùy chọn)
                </label>
                
                {/* File upload input */}
                <div className="mb-3">
                  <input
                    type="file"
                    id="qr-upload"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading || submitting}
                  />
                  <label
                    htmlFor="qr-upload"
                    className={`flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg transition-colors ${
                      uploading || submitting 
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                        : 'border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    <Upload className={`w-5 h-5 mr-2 ${uploading || submitting ? 'text-gray-300' : 'text-gray-400'}`} />
                    <span className={`text-sm ${uploading || submitting ? 'text-gray-400' : 'text-gray-600'}`}>
                      {uploading ? 'Đang tải ảnh...' : selectedFile ? selectedFile.name : 'Chọn ảnh mã QR để tải lên'}
                    </span>
                  </label>
                </div>

                {/* Preview image */}
                {previewUrl && (
                  <div className="mb-3">
                    <div className="flex items-center mb-2">
                      <Image className="w-4 h-4 mr-1 text-gray-500" />
                      <span className="text-sm text-gray-600">Xem trước:</span>
                    </div>
                    <img
                      src={previewUrl}
                      alt="QR Code Preview"
                      className="w-32 h-32 object-cover border rounded-lg"
                    />
                  </div>
                )}


              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={formData.is_primary}
                  onChange={(e) => setFormData({...formData, is_primary: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_primary" className="ml-2 block text-sm text-gray-700">
                  Đặt làm tài khoản chính
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={uploading || submitting}
                >
                  {uploading ? 'Đang tải ảnh...' : submitting ? 'Đang lưu...' : (editingAccount ? 'Cập nhật' : 'Thêm')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {bankAccounts.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Chưa có tài khoản ngân hàng
          </h3>
          <p className="text-gray-600 mb-4">
            Thêm tài khoản ngân hàng để nhận thanh toán từ hệ thống
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {bankAccounts.map((account) => (
            <div
              key={account.bank_id}
              className={`border rounded-lg p-4 ${
                account.is_primary 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Building2 className="w-5 h-5 text-gray-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">
                        {account.bank_name}
                      </h3>
                      {account.is_primary && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Star className="w-3 h-3 mr-1" />
                          Tài khoản chính
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      Số TK: {account.account_number}
                    </p>
                    <p className="text-sm text-gray-600">
                      Chủ TK: {account.account_holder_name}
                    </p>
                    
                    {account.qr_code_url && (
                      <p className="text-sm text-blue-600 mt-1">
                        Có mã QR thanh toán
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!account.is_primary && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetPrimary(account.bank_id)}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      <StarOff className="w-4 h-4 mr-1" />
                      Đặt chính
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(account)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(account.bank_id)}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BankAccountManager;