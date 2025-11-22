# Quy trình ký DocuSign và API trong code hiện tại

Tài liệu này bám sát đúng code trong `backend/src/controllers/docusign/docusignController.js` và `backend/src/routes/docusign/docusignRoute.js`, mô tả luồng ký và các API, bao gồm đầu vào/đầu ra.

## Tổng quan quy trình

- Backend tạo Envelope DocuSign cho mỗi `booking` sau khi thanh toán cọc (hoặc thanh toán đủ) thông qua `bookingSend()`.
- Envelope có 2 người ký:
  - Renter (người thuê) với `routingOrder = "1"`, `clientUserId = "renter"`.
  - Owner (chủ xe) với `routingOrder = "2"`, `clientUserId = "owner"`.
- FE gọi API lấy Recipient View URL để mở giao diện ký DocuSign trong `iframe`.
- Sau khi ký, DocuSign redirect về `returnUrl` (HTTPS) → FE đóng modal, gọi API trạng thái và hiển thị PDF.
- Trạng thái hợp đồng được đồng bộ qua polling (`GET /status/:id`) và/hoặc webhook (`POST /webhook`).

## Sơ đồ luồng

1) Người thuê thanh toán đặt cọc → hệ thống tạo Envelope cho `booking`.
2) Người thuê mở trang hợp đồng → gọi API lấy Recipient View và ký.
3) Sau khi người thuê ký xong → chủ xe mở trang hợp đồng → gọi API lấy Recipient View để ký.
4) Sau khi cả hai ký xong → trạng thái hợp đồng thành `completed` → có thể tải PDF tổng hợp.

## API chi tiết (khớp `docusignRoute.js`)

### 1) Khởi tạo envelope cho booking

- Method: `POST`
- Path: `/api/docusign/booking/:bookingId/send`
- Handler: `bookingSend`
- Mục đích: Tạo Envelope từ HTML template và gửi tới renter/owner để ký.
- Đầu vào:
  - Path param: `bookingId` (bắt buộc)
- Đầu ra (200): `{ envelopeId, status }`
- Ánh xạ trạng thái vào DB (`BookingContract.contract_status`):
  - `sent` → `pending_signatures`
  - `completed` → `completed`
  - `voided` → `terminated`

### 2) Tạo Recipient View (link ký nhúng) cho từng vai trò

- Method: `GET`
- Path: `/api/docusign/sign/:envelopeId`
- Middleware: `verifyJWTToken`, `requireToken`
- Handler: `signRecipientView`
- Mục đích: Tạo URL ký nhúng cho renter/owner.
- Đầu vào (query params):
  - `role`: `renter | owner` (khuyến nghị). Nếu có `role`, backend tự tra cứu `name`, `email`, `clientUserId` từ `envelopeId` → `BookingContract` → `Booking`.
  - Hoặc truyền trực tiếp: `name`, `email`, `clientUserId`.
  - `returnUrl`: HTTPS public. Nếu không truyền hợp lệ, server cố tính `returnUrl` từ env (`FRONTEND_ORIGIN | APP_BASE_URL`) thành `/contract/:bookingId`; nếu vẫn không phải HTTPS → trả 400.
- Đầu ra (200): `{ success: true, url }`
- Lỗi chuẩn hoá theo code:
  - (409) `{ errorCode: "RECIPIENT_NOT_IN_SEQUENCE" }` → owner ký trước renter.
  - (400) `{ errorCode: "HTTPS_REQUIRED_FOR_RETURN_URL" }` → `returnUrl` không HTTPS.
  - (500) `{ error: "Failed to create recipient view" }` nếu token DocuSign thiếu/hết hạn hoặc lỗi khác.

### 3) Lấy trạng thái envelope

- Method: `GET`
- Path: `/api/docusign/status/:id`
- Middleware: `verifyJWTToken`, `requireToken`
- Handler: `getStatus`
- Đầu vào: `id` = `envelopeId`
- Đầu ra (200): `{ success: true, status, app_status, envelope }`
- Hành vi: Suy `app_status` từ DocuSign và cập nhật mốc thời gian ký `owner_signed_at`/`renter_signed_at` nếu signer hoàn tất.

