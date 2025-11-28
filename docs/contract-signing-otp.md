# Tài liệu quy trình tạo Hợp đồng và ký OTP (DocuSign)

Tài liệu này mô tả quy trình tạo và ký hợp đồng điện tử trong hệ thống, bao gồm luồng OTP xác thực ký, các API liên quan (đầu vào/đầu ra), các trang frontend liên quan, middleware ràng buộc, và những lưu ý triển khai.

## Mục đích
- Tạo envelope hợp đồng DocuSign từ dữ liệu `Booking` và gửi cho người thuê (renter) và chủ xe (owner) ký.
- Áp dụng OTP gửi qua email trước khi mở giao diện ký DocuSign (embedded signing).
- Theo dõi trạng thái hợp đồng (sent, pending_signatures, completed, voided/terminated), ghi nhận thời gian ký của mỗi bên, và cung cấp tài liệu PDF combined.

## Luồng tổng quan (chi tiết)
1) Khởi tạo hợp đồng:
   - Trigger: đặt cọc thành công (hoặc thanh toán đủ) qua PayOS webhook, hoặc FE gọi thủ công.
   - Hành động: Server tạo DocuSign envelope từ `contract.html`, gắn signer tabs cho renter/owner, lưu `BookingContract` với `contract_number` và `contract_status`.
2) Hiển thị hợp đồng:
   - FE tải PDF combined từ DocuSign để xem nội dung.
3) Ký hợp đồng với OTP:
   - FE gửi OTP đến email người ký qua `/sign/send-otp`.
   - FE xác thực OTP (GET `/sign/:envelopeId?role=...&otp=...` hoặc POST `/sign/verify-otp`) để nhận Recipient View URL.
   - FE mở iFrame DocuSign để ký.
4) Hoàn tất ký và đồng bộ trạng thái:
   - DocuSign chuyển hướng về `returnUrl` (HTTPS) sau khi user hoàn tất trong iFrame.
   - FE gọi `/status/:id` để đồng bộ DB (fallback nếu webhook trễ).
5) Webhook cập nhật DB:
   - DocuSign Connect đẩy sự kiện `sent`, `completed`, `voided`.
   - Server cập nhật `BookingContract.contract_status`, thời gian ký mỗi bên.
6) Ràng buộc nghiệp vụ:
   - Các quy trình như giao/nhận xe yêu cầu hợp đồng đã `completed`; middleware `requireContractFullySigned` kiểm tra trước khi cho phép.

## Biến môi trường và phụ thuộc
- DocuSign: `DOCUSIGN_INTEGRATION_KEY`, `DOCUSIGN_USER_ID`, `DS_PRIVATE_KEY_PATH` hoặc `DOCUSIGN_ACCESS_TOKEN`, `DOCUSIGN_ACCOUNT_ID`, `DOCUSIGN_BASE_PATH`, `DOCUSIGN_AUTH_BASE`.
- Webhook: `DOCUSIGN_WEBHOOK_URL` phải là HTTPS public.
- Frontend origin để `returnUrl`: `CLIENT_ORIGIN` hoặc `FRONTEND_ORIGIN` hoặc `APP_BASE_URL` (HTTPS).
- Email: `GMAIL_USER` để gửi OTP.
- Thời gian sống OTP: trong `backend/src/utils/otp/otpStore.js`, mặc định 5 phút.

## API Backend

### Tạo và gửi envelope
- Method: `POST`
- Path: `/api/docusign/booking/:bookingId/send`
- Auth: JWT + DocuSign token middleware.
- Input: path `bookingId`.
- Output (200):
  ```json
  { "success": true, "envelopeId": "<DocuSignEnvelopeId>", "status": "sent|created" }
  ```
- Output (400/500):
  - `400 HTTPS_REQUIRED_FOR_CONNECT_LISTENER` nếu `DOCUSIGN_WEBHOOK_URL` không phải HTTPS.
  - `500 DocuSign access token missing/expired` nếu token hết hạn/thiếu.
- Notes:
  - Dùng `buildContractHtmlByBookingId` để render `contract.html` và gắn signer tabs.
  - Lưu/ cập nhật `BookingContract` với `contract_number`, `contract_status`.

