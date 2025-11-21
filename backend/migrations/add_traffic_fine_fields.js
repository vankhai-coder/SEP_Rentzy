// Migration script to add traffic fine fields to bookings table
// Run this script: node migrations/add_traffic_fine_fields.js

import sequelize from '../src/config/db.js';

async function addTrafficFineFields() {
  try {
    console.log('🔄 Adding traffic fine fields to bookings table...');
    
    await sequelize.query(`
      ALTER TABLE \`bookings\` 
      ADD COLUMN \`traffic_fine_amount\` DECIMAL(12, 2) DEFAULT 0 AFTER \`delivery_fee\`,
      ADD COLUMN \`traffic_fine_paid\` DECIMAL(12, 2) DEFAULT 0 AFTER \`traffic_fine_amount\`,
      ADD COLUMN \`traffic_fine_description\` TEXT NULL AFTER \`traffic_fine_paid\`
    `);
    
    console.log('✅ Successfully added traffic fine fields to bookings table!');
    process.exit(0);
  } catch (error) {
    // Nếu cột đã tồn tại, bỏ qua lỗi
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️  Traffic fine fields already exist, skipping...');
      process.exit(0);
    } else {
      console.error('❌ Error adding traffic fine fields:', error.message);
      process.exit(1);
    }
  }
}

addTrafficFineFields();

