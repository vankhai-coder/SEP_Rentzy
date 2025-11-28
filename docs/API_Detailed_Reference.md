# Tài liệu API chi tiết (SEP Rentzy)

Mục tiêu: mô tả đầy đủ các endpoint backend với đầu vào, đầu ra, trạng thái lỗi, xác thực và ví dụ cURL để bạn có thể tích hợp hoặc kiểm thử nhanh.

## Quy ước chung
- Auth: hầu hết endpoint bảo vệ bằng `JWT` qua header `Authorization: Bearer <token>`.
- Response chuẩn:
  - Thành công: `{ success: true, data?: any, message?: string }`
  - Lỗi: `{ success: false, message?: string, error?: string }`
- Trạng thái lỗi thường gặp:
  - `401 Unauthorized`: thiếu hoặc JWT không hợp lệ
  - `403 Forbidden`: không đủ quyền (ví dụ admin-only)
  - `400 Bad Request`: thiếu tham số, dữ liệu không hợp lệ
  - `404 Not Found`: bản ghi không tồn tại
  - `409 Conflict`: vi phạm ràng buộc (ví dụ thứ tự ký DocuSign)
  - `500 Internal Server Error`: lỗi phía server hoặc dịch vụ ngoài
- Mô tả tham số:
  - `Path Param`: nằm trong đường dẫn, ví dụ `/resource/:id`
  - `Query Param`: nằm sau `?`, ví dụ `?page=1&limit=20`
  - `Body`: JSON trong request với `Content-Type: application/json`

---

## 1) Xác thực và người dùng (Auth)

### Kiểm tra đăng nhập
- Method: `GET`
- Path: `/api/auth/check-auth`
- Auth: JWT
- Input: none
- Output (200): `{ success: true, user: { userId, role, email, ... } }`
- Lỗi: `401` nếu JWT thiếu/không hợp lệ
- Ví dụ:
  `curl -H "Authorization: Bearer <token>" https://<host>/api/auth/check-auth`

### Đăng nhập email
- Method: `POST`
- Path: `/api/auth/login`
- Body: `{ email: string, password: string }`
- Output (200): `{ success: true, token, user }`
- Lỗi: `400` thiếu trường, `401` sai thông tin đăng nhập

### Đăng ký email
- Method: `POST`
- Path: `/api/auth/register`
- Body: `{ full_name, email, password }`
- Output (200): `{ success: true, message }`
- Lỗi: `400` thiếu trường, `409` email đã tồn tại

### Đăng nhập/Đăng ký bằng số điện thoại
- Method: `POST`
- Path: `/api/auth/register-with-phone-number`
- Body: `{ phone_number, full_name, password? }`
- Output: `{ success: true }`
- Liên quan: `/api/auth/login-with-phone-number`, `/api/auth/request-login-with-phone-number`, `/api/auth/verify-phone-number-for-registration`

### Google OAuth
- `GET /api/auth/google` chuyển hướng tới Google
- `GET /api/auth/google/callback` nhận `code` và tạo phiên đăng nhập

### Đổi mật khẩu (email auth)
- Method: `POST`
- Path: `/api/auth/change-password-for-email-auth-user`
- Auth: JWT
- Body: `{ old_password, new_password }`
- Output (200): `{ success: true }`

### Xóa tài khoản
- Method: `DELETE`
- Path: `/api/auth/delete-account`
- Auth: JWT
- Output (200): `{ success: true }`

---

## 2) Tìm kiếm và xem xe (Renter)

### Danh sách xe
- Method: `GET`
- Path: `/api/renter/vehicles`
- Auth: không bắt buộc
- Query: `page?`, `limit?`, `brand?`, `type?` (tuỳ triển khai controller)
- Output (200): `{ success: true, data: Vehicle[] }`

### Chi tiết xe
- Method: `GET`
- Path: `/api/renter/vehicles/:id`
- Auth: `softAuth` (cho phép không đăng nhập)
- Output (200): `{ success: true, data: Vehicle }`
- Lỗi: `404` nếu không tồn tại

### Tìm kiếm nâng cao
- Method: `GET`
- Path: `/api/renter/search`
- Auth: `softAuth`
- Query: `q?`, `vehicle_type?`, `price_min?`, `price_max?`, `brand_id?`, `page?`, `limit?`...
- Output (200): `{ success: true, data: Vehicle[], pagination, filterOptions }`
- Lỗi: `500` khi lỗi server

---

## 3) Đặt xe (Booking)

### Lấy ngày đã đặt của xe
- Method: `GET`
- Path: `/api/booking/getDate/:vehicleId`
- Output (200): `{ success: true, dates: string[] }`
- Lỗi: `404` nếu xe không tồn tại

