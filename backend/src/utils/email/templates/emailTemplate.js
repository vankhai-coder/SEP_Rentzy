export const verifyEmailTemplate = (verifyLink) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Verify Your Email</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          padding: 30px;
        }
        h2 {
          color: #333333;
        }
        p {
          color: #555555;
          font-size: 15px;
          line-height: 1.6;
        }
        .button {
          display: inline-block;
        margin: 20px 0;
        padding: 12px 20px;
        background-color: #2563eb;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
        }
        .button:hover {
          background: #15803d;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #888888;
        }
      </style>
    </head>
    <body>
      <div class="container">
       <h2>Xác Minh Email</h2>
<p>Xin chào,</p>
<p>Vui lòng xác minh địa chỉ email của bạn bằng cách nhấn vào nút bên dưới:</p>
<a href="${verifyLink}" class="button">Xác Minh Email</a>
<p>Nếu bạn không tạo tài khoản, bạn có thể bỏ qua email này một cách an toàn.</p>
<div class="footer">
  <p>© ${new Date().getFullYear()} Rentzy. Mọi quyền được bảo lưu.</p>
</div>
      </div>
    </body>
  </html>
  `;
};

export const resetPasswordTemplate = (resetLink, username = "bạn") => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Reset Your Password</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
      }
      .container {
        background-color: #ffffff;
        max-width: 600px;
        margin: 40px auto;
        border-radius: 8px;
        padding: 20px 30px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      }
      h2 {
        color: #333333;
      }
      p {
        font-size: 15px;
        color: #555555;
        line-height: 1.5;
      }
      .btn {
        display: inline-block;
        margin: 20px 0;
        padding: 12px 20px;
        background-color: #2563eb;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
      }
      .footer {
        margin-top: 30px;
        font-size: 13px;
        color: #777777;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
     <h2>Xin chào ${username},</h2>
<p>Bạn vừa yêu cầu đặt lại mật khẩu của mình. Nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
<p>
  <a class="btn" href="${resetLink}" target="_blank">Đặt Lại Mật Khẩu</a>
</p>
<p>Nếu bạn không gửi yêu cầu này, bạn có thể bỏ qua email này một cách an toàn.</p>
<div class="footer">
  <p>© ${new Date().getFullYear()} Rentzy. Mọi quyền được bảo lưu.</p>
</div>

    </div>
  </body>
  </html>
  `;
};

export const paymentSuccessTemplateForRenter = (
  bookingId,
  paymentType,
  amount,
  vehicleName
) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Thanh toán thành công</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          padding: 30px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .success-icon {
          width: 60px;
          height: 60px;
          background: #10b981;
          border-radius: 50%;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
        }
        h2 {
          color: #333333;
          margin: 0;
        }
        .payment-details {
          background: #f8fafc;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
          border-bottom: none;
          font-weight: bold;
          color: #10b981;
        }
        .detail-label {
          color: #64748b;
        }
        .detail-value {
          color: #334155;
          font-weight: 500;
        }
        p {
          color: #555555;
          font-size: 15px;
          line-height: 1.6;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #888888;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Thanh toán thành công!</h2>
        </div>
        
        <p>Xin chào,</p>
        <p>Thanh toán ${paymentType} của bạn đã được xử lý thành công.</p>
        
        <div class="payment-details">
          <div class="detail-row">
            <span class="detail-label">Mã booking:</span>
            <span class="detail-value">#${bookingId}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">Loại thanh toán:</span>
            <span class="detail-value">${paymentType}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Số tiền:</span>
            <span class="detail-value">${amount.toLocaleString(
    "vi-VN"
  )} VNĐ</span>
          </div>
        </div>
        
        <p>Cảm ơn bạn đã sử dụng dịch vụ của Rentzy. Chúc bạn có chuyến đi an toàn và vui vẻ!</p>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Rentzy. Mọi quyền được bảo lưu.</p>
        </div>
      </div>
    </body>
  </html>
  `;
};

export const paymentSuccessTemplateForOwner = (
  bookingId,
  paymentType,
  amount,
  vehicleName,
  renterName
) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Nhận được thanh toán</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          padding: 30px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .money-icon {
          width: 60px;
          height: 60px;
          background: #3b82f6;
          border-radius: 50%;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
        }
        h2 {
          color: #333333;
          margin: 0;
        }
        .payment-details {
          background: #f8fafc;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
          border-bottom: none;
          font-weight: bold;
          color: #3b82f6;
        }
        .detail-label {
          color: #64748b;
        }
        .detail-value {
          color: #334155;
          font-weight: 500;
        }
        p {
          color: #555555;
          font-size: 15px;
          line-height: 1.6;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #888888;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Nhận được thanh toán!</h2>
        </div>
        
        <p>Xin chào,</p>
        <p>Bạn vừa nhận được thanh toán ${paymentType} cho xe của mình.</p>
        
        <div class="payment-details">
          <div class="detail-row">
            <span class="detail-label">Mã booking: </span>
            <span class="detail-value">#${bookingId}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Người thuê: </span>
            <span class="detail-value">${renterName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Loại thanh toán: </span>
            <span class="detail-value">${paymentType}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Số tiền thanh toán được: </span>
            <span class="detail-value">${amount.toLocaleString(
    "vi-VN"
  )} VNĐ</span>
          </div>
        </div>
        
        <p>Tiền sẽ được chuyển vào tài khoản của bạn theo quy trình thanh toán của Rentzy.</p>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Rentzy. Mọi quyền được bảo lưu.</p>
        </div>
      </div>
    </body>
  </html>
  `;
};

