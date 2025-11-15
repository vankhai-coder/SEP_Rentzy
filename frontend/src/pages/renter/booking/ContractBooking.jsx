import React, { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useContractBooking } from "./hooks/useContractBooking";
import "./ContractBooking.scss";

const ContractBooking = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const contractRef = useRef();

  const { booking, loading, error, refreshBooking } =
    useContractBooking(bookingId);

  const handlePrint = () => window.print();
  const handleDownloadPDF = () => window.print();

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString.slice(0, 5);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "0 VNĐ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatFieldValue = (value, defaultText = "........") => {
    if (value === null || value === undefined || value === "")
      return defaultText;
    return value;
  };

  const calculateDuration = () => {
    if (!booking?.startDate || !booking?.endDate) return 0;
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getCurrentDate = () => {
    const now = new Date();
    return {
      day: now.getDate(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
  };

  const currentDate = getCurrentDate();
  const duration = calculateDuration();

  if (loading) {
    return (
      <div className="contract-booking">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải hợp đồng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="contract-booking">
        <div className="error-container">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <div className="error-text">
              <h2>Lỗi tải hợp đồng</h2>
              <p>{error}</p>
              <button onClick={refreshBooking} className="retry-button">
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="contract-booking">
        <div className="not-found-container">
          <div className="not-found-content">
            <div className="not-found-icon">📄</div>
            <div className="not-found-text">
              <h2>Không tìm thấy hợp đồng</h2>
              <p>Hợp đồng không tồn tại hoặc đã bị xóa.</p>
              <button
                onClick={() => navigate("/renter/bookings")}
                className="back-button"
              >
                Quay lại danh sách booking
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contract-booking">
      <div className="contract-header">
        <div className="header-left">
          <button
            onClick={() => navigate("/renter/bookings")}
            className="back-btn"
          >
            ← Quay lại
          </button>
          <h1>Hợp đồng thuê xe ô tô tự lái</h1>
        </div>
        <div className="header-actions">
          <button onClick={refreshBooking} className="refresh-btn">
            🔄 Làm mới
          </button>
          <button onClick={handlePrint} className="print-btn">
            🖨️ In hợp đồng
          </button>
          <button onClick={handleDownloadPDF} className="download-btn">
            📄 Tải PDF
          </button>
        </div>
      </div>

      <div className="contract-booking-container">
        <div className="contract-content" ref={contractRef}>
          <div className="document-header">
            <div className="country-header">
              <div className="country-name">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </div>
              <div className="country-motto">Độc lập – Tự do – Hạnh phúc</div>
            </div>
          </div>

          <div className="contract-introduction">
            <div className="contract-title">HỢP ĐỒNG THUÊ XE Ô TÔ TỰ LÁI</div>
            <div className="contract-number">
              Số: {booking?.booking_id || booking?.id || "……"}/
              {currentDate.year}
            </div>
            <div className="legal-basis">
              (Căn cứ Bộ luật Dân sự năm 2015; Luật Thương mại năm 2005)
            </div>
          </div>

          {/* Thông tin các bên */}
          <div className="party-section">
            <div className="party-title">BÊN CHO THUÊ (Bên A):</div>
            <div className="party-info">
              <div className="info-item">
                <span className="label">Họ và tên:</span>
                <span className="value">
                  {formatFieldValue(
                    booking?.vehicle?.owner?.full_name,
                    "........................................"
                  )}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Năm sinh:</span>
                <span className="value">
                  {formatFieldValue(
                    booking?.vehicle?.owner?.birth_year,
                    "................"
                  )}
                </span>
              </div>
              <div className="info-item">
                <span className="label">CMND/CCCD:</span>
                <span className="value">
                  {formatFieldValue(
                    booking?.vehicle?.owner?.id_number,
                    "...................."
                  )}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Địa chỉ:</span>
                <span className="value">
                  {formatFieldValue(
                    booking?.vehicle?.owner?.address,
                    "..................................................................................."
                  )}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Điện thoại:</span>
                <span className="value">
                  {formatFieldValue(
                    booking?.vehicle?.owner?.phone_number,
                    "...................."
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="party-section">
            <div className="party-title">BÊN THUÊ (Bên B):</div>
            <div className="party-info">
              <div className="info-item">
                <span className="label">Họ và tên:</span>
                <span className="value">
                  {formatFieldValue(
                    booking?.renter?.full_name,
                    "........................................"
                  )}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Năm sinh:</span>
                <span className="value">
                  {formatFieldValue(
                    booking?.renter?.birth_year,
                    "................"
                  )}
                </span>
              </div>
              <div className="info-item">
                <span className="label">CMND/CCCD:</span>
                <span className="value">
                  {formatFieldValue(
                    booking?.renter?.id_number,
                    "...................."
                  )}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Địa chỉ:</span>
                <span className="value">
                  {formatFieldValue(
                    booking?.renter?.address,
                    "..................................................................................."
                  )}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Điện thoại:</span>
                <span className="value">
                  {formatFieldValue(
                    booking?.renter?.phone_number,
                    "...................."
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Thông tin xe */}
          <div className="vehicle-section">
            <div className="section-title">THÔNG TIN XE</div>
            <div className="vehicle-info">
              <div className="info-item">
                <span className="label">Nhãn hiệu:</span>
                <span className="value">
                  {formatFieldValue(booking?.vehicle?.brand_name)}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Model:</span>
                <span className="value">
                  {formatFieldValue(booking?.vehicle?.model)}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Biển số:</span>
                <span className="value">
                  {formatFieldValue(booking?.vehicle?.license_plate)}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Màu sơn:</span>
                <span className="value">
                  {formatFieldValue(booking?.vehicle?.color)}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Số chỗ ngồi:</span>
                <span className="value">
                  {formatFieldValue(booking?.vehicle?.seats)}
                </span>
              </div>
            </div>
          </div>

          {/* ĐIỀU KHOẢN HỢP ĐỒNG */}
          <div className="terms-section">
            <div className="section-title">ĐIỀU KHOẢN HỢP ĐỒNG:</div>

            <div className="article">
              <div className="article-title">Điều 2. Thời hạn thuê xe ô tô</div>
              <div className="article-content">
                <div className="term-item">
                  Thời hạn thuê là …… (……….) kể từ ngày Hợp đồng này được ký
                  kết.
                </div>
                <div className="term-item note">
                  Ghi nhận hệ thống: từ {formatDate(booking?.startDate)}{" "}
                  {formatTime(booking?.startTime)} đến{" "}
                  {formatDate(booking?.endDate)} {formatTime(booking?.endTime)}{" "}
                  (tổng {duration} ngày).
                </div>
              </div>
            </div>

            <div className="article">
              <div className="article-title">Điều 3. Mục đích thuê</div>
              <div className="article-content">
                <div className="term-item">
                  Bên B sử dụng tài sản thuê nêu trên vào mục đích
                  ………………………………….
                </div>
              </div>
            </div>

            <div className="article">
              <div className="article-title">
                Điều 4: Giá thuê và phương thức thanh toán
              </div>
              <div className="article-content">
                <div className="term-item">
                  1. Giá thuê tài sản nêu trên là: ………………VNĐ/…………. (Bằng chữ:
                  ……… đồng trên một ………………………………………………………………………………….).
                </div>
                <div className="term-item">
                  2. Phương thức thanh toán: Thanh toán bằng ………………… và Bên B
                  phải thanh toán cho Bên A số tiền thuê xe ô tô nêu trên vào
                  ngày …………………...
                </div>
                <div className="term-item">
                  3. Việc giao và nhận số tiền nêu trên do hai bên tự thực hiện
                  và chịu trách nhiệm trước pháp luật.
                </div>
                <div className="term-item note">
                  Tham chiếu hệ thống: Tổng thanh toán dự kiến{" "}
                  {formatCurrency(booking?.totalAmount)}.
                </div>
              </div>
            </div>

            <div className="article">
              <div className="article-title">
                Điều 5: Phương thức giao, trả lại tài sản thuê
              </div>
              <div className="article-content">
                <div className="term-item">
                  Hết thời hạn thuê nêu trên, Bên B phải giao trả chiếc xe ô tô
                  trên cho Bên A.
                </div>
              </div>
            </div>

            <div className="article">
              <div className="article-title">
                Điều 6: Nghĩa vụ và quyền của Bên A
              </div>
              <div className="article-content">
                <div className="term-item">
                  1. Bên A có các nghĩa vụ sau đây:
                </div>
                <div className="obligation-item">
                  a) Chuyển giao tài sản cho thuê đúng thỏa thuận ghi trong Hợp
                  đồng;
                </div>
                <div className="obligation-item">
                  b) Bảo đảm giá trị sử dụng của tài sản cho thuê;
                </div>
                <div className="obligation-item">
                  c) Bảo đảm quyền sử dụng tài sản cho Bên B;
                </div>
                <div className="term-item">2. Bên A có quyền sau đây:</div>
                <div className="obligation-item">
                  a) Nhận đủ tiền thuê tài sản theo phương thức đã thỏa thuận;
                </div>
                <div className="obligation-item">
                  b) Nhận lại tài sản thuê khi hết hạn Hợp đồng;
                </div>
                <div className="obligation-item">
                  c) Đơn phương đình chỉ thực hiện Hợp đồng và yêu cầu bồi
                  thường thiệt hại nếu Bên B có một trong các hành vi sau đây:
                </div>
                <div className="obligation-item">
                  - Không trả tiền thuê trong ……… liên tiếp;
                </div>
                <div className="obligation-item">
                  - Sử dụng tài sản thuê không đúng công dụng; mục đích của tài
                  sản;
                </div>
                <div className="obligation-item">
                  - Làm tài sản thuê mất mát, hư hỏng;
                </div>
                <div className="obligation-item">
                  - Sửa chữa, đổi hoặc cho người khác thuê lại mà không có sự
                  đồng ý của Bên A;
                </div>
              </div>
            </div>

            <div className="article">
              <div className="article-title">
                Điều 7: Nghĩa vụ và quyền của Bên B
              </div>
              <div className="article-content">
                <div className="term-item">
                  1. Bên B có các nghĩa vụ sau đây:
                </div>
                <div className="obligation-item">
                  a) Bảo quản tài sản thuê như tài sản của chính mình, không
                  được thay đổi tình trạng tài sản, không được cho thuê lại tài
                  sản nếu không có sự đồng ý của Bên A;
                </div>
                <div className="obligation-item">
                  b) Sử dụng tài sản thuê đúng công dụng, mục đích của tài sản;
                </div>
                <div className="obligation-item">
                  c) Trả đủ tiền thuê tài sản theo phương thức đã thỏa thuận;
                </div>
                <div className="obligation-item">
                  d) Trả lại tài sản thuê đúng thời hạn và phương thức đã thỏa
                  thuận;
                </div>
                <div className="obligation-item">
                  e) Chịu toàn bộ chi phí liên quan đến chiếc xe trong quá trình
                  thuê. Trong quá trình thuê xe mà Bên B gây ra tai nạn, hỏng
                  hóc xe thì Bên B phải có trách nhiệm thông báo ngay cho Bên A
                  và chịu trách nhiệm sửa chữa, phục hồi nguyên trạng xe cho Bên
                  A.
                </div>
                <div className="term-item">2. Bên B có các quyền sau đây:</div>
                <div className="obligation-item">
                  a) Nhận tài sản thuê theo đúng thỏa thuận;
                </div>
                <div className="obligation-item">
                  b) Được sử dụng tài sản thuê theo đúng công dụng, mục đích của
                  tài sản;
                </div>
                <div className="obligation-item">
                  c) Đơn phương đình chỉ thực hiện Hợp đồng thuê tài sản và yêu
                  cầu bồi thường thiệt hại nếu:
                </div>
                <div className="obligation-item">
                  - Bên A chậm giao tài sản theo thỏa thuận gây thiệt hại cho
                  Bên B;
                </div>
                <div className="obligation-item">
                  - Bên A giao tài sản thuê không đúng đắc điểm, tình trạng như
                  mô tả tại Điều 1 Hợp đồng;
                </div>
              </div>
            </div>

            <div className="article">
              <div className="article-title">Điều 8: Cam đoan của các bên</div>
              <div className="article-content">
                <div className="term-item">
                  Bên A và Bên B chịu trách nhiệm trước pháp luật về những lời
                  cam đoan sau đây:
                </div>
                <div className="term-item">1. Bên A cam đoan:</div>
                <div className="obligation-item">
                  - Những thông tin về nhân thân, về chiếc xe ô tô nêu trên này
                  là hoàn toàn đúng sự thật;
                </div>
                <div className="obligation-item">
                  - Không bỏ sót thành viên nào cùng có quyền sở hữu xe ô tô nêu
                  trên để ký Hợp đồng này; Nếu có bất kỳ một khiếu kiện nào của
                  thành viên cùng có quyền sở hữu xe ô tô trên bị bỏ sót thì Bên
                  A ký tên/điểm chỉ trong Hợp đồng này xin hoàn toàn chịu trách
                  nhiệm trước pháp luật, kể cả việc phải mang tài sản chung,
                  riêng của mình để đảm bảo cho trách nhiệm đó;
                </div>
                <div className="obligation-item">
                  - Xe ô tô nêu trên hiện tại thuộc quyền sở hữu, sử dụng hợp
                  pháp của Bên A, không có tranh chấp, không bị ràng buộc d­ưới
                  bất cứ hình thức nào bởi các giao dịch đang tồn tại như: Cầm
                  cố, thế chấp, bảo lãnh, mua bán, trao đổi, tặng cho, cho thuê,
                  cho mượn, góp vốn vào doanh nghiệp hay bất kỳ một quyết định
                  nào của cơ quan nhà n­ước có thẩm quyền nhằm hạn chế quyền
                  định đoạt của Bên A;
                </div>
                <div className="obligation-item">
                  - Việc giao kết Hợp đồng này là hoàn toàn tự nguyện, dứt
                  khoát, không bị lừa dối hoặc ép buộc;
                </div>
                <div className="obligation-item">
                  - Thực hiện đúng và đầy đủ tất cả các thỏa thuận đã ghi trong
                  bản Hợp đồng này;
                </div>
                <div className="term-item">2. Bên B cam đoan:</div>
                <div className="obligation-item">
                  a. Những thông tin pháp nhân, nhân thân đã ghi trong Hợp đồng
                  này là đúng sự thật;
                </div>
                <div className="obligation-item">
                  b. Đã xem xét kỹ, biết rõ về tài sản thuê;
                </div>
                <div className="obligation-item">
                  c. Việc giao kết Hợp đồng này hoàn toàn tự nguyện, không bị
                  lừa dối hoặc ép buộc;
                </div>
                <div className="obligation-item">
                  d. Thực hiện đúng và đầy đủ tất cả các thoả thuận đã ghi trong
                  Hợp đồng này;
                </div>
                <div className="term-item">3. Hai bên cam đoan:</div>
                <div className="obligation-item">
                  - Các bên cam kết mọi giấy tờ về nhân thân và tài sản đều là
                  giấy tờ thật, cấp đúng thẩm quyền, còn nguyên giá trị pháp lý
                  và không bị tẩy xóa, sửa chữa. Nếu sai các bên hoàn toàn chịu
                  trách nhiệm trước pháp luật kể cả việc mang tài sản chung,
                  riêng để đảm bảo cho lời cam đoan trên.
                </div>
                <div className="obligation-item">
                  - Nếu có thắc mắc, khiếu nại, khiếu kiện dẫn đến Hợp đồng vô
                  hiệu (kể cả vô hiệu một phần) thì các bên tự chịu trách nhiệm
                  trước pháp luật.
                </div>
                <div className="obligation-item">
                  - Tại thời điểm ký kết, các bên hoàn toàn minh mẫn, sáng suốt,
                  có đầy đủ năng lực hành vi dân sự, cam đoan đã biết rõ về nhân
                  thân và thông tin về những người có tên trong Hợp đồng này.
                </div>
              </div>
            </div>

            <div className="article">
              <div className="article-title">Điều 9: Điều khoản cuối cùng</div>
              <div className="article-content">
                <div className="term-item">
                  1. Nếu vì một lý do không thể khắc phục được mà một trong hai
                  bên muốn chấm dứt hợp đồng trước thời hạn, thì phải báo cho
                  bên kia biết trước ……. tháng.
                </div>
                <div className="term-item">
                  2. ……. (…….) tháng trước khi hợp đồng này hết hiệu lực, hai
                  bên phải cùng trao đổi việc thanh lý hợp đồng; Nếu hai bên
                  muốn tiếp tục thuê xe ô tô thì sẽ cùng nhau ký tiếp hợp đồng
                  mới hoặc ký phụ lục gia hạn hợp đồng.
                </div>
                <div className="term-item">
                  3. Hợp đồng này có hiệu lực kể từ thời điểm các bên ký kết.
                  Mọi sửa đổi bổ sung phải được cả hai bên lập thành văn bản;
                </div>
                <div className="term-item">
                  4. Trong quá trình thực hiện Hợp đồng mà phát sinh tranh chấp,
                  các bên cùng nhau thương lượng giải quyết trên nguyên tắc tôn
                  trọng quyền lợi của nhau; trong trường hợp không giải quyết
                  được, thì một trong hai bên có quyền khởi kiện để yêu cầu toà
                  án nhân dân có thẩm quyền giải quyết theo quy định của pháp
                  luật.
                </div>
                <div className="term-item">
                  5. Hai bên đều đã tự đọc lại toàn bộ nội dung của Hợp đồng
                  này, đã hiểu và đồng ý với toàn bộ nội dung ghi trong Hợp
                  đồng, không có điều gì vướng mắc. Bên A, bên B đã tự nguyện ký
                  tên/đóng dấu/điểm chỉ vào Hợp đồng này.
                </div>
                <div className="term-item">
                  Hợp đồng được lập thành … (……) bản có giá trị pháp lý như
                  nhau, mỗi bên giữ …. bản làm bằng chứng.
                </div>
              </div>
            </div>
          </div>

          <div className="signature-section">
            <div className="signature-date">
              Lập tại{" "}
              {formatFieldValue(
                booking?.pickupLocation,
                "............................"
              )}
              , ngày {currentDate.day} tháng {currentDate.month} năm{" "}
              {currentDate.year}
            </div>
            <div className="signature-columns">
              <div className="signature-col">
                <div className="signature-title">BÊN CHO THUÊ</div>
                <div className="signature-note">(ký và ghi rõ họ tên)</div>
                <div className="signature-name">
                  {formatFieldValue(
                    booking?.vehicle?.owner?.full_name,
                    "........................................"
                  )}
                </div>
              </div>
              <div className="signature-col">
                <div className="signature-title">BÊN THUÊ</div>
                <div className="signature-note">(ký và ghi rõ họ tên)</div>
                <div className="signature-name">
                  {formatFieldValue(
                    booking?.renter?.full_name,
                    "........................................"
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractBooking;
