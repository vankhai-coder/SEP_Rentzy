# PayOS Payment Session Management

## Tổng quan

Hệ thống quản lý phiên thanh toán PayOS được thiết kế để xử lý các tình huống khi người dùng thoát ra hoặc chưa hoàn tất thanh toán, đảm bảo không có xung đột giữa các payment session và cung cấp trải nghiệm người dùng mượt mà.

## Các tính năng chính

### 1. Tự động kiểm tra và hủy session cũ
- Hệ thống tự động kiểm tra các transaction PENDING đã hết hạn (15 phút)
- Hủy payment session trên PayOS server trước khi tạo session mới
- Cập nhật trạng thái transaction trong database thành "CANCELLED"

### 2. Reuse existing session
- Nếu có transaction PENDING còn hiệu lực, hệ thống sẽ tái sử dụng
- Tránh tạo nhiều payment link không cần thiết

### 3. Force refresh mechanism
- API endpoint để force refresh payment session khi có vấn đề
- Hủy tất cả pending sessions và cho phép tạo mới

### 4. Enhanced logging
- Log chi tiết lifecycle của payment session
- Timestamp và thông tin debug để troubleshoot

## API Endpoints

### 1. Tạo payment link cọc
```
POST /api/payment/payos/link
Authorization: Bearer <token>

Body:
{
  "bookingId": "123",
  "returnUrl": "https://yourapp.com/success",
  "cancelUrl": "https://yourapp.com/cancel"
}
```

### 2. Tạo payment link phần còn lại
```
POST /api/payment/payos/remaining-link
Authorization: Bearer <token>

Body:
{
  "bookingId": "123",
  "returnUrl": "https://yourapp.com/success",
  "cancelUrl": "https://yourapp.com/cancel"
}
```

### 3. Force refresh payment session
```
POST /api/payment/payos/force-refresh
Authorization: Bearer <token>

Body:
{
  "bookingId": "123",
  "paymentType": "DEPOSIT" // hoặc "RENTAL"
}
```

## Workflow xử lý payment session

### Khi tạo payment link mới:

1. **Kiểm tra existing pending transaction**
   - Tìm transaction PENDING cho booking và payment type
   - Nếu có và chưa hết hạn (< 15 phút) → Reuse
   - Nếu có và đã hết hạn → Cancel và tạo mới

2. **Cancel old PayOS session**
   - Gọi `payOS.paymentRequests.cancel(orderCode)`
   - Update transaction status thành "CANCELLED"
   - Log chi tiết quá trình cancel

3. **Tạo transaction mới**
   - Tạo record Transaction với status "PENDING"
   - Tạo PayOS payment request
   - Return checkout URL

### Khi webhook nhận thông báo:

1. **Xác thực payment**
   - Kiểm tra signature và data từ PayOS
   - Tìm booking theo orderCode

2. **Cập nhật trạng thái**
   - Update booking status (deposit_paid/fully_paid)
   - Update transaction status thành "COMPLETED"
   - Tạo notification cho user
   - Gửi email xác nhận

## Xử lý các tình huống đặc biệt

### 1. User thoát ra giữa chừng
- Payment session sẽ tự động expire sau 15 phút
- Lần tạo link tiếp theo sẽ tự động cancel session cũ
- Không cần can thiệp thủ công

### 2. Payment link bị lỗi
- Sử dụng API force refresh để reset toàn bộ
- Tạo lại payment link từ đầu

### 3. Multiple payment attempts
- Hệ thống chỉ cho phép 1 pending transaction tại 1 thời điểm
- Tự động cancel các session cũ khi tạo mới

## Logging và Monitoring

### Log format:
```
🚀 [timestamp] Creating PayOS payment request: {orderCode, amount, bookingId, ...}
✅ [timestamp] PayOS payment link created successfully: {orderCode, checkoutUrl, ...}
❌ [timestamp] PayOS session cancel failed: {orderCode, error, ...}
🔄 Force refreshed payment sessions for booking {bookingId}
```

### Các log quan trọng cần theo dõi:
- Payment link creation success/failure
- Session cancel success/failure
- Transaction status changes
- Webhook processing

## Best Practices

### 1. Frontend implementation
- Hiển thị loading state khi đang tạo payment link
- Xử lý timeout và retry mechanism
- Cung cấp nút "Tạo lại link thanh toán" nếu có lỗi

### 2. Error handling
- Catch và log tất cả errors từ PayOS API
- Provide meaningful error messages cho user
- Implement fallback mechanisms

### 3. Testing scenarios
- Test payment flow bình thường
- Test user exit và re-enter
- Test multiple payment attempts
- Test force refresh functionality
- Test webhook processing

## Troubleshooting

### Lỗi thường gặp:

1. **"Payment session conflict"**
   - Nguyên nhân: Có nhiều pending session cùng lúc
   - Giải pháp: Gọi force refresh API

2. **"PayOS session cancel failed"**
   - Nguyên nhân: Session đã được cancel hoặc không tồn tại
   - Giải pháp: Bỏ qua error này, tiếp tục tạo session mới

3. **"Transaction not found"**
   - Nguyên nhân: Webhook nhận được nhưng không tìm thấy transaction
   - Giải pháp: Kiểm tra orderCode mapping và database

### Debug steps:
1. Kiểm tra logs để trace payment flow
2. Verify transaction records trong database
3. Check PayOS dashboard cho session status
4. Test với force refresh API

## Security Considerations

- Validate tất cả input parameters
- Verify JWT token cho protected endpoints
- Log sensitive operations cho audit trail
- Không expose PayOS credentials trong logs
- Implement rate limiting cho payment APIs