### Gửi OTP để ký
- Method: `POST`
- Path: `/api/docusign/sign/send-otp`
- Auth: JWT + DocuSign token middleware.
- Body:
  ```json
  { "envelopeId": "<id>", "role": "renter|owner", "email": "optional" }
  ```
- Output (200):
  ```json
  { "success": true, "otp_sent": true }
  ```
- Output (400/404/500):
  - `400 { error: "Thiếu email người ký" }` nếu không xác định được email.
  - `404 { error: "Không tìm thấy hợp đồng" }` nếu envelopeId không tồn tại.
  - `500 { error: "Gửi OTP thất bại" }` lỗi mail service.
- Behavior:
  - Nếu không truyền `email`, server tra email theo `role` từ `BookingContract` → `Booking` → `User`.
  - Gửi email OTP với template ở `backend/src/utils/email/templates/emailTemplate.js`.

### Xác thực OTP và lấy Recipient View (server-side)
- Method: `POST`
- Path: `/api/docusign/sign/verify-otp`
- Auth: JWT + DocuSign token middleware.
- Body:
  ```json
  { "envelopeId": "<id>", "role": "renter|owner", "email": "optional", "otp": "123456", "returnUrl": "https://..." }
  ```
- Output (200):
  ```json
  { "success": true, "url": "https://demo.docusign.net/Member/Start?..." }
  ```
- Output (400/401/404/500):
  - `400 { error: "Thiếu envelopeId hoặc OTP" }` hoặc `"Thiếu email hoặc role"`.
  - `401 { error: "OTP không hợp lệ hoặc đã hết hạn" }`.
  - `404 { error: "Không tìm thấy hợp đồng" }`.
  - `400 { errorCode: "HTTPS_REQUIRED_FOR_RETURN_URL" }` nếu `returnUrl` không HTTPS.
  - `500 { error: "Tạo recipient view thất bại" }` lỗi DocuSign.
- Notes:
  - `returnUrl` phải là HTTPS. Nếu không truyền, server ghép từ `CLIENT_ORIGIN/FRONTEND_ORIGIN/APP_BASE_URL` và `bookingId`.

### Xác thực OTP và lấy Recipient View (client-side dùng GET)
- Method: `GET`
- Path: `/api/docusign/sign/:envelopeId`
- Query: `role=renter|owner`, `returnUrl=https://...`, `otp=123456`
- Output (200):
  ```json
  { "success": true, "url": "https://demo.docusign.net/Member/Start?..." }
  ```
- Error (401):
  ```json
  { "success": false, "error": "OTP_REQUIRED", "message": "Yêu cầu nhập mã OTP...", "otp_sent": true }
  ```
- Error khác (400/409/500):
  - `400 HTTPS_REQUIRED_FOR_RETURN_URL` nếu `returnUrl` không HTTPS.
  - `409 RECIPIENT_NOT_IN_SEQUENCE`: chưa tới lượt người ký.
  - `500 Failed to create recipient view`: lỗi DocuSign/token.
- Notes:
  - Endpoint này tự gửi OTP nếu chưa có hoặc OTP không hợp lệ.

### Trạng thái envelope
- Method: `GET`
- Path: `/api/docusign/status/:id`
- Output:
  ```json
  {
    "envelope": { "envelopeId": "<id>", "status": "sent|completed|voided" },
    "contract": { "contract_status": "pending_signatures|completed|terminated", ... }
  }
  ```
- Behavior:
  - Ánh xạ DocuSign status → `BookingContract.contract_status` và ghi nhận thời gian ký nếu có.
- Error (500): token DocuSign thiếu/hết hạn.

### Tải Combined Document
- Method: `GET`
- Path: `/api/docusign/documents/:id/combined`
- Output: `application/pdf` blob.

### Webhook DocuSign (Connect)
- Method: `POST`
- Path: `/api/docusign/webhook`
- Behavior:
  - Nhận event `envelope-sent`, `envelope-completed`, `envelope-voided`.
  - Cập nhật `BookingContract.contract_status`, `renter_signed_at`, `owner_signed_at`.
  - Gửi email thông báo tương ứng cho renter/owner khi ký xong.
- Error/lưu ý:
  - Phải là HTTPS public; nếu không, DocuSign không gửi được sự kiện.
  - Nên log và retry `getStatus` nếu webhook không tới kịp.

