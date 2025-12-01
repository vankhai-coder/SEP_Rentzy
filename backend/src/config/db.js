import { Sequelize } from "sequelize";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function initSequelize() {
  // Step 1: Connect without DB and create if not exists
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectTimeout: 60000, // 60 seconds
    acquireTimeout: 60000,
    timeout: 60000,
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`
  );
  console.log(`📦 Database '${process.env.DB_NAME}' is ready.`);

  // Step 2: Connect Sequelize to the database
  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: "mysql",
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 60000, // 60 seconds
        idle: 10000,
      },
      dialectOptions: {
        charset: "utf8mb4",
        connectTimeout: 60000, // 60 seconds
      },
      define: {
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
        timestamps: true,   // createdAt, updatedAt
      },
    }
  );

  try {
    await sequelize.authenticate();
    console.log(
      `✅ Connected to ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME} as ${process.env.DB_USER}`
    );
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    console.error("💡 Please check:");
    console.error("   1. MySQL server is running");
    console.error("   2. DB_HOST, DB_PORT, DB_USER, DB_PASSWORD are correct in .env");
    console.error("   3. Firewall/network allows connection to MySQL");
    throw error; // Re-throw to prevent app from starting with broken DB
  }

  return sequelize;
}

const sequelize = await initSequelize();

export default sequelize;
