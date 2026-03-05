const express = require("express");
const router = express.Router();
const { User } = require("../models/index");
const pool = require("../db/postgres");

// Login route
// 1. Authenticate against MongoDB (username/password)
// 2. Fetch full profile (role, division, etc.) from PostgreSQL
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        // Step 1: Find user in MongoDB (auth store)
        const mongoUser = await User.findOne({
            $or: [{ email: email }, { username: email }]
        });

        if (!mongoUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Plaintext password comparison (no hashing in current system)
        if (mongoUser.password !== password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Step 2: Fetch enriched profile from PostgreSQL
        const { rows } = await pool.query(
            `SELECT * FROM user_profiles
             WHERE mongo_id = $1 OR id_user = $2 OR username = $3
             LIMIT 1`,
            [mongoUser._id.toString(), mongoUser.id_user || mongoUser.username, mongoUser.username]
        );

        let profile;
        if (rows.length) {
            const r = rows[0];
            profile = {
                _id: r.id,
                mongo_id: r.mongo_id,
                id_user: r.id_user,
                nom: r.nom,
                username: r.username,
                email: r.email,
                role: r.role,
                division_id: r.division_id,
                projet_id: r.projet_id,
                is_active: r.is_active,
                must_change_password: r.must_change_password,
            };
        } else {
            // Fallback: use MongoDB data if no PG profile found
            const safe = mongoUser.toObject();
            delete safe.password;
            profile = safe;
        }

        res.status(200).json({ message: "Login successful", user: profile });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