### Booking Details kèm Contract
- Method: `GET`
- Path: `/api/booking/:id` (tuỳ module), `owner dashboard detail`, v.v.
- Trả về `contract` gồm:
  - `contract_id`, `contract_number`, `contract_status`
  - `renter_signed_at`, `owner_signed_at`
  - `contract_file_url` (nếu đã tổng hợp/lưu file)

## Middleware
- `requireToken`: đảm bảo có DocuSign access token (JWT hoặc env token).
- `requireContractFullySigned`: chặn xử lý handover/return nếu hợp đồng chưa `completed` (cần cả renter và owner ký).

## Model liên quan
- `backend/src/models/BookingContract.js`:
  - `booking_id`, `contract_number` (DocuSign envelopeId)
  - `contract_status`: `pending_signatures`, `completed`, `terminated`
  - `renter_signed_at`, `owner_signed_at`
  - `contract_file_url`

## Frontend: Trang và luồng liên quan

### Renter – Trang Hợp đồng
- File: `frontend/src/pages/renter/booking/ContractBooking.jsx`
- Chức năng:
  - Khởi tạo envelope nếu đã thanh toán (`/api/docusign/booking/:bookingId/send`).
  - Tải PDF combined hiển thị trong iframe.
  - Gửi OTP, xác thực OTP lấy URL ký, mở modal iFrame DocuSign.
  - Lắng nghe `returnUrl` để auto-refresh trạng thái (`/api/docusign/status/:id`).
- API gọi:
  - `POST /api/docusign/booking/:bookingId/send`
  - `POST /api/docusign/sign/send-otp`
  - `GET /api/docusign/sign/:envelopeId?role=renter&returnUrl=...&otp=...`
  - `GET /api/docusign/documents/:id/combined`
  - `GET /api/docusign/status/:id`

### Renter – Chi tiết đơn
- File: `frontend/src/pages/renter/booking/bookingDetailRenter/BookingDetailsPage.jsx`
- Hiển thị nút ký hợp đồng và modal tương tự (nhúng iFrame, refresh status).

### Owner – Chi tiết đơn
- File: `frontend/src/pages/owner/dashboard/BookingDetail.jsx`
- Chức năng:
  - Nút “Ký hợp đồng” tạo recipient view với `role=owner`.
  - Lưu ý: Endpoint GET có OTP gate. UI hiện tại chưa hiển thị form OTP cho owner; cần bổ sung UI OTP nếu server trả `OTP_REQUIRED`.
- API gọi:
  - `GET /api/docusign/sign/:envelopeId?role=owner`
  - Điều hướng xem PDF: `/owner/contract/:bookingId`

## Lưu ý và vấn đề thường gặp
- `returnUrl` phải là HTTPS public; nếu sai sẽ nhận lỗi `HTTPS_REQUIRED_FOR_RETURN_URL`.
- DocuSign token: cần JWT cấu hình đầy đủ hoặc set `DOCUSIGN_ACCESS_TOKEN`; nếu thiếu → lỗi token missing/expired.
- Thứ tự ký: có thể gặp `RECIPIENT_NOT_IN_SEQUENCE` nếu người ký chưa tới lượt.
- OTP:
  - TTL mặc định ~5 phút, lưu in-memory (`otpStore`), có thể cần dịch vụ lưu trữ chung nếu nhiều instance.
  - Cho renter đã có UI OTP. Với owner, cần bổ sung UI OTP nếu gặp 401 `OTP_REQUIRED`.
- Webhook: phải là HTTPS; nếu chạy local dùng ngrok.
- Sau sự kiện ký, FE cần gọi `/status/:id` để đồng bộ DB (trường hợp webhook không tới kịp).

## Trường hợp biên và kịch bản lỗi
- Người dùng nhập sai OTP nhiều lần:
  - Server trả `401` và có thể gửi OTP mới (GET endpoint tự gửi nếu sai).
  - Khuyến nghị giới hạn số lần thử và hiển thị countdown TTL.
- Envelope chưa có hoặc không khớp booking:
  - `404 Không tìm thấy hợp đồng`; FE nên khởi tạo lại bằng `POST /booking/:bookingId/send` nếu đã thanh toán.
