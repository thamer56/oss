const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function reassign() {
    try {
        await pool.query('BEGIN');
        
        // Les 4 divisions
        const divisions = ['D01', 'D02', 'D03', 'D04'];
        
        for (const div of divisions) {
            // Get all projects for this division ordered by ID
            const { rows: projects } = await pool.query(
                'SELECT id_projet FROM projets WHERE division_id = $1 ORDER BY id_projet ASC',
                [div]
            );
            
            // Get all chef de projets for this division ordered by username
            const { rows: chefs } = await pool.query(
                "SELECT id_user FROM users WHERE division_id = $1 AND role = 'chef_projet' ORDER BY username ASC",
                [div]
            );
            
            if (projects.length === 0 || chefs.length === 0) continue;
            
            // Assign round-robin
            for (let i = 0; i < projects.length; i++) {
                const projId = projects[i].id_projet;
                const chefId = chefs[i % chefs.length].id_user;
                
                await pool.query(
                    'UPDATE projets SET chef_projet = $1 WHERE id_projet = $2',
                    [chefId, projId]
                );
                console.log(`Updated project ${projId} -> ${chefId}`);
            }
        }
        
        await pool.query('COMMIT');
        console.log('Successfully reassigned all projects uniformly!');
    } catch (e) {
        await pool.query('ROLLBACK');
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
}

reassign();
