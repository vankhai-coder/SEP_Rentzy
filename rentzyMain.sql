-- =========================================================
-- R E N T Z Y - FULL DATABASE SCHEMA (IMPROVED VERSION)
-- =========================================================
-- Tạo cơ sở dữ liệu nếu chưa tồn tại
CREATE DATABASE IF NOT EXISTS rentzy
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

-- Sử dụng cơ sở dữ liệu rentzy
USE rentzy;

-- =========================
-- USERS (Người dùng)
-- =========================
-- Lưu trữ thông tin tất cả người dùng: người thuê, người cho thuê và quản trị viên
CREATE TABLE users (
  user_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT, -- ID người dùng duy nhất
  full_name VARCHAR(100) NOT NULL,                    -- Tên đầy đủ
  email VARCHAR(150) NOT NULL UNIQUE,                 -- Email, dùng để đăng nhập và liên hệ
  email_verified BOOLEAN DEFAULT FALSE,               -- Trạng thái xác minh email
  phone_number VARCHAR(20),                           -- Số điện thoại
  phone_verified BOOLEAN DEFAULT FALSE,               -- Trạng thái xác minh số điện thoại
  password_hash VARCHAR(255),                         -- Hash mật khẩu (NULL nếu đăng nhập bằng Google)
  google_id VARCHAR(255),                             -- ID Google (NULL nếu đăng nhập bằng email)
  avatar_url VARCHAR(255),                            -- URL ảnh đại diện
  role ENUM('renter','owner','admin') NOT NULL DEFAULT 'renter', -- Vai trò của người dùng
  driver_license_number VARCHAR(50),                  -- Số bằng lái xe
  driver_license_name  VARCHAR(100),                  -- Tên trên bằng lái
  driver_license_dob   DATE,                          -- Ngày sinh trên bằng lái
  driver_license_image_url VARCHAR(255),              -- URL ảnh bằng lái
  driver_license_status ENUM('pending','approved','rejected') DEFAULT 'pending', -- Trạng thái xác minh bằng lái
  national_id_number VARCHAR(50),                     -- Số CCCD/CMND
  national_id_name   VARCHAR(100),                    -- Tên trên CCCD/CMND
  national_id_dob    DATE,                            -- Ngày sinh trên CCCD/CMND
  national_id_image_url VARCHAR(255),                 -- URL ảnh CCCD/CMND
  national_id_status ENUM('pending','approved','rejected') DEFAULT 'pending', -- Trạng thái xác minh CCCD/CMND
  points INT DEFAULT 0,                               -- Tổng điểm thưởng hiện tại của người dùng
  is_active BOOLEAN DEFAULT TRUE,                     -- Trạng thái hoạt động của tài khoản
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     -- Thời gian tạo tài khoản
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Thời gian cập nhật cuối cùng
) ENGINE=InnoDB;

-- Các chỉ mục giúp truy vấn nhanh hơn
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email_verified ON users(email_verified);

-- =========================
-- BANKS (Tài khoản ngân hàng)
-- =========================
-- Lưu trữ thông tin tài khoản ngân hàng của người dùng (chủ yếu là owner để nhận tiền)
CREATE TABLE banks (
  bank_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT, -- ID tài khoản ngân hàng duy nhất
  user_id BIGINT UNSIGNED NOT NULL,                   -- ID người dùng sở hữu tài khoản này
  bank_name VARCHAR(100) NOT NULL,                    -- Tên ngân hàng
  account_number VARCHAR(50) NOT NULL,                -- Số tài khoản
  account_holder_name VARCHAR(100) NOT NULL,          -- Tên chủ tài khoản
  qr_code_url VARCHAR(255),                           -- ảnh qr chuyển khoản
  account_type ENUM('primary','secondary') NOT NULL DEFAULT 'primary', -- Loại tài khoản (chính hay phụ)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_banks_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE -- Khóa ngoại liên kết với bảng users
) ENGINE=InnoDB;

CREATE INDEX idx_banks_user ON banks(user_id);