- `returnUrl` không HTTPS:
  - DocuSign từ chối → `400 HTTPS_REQUIRED_FOR_RETURN_URL`; đảm bảo cấu hình origin HTTPS.
- Thiếu/expired DocuSign token:
  - `500` ở nhiều endpoint; cần cấu hình JWT hoặc `DOCUSIGN_ACCESS_TOKEN` và TTL hợp lý.
- Ký sai thứ tự:
  - `409 RECIPIENT_NOT_IN_SEQUENCE`; FE hiển thị hướng dẫn chờ bên trước ký.
- Webhook không đến hoặc chậm:
  - FE luôn gọi `/status/:id` sau khi quay lại từ DocuSign để đồng bộ nhanh.
- Multi-instance OTP:
  - In-memory không phù hợp; dùng Redis/shared store để đồng bộ và tránh thất thoát mã.
- Bảo mật email/OTP:
  - OTP one-time, xóa sau xác thực; không log mã OTP trong server logs.

## Xác thực OTP: đối chiếu mã trong email và cách sử dụng

### Cơ chế tạo/lưu/kiểm tra OTP
- File: `backend/src/utils/otp/otpStore.js`
- Tạo OTP: `createOtp(envelopeId, email, ttlMs)` sinh mã 6 chữ số (`100000–999999`) và lưu vào in-memory `Map` với key `${envelopeId}:${email.toLowerCase()}`.
- TTL: mặc định 5 phút; sau TTL auto-cleanup.
- Kiểm tra OTP: `verifyOtp(envelopeId, email, code)` so khớp mã và hạn sử dụng; nếu đúng thì xóa (one-time use).
- Kiểm tra còn hiệu lực: `hasOtp(envelopeId, email)`.

### So khớp OTP đúng với mã trong email
- Khi FE gửi OTP người dùng nhập, BE xác thực bằng `verifyOtp` dựa trên cặp `(envelopeId, email)`:
  - Nếu đúng và chưa hết hạn → trả về URL Recipient View để mở trang ký.
  - Nếu sai/hết hạn → trả lỗi 401 và có thể tự gửi lại OTP mới.
- Phân giải email người ký:
  - Nếu không truyền `email`, BE tra theo `role` từ `BookingContract` → `Booking` → `User` (renter/owner) trong `docusignController`.

### Các endpoint liên quan đến OTP và cách dùng
- Gửi OTP:
  - `POST /api/docusign/sign/send-otp`
  - Body: `{ envelopeId, role, email? }`
  - Trả: `{ success: true, otp_sent: true }`

- Xác thực OTP (POST, khuyến nghị dùng cho cả renter/owner):
  - `POST /api/docusign/sign/verify-otp`
  - Body: `{ envelopeId, role|email, otp, returnUrl? (HTTPS) }`
  - Trả: `{ success: true, url }` nếu OTP hợp lệ; 401 nếu không hợp lệ.

- Xác thực OTP (GET, đang dùng ở renter UI):
  - `GET /api/docusign/sign/:envelopeId?role=...&returnUrl=...&otp=...`
  - Hành vi:
    - Nếu `otp` sai/hết hạn → BE tự tạo/gửi OTP mới và trả `{ error: "OTP_REQUIRED", otp_sent: true }` (401).
    - Nếu đúng → trả `{ success: true, url }`.

### Ví dụ request/response
- Gửi OTP cho renter:
  - Request:
    ```json
    POST /api/docusign/sign/send-otp
    { "envelopeId": "abc123", "role": "renter" }
    ```
  - Response:
    ```json
    { "success": true, "otp_sent": true }
    ```

- Xác thực OTP và lấy URL ký (POST):
  - Request:
    ```json
    POST /api/docusign/sign/verify-otp
    { "envelopeId": "abc123", "role": "renter", "otp": "123456", "returnUrl": "https://app.example.com/contract/42" }
    ```
  - Response (OTP đúng):
    ```json
    { "success": true, "url": "https://demo.docusign.net/..." }
    ```
  - Response (OTP sai/hết hạn):
    ```json
    { "error": "OTP không hợp lệ hoặc đã hết hạn" }
    ```

