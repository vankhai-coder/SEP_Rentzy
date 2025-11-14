# Quy trình thanh toán – ký hợp đồng – giao xe (Renter & Owner)

## Mục tiêu
- Đảm bảo cả **người thuê (renter)** và **chủ xe (owner)** đều xác nhận/đồng ý trước khi giao xe.
- Hợp đồng điện tử DocuSign được tạo và ký đủ hai bên, sau đó mới cho phép **giao xe**.
- Trạng thái đơn, hợp đồng và các bước xác nhận luôn đồng bộ, có bằng chứng ký kết và nhật ký.

## Điều kiện để giao xe
- Thanh toán:
  - Tối thiểu đã **đặt cọc** thành công (`deposit_paid`).
  - Khuyến nghị: yêu cầu **thanh toán phần còn lại** (`fully_paid`) trước khi giao xe để giảm rủi ro.
- Hợp đồng DocuSign:
  - Envelope đã **được gửi** và ở trạng thái `pending_signatures`.
  - Cả renter và owner đã **ký hoàn tất** → trạng thái envelope `completed`. (Webhook DocuSign cập nhật `BookingContract.contract_status = completed`)
- Xác nhận giao xe tại thời điểm bàn giao:
  - Hai bên xác nhận lần cuối (checkbox/OTP/chữ ký tay/ảnh hiện trường), tạo **biên bản bàn giao** lưu kèm booking.

## Quy trình chi tiết
1) Tạo link thanh toán đặt cọc (PayOS)
- Frontend gọi `POST /api/payment/payos/link` → trả `checkoutUrl`.
- Người thuê thanh toán, PayOS gọi webhook `POST /api/payment/payos/webhook` → backend cập nhật booking `deposit_paid`.
- Backend tự động **gửi hợp đồng DocuSign** (nếu chưa gửi).

2) Gửi hợp đồng DocuSign
- Backend `POST /api/docusign/send-contract` hoặc hàm server-side `sendContractForBookingServerSide(bookingId)` xây dựng envelope:
  - Tài liệu: HTML/PDF dựa trên dữ liệu booking.
  - Người ký: renter (routingOrder 1) → owner (routingOrder 2) ký tuần tự.
  - `eventNotification` trỏ tới webhook DocuSign để cập nhật trạng thái.
- Lưu `envelopeId` vào `BookingContract.contract_number`, đặt `contract_status = pending_signatures`.

3) Ký hợp đồng (embedded signing)
- Frontend tạo URL ký cho renter bằng `GET /api/docusign/sign/:envelopeId?role=renter` và mở trong **modal iframe**.
- Sau renter, owner ký tương tự (`role=owner`, có thể gửi link riêng cho owner).
- DocuSign Connect webhook `POST /api/docusign/webhook` cập nhật `contract_status`.

4) Thanh toán phần còn lại (tuỳ chính sách)
- Frontend gọi `POST /api/payment/payos/remaining-link` → trả `checkoutUrl`.
- PayOS webhook cập nhật booking `fully_paid`.
- Nếu hợp đồng **chưa gửi**, backend sẽ **gửi hợp đồng** tại bước này (đã bổ sung logic dự phòng).

5) Xác định điều kiện “Sẵn sàng giao xe”
- Khi `Booking.status` là `deposit_paid` hoặc `fully_paid` và `BookingContract.contract_status` là `completed`, backend setting trạng thái booking → `ready_to_handover`.
- Frontend chỉ hiển thị nút **“Xác nhận giao xe”** khi đủ điều kiện.

6) Xác nhận giao xe (2 bên)
- Hai API đề xuất:
  - `POST /api/booking/:id/handover/confirm-renter` → renter xác nhận bàn giao (kèm ảnh, checklist, OTP nếu cần).
  - `POST /api/booking/:id/handover/confirm-owner` → owner xác nhận bàn giao (kèm ảnh, checklist, OTP nếu cần).
- Khi **cả hai** đều xác nhận → cập nhật `Booking.status = handed_over` và lưu **biên bản bàn giao**.

7) Hoàn tất và lưu trữ
- Sau khi kết thúc thuê, cập nhật trạng thái, xuất hóa đơn, và lưu hợp đồng PDF kết hợp (`/api/docusign/documents/:id/combined`).

## API hiện có (đã implement)
- Thanh toán PayOS:
  - `POST /api/payment/payos/link` → tạo link đặt cọc (JWT).
  - `POST /api/payment/payos/remaining-link` → tạo link phần còn lại (JWT).
  - `POST /api/payment/payos/webhook` → webhook PayOS, cập nhật `deposit_paid`/`fully_paid`, gửi hợp đồng nếu chưa có.
