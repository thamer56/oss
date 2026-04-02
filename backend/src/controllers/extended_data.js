const pool = require('../db/postgres');

exports.getKpisByProject = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM project_kpis WHERE project_id = $1 ORDER BY created_at ASC', [req.params.id]);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getTrainingsByProject = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM trainings WHERE project_id = $1 ORDER BY start_date ASC', [req.params.id]);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getBudgetByProject = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM budget_consumptions WHERE project_id = $1 ORDER BY partner_name ASC', [req.params.id]);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getEventsByProject = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM project_events WHERE project_id = $1 ORDER BY event_date ASC', [req.params.id]);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