### Luồng hiển thị OTP trên FE
- Renter (`ContractBooking.jsx`):
  - Gọi `POST /sign/send-otp` khi mở modal ký.
  - Người dùng nhập OTP → gọi `GET /sign/:envelopeId?role=renter&returnUrl=...&otp=...`.
  - Nếu trả URL → iFrame DocuSign mở → ký; sau khi quay về `returnUrl`, FE gọi `/status/:id` để đồng bộ DB.
- Owner (`BookingDetail.jsx`):
  - Hiện tại gọi `GET /sign/:envelopeId?role=owner` trực tiếp. Nên bổ sung form OTP tương tự renter, hoặc chuyển sang dùng `POST /sign/verify-otp` để có trải nghiệm nhất quán.

### Bảo mật và khuyến nghị
- OTP là one-time; xóa sau khi xác thực thành công.
- TTL 5 phút; nên hiển thị countdown UI nếu cần.
- In-memory store phù hợp môi trường đơn instance; nếu scale nhiều instance, nên dùng Redis/shared store để đồng bộ OTP.
- `returnUrl` bắt buộc HTTPS để DocuSign chấp nhận.

## Kiểm thử nhanh quy trình
1. Tạo booking và thanh toán đặt cọc/đủ tiền.
2. Kiểm tra ở trang Hợp đồng (renter) có `contract_number` và PDF combined.
3. Nhấn “Ký hợp đồng”:
   - Nhận OTP email → nhập OTP → mở iFrame DocuSign → ký.
   - Quay về app, FE gọi `/status/:id` → trạng thái hợp đồng đổi sang `completed` khi cả hai bên ký.

---

## Tham chiếu chi tiết API (Input/Output & cURL)

Phần này mở rộng chi tiết về đầu vào/đầu ra, các mã lỗi chuẩn, yêu cầu header và ví dụ cURL cho từng API liên quan đến hợp đồng DocuSign và OTP.

### Chuẩn chung
- Headers mặc định:
  - `Authorization: Bearer <JWT>` với các endpoint yêu cầu đăng nhập.
  - `Content-Type: application/json` cho các request body JSON.
- Quy ước mã lỗi JSON:
  ```json
  {
    "success": false,
    "code": "STRING_UPPER_SNAKE",
    "error": "Mô tả ngắn gọn",
    "message": "Diễn giải thân thiện người dùng (tùy chọn)",
    "details": { "field": "thông tin bổ sung" }
  }
  ```
- Giá trị hợp lệ cho `role`: `"renter" | "owner"`.
- `returnUrl` bắt buộc là URL HTTPS công khai.

---

### 1) Tạo và gửi envelope
- Method: `POST`
- Path: `/api/docusign/booking/:bookingId/send`
- Auth: Bắt buộc JWT và DocuSign token hợp lệ.
- Path params:
  - `bookingId` (string, required): ID của booking cần tạo hợp đồng.
- Request body: Không dùng (hoặc `{}`).
- Success response (200):
  ```json
  {
    "success": true,
    "envelopeId": "abc123def",
    "status": "sent"
  }
  ```
- Error responses:
  - 400 `HTTPS_REQUIRED_FOR_CONNECT_LISTENER`
    ```json
    { "success": false, "code": "HTTPS_REQUIRED_FOR_CONNECT_LISTENER", "error": "Webhook DocuSign phải là HTTPS" }
    ```
  - 404 `BOOKING_NOT_FOUND`
    ```json
    { "success": false, "code": "BOOKING_NOT_FOUND", "error": "Không tìm thấy booking" }
    ```
  - 500 `DOCUSIGN_TOKEN_MISSING_OR_EXPIRED`
    ```json
    { "success": false, "code": "DOCUSIGN_TOKEN_MISSING_OR_EXPIRED", "error": "DocuSign access token thiếu hoặc hết hạn" }
    ```
- cURL ví dụ:
  ```bash
  curl -X POST \
    -H "Authorization: Bearer $JWT" \
    -H "Content-Type: application/json" \
    https://api.example.com/api/docusign/booking/BOOKING_ID/send
  ```

---

### 2) Gửi OTP để ký
- Method: `POST`
- Path: `/api/docusign/sign/send-otp`
- Auth: Bắt buộc.
- Request body schema:
  ```json
  {
    "envelopeId": "string",
    "role": "renter|owner",
    "email": "string (optional)"
  }
  ```
  - `envelopeId` (required)
  - `role` (required)
  - `email` (optional, nếu không truyền server tự suy ra theo role)