-- =========================
-- BRANDS (Thương hiệu xe)
-- =========================
-- Bảng chứa danh sách các thương hiệu xe (ví dụ: Toyota, Honda, Yamaha)
CREATE TABLE brands (
  brand_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,   -- ID thương hiệu duy nhất
  name VARCHAR(100) NOT NULL UNIQUE,               -- Tên thương hiệu
  country VARCHAR(100),                            -- Quốc gia của thương hiệu
  logo_url VARCHAR(255),                           -- URL logo
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================
-- VEHICLES (Phương tiện - Gộp Cars và Motorbikes)
-- =========================
-- Lưu trữ thông tin chi tiết về tất cả phương tiện cho thuê (xe ô tô và xe máy)
CREATE TABLE vehicles (
  vehicle_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT, -- ID phương tiện duy nhất
  owner_id BIGINT UNSIGNED NOT NULL,                     -- ID người cho thuê (chủ xe)
  brand_id INT UNSIGNED NOT NULL,                        -- ID thương hiệu của xe
  vehicle_type ENUM('car','motorbike') NOT NULL,         -- Loại phương tiện: xe ô tô hoặc xe máy
  model VARCHAR(100) NOT NULL,                           -- Tên mẫu xe
  year YEAR NOT NULL,                                    -- Năm sản xuất
  price_per_day DECIMAL(10,2) NOT NULL,                  -- Giá thuê mỗi ngày
  description TEXT,                                      -- Mô tả chi tiết về xe
  main_image_url VARCHAR(255) NOT NULL,                  -- URL ảnh chính của xe
  extra_images JSON,                                     -- URL các ảnh phụ khác (định dạng JSON)
  features JSON,                                         -- Các tính năng của xe (định dạng JSON)
  location VARCHAR(255) NOT NULL,                        -- Địa điểm nhận/trả xe
  
  
  -- Các trường dành riêng cho xe ô tô
  transmission ENUM('manual','automatic'),               -- Loại hộp số (chỉ cho car)
  seats TINYINT UNSIGNED,                               -- Số chỗ ngồi (chỉ cho car)
  fuel_type ENUM('petrol','diesel','electric','hybrid'), -- Loại nhiên liệu (chỉ cho car)
  
  -- Các trường dành riêng cho xe máy
  bike_type ENUM('scooter','manual','clutch','electric'), -- Loại xe máy (chỉ cho motorbike)
  engine_capacity INT UNSIGNED,                          -- Dung tích xi-lanh cc (chỉ cho motorbike)

  -- Trạng thái duyệt xe  bởi amdin
  approvalStatus  ENUM('none', 'pending', 'approved', 'rejected') DEFAULT 'none', -- Trạng thái duyệt xe
  --  Trạng thái xe: available, blocked
  status ENUM('available', 'blocked') DEFAULT 'available', -- Trạng thái xe
  rent_count INT UNSIGNED DEFAULT 0,                     -- Số lần đã được thuê
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_vehicles_owner
    FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE, -- Khóa ngoại liên kết với chủ xe
  CONSTRAINT fk_vehicles_brand
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id) ON DELETE RESTRICT, -- Khóa ngoại liên kết với thương hiệu
    
  -- Ràng buộc kiểm tra dữ liệu theo loại xe
  CONSTRAINT chk_car_fields 
    CHECK (
      (vehicle_type = 'car' AND transmission IS NOT NULL AND seats IS NOT NULL AND fuel_type IS NOT NULL AND bike_type IS NULL AND engine_capacity IS NULL)
      OR 
      (vehicle_type = 'motorbike' AND bike_type IS NOT NULL AND transmission IS NULL AND seats IS NULL AND fuel_type IS NULL)
    )
) ENGINE=InnoDB;

CREATE INDEX idx_vehicles_owner ON vehicles(owner_id);
CREATE INDEX idx_vehicles_brand ON vehicles(brand_id);
CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_location ON vehicles(location);

-- =========================
-- VOUCHERS (Mã giảm giá/Voucher)
-- =========================
-- Bảng chứa thông tin các mã giảm giá do admin tạo
-- Luồng hoạt động: Admin tạo voucher -> Người dùng sử dụng voucher trực tiếp khi đặt xe
-- Mỗi booking có thể áp dụng 1 voucher thông qua trường voucher_code
DROP TABLE IF EXISTS vouchers;