// ========= New: DocuSign Signing OTP & Notifications =========
export const signingOtpTemplate = (otp, bookingId) => {
  return `
  <div style="font-family: Arial, sans-serif; line-height:1.6;">
    <h2>Mã xác thực ký hợp đồng</h2>
    <p>Bạn đang yêu cầu mở giao diện ký hợp đồng thuê xe${bookingId ? ` #${bookingId}` : ""}.</p>
    <p>Mã OTP gồm 6 chữ số của bạn là:</p>
    <div style="font-size:24px;font-weight:bold;letter-spacing:4px;">${otp}</div>
    <p>Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã cho bất kỳ ai.</p>
  </div>
  `;
};

export const signingConfirmationTemplate = ({ signerName, bookingId, signedAt }) => {
  return `
  <div style="font-family: Arial, sans-serif; line-height:1.6;">
    <h2>Xác nhận đã ký hợp đồng</h2>
    <p>Xin chào ${signerName || "Bạn"},</p>
    <p>Bạn đã ký thành công hợp đồng thuê xe${bookingId ? ` #${bookingId}` : ""}.</p>
    <p>Thời gian ký: <strong>${signedAt}</strong></p>
  </div>
  `;
};

export const otherPartyNotificationTemplate = ({ otherName, bookingId, signerName, signedAt }) => {
  return `
  <div style="font-family: Arial, sans-serif; line-height:1.6;">
    <h2>Thông báo: Bên kia đã ký hợp đồng</h2>
    <p>Xin chào ${otherName || "Bạn"},</p>
    <p>${signerName || "Người ký"} đã ký hợp đồng thuê xe${bookingId ? ` #${bookingId}` : ""}.</p>
    <p>Thời gian ký: <strong>${signedAt}</strong></p>
    <p>Vui lòng truy cập hệ thống để tiếp tục ký (nếu chưa ký).</p>
  </div>
  `;
};
// template for owner approval notification email
export const ownerApprovalNotificationTemplate = (frontendURL) => {
  const escapeHTML = (str = "") =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");


  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Owner Approval Notification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          padding: 30px;
        }
        h2 {
          color: #333333;
        }
        p {
          color: #555555;
          font-size: 15px;
          line-height: 1.6;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #888888;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Thông báo phê duyệt chủ xe</h2>
        <p>Xin chào</p>
        <p>Yêu cầu trở thành chủ xe của bạn đã được phê duyệt.</p>
        <p>Bạn có thể đăng nhập vào bảng điều khiển chủ xe của mình <a href="${frontendURL}/logout" target="_blank">tại đây</a></p>
        <p>Cảm ơn bạn đã sử dụng dịch vụ của Rentzy.</p>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Rentzy. Mọi quyền được bảo lưu.</p>
        </div>
      </div>
    </body>
  </html>
  `;
};