- Success response (200):
  ```json
  { "success": true, "otp_sent": true }
  ```
- Error responses:
  - 400 `MISSING_ENVELOPE_ID_OR_ROLE`
    ```json
    { "success": false, "code": "MISSING_ENVELOPE_ID_OR_ROLE", "error": "Thiếu envelopeId hoặc role" }
    ```
  - 400 `MISSING_SIGNER_EMAIL`
    ```json
    { "success": false, "code": "MISSING_SIGNER_EMAIL", "error": "Thiếu email người ký" }
    ```
  - 404 `ENVELOPE_NOT_FOUND`
    ```json
    { "success": false, "code": "ENVELOPE_NOT_FOUND", "error": "Không tìm thấy hợp đồng" }
    ```
  - 500 `SEND_OTP_FAILED`
    ```json
    { "success": false, "code": "SEND_OTP_FAILED", "error": "Gửi OTP thất bại" }
    ```
- cURL ví dụ:
  ```bash
  curl -X POST \
    -H "Authorization: Bearer $JWT" \
    -H "Content-Type: application/json" \
    -d '{"envelopeId":"ENV_ID","role":"renter"}' \
    https://api.example.com/api/docusign/sign/send-otp
  ```

---

### 3) Xác thực OTP và lấy Recipient View (POST)
- Method: `POST`
- Path: `/api/docusign/sign/verify-otp`
- Auth: Bắt buộc.
- Request body schema:
  ```json
  {
    "envelopeId": "string",
    "role": "renter|owner",
    "email": "string (optional)",
    "otp": "string",
    "returnUrl": "https://... (optional but must be HTTPS if provided)"
  }
  ```
- Success response (200):
  ```json
  { "success": true, "url": "https://demo.docusign.net/Member/Start?..." }
  ```
- Error responses:
  - 400 `MISSING_ENVELOPE_ID_OR_OTP`
    ```json
    { "success": false, "code": "MISSING_ENVELOPE_ID_OR_OTP", "error": "Thiếu envelopeId hoặc OTP" }
    ```
  - 400 `HTTPS_REQUIRED_FOR_RETURN_URL`
    ```json
    { "success": false, "code": "HTTPS_REQUIRED_FOR_RETURN_URL", "error": "returnUrl phải là HTTPS" }
    ```
  - 401 `OTP_INVALID_OR_EXPIRED`
    ```json
    { "success": false, "code": "OTP_INVALID_OR_EXPIRED", "error": "OTP không hợp lệ hoặc đã hết hạn" }
    ```
  - 404 `ENVELOPE_NOT_FOUND`
    ```json
    { "success": false, "code": "ENVELOPE_NOT_FOUND", "error": "Không tìm thấy hợp đồng" }
    ```
  - 409 `RECIPIENT_NOT_IN_SEQUENCE`
    ```json
    { "success": false, "code": "RECIPIENT_NOT_IN_SEQUENCE", "error": "Chưa đến lượt người ký" }
    ```
  - 500 `CREATE_RECIPIENT_VIEW_FAILED`
    ```json
    { "success": false, "code": "CREATE_RECIPIENT_VIEW_FAILED", "error": "Tạo recipient view thất bại" }
    ```
- cURL ví dụ:
  ```bash
  curl -X POST \
    -H "Authorization: Bearer $JWT" \
    -H "Content-Type: application/json" \
    -d '{
      "envelopeId":"ENV_ID",
      "role":"owner",
      "otp":"123456",
      "returnUrl":"https://app.example.com/contract/BOOKING_ID"
    }' \
    https://api.example.com/api/docusign/sign/verify-otp
  ```

---

### 4) Xác thực OTP và lấy Recipient View (GET)
- Method: `GET`
- Path: `/api/docusign/sign/:envelopeId`
- Query params:
  - `role` (string, required): `renter|owner`
  - `otp` (string, optional nhưng bắt buộc để lấy URL ký)
  - `returnUrl` (string, optional; bắt buộc HTTPS nếu truyền)
- Success response (200):
  ```json
  { "success": true, "url": "https://demo.docusign.net/Member/Start?..." }
  ```