### Tạo booking
- Method: `POST`
- Path: `/api/booking/createBooking`
- Auth: JWT
- Middleware: `checkVerificationForBooking`
- Body bắt buộc: `{ vehicle_id: number, start_date: ISODate, end_date: ISODate, pickup_location, dropoff_location, ... }`
- Output (200): `{ success: true, booking_id, status: "pending"|"confirmed" }`
- Lỗi: `400` thiếu trường, `403` chưa xác minh danh tính, `409` xung đột lịch

### Xem booking
- Method: `GET`
- Path: `/api/booking/:bookingId`
- Auth: JWT
- Output (200): `{ success: true, data: Booking }`
- Lỗi: `404` nếu không tồn tại hoặc không thuộc user

### Xóa booking
- Method: `DELETE`
- Path: `/api/booking/:bookingId`
- Auth: JWT
- Output (200): `{ success: true }`
- Lỗi: `404`, `403` nếu không có quyền

### Tự động hủy booking hết hạn (Admin/Job)
- Method: `POST`
- Path: `/api/booking/admin/auto-cancel-expired`
- Output (200): `{ success: true, processed: number }`

### Phí hủy và xác nhận hủy
- Method: `GET`
- Path: `/api/booking/:bookingId/cancellation-fee`
- Output (200): `{ success: true, fee: number, policy: string }`
- Method: `POST`
- Path: `/api/booking/:bookingId/cancel`
- Auth: JWT
- Middleware: `requireBankAccount`
- Body: `{ reason: string }`
- Output (200): `{ success: true, status: "canceled" }`

---

## 4) Bàn giao & trả xe (Handover)

Yêu cầu hợp đồng đã ký đủ 2 bên: middleware `requireContractFullySigned` cho một số bước.

### Chủ xe xác nhận bàn giao
- Method: `POST`
- Path: `/api/handover/:bookingId/confirm-owner-handover`
- Auth: JWT
- Middleware: `requireContractFullySigned`, `uploadMiddleware` (hình ảnh)
- Body (multipart/form-data): `images[]`, `note?`
- Output (200): `{ success: true }`

### Người thuê xác nhận bàn giao
- Method: `POST`
- Path: `/api/handover/:bookingId/confirm-renter-handover`
- Auth: JWT
- Body: `{ accepted: boolean, note? }`
- Output (200): `{ success: true }`

### Chủ xe xác nhận nhận lại xe
- Method: `POST`
- Path: `/api/handover/:bookingId/confirm-owner-return`
- Auth: JWT
- Middleware: `uploadMiddleware`
- Body: `images[]`, `fuel_level?`, `note?`
- Output (200): `{ success: true }`

### Người thuê xác nhận trả xe
- Method: `POST`
- Path: `/api/handover/:bookingId/confirm-renter-return`
- Auth: JWT
- Body: `{ accepted: boolean, note? }`
- Output (200): `{ success: true }`

---

## 5) Thanh toán (PayOS)

### Tạo link thanh toán cọc
- Method: `POST`
- Path: `/api/payment/payos/link`
- Auth: JWT
- Body: `{ bookingId: number, amount: number }`
- Output (200): `{ success: true, checkoutUrl, orderCode }`
- Lỗi: `400` thiếu trường, `500` lỗi PayOS

### Tạo link thanh toán phần còn lại
- Method: `POST`
- Path: `/api/payment/payos/remaining-link`
- Auth: JWT
- Body: `{ bookingId: number, amount: number }`
- Output (200): `{ success: true, checkoutUrl, orderCode }`

### Tạo link thanh toán phí phạt nguội
- Method: `POST`
- Path: `/api/payment/payos/traffic-fine-link`
- Auth: JWT
- Body: `{ bookingId: number, amount: number, description }`
- Output (200): `{ success: true, checkoutUrl, orderCode }`

### Hủy giao dịch PayOS
- Method: `POST`
- Path: `/api/payment/payos/cancel`
- Auth: JWT
- Body: `{ orderCode: string }`
- Output (200): `{ success: true }`

### Webhook PayOS
- Method: `POST`
- Path: `/api/payment/payos/webhook`
- Input: payload PayOS
- Output (200): `{ success: true }`
- Hành vi: cập nhật trạng thái booking (`deposit_paid`/`fully_paid`), gửi DocuSign nếu cần

### Thanh toán tiền mặt phần còn lại
- Method: `PATCH`
- Path: `/api/payment/byCash/:bookingId`
- Auth: JWT
- Body: `{ amount: number }`
- Output (200): `{ success: true, status: "fully_paid" }`

