// Migration script to add traffic_fine_images field to bookings table
// Run this script: node migrations/add_traffic_fine_images_field.js

import sequelize from '../src/config/db.js';

async function addTrafficFineImagesField() {
  try {
    console.log('🔄 Adding traffic_fine_images field to bookings table...');
    
    // Kiểm tra xem cột đã tồn tại chưa
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'bookings' 
      AND COLUMN_NAME = 'traffic_fine_images'
    `);
    
    if (results.length > 0) {
      console.log('ℹ️  traffic_fine_images field already exists, skipping...');
      process.exit(0);
    }
    
    await sequelize.query(`
      ALTER TABLE \`bookings\` 
      ADD COLUMN \`traffic_fine_images\` TEXT NULL AFTER \`traffic_fine_description\`
    `);
    
    console.log('✅ Successfully added traffic_fine_images field to bookings table!');
    process.exit(0);
  } catch (error) {
    // Nếu cột đã tồn tại, bỏ qua lỗi
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️  traffic_fine_images field already exists, skipping...');
      process.exit(0);
    } else {
      console.error('❌ Error adding traffic_fine_images field:', error.message);
      process.exit(1);
    }
  }
}

addTrafficFineImagesField();

