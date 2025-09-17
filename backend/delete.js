import db from './src/models/index.js'

(async () => {
  try {
    await db.sequelize.getQueryInterface().dropTable('user_vouchers');
    console.log("Dropped table user_vouchers");

    await db.sequelize.getQueryInterface().dropTable('vouchers');
    console.log("Dropped table vouchers");
  } catch (error) {
    console.error(error);
  }
})();
