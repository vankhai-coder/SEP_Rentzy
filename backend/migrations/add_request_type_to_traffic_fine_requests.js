// Migration script to add request_type field to traffic_fine_requests table
// Run this script: node migrations/add_request_type_to_traffic_fine_requests.js

import sequelize from '../src/config/db.js';

async function addRequestTypeField() {
  try {
    console.log('🔄 Adding request_type field to traffic_fine_requests table...');
    
    // Kiểm tra xem field đã tồn tại chưa
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'traffic_fine_requests'
      AND COLUMN_NAME = 'request_type'
    `);
    
    if (results.length > 0) {
      console.log('ℹ️  request_type field already exists, skipping...');
      process.exit(0);
    }
    
    // Thêm field request_type
    await sequelize.query(`
      ALTER TABLE \`traffic_fine_requests\` 
      ADD COLUMN \`request_type\` ENUM('add', 'delete') DEFAULT 'add' AFTER \`owner_id\`
    `);
    
    // Thêm field deletion_reason
    await sequelize.query(`
      ALTER TABLE \`traffic_fine_requests\` 
      ADD COLUMN \`deletion_reason\` TEXT NULL AFTER \`rejection_reason\`
    `);
    
    // Cập nhật amount để cho phép NULL (cho request xóa)
    await sequelize.query(`
      ALTER TABLE \`traffic_fine_requests\` 
      MODIFY COLUMN \`amount\` DECIMAL(12, 2) NULL
    `);
    
    console.log('✅ Successfully added request_type and deletion_reason fields to traffic_fine_requests table!');
    process.exit(0);
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️  request_type field already exists, skipping...');
      process.exit(0);
    } else {
      console.error('❌ Error adding request_type field:', error.message);
      process.exit(1);
    }
  }
}

addRequestTypeField();