### Chủ xe xác nhận thanh toán ngoài hệ thống
- Method: `PATCH`
- Path: `/api/payment/approveRemainingByOwner/:bookingId`
- Auth: JWT
- Output (200): `{ success: true }`

---

## 6) Hợp đồng điện tử (DocuSign)

### Gửi hợp đồng cho booking
- Method: `POST`
- Path: `/api/docusign/booking/:bookingId/send`
- Auth: JWT + DocuSign token
- Body: `{ owner_sign_first?: boolean }`
- Output (200): `{ success: true, envelopeId, status: "sent|created" }`
- Lỗi: `400 HTTPS_REQUIRED_FOR_CONNECT_LISTENER`, `500 DocuSign token missing/expired`

### Gửi OTP ký
- Method: `POST`
- Path: `/api/docusign/sign/send-otp`
- Auth: JWT + DocuSign token
- Body: `{ envelopeId: string, role: 'renter'|'owner', email?: string }`
- Output (200): `{ success: true, otp_sent: true }`
- Lỗi: `400 thiếu email`, `404 không tìm thấy hợp đồng`, `500 gửi OTP thất bại`

### Xác thực OTP và lấy Recipient View (POST)
- Method: `POST`
- Path: `/api/docusign/sign/verify-otp`
- Auth: JWT + DocuSign token
- Body: `{ envelopeId, role, email?, otp, returnUrl? (HTTPS) }`
- Output (200): `{ success: true, url }`
- Lỗi: `401 OTP không hợp lệ/hết hạn`, `400 thiếu tham số`, `400 HTTPS_REQUIRED_FOR_RETURN_URL`, `404 không thấy hợp đồng`, `500 lỗi DocuSign`

### Xác thực OTP và lấy Recipient View (GET)
- Method: `GET`
- Path: `/api/docusign/sign/:envelopeId?role=...&email=...&otp=...&returnUrl=...`
- Auth: JWT + DocuSign token
- Output (200): `{ success: true, url }`
- Lỗi: `401 OTP_REQUIRED`, `409 RECIPIENT_NOT_IN_SEQUENCE`, `400 HTTPS_REQUIRED_FOR_RETURN_URL`, `500 lỗi DocuSign`

### Lấy trạng thái envelope
- Method: `GET`
- Path: `/api/docusign/status/:id`
- Auth: JWT + DocuSign token
- Output (200): `{ envelope: { status }, contract: { contract_status, renter_signed_at?, owner_signed_at? } }`

### Tải PDF combined
- Method: `GET`
- Path: `/api/docusign/documents/:id/combined`
- Auth: JWT + DocuSign token
- Output (200): `application/pdf`
- Lỗi: `404`, `500`

### Mẫu hợp đồng theo booking
- Method: `GET`
- Path: `/api/docusign/contract-template/:bookingId`
- Auth: JWT
- Output (200): `{ html: string }`

### OAuth DocuSign (tuỳ chọn)
- `GET /api/docusign/oauth/login` → chuyển hướng consent
- `GET /api/docusign/oauth/callback` → trả `{ success, access_token }`

### Webhook DocuSign
- Method: `POST`
- Path: `/api/docusign/webhook`
- Input: payload Connect (HTTPS bắt buộc)
- Output (200): `{ success: true }`

---

## 7) Chủ xe (Owner)

### Danh sách booking
- Method: `GET`
- Path: `/api/owner/dashboard/bookings`
- Auth: JWT
- Query: `page?`, `status?`
- Output: `{ success: true, data: Booking[] }`

### Chi tiết booking
- Method: `GET`
- Path: `/api/owner/dashboard/bookings/detail/:id`
- Output: `{ success: true, data: Booking }`

### Chấp nhận/Từ chối booking
- Method: `PATCH`
- Path: `/api/owner/dashboard/bookings/:id/accept`
- Output: `{ success: true, status: "confirmed" }`
- Method: `PATCH`
- Path: `/api/owner/dashboard/bookings/:id/reject`
- Body: `{ reason?: string }`
- Output: `{ success: true, status: "canceled" }`

### Doanh thu, giao dịch
- `GET /api/owner/dashboard/revenue`
- `GET /api/owner/dashboard/transactions`

### Xe của chủ xe (CRUD)
- `GET /api/owner/vehicles` danh sách
- `GET /api/owner/vehicles/stats` thống kê
- `GET /api/owner/vehicles/:id` chi tiết
- `POST /api/owner/vehicles` body: trường xe + `main_image`, `extra_images[]` (multipart)
- `PUT /api/owner/vehicles/:id` cập nhật, tương tự upload
- `PATCH /api/owner/vehicles/:id/status` `{ status: 'available'|'blocked' }`
- `PATCH /api/owner/vehicles/:id/confirmation` `{ require_owner_confirmation: boolean }`
- `DELETE /api/owner/vehicles/:id`

