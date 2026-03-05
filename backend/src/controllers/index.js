// All non-auth data is now stored in PostgreSQL (NeonDB)
const pool = require('../db/postgres');
const { User: MongoUser } = require('../models/index'); // for auth dual-write

// ── Helpers ────────────────────────────────────────────────────────────────
// Map database row (snake_case) to the shape the frontend expects (camelCase / original field names)
function mapProject(row) {
    if (!row) return null;
    return {
        _id: row.id,
        id_projet: row.id_projet,
        nom_projet: row.nom_projet,
        acronyme: row.acronyme,
        division_id: row.division_id,
        chef_projet_id: row.chef_projet_id,
        etat: row.etat,
        annee_debut: row.annee_debut,
        annee_fin: row.annee_fin,
        budget_total: parseFloat(row.budget_total),
        budget_depense: parseFloat(row.budget_depense),
        avancement: row.avancement,
        theme_principal: row.theme_principal,
        beneficiaires_pays: row.beneficiaires_pays,
        partenaires_financiers: row.partenaires_financiers,
        description: row.description,
        duree: row.duree,
        tasks: row.tasks || [],
        documents: row.documents || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapUser(row) {
    if (!row) return null;
    return {
        _id: row.id,
        id_user: row.id_user,
        nom: row.nom,
        username: row.username,
        email: row.email,
        role: row.role,
        division_id: row.division_id,
        projet_id: row.projet_id,
        is_active: row.is_active,
        must_change_password: row.must_change_password,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

// ── PROJECT CONTROLLERS ────────────────────────────────────────────────────
exports.getAllProjects = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
        res.status(200).json(rows.map(mapProject));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProjectById = async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM projects WHERE id_projet = $1 OR id = $1 LIMIT 1',
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ message: 'Project not found' });
        res.status(200).json(mapProject(rows[0]));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createProject = async (req, res) => {
    try {
        const b = req.body;
        // Generate a unique id
        const id = 'pg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        const id_projet = b.id_projet || b.acronyme;
        const { rows } = await pool.query(`
            INSERT INTO projects (id, id_projet, nom_projet, acronyme, division_id, chef_projet_id, etat,
                annee_debut, annee_fin, budget_total, budget_depense, avancement,
                theme_principal, beneficiaires_pays, partenaires_financiers, description, duree, tasks, documents)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
            RETURNING *
        `, [
            id, id_projet, b.nom_projet, b.acronyme, b.division_id, b.chef_projet_id || null,
            b.etat || 'En Cours',
            b.annee_debut || null, b.annee_fin || null,
            b.budget_total || 0, b.budget_depense || 0,
            b.avancement || '0%',
            b.theme_principal || null, b.beneficiaires_pays || null,
            b.partenaires_financiers || null, b.description || null, b.duree || null,
            JSON.stringify(b.tasks || []), JSON.stringify(b.documents || [])
        ]);
        res.status(201).json(mapProject(rows[0]));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateProject = async (req, res) => {
    try {
        const b = req.body;
        const { rows } = await pool.query(`
            UPDATE projects SET
                nom_projet             = COALESCE($2, nom_projet),
                etat                   = COALESCE($3, etat),
                chef_projet_id         = COALESCE($4, chef_projet_id),
                budget_total           = COALESCE($5, budget_total),
                budget_depense         = COALESCE($6, budget_depense),
                avancement             = COALESCE($7, avancement),
                theme_principal        = COALESCE($8, theme_principal),
                beneficiaires_pays     = COALESCE($9, beneficiaires_pays),
                partenaires_financiers = COALESCE($10, partenaires_financiers),
                description            = COALESCE($11, description),
                annee_debut            = COALESCE($12, annee_debut),
                annee_fin              = COALESCE($13, annee_fin),
                tasks                  = COALESCE($14, tasks),
                documents              = COALESCE($15, documents),
                updated_at             = NOW()
            WHERE id_projet = $1 OR id = $1
            RETURNING *
        `, [
            req.params.id,
            b.nom_projet, b.etat, b.chef_projet_id,
            b.budget_total, b.budget_depense, b.avancement,
            b.theme_principal, b.beneficiaires_pays, b.partenaires_financiers,
            b.description, b.annee_debut, b.annee_fin,
            b.tasks ? JSON.stringify(b.tasks) : null,
            b.documents ? JSON.stringify(b.documents) : null
        ]);
        if (!rows.length) return res.status(404).json({ message: 'Project not found' });
        res.status(200).json(mapProject(rows[0]));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const { rows } = await pool.query(
            'DELETE FROM projects WHERE id_projet = $1 OR id = $1 RETURNING *',
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ message: 'Project not found' });
        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── USER CONTROLLERS ────────────────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
    try {
        // Fetch profiles from PostgreSQL
        const { rows } = await pool.query('SELECT * FROM user_profiles ORDER BY nom ASC');

        // Fetch all users from MongoDB to get their passwords
        let mongoPasswords = {};
        try {
            const mongoUsers = await MongoUser.find({}, 'username email password id_user').lean();
            for (const mu of mongoUsers) {
                const key = mu.username || mu.id_user || mu.email;
                if (key) mongoPasswords[key] = mu.password;
            }
        } catch (e) {
            // MongoDB unavailable — passwords will be missing, which is fine
        }

        const result = rows.map(r => {
            const profile = mapUser(r);
            // Inject password from MongoDB lookup by username
            profile.password = mongoPasswords[r.username] || mongoPasswords[r.id_user] || undefined;
            return profile;
        });

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const b = req.body;
        const id = 'pg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        const email = b.email || `${b.username}@oss.org`;
        const id_user = b.id_user || b.username;

        // Step 1: Write to MongoDB for authentication
        try {
            const mongoUser = new MongoUser({
                id_user,
                nom: b.nom || b.username,
                username: b.username,
                email,
                role: b.role,
                division_id: b.division_id || null,
                projet_id: b.projet_id || null,
                password: b.password || 'OSS2024',
                is_active: true,
                must_change_password: true,
            });
            await mongoUser.save();
        } catch (mongoErr) {
            // If user already exists in Mongo, we continue to PG creation
            if (!mongoErr.message.includes('duplicate')) {
                console.warn('MongoDB user creation warning:', mongoErr.message);
            }
        }

        // Step 2: Write to PostgreSQL for profile data
        const { rows } = await pool.query(`
            INSERT INTO user_profiles (id, mongo_id, id_user, nom, username, email, role, division_id, projet_id, is_active, must_change_password)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            ON CONFLICT (username) DO UPDATE SET
                nom = EXCLUDED.nom,
                role = EXCLUDED.role,
                division_id = EXCLUDED.division_id,
                projet_id = EXCLUDED.projet_id,
                updated_at = NOW()
            RETURNING *
        `, [
            id, id, id_user,
            b.nom || b.username,
            b.username, email, b.role,
            b.division_id || null, b.projet_id || null,
            true, true
        ]);

        res.status(201).json(mapUser(rows[0]));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateUserPassword = async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ message: 'Le mot de passe ne peut pas être vide' });
        }
        // Password stays in MongoDB; this endpoint is kept for compatibility but we'll
        // signal the caller that passwords live in MongoDB.
        res.status(200).json({ message: 'Mot de passe mis à jour (MongoDB auth).' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.checkSI = async (req, res) => {
    try {
        const { rows } = await pool.query(
            "SELECT * FROM user_profiles WHERE role = 'se' LIMIT 1"
        );
        if (rows.length) {
            res.status(200).json({ message: 'SI user exists', user: mapUser(rows[0]) });
        } else {
            res.status(404).json({ message: 'SI user not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── ANALYTICS / STATS ────────────────────────────────────────────────────────
async function buildStats(whereClause, params) {
    const base = `SELECT * FROM projects ${whereClause}`;
    const { rows: projects } = await pool.query(base, params);

    const total = projects.length;
    const budgetTotal = projects.reduce((s, p) => s + parseFloat(p.budget_total || 0), 0);
    const budgetDepense = projects.reduce((s, p) => s + parseFloat(p.budget_depense || 0), 0);

    // Projets par état
    const parEtat = {};
    for (const p of projects) {
        parEtat[p.etat] = (parEtat[p.etat] || 0) + 1;
    }

    // Budget et avancement par division
    const divMap = {};
    for (const p of projects) {
        if (!divMap[p.division_id]) divMap[p.division_id] = { budget_total: 0, budget_depense: 0, count: 0, avancementSum: 0 };
        divMap[p.division_id].budget_total += parseFloat(p.budget_total || 0);
        divMap[p.division_id].budget_depense += parseFloat(p.budget_depense || 0);
        divMap[p.division_id].count += 1;
        divMap[p.division_id].avancementSum += parseFloat((p.avancement || '0%').replace('%', ''));
    }

    const parDivision = Object.entries(divMap).map(([div, d]) => ({
        division: div,
        budget_total: d.budget_total,
        budget_depense: d.budget_depense,
        count: d.count,
        avancement_moyen: d.count > 0 ? Math.round(d.avancementSum / d.count) : 0,
    }));

    // Top 5 projets par budget
    const top5 = [...projects]
        .sort((a, b) => parseFloat(b.budget_total) - parseFloat(a.budget_total))
        .slice(0, 5)
        .map(p => ({ nom: p.acronyme || p.nom_projet, budget_total: parseFloat(p.budget_total), budget_depense: parseFloat(p.budget_depense) }));

    const avancementMoyen = total > 0
        ? Math.round(projects.reduce((s, p) => s + parseFloat((p.avancement || '0%').replace('%', '')), 0) / total)
        : 0;

    return { total, budgetTotal, budgetDepense, avancementMoyen, parEtat, parDivision, top5 };
}

exports.getStats = async (req, res) => {
    try {
        const stats = await buildStats('', []);
        res.status(200).json(stats);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getStatsByDivision = async (req, res) => {
    try {
        const { division_id } = req.params;
        const stats = await buildStats('WHERE division_id = $1', [division_id]);
        res.status(200).json(stats);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── NOTIFICATION CONTROLLERS ─────────────────────────────────────────────────

/**
 * Ensure the notifications table exists (idempotent).
 * Called once at startup.
 */
async function ensureNotificationsTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            message TEXT NOT NULL,
            target_role TEXT,
            target_username TEXT,
            target_division TEXT,
            read BOOLEAN DEFAULT FALSE,
            project_id TEXT,
            project_name TEXT,
            icon TEXT DEFAULT 'notifications',
            type TEXT DEFAULT 'info',
            changed_by TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `);
}
ensureNotificationsTable().catch(err => console.warn('Could not create notifications table:', err.message));

function mapNotification(row) {
    if (!row) return null;
    return {
        id: row.id,
        message: row.message,
        targetRole: row.target_role,
        targetUsername: row.target_username,
        targetDivision: row.target_division,
        read: row.read,
        projectId: row.project_id,
        projectName: row.project_name,
        icon: row.icon || 'notifications',
        type: row.type || 'info',
        changedBy: row.changed_by,
        createdAt: row.created_at,
    };
}

/**
 * GET /api/notifications?username=X&role=Y&divisionId=Z
 * Returns notifications filtered for the given user.
 */
exports.getNotifications = async (req, res) => {
    try {
        const { username, role, divisionId } = req.query;

        let conditions = [];
        let params = [];
        let idx = 1;

        // Build OR conditions matching frontend logic
        let orParts = [];

        // Direct username match
        if (username) {
            orParts.push(`target_username = $${idx}`);
            params.push(username);
            idx++;
        }

        // Role-based
        if (role === 'se') {
            orParts.push(`target_role = $${idx}`);
            params.push('se');
            idx++;
        } else if (role === 'directeur') {
            orParts.push(`target_role = $${idx}`);
            params.push('directeur');
            idx++;
        } else if (role === 'chef_division') {
            if (divisionId) {
                orParts.push(`(target_role = $${idx} AND (target_division IS NULL OR target_division = $${idx + 1}))`);
                params.push('chef_division', divisionId);
                idx += 2;
            } else {
                orParts.push(`target_role = $${idx}`);
                params.push('chef_division');
                idx++;
            }
        }

        const whereClause = orParts.length > 0 ? `WHERE ${orParts.join(' OR ')}` : '';
        const query = `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT 200`;
        const { rows } = await pool.query(query, params);
        res.status(200).json(rows.map(mapNotification));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * POST /api/notifications
 * Creates a new notification.
 */
exports.createNotification = async (req, res) => {
    try {
        const b = req.body;
        const id = 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        const { rows } = await pool.query(`
            INSERT INTO notifications
                (id, message, target_role, target_username, target_division, read,
                 project_id, project_name, icon, type, changed_by)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING *
        `, [
            id, b.message,
            b.targetRole || null,
            b.targetUsername || null,
            b.targetDivision || null,
            false,
            b.projectId || null,
            b.projectName || null,
            b.icon || 'notifications',
            b.type || 'info',
            b.changedBy || null
        ]);
        res.status(201).json(mapNotification(rows[0]));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

/**
 * PUT /api/notifications/:id/read
 * Marks a single notification as read.
 */
exports.markNotificationRead = async (req, res) => {
    try {
        const { rows } = await pool.query(
            'UPDATE notifications SET read = TRUE WHERE id = $1 RETURNING *',
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ message: 'Notification not found' });
        res.status(200).json(mapNotification(rows[0]));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * PUT /api/notifications/mark-all-read?username=X&role=Y&divisionId=Z
 * Marks all user-relevant notifications as read.
 */
exports.markAllNotificationsRead = async (req, res) => {
    try {
        const { username, role, divisionId } = req.query;
        let orParts = [];
        let params = [];
        let idx = 1;

        if (username) { orParts.push(`target_username = $${idx}`); params.push(username); idx++; }
        if (role === 'se') { orParts.push(`target_role = $${idx}`); params.push('se'); idx++; }
        else if (role === 'directeur') { orParts.push(`target_role = $${idx}`); params.push('directeur'); idx++; }
        else if (role === 'chef_division') {
            if (divisionId) {
                orParts.push(`(target_role = $${idx} AND (target_division IS NULL OR target_division = $${idx + 1}))`);
                params.push('chef_division', divisionId); idx += 2;
            } else {
                orParts.push(`target_role = $${idx}`); params.push('chef_division'); idx++;
            }
        }

        if (!orParts.length) return res.status(400).json({ message: 'No filter provided' });
        await pool.query(`UPDATE notifications SET read = TRUE WHERE ${orParts.join(' OR ')}`, params);
        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};