### 4) Tải PDF tổng hợp (Combined Document)

- Method: `GET`
- Path: `/api/docusign/documents/:id/combined`
- Middleware: `verifyJWTToken`, `requireToken`
- Handler: `getCombinedDocuments`
- Đầu vào: `id` (envelopeId)
- Đầu ra (200): Binary PDF (`Content-Type: application/pdf`).

### 5) Webhook DocuSign (Connect)

- Method: `POST`
- Path: `/api/docusign/webhook`
- Handler: `webhook`
- Yêu cầu cấu hình: `DOCUSIGN_WEBHOOK_URL` phải là HTTPS; sử dụng trong `eventNotification` khi tạo envelope.
- Đầu vào: payload từ DocuSign.
- Đầu ra: `200 OK`; đồng bộ trạng thái và mốc thời gian ký.

### 6) OAuth (tuỳ chọn)

- `GET /api/docusign/oauth/login` → `oauthLogin` chuyển hướng đến trang consent/login.
- `GET /api/docusign/oauth/callback` → `oauthCallback` nhận `code` và đổi sang `access_token`.
- `requireToken` middleware: kiểm tra có `docusignAccessToken` (từ env hoặc JWT) trước khi gọi API.

## Trạng thái và dữ liệu

- Bảng `BookingContract` lưu:
  - `contract_number` (DocuSign `envelopeId`)
  - `contract_status` (ánh xạ từ DocuSign hoặc suy diễn)
  - `owner_signed_at`, `renter_signed_at` (thời điểm ký)
- `contract_status` có thể là: `pending_signatures`, `signed`, `completed`, `terminated`, `unknown`.

## Tích hợp FE

### Trang người thuê (`ContractBooking.jsx`)

- Hiển thị nút “Ký hợp đồng” duy nhất trong banner.
- Gọi `GET /api/docusign/sign/:envelopeId?role=renter&returnUrl=https://...` để lấy `url` ký → mở trong `iframe`.
- Khi DocuSign redirect về `returnUrl` cùng origin FE:
  - Đóng modal, gọi `GET /api/docusign/status/:id` → cập nhật UI.

### Trang chủ xe (`ContractOwner.jsx`)

- Hiển thị nút “Ký hợp đồng” duy nhất trong banner.
- Gọi `GET /api/docusign/sign/:envelopeId?role=owner&returnUrl=https://...`.
- Nếu người thuê chưa ký xong, backend trả `409 RECIPIENT_NOT_IN_SEQUENCE` → FE hiển thị toast tiếng Việt: “Chưa tới lượt ký…”.
- Khi redirect về FE sau khi ký, FE hiển thị toast thành công và cập nhật trạng thái.

## Cấu hình bắt buộc

- `DOCUSIGN_ACCOUNT_ID`, `DOCUSIGN_BASE_PATH` (chuẩn hoá về `.../restapi` nếu thiếu), `DOCUSIGN_AUTH_BASE`.
- Token:
  - `DOCUSIGN_ACCESS_TOKEN` (tĩnh) + `DOCUSIGN_TOKEN_TTL_MS` (tuỳ chọn), hoặc
  - JWT: `DOCUSIGN_INTEGRATION_KEY`, `DOCUSIGN_USER_ID`, `DS_PRIVATE_KEY_PATH` (+ consent).
- Return URL/FE origin:
  - `FRONTEND_ORIGIN` hoặc `APP_BASE_URL` (phải HTTPS) để backend tự tính `returnUrl` `/contract/:bookingId` nếu không truyền.
- Webhook: `DOCUSIGN_WEBHOOK_URL` phải là HTTPS; nếu không, việc tạo envelope sẽ ném lỗi `HTTPS_REQUIRED_FOR_CONNECT_LISTENER`.

## Lỗi thường gặp và cách xử lý

- `RECIPIENT_NOT_IN_SEQUENCE` (409):
  - Nguyên nhân: Owner ký trước renter (code đặt `routingOrder`: renter=1, owner=2; `clientUserId` phải khớp `"renter"/"owner"`).
  - Cách xử lý: Hiển thị thông báo Việt và yêu cầu ký đúng thứ tự.