// template for owner rejection notification email
export const ownerRejectionNotificationTemplate = (reasonRejected) => {
  const escapeHTML = (str = "") =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Owner Rejection Notification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          padding: 30px;
        }
        h2 {
          color: #333333;
        }
        p {
          color: #555555;
          font-size: 15px;
          line-height: 1.6;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #888888;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Thông báo từ chối yêu cầu trở thành chủ xe</h2>

        <p>Xin chào </p>

        <p>Rất tiếc, yêu cầu trở thành chủ xe của bạn đã bị <strong>từ chối</strong>.</p>

        <p><strong>Lý do từ chối:</strong> ${escapeHTML(reasonRejected)}</p>

        <p>Nếu bạn có bất kỳ thắc mắc nào, hãy liên hệ với bộ phận hỗ trợ của chúng tôi.</p>

        <p>Cảm ơn bạn đã sử dụng dịch vụ của Rentzy.</p>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Rentzy. Mọi quyền được bảo lưu.</p>
        </div>
      </div>
    </body>
  </html>
  `;
};

// template for ban/unban notification email : 
export const banUnbanNotificationTemplate = (isBanned) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Account Status Notification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          padding: 30px;
        }
        h2 {
          color: #333333;
        }
        p {
          color: #555555;
          font-size: 15px;
          line-height: 1.6;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #888888;
        } 
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Thông báo trạng thái tài khoản</h2>
        <p>Xin chào,</p>
        <p>
          Tài khoản của bạn đã bị ${isBanned ? "khóa" : "mở khóa"} bởi quản trị viên.
        </p>
        <p>
          Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi.
        </p>
        <p>Cảm ơn bạn đã sử dụng dịch vụ của Rentzy.</p>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Rentzy. Mọi quyền được bảo lưu.</p>
        </div>
      </div>
    </body>
  </html>
  `;
}

// template for change password success notification email :
export const changePasswordSuccessTemplate = () => {
  return `
  <!DOCTYPE html>
  <html lang="vi">
    <head>
      <meta charset="UTF-8" />
      <title>Thông báo đổi mật khẩu</title>
      <style>
        body {
          font-family: Arial, Helvetica, sans-serif;
          background-color: #f2f2f2;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.08);
        }
        h2 {
          color: #111827;
          margin-bottom: 16px;
        }
        p {
          color: #374151;
          font-size: 15px;
          line-height: 1.6;
          margin: 8px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>🔐 Xác nhận thay đổi mật khẩu</h2>

        <p>Xin chào,</p>

        <p>
          Mật khẩu tài khoản Rentzy của bạn đã được thay đổi thành công.
        </p>

        <p>
          Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ ngay với đội ngũ hỗ trợ của chúng tôi để đảm bảo an toàn cho tài khoản.
        </p>

        <p>
          Cảm ơn bạn đã tin tưởng và sử dụng Rentzy.
        </p>

        <div class="footer">
          © ${new Date().getFullYear()} Rentzy — Tất cả các quyền được bảo lưu.
        </div>
      </div>
    </body>
  </html>
  `;
};