### Phạt nguội
- `GET /api/owner/dashboard/traffic-fine-search/captcha`
- `POST /api/owner/dashboard/traffic-fine-search` `{ license_plate, ... }`
- `POST /api/owner/dashboard/bookings/:id/traffic-fine` upload `images[]`, `{ amount, description }`
- `POST /api/owner/dashboard/bookings/:id/traffic-fine/delete-request`

---

## 8) Người thuê (Renter)

### Lịch sử booking
- `GET /api/renter/booking-history` (có filter `status?`)
- `GET /api/renter/booking-history/statuses`
- `GET /api/renter/booking-history/:bookingId` chi tiết

### Lịch sử giao dịch
- `GET /api/renter/transactions`

### Điểm thưởng
- `GET /api/renter/points/history` query: `page`, `limit`, `transaction_type?`, `reference_type?`, `search?`
- Output: `{ success, data: PointsTransaction[], pagination, stats }`

### Voucher
- `GET /api/renter/voucher/unused`

### Nhãn hiệu, đề xuất, so sánh, yêu thích, thông báo
- Các route tồn tại trong thư mục `backend/src/routes/renter/` tương ứng:
  - `brandRoute.js`, `recommendationRoute.js`, `compareVehicleRoute.js`, `favoriteRoute.js`, `notificationRoute.js`, `vehicleReportRoute.js`, `systemSettingPublicRoute.js`
- Mẫu response: `{ success: true, data }` hoặc `{ success: false, message }`

---

## 9) Quản trị (Admin)

### Phạt nguội
- `GET /api/admin/traffic-fine-requests/stats`
- `GET /api/admin/traffic-fine-requests`
- `PATCH /api/admin/traffic-fine-requests/:id/approve`
- `PATCH /api/admin/traffic-fine-requests/:id/reject`
- Auth: JWT + role `admin`

### Payout
- `GET /api/admin/payout-management` (legacy) hoặc `GET /api/admin/payouts`
- `POST /api/admin/payout-management/approve/:id` hoặc `PUT /api/admin/payouts/:id/approve`
- `POST /api/admin/payout-management/reject/:id` hoặc `PUT /api/admin/payouts/:id/reject`

### System Settings
- `GET /api/admin/system-settings`
- `POST /api/admin/system-settings` body `{ key, value, description? }`
- `PUT /api/admin/system-settings/:id`
- `DELETE /api/admin/system-settings/:id`

### Vouchers, Overviews, Revenue, Notifications, User Management
- Có các route tương ứng trong `backend/src/routes/admin/`:
  - `adminVoucherRoute.js`, `adminOverviewRoute.js`, `adminRevenueRoute.js`, `adminNotificationRoute.js`, `adminUserManagementRoute.js`, `adminUserChartRoute.js`, `adminManagemnetVehicleRoute.js`, `adminApprovalVehicleRoute.js`, `adminApproveOwnerRoute.js`
- Quy ước: yêu cầu role `admin` và trả `{ success, data }`

---

## 10) Ghi chú tích hợp và kiểm thử
- JWT: thêm header `Authorization: Bearer <token>` cho tất cả endpoints yêu cầu đăng nhập.
- CORS: cấu hình FE origin phù hợp; DocuSign `returnUrl` phải HTTPS.
- PayOS webhook: đảm bảo triển khai công khai hoặc dùng ngrok để kiểm thử.
- DocuSign webhook: `DOCUSIGN_WEBHOOK_URL` bắt buộc HTTPS; kiểm tra mapping trạng thái.
- OTP: TTL ~5 phút, one-time, in-memory; dùng Redis nếu multi-instance.

## Ví dụ cURL nhanh
- Check auth: `curl -H "Authorization: Bearer <token>" https://<host>/api/auth/check-auth`
- Create booking: `curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"vehicle_id":1,"start_date":"2025-01-01","end_date":"2025-01-02"}' https://<host>/api/booking/createBooking`
- Create PayOS link: `curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"bookingId":123,"amount":2000000}' https://<host>/api/payment/payos/link`
- Send DocuSign OTP: `curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"envelopeId":"<envId>","role":"renter"}' https://<host>/api/docusign/sign/send-otp`

---

## Lộ trình cải tiến tài liệu
- Chuẩn hoá schema JSON bằng OpenAPI/Swagger trong repo để tự động hoá.
- Thêm ví dụ phản hồi lỗi chi tiết cho từng controller.
- Đồng bộ hoá tiêu chuẩn response `{ success, data, message }` trên toàn bộ controllers.