- Error responses:
  - 401 `OTP_REQUIRED`
    ```json
    { "success": false, "code": "OTP_REQUIRED", "error": "Yêu cầu nhập mã OTP", "otp_sent": true }
    ```
  - 400 `HTTPS_REQUIRED_FOR_RETURN_URL`
  - 409 `RECIPIENT_NOT_IN_SEQUENCE`
  - 500 `CREATE_RECIPIENT_VIEW_FAILED`
- cURL ví dụ:
  ```bash
  curl -G \
    -H "Authorization: Bearer $JWT" \
    --data-urlencode "role=renter" \
    --data-urlencode "otp=123456" \
    --data-urlencode "returnUrl=https://app.example.com/contract/BOOKING_ID" \
    https://api.example.com/api/docusign/sign/ENV_ID
  ```

---

### 5) Lấy trạng thái envelope
- Method: `GET`
- Path: `/api/docusign/status/:id`
- Path params:
  - `id` (string, required): DocuSign `envelopeId`.
- Success response (200):
  ```json
  {
    "envelope": { "envelopeId": "ENV_ID", "status": "sent|completed|voided" },
    "contract": {
      "booking_id": "...",
      "contract_number": "ENV_ID",
      "contract_status": "pending_signatures|completed|terminated",
      "renter_signed_at": "2024-10-01T10:20:30.000Z",
      "owner_signed_at": "2024-10-01T11:20:30.000Z",
      "contract_file_url": "https://.../contract.pdf"
    }
  }
  ```
- Error responses:
  - 404 `ENVELOPE_NOT_FOUND`
  - 500 `DOCUSIGN_TOKEN_MISSING_OR_EXPIRED`
- cURL ví dụ:
  ```bash
  curl -H "Authorization: Bearer $JWT" \
    https://api.example.com/api/docusign/status/ENV_ID
  ```

---

### 6) Tải Combined Document (PDF)
- Method: `GET`
- Path: `/api/docusign/documents/:id/combined`
- Path params:
  - `id` (string, required): DocuSign `envelopeId`.
- Success response: `application/pdf` (stream/blob)
- Error responses:
  - 404 `ENVELOPE_NOT_FOUND`
  - 500 `DOCUSIGN_TOKEN_MISSING_OR_EXPIRED`
- cURL ví dụ (tải về file):
  ```bash
  curl -L \
    -H "Authorization: Bearer $JWT" \
    -o contract.pdf \
    https://api.example.com/api/docusign/documents/ENV_ID/combined
  ```

---

### 7) Webhook DocuSign (Connect)
- Method: `POST`
- Path: `/api/docusign/webhook`
- Auth: Public nhưng phải là HTTPS; xác thực bằng HMAC (nếu cấu hình) hoặc IP allowlist (khuyến nghị).
- Request body (ví dụ rút gọn):
  ```xml
  <DocuSignEnvelopeInformation>
    <EnvelopeStatus>
      <EnvelopeID>ENV_ID</EnvelopeID>
      <Status>Completed</Status>
      <RecipientStatuses>
        <RecipientStatus>
          <Type>Signer</Type>
          <Email>renter@example.com</Email>
          <Status>Completed</Status>
          <Completed>2024-10-01T10:20:30.000Z</Completed>
        </RecipientStatus>
        <RecipientStatus>
          <Type>Signer</Type>
          <Email>owner@example.com</Email>
          <Status>Completed</Status>
          <Completed>2024-10-01T11:20:30.000Z</Completed>
        </RecipientStatus>
      </RecipientStatuses>
    </EnvelopeStatus>
  </DocuSignEnvelopeInformation>
  ```
- Success response (200):
  ```json
  { "success": true }
  ```
- Error responses: 400/500 tùy trường hợp parse và cập nhật DB.
- Ghi chú:
  - Server ánh xạ `Status` của envelope sang `BookingContract.contract_status`:
    - `Sent|Delivered|Created` → `pending_signatures`
    - `Completed` → `completed`
    - `Voided` → `terminated`
  - Đồng thời ghi nhận `renter_signed_at`/`owner_signed_at` theo `RecipientStatuses`.

---