- `HTTPS_REQUIRED_FOR_RETURN_URL` (400):
  - Nguyên nhân: `returnUrl` không phải HTTPS public hoặc không thể suy ra origin HTTPS từ env.
  - Cách xử lý: Cấu hình `FRONTEND_ORIGIN`/`APP_BASE_URL` là HTTPS hoặc truyền `returnUrl` HTTPS.
- `DocuSign access token missing/expired` (500):
  - Nguyên nhân: Thiếu token hoặc hết hạn (middleware `requireToken` sẽ chặn).
  - Cách xử lý: Thiết lập `DOCUSIGN_ACCESS_TOKEN` hoặc cấu hình JWT đầy đủ.

## Gợi ý debug nhanh

- Kiểm tra `envelopeId` trong `BookingContract.contract_number`.
- Gọi `GET /api/docusign/status/:id` để xem `status` và `app_status`.
- Kiểm tra các `clientUserId` của signer (phải cố định theo code):
  - Renter: `clientUserId = "renter"`, `routingOrder = "1"`.
  - Owner: `clientUserId = "owner"`, `routingOrder = "2"`.
- Đảm bảo `returnUrl` đúng HTTPS, cùng origin FE.

Xem PDF tổng hợp: GET /api/docusign/documents/:id/combined trả về PDF do DocuSign tạo (thường dùng sau khi envelope đã tồn tại). Có thể nhúng vào iframe viewer PDF nếu muốn.
- Lấy link ký (Recipient View): GET /api/docusign/sign/:envelopeId (FE mở viewer DocuSign).
- Tải PDF tổng hợp: GET /api/docusign/documents/:id/combined
http://localhost:3000/api/docusign/documents/8b5e1c73-719d-8cef-810f-657ba3ba1294/combined 
Trae Builder

Thought process

I’ve reviewed the DocuSign controller to confirm what endpoints return and where envelopes appear. Now I’ll open the function that generates the signing link to quote exact responses.

backend/src/controllers/docusign/docusignController.js 440 - 620

backend/src/controllers/docusign/docusignController.js 620 - 780

Thought

Xem hợp đồng trên DocuSign

- Đăng nhập DocuSign theo môi trường của bạn:
  - Sandbox: https://demo.docusign.net
  - Production: https://app.docusign.com
- Vào mục eSignature → Manage :
  - Inbox / In Progress : các envelope đang chờ ký.
  - Sent : đã gửi đi.
  - Completed : đã ký xong.
  - Voided : đã hủy.
- Dùng ô tìm kiếm để nhập Envelope ID (mã mà API trả về) để tìm đúng hợp đồng.
- Nếu bật webhook (Connect), xem log tại Settings → Connect để kiểm tra sự kiện cập nhật trạng thái.
API trả về gì khi tạo và ký

- Tạo envelope từ booking:
  - POST /api/docusign/booking/:bookingId/send
  - Trả về:
    - {"success": true, "envelopeId": "<id>", "status": "created|sent"}
    - Đồng thời lưu/ cập nhật BookingContract với contract_number = envelopeId và trạng thái nội bộ.
- Lấy link ký (Recipient View):
  - GET /api/docusign/sign-recipient-view/:id?role=owner|renter&name=&email=&clientUserId=&returnUrl=
  - Trả về thành công:
    - {"success": true, "url": "<docusign_signing_url>"} để FE mở iframe/redirect.
  - Lỗi phổ biến:
    - 400 HTTPS_REQUIRED_FOR_RETURN_URL : returnUrl hoặc FRONTEND_ORIGIN không phải HTTPS công khai.
    - 409 RECIPIENT_NOT_IN_SEQUENCE : chưa đến lượt người ký này theo routingOrder .
    - 500 Failed to create recipient view : lỗi chung từ DocuSign.
- Kiểm tra trạng thái envelope:
  - GET /api/docusign/status/:id
  - Trả về:
    - {"success": true, "status": "<sent|completed|voided|...>", "app_status": "<pending_signatures|signed|completed|terminated|unknown>", "envelope": { ...raw DocuSign envelope... }}
    - app_status là trạng thái nội bộ đã map để hiển thị UI.
