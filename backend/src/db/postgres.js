// PostgreSQL connection using pg
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_duimIW20HxZv@ep-muddy-morning-ali2brzi-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: { rejectUnauthorized: false }
});

module.exports = pool;