export const vehicleApprovalNotificationTemplate = ({
  ownerName = "",
  vehicleModel = "",
  licensePlate = "",
  dashboardLink = "",
  detailsText = "",
}) => {
  const safe = (v = "") => String(v || "");
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Xe đã được duyệt</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f9fafb; margin:0; padding:0; }
        .container { max-width:600px; margin:40px auto; background:#ffffff; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.08); padding:28px; }
        h2 { color:#111827; margin:0 0 12px; }
        p { color:#374151; font-size:15px; line-height:1.6; margin:8px 0; }
        .card { background:#f3f4f6; border-radius:8px; padding:16px; margin:16px 0; }
        .row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #e5e7eb; }
        .row:last-child { border-bottom:none; }
        .label { color:#6b7280; }
        .value { color:#111827; font-weight:600; }
        .btn { display:inline-block; margin-top:16px; padding:12px 18px; background:#2563eb; color:#ffffff !important; text-decoration:none; border-radius:8px; font-weight:600; }
        .footer { margin-top:22px; font-size:12px; color:#9ca3af; text-align:center; }
        .details { background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:12px; margin-top:12px; white-space:pre-line; color:#111827; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Xe của bạn đã được duyệt</h2>
        <p>Xin chào ${safe(ownerName)},</p>
        <p>Xe của bạn đã được duyệt và sẵn sàng để cho thuê trên Rentzy.</p>
        <div class="card">
          <div class="row">
            <span class="label">Mẫu xe</span>
            <span class="value">${safe(vehicleModel)}</span>
          </div>
          <div class="row">
            <span class="label">Biển số</span>
            <span class="value">${safe(licensePlate)}</span>
          </div>
          <div class="row">
            <span class="label">Trạng thái</span>
            <span class="value">Đã duyệt</span>
          </div>
        </div>
        ${detailsText ? `<div class="details">${safe(detailsText)}</div>` : ""}
        ${dashboardLink ? `<a class="btn" href="${safe(dashboardLink)}" target="_blank">Quản lý xe</a>` : ""}
        <p>Cảm ơn bạn đã tin tưởng sử dụng Rentzy.</p>
        <div class="footer">© ${new Date().getFullYear()} Rentzy. Mọi quyền được bảo lưu.</div>
      </div>
    </body>
  </html>
  `;
};

export const vehicleRejectionNotificationTemplate = ({
  ownerName = "",
  vehicleModel = "",
  licensePlate = "",
  dashboardLink = "",
  reason = "",
  detailsText = "",
}) => {
  const safe = (v = "") => String(v || "");
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Xe bị từ chối</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f9fafb; margin:0; padding:0; }
        .container { max-width:600px; margin:40px auto; background:#ffffff; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.08); padding:28px; }
        h2 { color:#b91c1c; margin:0 0 12px; }
        p { color:#374151; font-size:15px; line-height:1.6; margin:8px 0; }
        .card { background:#fef2f2; border:1px solid #fee2e2; border-radius:8px; padding:16px; margin:16px 0; }
        .row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #fee2e2; }
        .row:last-child { border-bottom:none; }
        .label { color:#6b7280; }
        .value { color:#111827; font-weight:600; }
        .reason { background:#fff7ed; border:1px solid #ffedd5; border-radius:8px; padding:12px; margin-top:12px; color:#7c2d12; }
        .btn { display:inline-block; margin-top:16px; padding:12px 18px; background:#2563eb; color:#ffffff !important; text-decoration:none; border-radius:8px; font-weight:600; }
        .footer { margin-top:22px; font-size:12px; color:#9ca3af; text-align:center; }
        .details { background:#fff7ed; border:1px solid #ffedd5; border-radius:8px; padding:12px; margin-top:12px; white-space:pre-line; color:#7c2d12; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Xe của bạn đã bị từ chối</h2>
        <p>Xin chào ${safe(ownerName)},</p>
        <p>Rất tiếc, xe của bạn chưa đáp ứng yêu cầu duyệt trên Rentzy.</p>
        <div class="card">
          <div class="row">
            <span class="label">Mẫu xe</span>
            <span class="value">${safe(vehicleModel)}</span>
          </div>
          <div class="row">
            <span class="label">Biển số</span>
            <span class="value">${safe(licensePlate)}</span>
          </div>
          <div class="row">
            <span class="label">Trạng thái</span>
            <span class="value">Bị từ chối</span>
          </div>
        </div>
        ${reason ? `<div class="reason"><strong>Lý do:</strong> ${safe(reason)}</div>` : ""}
        ${detailsText ? `<div class="details">${safe(detailsText)}</div>` : ""}
        ${dashboardLink ? `<a class="btn" href="${safe(dashboardLink)}" target="_blank">Quản lý xe</a>` : ""}
        <p>Bạn có thể cập nhật lại thông tin và gửi yêu cầu duyệt lần nữa.</p>
        <div class="footer">© ${new Date().getFullYear()} Rentzy. Mọi quyền được bảo lưu.</div>
      </div>
    </body>
  </html>
  `;
};