- Tải PDF hợp đồng tổng hợp (sau khi DocuSign tạo):
  - GET /api/docusign/documents/:id/combined
  - Trả về: nội dung application/pdf (binary). Ví dụ đường dẫn bạn đang có:
    - http://localhost:3000/api/docusign/documents/8b5e1c73-719d-8cef-810f-657ba3ba1294/combined
- Xem HTML hợp đồng đã render (chỉ xem, không ký):
  - GET /api/docusign/contract-template/:bookingId
  - Trả về: text/html của mẫu hợp đồng đã điền dữ liệu từ booking.

  Luồng tổng quát

- Tạo envelope cho booking: POST /api/docusign/booking/:bookingId/send .
- Lấy link ký (Recipient View) cho đúng vai trò: GET /api/docusign/sign-recipient-view/:envelopeId?role=owner|renter&returnUrl=... .
- Người dùng ký trong viewer của DocuSign (iframe/redirect).
- Kiểm tra trạng thái: GET /api/docusign/status/:envelopeId .
- Tải PDF hợp đồng tổng hợp: GET /api/docusign/documents/:envelopeId/combined .
Endpoints chính

- POST /api/docusign/booking/:bookingId/send
  - Mục đích: Tạo envelope từ HTML hợp đồng của booking.
  - Trả về: {"success": true, "envelopeId": "<id>", "status": "created|sent"} .
- GET /api/docusign/sign-recipient-view/:envelopeId
  - Mục đích: Lấy URL viewer của DocuSign để ký nhúng.
  - Query:
    - role : owner hoặc renter (giúp tự tìm tên/email nếu không truyền).
    - name , email : nếu không truyền, hệ thống sẽ lấy theo role từ booking.
    - clientUserId : thường là "owner" hoặc "renter" để khớp với envelope.
    - returnUrl : bắt buộc HTTPS (public) ở production; nếu không truyền, hệ thống cố lấy từ FRONTEND_ORIGIN / APP_BASE_URL .
  - Trả về thành công: {"success": true, "url": "<docusign_signing_url>"} .
  - Lỗi chuẩn:
    - 400 HTTPS_REQUIRED_FOR_RETURN_URL : returnUrl không phải HTTPS public.
    - 409 RECIPIENT_NOT_IN_SEQUENCE : chưa đến lượt người ký này.
    - 500 Failed to create recipient view : lỗi chung từ DocuSign.
- GET /api/docusign/status/:envelopeId
  - Mục đích: Kiểm tra trạng thái envelope để cập nhật UI.
  - Trả về: {"success": true, "status": "<sent|completed|voided|...>", "app_status": "<pending_signatures|signed|completed|terminated|unknown>", "envelope": {...}} .
- GET /api/docusign/documents/:envelopeId/combined
  - Mục đích: Tải PDF tổng hợp do DocuSign tạo.
  - Trả về: nội dung application/pdf (binary).
- GET /api/docusign/contract-template/:bookingId
  - Mục đích: Xem HTML hợp đồng đã render (chỉ xem, không ký).
  - Trả về: text/html .
Ví dụ gọi API

- Tạo envelope:
  - POST http://localhost:3000/api/docusign/booking/150/send
  - Response:
    - {"success": true, "envelopeId": "8b5e1c73-719d-8cef-810f-657ba3ba1294", "status": "sent"}
- Lấy link ký cho renter:
  - GET http://localhost:3000/api/docusign/sign-recipient-view/8b5e1c73-719d-8cef-810f-657ba3ba1294?role=renter&returnUrl=https://<your-ngrok>.ngrok-free.dev/contract/150
  - Response:
    - {"success": true, "url": "https://demo.docusign.net/Member/StartInSession?..."}
- Kiểm tra trạng thái:
  - GET http://localhost:3000/api/docusign/status/8b5e1c73-719d-8cef-810f-657ba3ba1294
  - Response:
    - {"success": true, "status": "completed", "app_status": "completed", "envelope": { ... }}