### Ánh xạ trạng thái và ràng buộc ký
- DocuSign → Hệ thống:
  - `created|sent|delivered` → `pending_signatures`
  - `completed` → `completed`
  - `voided` → `terminated`
- Thứ tự ký (ví dụ): renter trước, owner sau. Nếu gọi tạo view khi chưa đến lượt → trả `409 RECIPIENT_NOT_IN_SEQUENCE`.

---

### Khuyến nghị triển khai và bảo mật
- `returnUrl` luôn là HTTPS; không dùng localhost trừ khi thông qua ngrok.
- OTP one-time, TTL 5 phút; giới hạn số lần thử và chống brute force.
- Lưu trữ OTP:
  - Đơn instance: in-memory `otpStore` OK.
  - Multi-instance: dùng Redis/shared store để đồng bộ.
- Idempotency: gửi OTP nhiều lần đến cùng `(envelopeId, email)` sẽ ghi đè mã cũ; người dùng chỉ cần nhập mã mới nhất.
- Rate limit: giới hạn tần suất `send-otp` theo IP/user để tránh spam.

---

### Tổng hợp cURL nhanh
- Tạo envelope:
  ```bash
  curl -X POST -H "Authorization: Bearer $JWT" https://api.example.com/api/docusign/booking/BOOKING_ID/send
  ```
- Gửi OTP:
  ```bash
  curl -X POST -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
    -d '{"envelopeId":"ENV_ID","role":"renter"}' \
    https://api.example.com/api/docusign/sign/send-otp
  ```
- Xác thực OTP (POST):
  ```bash
  curl -X POST -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
    -d '{"envelopeId":"ENV_ID","role":"owner","otp":"123456","returnUrl":"https://app.example.com/contract/BOOKING_ID"}' \
    https://api.example.com/api/docusign/sign/verify-otp
  ```
- Xác thực OTP (GET):
  ```bash
  curl -G -H "Authorization: Bearer $JWT" \
    --data-urlencode "role=renter" \
    --data-urlencode "otp=123456" \
    --data-urlencode "returnUrl=https://app.example.com/contract/BOOKING_ID" \
    https://api.example.com/api/docusign/sign/ENV_ID
  ```
- Lấy trạng thái:
  ```bash
  curl -H "Authorization: Bearer $JWT" https://api.example.com/api/docusign/status/ENV_ID
  ```
- Tải PDF hợp đồng:
  ```bash
  curl -L -H "Authorization: Bearer $JWT" -o contract.pdf \
    https://api.example.com/api/docusign/documents/ENV_ID/combined
  ```
4. Đối với owner:
   - Nhấn “Ký hợp đồng” → nếu 401 `OTP_REQUIRED`, bổ sung UI OTP hoặc chuyển dùng POST `/sign/verify-otp`.

## Tài nguyên mã nguồn liên quan
- Backend:
  - `controllers/docusign/docusignController.js`: Gửi envelope, recipient view, OTP endpoints, webhook, status, combined docs, contract HTML.
  - `controllers/payment/paymentController.js`: Tự động gửi hợp đồng sau webhook PayOS.
  - `middlewares/contractMiddleware.js`: Ràng buộc hợp đồng đã ký đủ.
  - `models/BookingContract.js`: Lưu trạng thái và thông tin hợp đồng.
  - `utils/otp/otpStore.js`: Sinh/kiểm OTP ký hợp đồng.
  - `utils/email/templates/emailTemplate.js`: Email OTP ký.
- Frontend:
  - `pages/renter/booking/ContractBooking.jsx`: OTP và embedded signing cho renter.
  - `pages/renter/booking/bookingDetailRenter/BookingDetailsPage.jsx`: Ký và xem trạng thái.
  - `pages/owner/dashboard/BookingDetail.jsx`: Ký dành cho owner.

## Khuyến nghị cải tiến
- Thêm UI form OTP cho owner giống renter; fallback dùng POST `/sign/verify-otp` để tránh lẫn GET/POST.
- Lưu `contract_file_url` sau khi envelope `completed` bằng việc tải combined PDF và lưu vào storage/CDN.
- Triển khai lưu trữ OTP bền vững (Redis) nếu chạy nhiều instance.
- Hiển thị cụ thể lỗi `RECIPIENT_NOT_IN_SEQUENCE` trên FE để hướng dẫn thứ tự ký.