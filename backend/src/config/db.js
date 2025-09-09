import { Sequelize } from "sequelize";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function initSequelize() {
  // Step 1: Connect without DB and create if not exists
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
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
      port: process.env.DB_PORT,
      dialect: "mysql",
      logging: false,
      dialectOptions: {
        charset: "utf8mb4",
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
      `✅ Connected to ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME} as ${process.env.DB_USER}`
    );
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
  }

  return sequelize;
}

const sequelize = await initSequelize();

export default sequelize;
