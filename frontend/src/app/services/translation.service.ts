import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';


export type Lang = 'fr' | 'en';

const TRANSLATIONS = {
    fr: {
        // ─── Common / Shared ───────────────────────────────────────────
        appName: 'OSS Portail',
        logout: 'Déconnexion',
        loading: 'Chargement...',
        save: 'Enregistrer',
        cancel: 'Annuler',
        edit: 'Modifier',
        delete: 'Supprimer',
        close: 'Fermer',
        search: 'Rechercher...',
        actions: 'Actions',
        status: 'Statut',
        budget: 'Budget',
        name: 'Nom',
        yes: 'Oui',
        no: 'Non',
        confirm: 'Confirmer',
        back: 'Retour',
        add: 'Ajouter',
        view: 'Voir',
        download: 'Télécharger',
        upload: 'Téléverser',
        noData: 'Aucune donnée disponible.',

        // ─── Navigation ────────────────────────────────────────────────
        menu: 'Menu Principal',
        home: 'Accueil',
        dashboard: 'Tableau de bord',
        projects: 'Projets',
        team: 'Équipe',
        users: 'Personnel',
        manageStaff: 'Gérer Personnel',
        notifications: 'Notifications',
        myProjects: 'Mes Projets',
        myTasks: 'Mes Tâches',
        overview: "Vue d'ensemble",

        // ─── Login ─────────────────────────────────────────────────────
        welcome: 'Bienvenue',
        signInDesc: 'Connectez-vous à votre compte',
        usernameLabel: "Nom d'utilisateur",
        usernamePlaceholder: "Entrez votre nom d'utilisateur",
        passwordLabel: 'Mot de passe',
        forgotPassword: 'Oublié ?',
        signInBtn: 'Se Connecter',
        noAccount: "Vous n'avez pas de compte ?",
        contactSupport: 'Contacter le Support',
        loginError: "Nom d'utilisateur ou mot de passe incorrect",

        // ─── Forgot Password ───────────────────────────────────────────
        forgotPasswordTitle: 'Mot de passe oublié',
        forgotPasswordDesc: 'Entrez votre email pour réinitialiser votre mot de passe',
        emailLabel: 'Adresse email',
        emailPlaceholder: 'Entrez votre email',
        sendLink: 'Envoyer le lien',
        backToLogin: 'Retour à la connexion',

        // ─── Portal ────────────────────────────────────────────────────
        portalTitle: 'Portail OSS',
        portalDesc: 'Sélectionnez votre espace de travail',
        selectRole: 'Sélectionner votre rôle',

        // ─── Super Admin Dashboard ─────────────────────────────────────
        adminMode: 'Admin Mode',
        executiveKPIs: 'Executive KPIs',
        thisQuarter: 'Ce Trimestre',
        totalProjects: 'Total Projets',
        globalBudget: 'Budget Global',
        activeDivisions: 'Divisions Actives',
        totalCoverage: 'Couverture Totale',
        divisionsOverview: 'Aperçu des Divisions',
        projectPipeline: 'Pipeline des Projets',
        recentActivities: 'Activités Récentes',
        projectAcronym: 'Projet / Acronyme',
        axis: 'Axe',
        addProject: 'Ajouter Projet',
        viewProjects: 'Voir les projets',
        globalPriority: 'Priorité Globale',
        resilienceImpact: 'Impact Résilience',
        aquiferManagement: 'Gestion Aquifère',
        soilRestoration: 'Restauration Sols',

        // ─── Director Dashboard ────────────────────────────────────────
        directorTitle: 'Direction Générale',
        activeProjects: 'Projets Actifs',
        atRisk: 'À Risque',
        completed: 'Clôturés',
        totalBudget: 'Budget Total',
        portfolioOverview: 'Vue d\'ensemble du Portfolio',
        strategicAxes: 'Axes Stratégiques',
        projectStatus: 'État des Projets',

        // ─── Division Chief Dashboard ──────────────────────────────────
        divisionChiefTitle: 'Chef de Division',
        myDivision: 'Ma Division',
        divisionProjects: 'Projets de la Division',
        taskManagement: 'Gestion des Tâches',
        reportProgress: 'Rapport de Progression',

        // ─── Project Manager Dashboard ─────────────────────────────────
        projectManagerTitle: 'Chef de Projet',
        tasksProgress: 'Avancement des Tâches',
        completedTasks: 'Tâches Terminées',
        pendingTasks: 'Tâches en Attente',
        taskTitle: 'Titre de la Tâche',
        estimatedBudget: 'Budget Estimé',
        dueDate: 'Date Limite',
        assignedTo: 'Assigné à',
        markComplete: 'Marquer comme terminée',

        // ─── Project Create ────────────────────────────────────────────
        createProject: 'Créer un Projet',
        newProject: 'Nouveau Projet',
        projectName: 'Nom du Projet',
        projectAcronymLabel: 'Acronyme',
        projectDescription: 'Description du Projet',
        projectAxis: 'Axe Thématique',
        projectState: 'État',
        startDate: 'Date de Début',
        endDate: 'Date de Fin',
        responsibleCountries: 'Pays Concernés',
        donor: 'Bailleur',
        projectManager: 'Chef de Projet',
        aiGenerateTasks: 'Générer les Tâches avec IA',
        aiGenerating: 'Génération en cours...',
        aiTasksTitle: 'Tâches Générées par l\'IA',
        addTask: 'Ajouter une Tâche',
        taskName: 'Nom de la Tâche',
        documents: 'Documents',
        submitProject: 'Soumettre le Projet',
        saveDraft: 'Sauvegarder Brouillon',
        required: 'Champ requis',

        // ─── Project Detail ────────────────────────────────────────────
        projectDetail: 'Détail du Projet',
        projectInfo: 'Informations du Projet',
        projectDocs: 'Documents du Projet',
        uploadDoc: 'Téléverser un Document',
        noDocuments: 'Aucun document disponible.',
        deleteConfirm: 'Êtes-vous sûr de vouloir supprimer ?',
        editProject: 'Modifier le Projet',
        deleteProject: 'Supprimer le Projet',
        projectProgress: 'Progression',
        inProgress: 'En Cours',
        delayed: 'En Retard',
        closed: 'Clôturé',
        risk: 'À Risque',
        additionalInfo: 'Informations Complémentaires',
        mainTheme: 'Thème Principal',
        beneficiaryCountries: 'Pays Bénéficiaires',
        financialPartners: 'Partenaires Financiers',
        divisionLabel: 'Division',
        periodLabel: 'Période',

        // ─── Equipe ────────────────────────────────────────────────────
        teamTitle: 'Notre Équipe',
        teamDesc: 'Membres de l\'organisation OSS',
        role: 'Rôle',
        division: 'Division',
        email: 'Email',
        phone: 'Téléphone',
        noTeamMembers: 'Aucun membre trouvé.',

        // ─── User Signup ───────────────────────────────────────────────
        createUser: 'Créer un Compte',
        firstName: 'Prénom',
        lastName: 'Nom de Famille',
        username: "Nom d'Utilisateur",
        password: 'Mot de Passe',
        confirmPassword: 'Confirmer le Mot de Passe',
        jobTitle: 'Titre d\'Emploi',
        selectJobTitle: 'Sélectionner un titre',
        createAccount: 'Créer le Compte',
        userCreated: 'Compte créé avec succès.',
        passwordMismatch: 'Les mots de passe ne correspondent pas.',

        // ─── Chatbot ───────────────────────────────────────────────────
        chatTitle: 'Assistant OSS',
        chatPlaceholder: 'Posez votre question...',
        chatSend: 'Envoyer',
        chatWelcome: "Bonjour ! Je suis l'assistant de l'OSS. Comment puis-je vous aider aujourd'hui ?",
        chatError: 'Désolé, une erreur technique est survenue. Veuillez réessayer.',
        chatLoginRequired: 'Veuillez vous connecter pour utiliser l\'assistant IA.',
    },

    en: {
        // ─── Common / Shared ───────────────────────────────────────────
        appName: 'OSS Portal',
        logout: 'Logout',
        loading: 'Loading...',
        save: 'Save',
        cancel: 'Cancel',
        edit: 'Edit',
        delete: 'Delete',
        close: 'Close',
        search: 'Search...',
        actions: 'Actions',
        status: 'Status',
        budget: 'Budget',
        name: 'Name',
        yes: 'Yes',
        no: 'No',
        confirm: 'Confirm',
        back: 'Back',
        add: 'Add',
        view: 'View',
        download: 'Download',
        upload: 'Upload',
        noData: 'No data available.',

        // ─── Navigation ────────────────────────────────────────────────
        menu: 'Main Menu',
        home: 'Home',
        dashboard: 'Dashboard',
        projects: 'Projects',
        team: 'Team',
        users: 'Staff',
        manageStaff: 'Manage Staff',
        notifications: 'Notifications',
        myProjects: 'My Projects',
        myTasks: 'My Tasks',
        overview: 'Overview',

        // ─── Login ─────────────────────────────────────────────────────
        welcome: 'Welcome',
        signInDesc: 'Sign in to your account',
        usernameLabel: 'Username',
        usernamePlaceholder: 'Enter your username',
        passwordLabel: 'Password',
        forgotPassword: 'Forgot Password?',
        signInBtn: 'Sign In',
        noAccount: "Don't have an account?",
        contactSupport: 'Contact Support',
        loginError: 'Invalid username or password',

        // ─── Forgot Password ───────────────────────────────────────────
        forgotPasswordTitle: 'Forgot Password',
        forgotPasswordDesc: 'Enter your email to reset your password',
        emailLabel: 'Email address',
        emailPlaceholder: 'Enter your email',
        sendLink: 'Send Reset Link',
        backToLogin: 'Back to Login',

        // ─── Portal ────────────────────────────────────────────────────
        portalTitle: 'OSS Portal',
        portalDesc: 'Select your workspace',
        selectRole: 'Select your role',

        // ─── Super Admin Dashboard ─────────────────────────────────────
        adminMode: 'Admin Mode',
        executiveKPIs: 'Executive KPIs',
        thisQuarter: 'This Quarter',
        totalProjects: 'Total Projects',
        globalBudget: 'Global Budget',
        activeDivisions: 'Active Divisions',
        totalCoverage: 'Total Coverage',
        divisionsOverview: 'Divisions Overview',
        projectPipeline: 'Project Pipeline',
        recentActivities: 'Recent Activities',
        projectAcronym: 'Project / Acronym',
        axis: 'Axis',
        addProject: 'Add Project',
        viewProjects: 'View projects',
        globalPriority: 'Global Priority',
        resilienceImpact: 'Resilience Impact',
        aquiferManagement: 'Aquifer Management',
        soilRestoration: 'Soil Restoration',

        // ─── Director Dashboard ────────────────────────────────────────
        directorTitle: 'General Management',
        activeProjects: 'Active Projects',
        atRisk: 'At Risk',
        completed: 'Completed',
        totalBudget: 'Total Budget',
        portfolioOverview: 'Portfolio Overview',
        strategicAxes: 'Strategic Axes',
        projectStatus: 'Project Status',

        // ─── Division Chief Dashboard ──────────────────────────────────
        divisionChiefTitle: 'Division Chief',
        myDivision: 'My Division',
        divisionProjects: 'Division Projects',
        taskManagement: 'Task Management',
        reportProgress: 'Progress Report',

        // ─── Project Manager Dashboard ─────────────────────────────────
        projectManagerTitle: 'Project Manager',
        tasksProgress: 'Tasks Progress',
        completedTasks: 'Completed Tasks',
        pendingTasks: 'Pending Tasks',
        taskTitle: 'Task Title',
        estimatedBudget: 'Estimated Budget',
        dueDate: 'Due Date',
        assignedTo: 'Assigned To',
        markComplete: 'Mark as complete',

        // ─── Project Create ────────────────────────────────────────────
        createProject: 'Create Project',
        newProject: 'New Project',
        projectName: 'Project Name',
        projectAcronymLabel: 'Acronym',
        projectDescription: 'Project Description',
        projectAxis: 'Thematic Axis',
        projectState: 'State',
        startDate: 'Start Date',
        endDate: 'End Date',
        responsibleCountries: 'Countries Involved',
        donor: 'Donor',
        projectManager: 'Project Manager',
        aiGenerateTasks: 'Generate Tasks with AI',
        aiGenerating: 'Generating...',
        aiTasksTitle: 'AI-Generated Tasks',
        addTask: 'Add Task',
        taskName: 'Task Name',
        documents: 'Documents',
        submitProject: 'Submit Project',
        saveDraft: 'Save Draft',
        required: 'Required field',

        // ─── Project Detail ────────────────────────────────────────────
        projectDetail: 'Project Detail',
        projectInfo: 'Project Information',
        projectDocs: 'Project Documents',
        uploadDoc: 'Upload Document',
        noDocuments: 'No documents available.',
        deleteConfirm: 'Are you sure you want to delete?',
        editProject: 'Edit Project',
        deleteProject: 'Delete Project',
        projectProgress: 'Progress',
        inProgress: 'In Progress',
        delayed: 'Delayed',
        closed: 'Closed',
        risk: 'At Risk',
        additionalInfo: 'Additional Information',
        mainTheme: 'Main Theme',
        beneficiaryCountries: 'Beneficiary Countries',
        financialPartners: 'Financial Partners',
        divisionLabel: 'Division',
        periodLabel: 'Period',

        // ─── Equipe ────────────────────────────────────────────────────
        teamTitle: 'Our Team',
        teamDesc: 'OSS Organisation Members',
        role: 'Role',
        division: 'Division',
        email: 'Email',
        phone: 'Phone',
        noTeamMembers: 'No members found.',

        // ─── User Signup ───────────────────────────────────────────────
        createUser: 'Create Account',
        firstName: 'First Name',
        lastName: 'Last Name',
        username: 'Username',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        jobTitle: 'Job Title',
        selectJobTitle: 'Select a title',
        createAccount: 'Create Account',
        userCreated: 'Account created successfully.',
        passwordMismatch: 'Passwords do not match.',

        // ─── Chatbot ───────────────────────────────────────────────────
        chatTitle: 'OSS Assistant',
        chatPlaceholder: 'Ask a question...',
        chatSend: 'Send',
        chatWelcome: "Hello! I'm the OSS assistant. How can I help you today?",
        chatError: 'Sorry, a technical error occurred. Please try again.',
        chatLoginRequired: 'Please log in to use the AI assistant.',
    }
};

export type TranslationKeys = keyof typeof TRANSLATIONS.fr;

@Injectable({ providedIn: 'root' })
export class TranslationService {
    private _lang: Lang = 'fr';
    private _langSubject = new BehaviorSubject<Lang>('fr');

    lang$: Observable<Lang>;

    constructor() {
        this.lang$ = this._langSubject.asObservable();
    }

    get lang(): Lang {
        return this._lang;
    }

    get t(): typeof TRANSLATIONS.fr {
        return TRANSLATIONS[this._lang] as typeof TRANSLATIONS.fr;
    }

    toggle(): void {
        // Translations disabled: Enforcement of French only.
    }

    setLang(lang: Lang): void {
        // Translations disabled: Enforcement of French only.
    }
}