- Tải PDF:
  - GET http://localhost:3000/api/docusign/documents/8b5e1c73-719d-8cef-810f-657ba3ba1294/combined
Cách dùng trên FE (rút gọn)

- Sau khi có envelopeId , gọi sign-recipient-view để lấy url , rồi mở trong iframe/redirect:
  - fetch('/api/docusign/sign-recipient-view/<envelopeId>?role=renter&returnUrl=https://...')
  - Nhận url , set window.location.href = url hoặc <iframe src={url} /> .
Lưu ý quan trọng

- returnUrl phải HTTPS public ở production; nếu dùng localhost, nên dùng ngrok để có https://<your-ngrok>.ngrok-free.dev .
- clientUserId trong query phải khớp với thiết lập ở envelope ( "renter" / "owner" ) để tạo recipient view nhúng.
- Trạng thái nội bộ ( app_status ) được map:
  - sent → pending_signatures
  - Ít nhất một người ký xong → signed
  - Tất cả ký xong → completed
  - voided → terminated
- Lỗi 409 RECIPIENT_NOT_IN_SEQUENCE : cho biết thứ tự ký chưa tới; chờ bên trước ký xong rồi thử lại

GET /api/docusign/sign/ea4f1b5d-d015-82a8-81e0-ea6b5fb61178?role=renter&returnUrl=https:%2F%2Fevaporative-evie-gadrooned.ngrok-free.dev%2Fcontract%2F153
Creating DocuSign recipient view: {
  envelopeId: 'ea4f1b5d-d015-82a8-81e0-ea6b5fb61178',
  role: 'renter',
  signerEmail: 'vupltde170269@fpt.edu.vn',
  clientUserId: 'renter',
  returnUrl: 'https://evaporative-evie-gadrooned.ngrok-free.dev/contract/153'
}
Ngắn gọn: Trong code hiện tại, việc “renter” hay “owner” đang ký được xác định chủ yếu bằng tham số role bạn truyền lên khi gọi API lấy link ký nhúng. Server dùng role để chọn đúng người ký trong envelope (renter/owner) và tạo Recipient View tương ứng. DocuSign dựa vào clientUserId để biết bạn muốn mở viewer cho signer nào.

Cách xác định vai trò trong code hiện tại

Endpoint: GET /api/docusign/sign-recipient-view/:envelopeId
Query bạn truyền: role=owner|renter (có thể kèm name, email, clientUserId, returnUrl).
Bên trong handler:
Nếu thiếu name/email, server truy vấn Booking từ envelopeId, rồi:
role=renter → dùng booking.renter.full_name/email và đặt clientUserId = "renter".
role=owner → dùng booking.vehicle.owner.full_name/email và đặt clientUserId = "owner".
Tạo recipientViewRequest và gọi DocuSign để lấy url.
Trước đó, khi tạo envelope (sendContractForBookingServerSide), bạn đã cấu hình 2 signer:
Renter: clientUserId: "renter", routingOrder: "1", anchor SIGN_RENTER.
Owner: clientUserId: "owner", routingOrder: "2", anchor SIGN_OWNER.
Kết quả: DocuSign biết “đang ký cho ai” dựa trên clientUserId (“renter” hoặc “owner”) và email/name khớp với signer trong envelope.
Quan trọng: Ai đang ký thật sự?

DocuSign không tự biết “tài khoản nào của hệ thống bạn” đang ký. Nó chỉ mở viewer cho signer tương ứng (renter/owner) dựa trên clientUserId + email/name.
Nếu người khác lấy được URL ký nhúng, họ vẫn có thể vào ký dưới danh nghĩa signer đó. Vì embedded signing tin tưởng hệ thống của bạn đã xác thực người dùng trước khi cấp link.
Hiện trạng bảo vệ trong code của bạn

Handler signRecipientView hiện tại KHÔNG kiểm tra req.user hay quyền truy cập theo booking/role. Chỉ dựa vào role bạn truyền.
Nghĩa là hệ thống chưa đảm bảo “đúng chính chủ” ở tầng ứng dụng; chỉ phân vai khi tạo link.
Gợi ý cải thiện để đảm bảo đúng người ký

