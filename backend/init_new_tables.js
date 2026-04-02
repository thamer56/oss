const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_duimIW20HxZv@ep-muddy-morning-ali2brzi-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function createTables() {
    try {
        console.log("Creating new tables...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS project_kpis (
                id SERIAL PRIMARY KEY,
                project_id TEXT,
                indicator TEXT,
                indicator_desc TEXT,
                baseline TEXT,
                target TEXT,
                achievements TEXT,
                gaps TEXT,
                way_forward TEXT,
                comment TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS trainings (
                id SERIAL PRIMARY KEY,
                project_id TEXT,
                title TEXT,
                category TEXT,
                sub_category TEXT,
                mode TEXT,
                start_date TEXT,
                end_date TEXT,
                venue TEXT,
                participant_count INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS budget_consumptions (
                id SERIAL PRIMARY KEY,
                project_id TEXT,
                partner_name TEXT,
                budget_item TEXT,
                allocated_budget DOUBLE PRECISION,
                consumed_budget DOUBLE PRECISION,
                year INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS project_events (
                id SERIAL PRIMARY KEY,
                project_id TEXT,
                title TEXT,
                event_date TEXT,
                decision TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log("Tables created successfully.");
    } catch (e) {
        console.error("Error creating tables:", e);
    } finally {
        pool.end();
    }
}

createTables();