CREATE TABLE vouchers (
  voucher_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT, -- ID voucher duy nhất
  created_by BIGINT UNSIGNED NOT NULL,                   -- ID admin tạo voucher
  code VARCHAR(50) NOT NULL UNIQUE,                      -- Mã voucher
  title VARCHAR(120) NOT NULL,                           -- Tiêu đề voucher
  description TEXT,                                      -- Mô tả chi tiết
  discount_type ENUM('PERCENT','AMOUNT') NOT NULL,       -- Loại giảm giá (phần trăm hoặc số tiền)
  discount_value DECIMAL(10,2) NOT NULL,                 -- Giá trị giảm giá
  min_order_amount DECIMAL(12,2) DEFAULT 0,              -- Giá trị đơn hàng tối thiểu để áp dụng
  max_discount DECIMAL(12,2) DEFAULT NULL,               -- Giới hạn giảm giá tối đa (nếu loại là PERCENT)
  total_quantity INT UNSIGNED DEFAULT 0,                 -- Tổng số lượng voucher
  remaining_quantity INT UNSIGNED DEFAULT 0,             -- Số lượng voucher còn lại
  valid_from DATETIME NOT NULL,                          -- Ngày bắt đầu có hiệu lực
  valid_to DATETIME NOT NULL,                            -- Ngày hết hạn
  is_active BOOLEAN DEFAULT TRUE,                        -- Trạng thái kích hoạt
  image_url VARCHAR(255),                                -- Ảnh voucher
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_vouchers_creator
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE RESTRICT,
  
  CONSTRAINT chk_voucher_quantity
    CHECK (remaining_quantity <= total_quantity),
  
  CONSTRAINT chk_voucher_dates
    CHECK (valid_to > valid_from)
) ENGINE=InnoDB;

CREATE INDEX idx_vouchers_active ON vouchers(is_active, valid_to);
CREATE INDEX idx_vouchers_creator ON vouchers(created_by);
CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_vouchers_dates ON vouchers(valid_from, valid_to);

