const { GoogleGenAI } = require("@google/genai");
const pool = require('../db/postgres');

// The client gets the API key from the environment variable GEMINI_API_KEY
// Fallback to a dummy key to prevent server crash if not provided in environment
const apiKey = process.env.GEMINI_API_KEY || 'dummy_key_to_prevent_crash';
const ai = new GoogleGenAI({ apiKey });

exports.generateTasks = async (req, res) => {
    const { description } = req.body;

    if (!description || description.trim().length === 0) {
        return res.status(400).json({ error: 'La description du projet est requise.' });
    }

    try {
        const prompt = `Tu es un expert en gestion de projets de développement environnemental pour l'OSS (Observatoire du Sahara et du Sahel).

En te basant sur la description de projet suivante, génère une liste de tâches structurées et réalistes pour ce projet.

RÈGLE DE LANGUE : Tu dois OBLIGATOIREMENT répondre en français uniquement.

Description du projet:
${description}

Réponds UNIQUEMENT avec un tableau JSON valide (sans markdown, sans balises de code, juste le JSON brut), dans ce format exact:
[
  {
    "title": "Titre clair de la tâche",
    "estimatedBudget": 50000
  }
]

Génère entre 5 et 8 tâches logiques, avec des budgets estimés en USD cohérents avec la description. Les tâches doivent couvrir toutes les phases du projet: préparation, mise en oeuvre, suivi, clôture.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const text = response.text.trim();

        // Clean up potential markdown code blocks if model wraps them
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        let parsedTasks;
        try {
            parsedTasks = JSON.parse(cleaned);
        } catch (parseErr) {
            console.error('Failed to parse Gemini response:', cleaned);
            return res.status(500).json({ error: 'Réponse IA invalide. Veuillez réessayer.' });
        }

        const tasks = parsedTasks.map((t, i) => ({
            id: 'ai_task_' + (i + 1),
            title: t.title || `Tâche ${i + 1}`,
            completed: false,
            estimatedBudget: typeof t.estimatedBudget === 'number' ? t.estimatedBudget : 0
        }));

        return res.json({ tasks });
    } catch (err) {
        console.error('Gemini API error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la génération IA: ' + err.message });
    }
};

exports.chat = async (req, res) => {
    const { message, context } = req.body;
    if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message requis.' });
    }
    
    try {
        const roleStr = context?.role || 'Collaborateur';
        const divisionStr = context?.division || 'Toutes';

        let projects = [];
        try {
            const roleL = roleStr.toLowerCase();
            const isAdmin = ['se', 'directeur', 'superadmin'].includes(roleL);
            if (isAdmin || divisionStr === 'Toutes' || divisionStr === 'ALL') {
                const { rows } = await pool.query('SELECT nom_projet, acronyme, etat, budget_total, budget_depense, avancement, chef_projet_id, division_id FROM projects LIMIT 50');
                projects = rows;
            } else if (divisionStr) {
                const { rows } = await pool.query('SELECT nom_projet, acronyme, etat, budget_total, budget_depense, avancement, chef_projet_id, division_id FROM projects WHERE division_id = $1 LIMIT 50', [divisionStr]);
                projects = rows;
            }
        } catch (dbErr) {
            console.error('Error fetching context projects', dbErr.message);
        }

        const projectData = projects.length > 0
            ? `\n\nBase de données interne des projets actuellement accessibles pour cet utilisateur (format JSON) :\n${JSON.stringify(projects)}\nTu vas utiliser ces données réelles pour répondre avec précision (par exemple pour donner le solde du budget, le taux d'avancement, le responsable, l'état, ou la région du projet le plus proche). N'invente jamais de data.`
            : `\n\nAucune donnée de projet accessible.`;

        const prompt = `Tu es l'assistant IA de l'Observatoire du Sahara et du Sahel (OSS).
L'utilisateur avec qui tu parles possède le rôle "${roleStr}" et appartient à la division "${divisionStr}".
RÈGLE DE SÉCURITÉ CRITIQUE : Si l'utilisateur demande des informations sur des projets ou stratégies, tu dois te limiter UNIQUEMENT à sa propre division ("${divisionStr}"). S'il demande des informations sur une AUTRE division (exemple: il est dans 'Eau' et demande pour 'Terre'), explique-lui poliment qu'il n'a pas les droits pour accéder aux projets des autres divisions.
RÈGLE DE LANGUE : Tu dois OBLIGATOIREMENT répondre en français uniquement, peu importe la langue utilisée par l'utilisateur.${projectData}

Voici son message :
"${message}"`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const text = response.text.trim();

        return res.json({ response: text });
    } catch (err) {
        console.error('Gemini API error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la génération IA: ' + err.message });
    }
};
