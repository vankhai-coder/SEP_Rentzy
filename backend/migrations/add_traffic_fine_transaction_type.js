// Migration script to add TRAFFIC_FINE type to transactions table
// Run this script: node migrations/add_traffic_fine_transaction_type.js

import sequelize from '../src/config/db.js';

async function addTrafficFineTransactionType() {
  try {
    console.log('🔄 Adding TRAFFIC_FINE type to transactions table...');
    
    // MySQL không hỗ trợ ALTER ENUM trực tiếp, cần tạo lại cột
    // Kiểm tra xem có dữ liệu không
    const [results] = await sequelize.query(`
      SELECT COUNT(*) as count FROM transactions WHERE type = 'TRAFFIC_FINE'
    `);
    
    if (results[0].count > 0) {
      console.log('ℹ️  TRAFFIC_FINE type already exists in transactions, skipping...');
      process.exit(0);
    }
    
    // Thêm giá trị mới vào ENUM bằng cách modify column
    await sequelize.query(`
      ALTER TABLE \`transactions\` 
      MODIFY COLUMN \`type\` ENUM(
        'DEPOSIT',
        'RENTAL',
        'REFUND',
        'COMPENSATION',
        'PAYOUT',
        'TRAFFIC_FINE'
      ) NOT NULL
    `);
    
    console.log('✅ Successfully added TRAFFIC_FINE type to transactions table!');
    process.exit(0);
  } catch (error) {
    // Nếu ENUM đã có giá trị này, bỏ qua
    if (error.message.includes('Duplicate') || error.message.includes('already exists')) {
      console.log('ℹ️  TRAFFIC_FINE type already exists, skipping...');
      process.exit(0);
    } else {
      console.error('❌ Error adding TRAFFIC_FINE type:', error.message);
      process.exit(1);
    }
  }
}

addTrafficFineTransactionType();

