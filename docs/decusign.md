DOCUSIGN_ACCOUNT_ID = a16fee36-3a27-4ac3-9bef-21dbd4027c5c
Là gì:
Đây là ID tài khoản DocuSign của bạn (Account ID).
Mỗi tài khoản DocuSign (dev hoặc production) đều có một GUID riêng.

Dùng để làm gì:

Khi gọi API eSignature, bạn phải chỉ rõ bạn đang thao tác trên tài khoản nào.

Ví dụ: tạo envelope, lấy trạng thái, tải file hợp đồng.

Khi nào cần:

Mọi API call với DocuSign bắt buộc cần accountId.

Nếu bạn bỏ trống → API sẽ báo lỗi “accountId missing”.

DOCUSIGN_BASE_PATH = https://demo.docusign.net
Là gì:

Đây là Base URI của API DocuSign.

demo là môi trường Developer Sandbox.

Môi trường production sẽ là https://www.docusign.net.

Dùng để làm gì:

Xác định endpoint API mà bạn sẽ gọi.

Ví dụ: https://demo.docusign.net/restapi/v2.1/accounts/{accountId}/envelopes

Khi nào cần:

Khi tạo ApiClient trong backend.

Nếu bạn gọi nhầm base path → API sẽ báo lỗi hoặc gọi nhầm server.

DOCUSIGN_USER_ID = cdbafe5a-d889-4c37-8877-71011a89edf7
Là gì:

Đây là GUID của người dùng trong tài khoản DocuSign mà bạn sẽ impersonate qua JWT.

Khi dùng JWT, bạn đang đại diện user này gọi API.

Dùng để làm gì:

Xác định ai là người đang thực hiện thao tác.

Quan trọng với embedded signing: DocuSign cần biết bạn đang tạo envelope thay cho user nào.

Khi nào cần:

Bắt buộc khi dùng JWT Grant.

Không cần nếu dùng Authorization Code Flow (OAuth trực tiếp user login).

DOCUSIGN_INTEGRATION_KEY = d3c33f0b-b5c0-433e-951c-24b33588472d
Là gì:

Đây là ID của ứng dụng bạn tạo trên DocuSign (Integration Key / Client ID).

Mỗi App bạn tạo → một Integration Key.

Dùng để làm gì:

Khi tạo JWT Token, DocuSign cần biết app nào đang request.

Phải khớp với app đã cấu hình trong DocuSign (với scopes: signature, impersonation).

Khi nào cần:

Bắt buộc khi tạo JWT token.

DS_PRIVATE_KEY_PATH = ./config/private.key
Là gì:

Đây là private RSA key bạn tải/được tạo khi tạo app DocuSign.

Dùng để ký JWT token.

Dùng để làm gì:

JWT token yêu cầu digital signature bằng private key để DocuSign xác nhận app hợp lệ.

Khi nào cần:

Bắt buộc khi dùng JWT Grant.

Không dùng khi OAuth Code Flow.

Vì sao JWT Grant quan trọng cho web của bạn:

Bạn muốn người thuê/cho thuê ký trực tiếp trên web → không muốn họ phải tạo tài khoản DocuSign hay login.

Backend có thể tạo token thay mặt người dùng (impersonation) để gọi API DocuSign.

Token JWT có hạn (1 giờ), có thể tự tạo lại khi cần.

2️⃣ Logic hoạt động JWT Grant

Backend giữ Integration Key (Client ID) + RSA Private Key + User ID của DocuSign.

Khi muốn gọi API DocuSign:

Backend tạo JWT token ký bằng Private Key.

JWT gửi tới DocuSign → DocuSign trả access token OAuth 2.0.

Backend dùng access token để gọi API DocuSign: tạo envelope, thêm signer, lấy embedded signing URL…

Token hết hạn → tạo JWT mới → lấy token mới.

Lưu ý: JWT Grant chỉ cần backend, không cần người dùng login.