Bắt buộc đăng nhập và kiểm tra quyền tại sign-recipient-view:
Nếu role=renter → req.user.id === booking.renter_id.
Nếu role=owner → req.user.id === booking.vehicle.owner_id.
Sai → trả 403 Forbidden.
Ràng buộc clientUserId bằng userId thật thay vì chuỗi "renter"/"owner".
Khi tạo envelope: clientUserId: String(booking.renter_id) và String(booking.vehicle.owner_id).
Khi tạo Recipient View: dùng đúng clientUserId theo người đang đăng nhập.
Bật xác thực DocuSign cho signer:
smsAuthentication (OTP SMS),
accessCode (mã truy cập riêng),
identityVerification (IDV/KYC) nếu cần độ tin cậy cao.
Hoặc chuyển sang “remote signing” (bỏ clientUserId) để DocuSign gửi email mời ký theo routingOrder và bổ sung OTP/IDV.
Tóm lại: Code của bạn hiện tại biết “đang tạo link ký cho renter hay owner” dựa trên role và clientUserId = "renter"/"owner", nhưng chưa xác thực “người đang gọi là ai” ở tầng hệ thống. Muốn chắc chắn đúng chính chủ, cần bổ sung kiểm tra đăng nhập/quyền và/hoặc phương thức xác thực của DocuSign.

Lý Do Dùng JWT Với DocuSign

- Server-to-server an toàn: JWT Grant cho phép backend của bạn lấy access token DocuSign bằng private key, không cần người dùng đăng nhập mỗi lần. Sau khi cấp quyền một lần (consent), hệ thống tự mint token định kỳ.
- Không phụ thuộc phiên trình duyệt: Luồng ký nhúng (embedded signing) cần server gọi DocuSign để tạo Recipient View, gửi hợp đồng, lấy trạng thái, tải PDF… JWT Grant giúp backend chủ động gọi API mà không cần OAuth tương tác.
- Bảo mật tốt hơn cho dịch vụ: Private key nằm trên server; token DocuSign được cấp ngắn hạn và luân phiên, giảm rủi ro lộ token tĩnh. Scope hẹp signature impersonation đúng mục đích.
- Phù hợp với kiến trúc hiện tại: Các route DocuSign của bạn đều là API backend (gọi từ server), nên JWT Grant là chuẩn khuyến nghị của DocuSign cho ứng dụng dịch vụ.
JWT Bạn Đang Dùng Có Hai Loại

- JWT của ứng dụng: verifyJWTToken kiểm tra người dùng của hệ thống (userId, role) để bảo vệ API của bạn. Ví dụ GET /api/docusign/sign/:envelopeId yêu cầu JWT này để chắc chắn đúng chủ thể (owner/renter) đang xin link ký.
- JWT DocuSign (OAuth JWT Grant): Hàm ensureAccessTokenJWT() ký một assertion bằng private key (RS256) và đổi lấy DocuSign access token với scope signature impersonation . Token này chỉ dùng để gọi DocuSign API (gửi hợp đồng, tạo recipient view, lấy trạng thái, tải tài liệu).
Cách Nó Hoạt Động Trong Code Của Bạn

- Kiểm tra JWT ứng dụng: middleware verifyJWTToken bảo vệ route DocuSign, đảm bảo bạn là người có quyền truy cập booking/hợp đồng.
- Lấy DocuSign token qua JWT Grant:
  - Đọc INTEGRATION_KEY (Client ID), DOCUSIGN_USER_ID (GUID người dùng DocuSign để impersonate), và DS_PRIVATE_KEY_PATH (private key RSA).
  - Ký JWT assertion (RS256) và gọi /oauth/token để nhận access token.
  - Dùng token này tạo Recipient View, gửi envelope, truy vấn trạng thái, tải Combined PDF.
- Điểm cấp quyền (one-time consent): Code của bạn còn hiển thị consentUrl với scope signature impersonation nếu chưa cấp quyền cho Integration Key — đúng chuẩn DocuSign.