CREATE TABLE notifications (
  notification_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT, -- ID thông báo duy nhất
  user_id BIGINT UNSIGNED NOT NULL,                           -- ID người dùng nhận thông báo
  title VARCHAR(255) NOT NULL,                                -- Tiêu đề thông báo
  content TEXT NOT NULL,                                      -- Nội dung thông báo
  is_read BOOLEAN DEFAULT FALSE,                              -- Trạng thái đã đọc hay chưa
  type ENUM('system','rental','promotion','alert') DEFAULT 'system', -- Loại thông báo
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- =========================
-- BOOKINGS (Đặt xe - Bảng chính đã được tối giản)
-- =========================
-- Chỉ chứa thông tin cơ bản về đơn đặt xe
CREATE TABLE bookings (
  booking_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,    -- ID đơn đặt xe
  renter_id BIGINT UNSIGNED NOT NULL,                       -- ID người thuê xe
  vehicle_id BIGINT UNSIGNED NOT NULL,                      -- ID của xe
  
  start_date DATETIME NOT NULL,                             -- Ngày bắt đầu thuê
  end_date   DATETIME NOT NULL,                             -- Ngày kết thúc thuê
  total_days INT UNSIGNED NOT NULL,                         -- Tổng số ngày thuê
  total_cost DECIMAL(12,2) NOT NULL,                        -- Tổng tiền thuê xe (chưa giảm giá)
  discount_amount DECIMAL(12,2) DEFAULT 0,                  -- Số tiền được giảm
  delivery_fee DECIMAL(12,2) DEFAULT 0,                     -- Phí giao nhận xe
  total_amount DECIMAL(12,2) NOT NULL,                      -- Tổng số tiền cuối cùng phải trả
  total_paid DECIMAL(12,2) DEFAULT 0,                       -- Tổng số tiền đã thanh toán
  
  voucher_code VARCHAR(50),                                 -- Mã voucher đã áp dụng
  points_used INT DEFAULT 0,                                -- Số điểm đã sử dụng
  points_earned INT DEFAULT 0,                              -- Số điểm thưởng kiếm được
  
  order_code BIGINT UNIQUE,                                 -- Mã đơn hàng PayOS
  order_code_remaining BIGINT UNIQUE,                       -- Mã đơn hàng còn lại
  
  status ENUM(
    'pending',
    'deposit_paid', 
    'confirmed',
    'in_progress',
    'completed',
    'cancel_requested',
    'canceled'
  ) DEFAULT 'pending',
  
  pickup_location VARCHAR(255) NOT NULL,                    -- Địa điểm nhận xe
  return_location VARCHAR(255) NOT NULL,                    -- Địa điểm trả xe
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- FOREIGN KEYS
  CONSTRAINT fk_bookings_renter
    FOREIGN KEY (renter_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_vehicle
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_voucher
    FOREIGN KEY (voucher_code) REFERENCES vouchers(code) ON DELETE SET NULL,
    
  -- CONSTRAINTS
  CONSTRAINT chk_booking_dates CHECK (end_date > start_date),
  CONSTRAINT chk_booking_amounts CHECK (total_amount >= 0 AND total_paid >= 0),
  CONSTRAINT chk_booking_days CHECK (total_days > 0)
) ENGINE=InnoDB;

-- Indexes for bookings table
CREATE INDEX idx_bookings_renter ON bookings(renter_id);
CREATE INDEX idx_bookings_vehicle ON bookings(vehicle_id);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX idx_bookings_voucher ON bookings(voucher_code);
CREATE INDEX idx_bookings_created ON bookings(created_at);

-- =========================
-- BOOKING_REVIEWS (Đánh giá đơn đặt xe)
-- =========================
-- Lưu trữ thông tin đánh giá từ cả renter và owner
CREATE TABLE booking_reviews (
  review_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,     -- ID đánh giá duy nhất
  booking_id BIGINT UNSIGNED NOT NULL,                     -- ID đơn đặt xe

  
  rating TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5), -- Điểm đánh giá
  review_title VARCHAR(255),                                -- Tiêu đề đánh giá
  review_content TEXT,                                      -- Nội dung đánh giá
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- FOREIGN KEYS
  CONSTRAINT fk_reviews_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,

    
  -- CONSTRAINTS
  CONSTRAINT uk_booking_reviewer UNIQUE (booking_id)
) ENGINE=InnoDB;

-- INDEXES for booking_reviews
CREATE INDEX idx_reviews_booking ON booking_reviews(booking_id);
CREATE INDEX idx_reviews_rating ON booking_reviews(rating);
CREATE INDEX idx_reviews_created ON booking_reviews(created_at);

-- =========================
-- HANDOVER_CONFIRMATIONS (Bàn giao xác nhận giao nhận xe)
-- =========================
-- Lưu trữ thông tin về việc bàn giao và trả xe
CREATE TABLE handover_confirmations (
  handover_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,   -- ID bàn giao duy nhất
  booking_id BIGINT UNSIGNED NOT NULL UNIQUE,              -- ID đơn đặt xe (1-1 relationship)
  
  -- Thông tin bàn giao xe (pickup)
  owner_handover_confirmed BOOLEAN DEFAULT FALSE,           -- Chủ xe xác nhận bàn giao
  renter_handover_confirmed BOOLEAN DEFAULT FALSE,          -- Người thuê xác nhận bàn giao
  handover_time DATETIME,                                   -- Thời gian bàn giao thực tế
  pre_rental_images JSON,                                   -- Ảnh biên bản bàn giao xe ban đầu
  
  -- Thông tin trả xe (return)
  owner_return_confirmed BOOLEAN DEFAULT FALSE,             -- Chủ xe xác nhận trả xe
  renter_return_confirmed BOOLEAN DEFAULT FALSE,            -- Người thuê xác nhận trả xe
  return_time DATETIME,                                     -- Thời gian trả xe thực tế
  post_rental_images JSON,                                  -- Ảnh biên bản trả xe
  
  -- Thông tin hư hỏng và bồi thường
  damage_reported BOOLEAN DEFAULT FALSE,                    -- Có báo cáo hư hỏng không
  damage_description TEXT,                                  -- Mô tả hư hỏng
  compensation_amount DECIMAL(12,2) DEFAULT 0,              -- Số tiền bồi thường
  compensation_status ENUM('none', 'pending', 'approved', 'rejected', 'paid') DEFAULT 'none',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_handover_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    
  -- CONSTRAINTS
  CONSTRAINT chk_handover_compensation CHECK (compensation_amount >= 0)
) ENGINE=InnoDB;

-- Indexes cho bảng handover_confirmations
CREATE INDEX idx_handover_booking ON handover_confirmations(booking_id);
CREATE INDEX idx_handover_times ON handover_confirmations(handover_time, return_time);
CREATE INDEX idx_handover_damage ON handover_confirmations(damage_reported, compensation_status);

-- =========================
-- RENTAL_CONTRACTS (Hợp đồng thuê xe)
-- =========================
-- Lưu trữ thông tin hợp đồng và chữ ký điện tử
CREATE TABLE rental_contracts (
  contract_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,   -- ID hợp đồng duy nhất
  booking_id BIGINT UNSIGNED NOT NULL UNIQUE,              -- ID đơn đặt xe (1-1 relationship)

  contract_number VARCHAR(50) NOT NULL UNIQUE,             -- Số hợp đồng  
  -- Chữ ký điện tử
  renter_signature VARCHAR(255),                            -- Chữ ký điện tử của người thuê
  owner_signature VARCHAR(255),                             -- Chữ ký điện tử của chủ xe
  renter_signed_at DATETIME,                               -- Thời gian người thuê ký
  owner_signed_at DATETIME,                                -- Thời gian chủ xe ký
  
  -- Trạng thái hợp đồng
  contract_status ENUM('draft', 'pending_signatures', 'signed', 'completed', 'terminated') DEFAULT 'draft',
  
  -- File hợp đồng
  contract_file_url VARCHAR(255),                          -- URL file hợp đồng PDF
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_contract_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Indexes cho bảng rental_contracts
CREATE INDEX idx_contract_booking ON rental_contracts(booking_id);
CREATE INDEX idx_contract_number ON rental_contracts(contract_number);
CREATE INDEX idx_contract_status ON rental_contracts(contract_status);
CREATE INDEX idx_contract_signatures ON rental_contracts(renter_signed_at, owner_signed_at);
CREATE INDEX idx_contract_created ON rental_contracts(created_at);

-- =========================
-- BOOKING_CANCELLATIONS (Hủy chuyến xe có tiền hoàn và trạng thái hoàn)
-- =========================
-- Lưu trữ thông tin về việc hủy đơn và hoàn tiền
CREATE TABLE booking_cancellations (
  cancellation_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT, -- ID hủy đơn duy nhất
  booking_id BIGINT UNSIGNED NOT NULL UNIQUE,                -- ID đơn đặt xe (1-1 relationship)
  
  -- Thông tin hủy đơn
  cancellation_reason TEXT NOT NULL,                         -- Lý do hủy đơn
  cancelled_at DATETIME NOT NULL,                            -- Thời gian đơn bị hủy
  cancel_requested_at DATETIME,                              -- Thời gian yêu cầu hủy đơn
  cancellation_fee DECIMAL(10,2) DEFAULT 0,                  -- Phí hủy đơn

  
  -- Thông tin duyệt hủy
  owner_approved_cancel_at DATETIME,                         -- Thời gian owner duyệt hủy
  admin_approved_cancel_at DATETIME,                         -- Thời gian admin duyệt hủy

  
  -- Thông tin hoàn tiền cho renter
  total_refund_for_renter DECIMAL(12,2) DEFAULT 0,           -- Tổng tiền hoàn cho renter
  refund_status_renter ENUM('none', 'pending', 'approved', 'rejected', 'completed') DEFAULT 'none',
  refund_reason_renter TEXT,                                 -- Lý do hoàn tiền renter
  refund_processed_at_renter DATETIME,                       -- Thời gian xử lý hoàn tiền renter

  
  -- Thông tin hoàn tiền cho owner (nếu renter hủy muộn)
  total_refund_for_owner DECIMAL(12,2) DEFAULT 0,            -- Tổng tiền hoàn cho owner
  refund_status_owner ENUM('none', 'pending', 'approved', 'rejected', 'completed') DEFAULT 'none',
  refund_reason_owner TEXT,                                  -- Lý do hoàn tiền owner
  refund_processed_at_owner DATETIME,                        -- Thời gian xử lý hoàn tiền owner

  
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_cancellation_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
        
  -- CONSTRAINTS
  CONSTRAINT chk_cancellation_refunds CHECK (
    total_refund_for_renter >= 0 AND 
    total_refund_for_owner >= 0 
  )
) ENGINE=InnoDB;

-- Indexes cho bảng booking_cancellations
CREATE INDEX idx_cancellation_booking ON booking_cancellations(booking_id);
CREATE INDEX idx_cancellation_refund_status ON booking_cancellations(refund_status_renter, refund_status_owner);
CREATE INDEX idx_cancellation_created ON booking_cancellations(created_at);

-- =========================
-- OWNER_PAYOUTS (Giải ngân cho chủ xe)
-- =========================
-- Lưu trữ thông tin về việc giải ngân tiền cho chủ xe
CREATE TABLE owner_payouts (
  payout_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,     -- ID giải ngân duy nhất
  booking_id BIGINT UNSIGNED NOT NULL UNIQUE,              -- ID đơn đặt xe (1-1 relationship)
  
  -- Thông tin tài chính
  total_rental_amount DECIMAL(12,2) NOT NULL,              -- Tổng tiền thuê xe
  platform_commission_rate DECIMAL(5,2) NOT NULL,         -- Tỷ lệ hoa hồng platform (%)
  platform_commission_amount DECIMAL(12,2) NOT NULL,      -- Số tiền hoa hồng platform
  owner_payout_amount DECIMAL(12,2) NOT NULL,             -- Số tiền giải ngân cho owner
  
  -- Trạng thái giải ngân
  payout_status ENUM('pending', 'approved', 'rejected', 'completed', 'failed') DEFAULT 'pending',
  payout_method ENUM('bank_transfer', 'momo', 'zalopay', 'cash') DEFAULT 'bank_transfer',
  
  -- Thông tin ngân hàng
  bank_account_id BIGINT UNSIGNED,                        -- ID tài khoản ngân hàng
  bank_name VARCHAR(100),                                 -- Tên ngân hàng
  account_number VARCHAR(50),                             -- Số tài khoản
  account_holder_name VARCHAR(100),                       -- Tên chủ tài khoản
  
  
  -- Thông tin xử lý
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,        -- Thời gian yêu cầu giải ngân
  approved_at DATETIME,                                   -- Thời gian duyệt giải ngân
  approved_by BIGINT UNSIGNED,                            -- ID admin duyệt
  processed_at DATETIME,                                  -- Thời gian xử lý thành công
  processed_by BIGINT UNSIGNED,                           -- ID admin xử lý
  
  -- Thông tin giao dịch
  transaction_reference VARCHAR(100),                     -- Mã tham chiếu giao dịch
  payout_notes TEXT,                                      -- Ghi chú giải ngân
  rejection_reason TEXT,                                  -- Lý do từ chối (nếu có)
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_payout_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
  CONSTRAINT fk_payout_bank_account
    FOREIGN KEY (bank_account_id) REFERENCES banks(bank_id) ON DELETE SET NULL,
  CONSTRAINT fk_payout_approved_by
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL,
  CONSTRAINT fk_payout_processed_by
    FOREIGN KEY (processed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    
  -- CONSTRAINTS
  CONSTRAINT chk_payout_amounts CHECK (
    total_rental_amount >= 0 AND 
    platform_commission_amount >= 0 AND 
    owner_payout_amount >= 0
  ),
  CONSTRAINT chk_payout_commission_rate CHECK (platform_commission_rate >= 0 AND platform_commission_rate <= 100)
 
) ENGINE=InnoDB;

-- Indexes cho bảng owner_payouts
CREATE INDEX idx_payout_booking ON owner_payouts(booking_id);
CREATE INDEX idx_payout_status ON owner_payouts(payout_status);
CREATE INDEX idx_payout_requested ON owner_payouts(requested_at);
CREATE INDEX idx_payout_processed ON owner_payouts(processed_at);
CREATE INDEX idx_payout_method ON owner_payouts(payout_method);

-- =========================
-- POINTS_TRANSACTIONS (Giao dịch điểm)
-- =========================
-- Theo dõi lịch sử tích điểm và tiêu điểm
CREATE TABLE points_transactions (
  transaction_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  transaction_type ENUM('earn','spend','expire','refund') NOT NULL, -- Loại giao dịch
  points_amount INT NOT NULL,                                -- Số điểm (âm nếu tiêu, dương nếu tích)
  balance_after INT NOT NULL,                                -- Số dư điểm sau giao dịch
  reference_type ENUM('booking','voucher','bonus','penalty') NULL, -- Loại tham chiếu
  reference_id BIGINT UNSIGNED NULL,                         -- ID tham chiếu (booking_id, voucher_id, etc.)
  booking_id BIGINT UNSIGNED NULL,                           -- ID booking liên quan (nếu có)
  description VARCHAR(255),                                  -- Mô tả giao dịch
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_points_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_points_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_points_user ON points_transactions(user_id, created_at);
CREATE INDEX idx_points_type ON points_transactions(transaction_type);
CREATE INDEX idx_points_reference ON points_transactions(reference_type, reference_id);
CREATE INDEX idx_points_booking ON points_transactions(booking_id);

-- TRANSACTIONS (Giao dịch tài chính)
-- =========================
-- Ghi lại tất cả các giao dịch tiền ra/vào hệ thống
CREATE TABLE transactions (
  transaction_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT, -- ID giao dịch duy nhất
  booking_id BIGINT UNSIGNED,                                -- ID đơn đặt xe liên quan (có thể NULL)
  from_user_id BIGINT UNSIGNED,                              -- ID người gửi tiền
  to_user_id BIGINT UNSIGNED,                                -- ID người nhận tiền
  amount DECIMAL(12,2) NOT NULL,                             -- Số tiền giao dịch
  type ENUM(                                                 -- Loại giao dịch
    'DEPOSIT',               -- Đặt cọc từ renter
    'RENTAL',                -- Thanh toán tiền thuê từ renter
    'REFUND',                -- Hoàn tiền từ admin cho renter
    'PAYOUT',                -- Thanh toán tiền thuê từ admin cho owner
    'COMPENSATION',          -- Bồi thường từ renter cho owner
    'WITHDRAWAL',            -- Rút tiền từ owner về ngân hàng
    'TOPUP'                  -- Nạp tiền vào tài khoản
  ) NOT NULL,
  status ENUM('PENDING','COMPLETED','FAILED','CANCELLED') DEFAULT 'PENDING', -- Trạng thái giao dịch
  payment_method ENUM('PAYOS','CASH','BANK_TRANSFER','MOMO','VNPAY','ZALOPAY') NOT NULL, -- Phương thức thanh toán
  processed_at DATETIME,                                     -- Thời gian giao dịch hoàn tất
  note TEXT,                                                 -- Ghi chú về giao dịch
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tx_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL,
  CONSTRAINT fk_tx_from_user
    FOREIGN KEY (from_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  CONSTRAINT fk_tx_to_user
    FOREIGN KEY (to_user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_tx_booking ON transactions(booking_id);
CREATE INDEX idx_tx_from_user ON transactions(from_user_id);
CREATE INDEX idx_tx_to_user ON transactions(to_user_id);
CREATE INDEX idx_tx_type_status ON transactions(type, status);

-- =========================
-- FAVORITES (Yêu thích)
-- =========================
-- Lưu trữ danh sách xe yêu thích của người dùng
CREATE TABLE favorites (
  favorite_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT, -- ID duy nhất
  user_id BIGINT UNSIGNED NOT NULL,                       -- ID người dùng
  vehicle_id BIGINT UNSIGNED NOT NULL,                    -- ID phương tiện yêu thích
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_favorites_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_favorites_vehicle
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_vehicle (user_id, vehicle_id)       -- Đảm bảo một user chỉ có thể yêu thích một xe một lần
) ENGINE=InnoDB;

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_vehicle ON favorites(vehicle_id);

-- =========================
-- MESSAGES (Tin nhắn)
-- =========================
-- Hệ thống tin nhắn giữa renter và owner
CREATE TABLE messages (
  message_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,  -- ID tin nhắn duy nhất
  sender_id BIGINT UNSIGNED NOT NULL,                     -- ID người gửi
  receiver_id BIGINT UNSIGNED NOT NULL,                   -- ID người nhận
  content TEXT NOT NULL,                                  -- Nội dung tin nhắn
  message_type ENUM('text','image','file') DEFAULT 'text', -- Loại tin nhắn
  attachment_url VARCHAR(255),                            -- URL file đính kèm (nếu có)
  is_read BOOLEAN DEFAULT FALSE,                          -- Trạng thái đã đọc
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_sender
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_receiver
    FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id, is_read);
