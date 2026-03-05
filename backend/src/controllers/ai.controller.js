const { GoogleGenAI } = require("@google/genai");

// The client gets the API key from the environment variable GEMINI_API_KEY
const ai = new GoogleGenAI({});

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

        const prompt = `Tu es l'assistant IA de l'Observatoire du Sahara et du Sahel (OSS).
L'utilisateur avec qui tu parles possède le rôle "${roleStr}" et appartient à la division "${divisionStr}".
RÈGLE DE SÉCURITÉ CRITIQUE : Si l'utilisateur demande des informations sur des projets ou stratégies, tu dois te limiter UNIQUEMENT à sa propre division ("${divisionStr}"). S'il demande des informations sur une AUTRE division (exemple: il est dans 'Eau' et demande pour 'Terre'), explique-lui poliment qu'il n'a pas les droits pour accéder aux projets des autres divisions.
RÈGLE DE LANGUE : Tu dois OBLIGATOIREMENT répondre en français uniquement, peu importe la langue utilisée par l'utilisateur.

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
