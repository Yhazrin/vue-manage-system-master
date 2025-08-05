import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

export const pool = mysql.createPool({
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT),
    user:     process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log('Connecting to DB:', process.env.DB_NAME);