- DocuSign:
  - `POST /api/docusign/send-contract` → gửi envelope (JWT + token DocuSign).
  - `GET /api/docusign/sign/:envelopeId` → tạo URL ký embedded cho renter/owner (JWT + token DocuSign).
  - `GET /api/docusign/status/:id` → lấy trạng thái envelope, sync `BookingContract` (JWT + token DocuSign).
  - `GET /api/docusign/documents/:id/combined` → tải PDF hợp nhất (JWT + token DocuSign).
  - `GET /api/docusign/contract-template/:bookingId` → sinh HTML hợp đồng từ booking (JWT).
  - `POST /api/docusign/webhook` → DocuSign Connect cập nhật `sent/completed/voided`.

## API đề xuất (bổ sung cho bàn giao 2 bên)
- `GET /api/booking/:id/readiness` → trả về điều kiện sẵn sàng giao xe (các flag: thanh toán, hợp đồng, checklist).
- `PATCH /api/booking/:id/ready-to-handover` → backend tự set khi đủ điều kiện hoặc cho phép chủ xe set thủ công nếu chính sách cho phép.
- `POST /api/booking/:id/handover/confirm-renter` → renter xác nhận bàn giao.
- `POST /api/booking/:id/handover/confirm-owner` → owner xác nhận bàn giao.
- `GET /api/booking/:id/handover-report` → tải/hiển thị biên bản bàn giao (ảnh, chữ ký tay, checklist).

## Ràng buộc logic (guard)
- Chỉ cho phép mở modal ký khi hợp đồng ở `pending_signatures`.
- Chỉ cho phép view PDF khi hợp đồng `completed` (hoặc hệ thống muốn cho xem nháp thì không bắt buộc).
- Chỉ cho phép chuyển `ready_to_handover` khi:
  - `Booking.status ∈ {deposit_paid, fully_paid}`
  - `BookingContract.contract_status === completed`.
- Chỉ cho phép `handed_over` khi cả renter và owner đã gọi **confirm**.

## Model BookingContract (kiểm tra)
- Trường chính:
  - `booking_id` (duy nhất 1-1), `contract_number` (DocuSign envelopeId), `contract_status` (ENUM: `draft`, `pending_signatures`, `signed`, `completed`, `terminated`).
- Gợi ý:
  - Sử dụng `signed` khi **một bên** đã ký; `completed` khi **cả hai** ký xong.
  - Bổ sung cập nhật `renter_signed_at`/`owner_signed_at` từ webhook `recipientEvents` để theo dõi chi tiết.
- Liên kết:
  - Quan hệ 1-1 với `Booking` (đúng chuẩn). Index đã hợp lý.

## Biến môi trường & Webhook DocuSign
- `DOCUSIGN_CLIENT_ID`, `DOCUSIGN_CLIENT_SECRET`, `DOCUSIGN_REDIRECT_URI`, `DOCUSIGN_ACCOUNT_ID`.
- `DOCUSIGN_BASE_PATH` (`https://demo.docusign.net/restapi`), `DOCUSIGN_AUTH_BASE` (`https://account-d.docusign.com`).
- `DOCUSIGN_ACCESS_TOKEN` (tự động server-side) hoặc dùng OAuth và persist token.
- `DOCUSIGN_WEBHOOK_URL` → URL public tới `POST /api/docusign/webhook`.
- Khuyến nghị webhook gửi **JSON** (code đã hỗ trợ). Nếu DocuSign gửi XML, cần bổ sung parse XML.

## Kiểm thử
- Đặt cọc → webhook PayOS cập nhật `deposit_paid` → hệ thống gửi envelope DocuSign.
- Renter mở modal ký (iframe), ký → Owner ký → webhook DocuSign báo `completed`.
- Thanh toán phần còn lại → cập nhật `fully_paid`.
- Kiểm tra readiness → chuyển `ready_to_handover`.
- Hai bên xác nhận bàn giao → `handed_over` và lưu biên bản.
- Tải PDF hợp đồng kết hợp và lưu trữ.

## Khuyến nghị vận hành
- Yêu cầu thanh toán phần còn lại trước giao xe để giảm rủi ro.
- Lưu ảnh hiện trường, đồng hồ công tơ, tình trạng nhiên liệu khi bàn giao.
- Nhật ký (audit log) cho các thao tác quan trọng (gửi envelope, ký, xác nhận bàn giao).