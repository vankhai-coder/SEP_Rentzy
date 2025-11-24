// Migration script to create traffic_fine_requests table
// Run this script: node migrations/add_traffic_fine_requests_table.js

import sequelize from '../src/config/db.js';

async function createTrafficFineRequestsTable() {
  try {
    console.log('🔄 Creating traffic_fine_requests table...');
    
    // Kiểm tra xem bảng đã tồn tại chưa
    const [results] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'traffic_fine_requests'
    `);
    
    if (results.length > 0) {
      console.log('ℹ️  traffic_fine_requests table already exists, skipping...');
      process.exit(0);
    }
    
    await sequelize.query(`
      CREATE TABLE \`traffic_fine_requests\` (
        \`request_id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`booking_id\` BIGINT UNSIGNED NOT NULL,
        \`owner_id\` BIGINT UNSIGNED NOT NULL,
        \`amount\` DECIMAL(12, 2) NOT NULL,
        \`description\` TEXT NULL,
        \`images\` TEXT NULL,
        \`status\` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        \`rejection_reason\` TEXT NULL,
        \`reviewed_by\` BIGINT UNSIGNED NULL,
        \`reviewed_at\` DATETIME NULL,
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`request_id\`),
        INDEX \`idx_booking_id\` (\`booking_id\`),
        INDEX \`idx_owner_id\` (\`owner_id\`),
        INDEX \`idx_status\` (\`status\`),
        INDEX \`idx_created_at\` (\`created_at\`),
        FOREIGN KEY (\`booking_id\`) REFERENCES \`bookings\`(\`booking_id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`owner_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`reviewed_by\`) REFERENCES \`users\`(\`user_id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    console.log('✅ Successfully created traffic_fine_requests table!');
    process.exit(0);
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️  traffic_fine_requests table already exists, skipping...');
      process.exit(0);
    } else {
      console.error('❌ Error creating traffic_fine_requests table:', error.message);
      process.exit(1);
    }
  }
}

createTrafficFineRequestsTable();

