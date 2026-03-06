// PostgreSQL connection using pg
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://admin_oss:oss_admin_2024@ep-young-waterfall-a2z5zsqs.eu-central-1.aws.neon.tech/oss_db?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

module.exports = pool;
