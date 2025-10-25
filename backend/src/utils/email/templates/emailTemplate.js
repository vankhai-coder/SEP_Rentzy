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
          <div class="success-icon">✓</div>
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
            <span class="detail-label">Xe thuê:</span>
            <span class="detail-value">${vehicleName}</span>
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
            <span class="detail-label">Mã booking:</span>
            <span class="detail-value">#${bookingId}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Xe cho thuê:</span>
            <span class="detail-value">${vehicleName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Người thuê:</span>
            <span class="detail-value">${renterName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Loại thanh toán:</span>
            <span class="detail-value">${paymentType}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Số tiền thanh toán được:</span>
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
