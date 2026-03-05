const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function reassignPg() {
    try {
        await pool.query('BEGIN');
        
        const divisions = ['D01', 'D02', 'D03', 'D04'];
        
        for (const div of divisions) {
            // Get all projects for this division ordered by ID
            const { rows: projects } = await pool.query(
                `SELECT id_projet FROM projects WHERE division_id = $1 ORDER BY id_projet ASC`,
                [div]
            );
            
            // Get all chef de projets from user_profiles
            const { rows: chefs } = await pool.query(
                `SELECT id_user FROM user_profiles WHERE division_id = $1 AND role = 'chef_projet' ORDER BY username ASC`,
                [div]
            );
            
            if (projects.length === 0 || chefs.length === 0) continue;
            
            // Assign round-robin
            for (let i = 0; i < projects.length; i++) {
                const projId = projects[i].id_projet;
                const chefId = chefs[i % chefs.length].id_user;
                
                await pool.query(
                    `UPDATE projects SET chef_projet_id = $1 WHERE id_projet = $2`,
                    [chefId, projId]
                );
                console.log(`Updated PG project ${projId} -> ${chefId}`);
            }
        }
        
        await pool.query('COMMIT');
        console.log('Successfully reassigned all PostgreSQL projects uniformly!');
    } catch (e) {
        await pool.query('ROLLBACK');
        console.error('Error in PG script:', e);
    } finally {
        await pool.end();
    }
}

reassignPg();
