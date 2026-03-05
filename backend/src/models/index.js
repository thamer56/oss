const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id_user: { type: String, required: true, unique: true },
    nom: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true },
    division_id: { type: String },
    projet_id: { type: String },
    password: { type: String, required: true },
    is_active: { type: Boolean, default: true },
    must_change_password: { type: Boolean, default: true }
}, { timestamps: true });

const documentSchema = new mongoose.Schema({
    id: String,
    filename: String,
    url: String,
    uploadDate: { type: Date, default: Date.now },
    size: Number
});

const projectSchema = new mongoose.Schema({
    id_projet: { type: String, required: true, unique: true },
    nom_projet: { type: String, required: true },
    acronyme: { type: String, required: true },
    division_id: { type: String, required: true },
    chef_projet_id: { type: String },
    etat: { type: String, required: true },
    annee_debut: { type: Number },
    annee_fin: { type: Number },
    budget_total: { type: Number, default: 0 },
    budget_depense: { type: Number, default: 0 },
    avancement: { type: String, default: "0%" },
    theme_principal: { type: String },
    beneficiaires_pays: { type: String },
    partenaires_financiers: { type: String },
    description: { type: String },
    documents: [documentSchema],
    tasks: { type: Array, default: [] }
}, { timestamps: true });

// NOTE: Reverting the collections mapping to the legacy structure because Atlas DB still has them swapped.
// User -> 'projets', Project -> 'users'
const User = mongoose.model('User', userSchema, 'projets');
const Project = mongoose.model('Project', projectSchema, 'users');

module.exports = {
    User,
    Project
};