import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Task {
    id?: string;
    _id?: string;
    title: string;
    completed: boolean;
    estimatedBudget: number;
}

export interface Project {
    id_projet: string;
    _id?: string;
    nom_projet: string;
    acronyme: string;
    division_id: string; // was axe
    etat: string;
    annee_debut?: number;
    annee_fin?: number;
    budget_total?: number;
    budget_depense?: number;
    avancement?: string;
    documents?: any[]; // for document arrays
    chef_projet_id?: string;
    description?: string;
    lastUpdated?: string;
    tasks?: Task[];
    theme_principal?: string;
    beneficiaires_pays?: string;
    partenaires_financiers?: string;
    axe?: string;
    duree?: string;
}

export interface Activity {
    title: string;
    description: string;
    type: 'RAPPORT' | 'APPROBATION' | 'ADMIN';
    time: string;
    icon: string;
    color: string;
}

@Injectable({
    providedIn: 'root'
})
export class ProjectService {
    private apiUrl = `http://${window.location.hostname}:3000/api`;
    private projectsCache = new BehaviorSubject<Project[]>([]);
    public projects$ = this.projectsCache.asObservable();

    constructor(private http: HttpClient) {
        this.fetchProjects();
    }

    fetchProjects() {
        this.http.get<Project[]>(`${this.apiUrl}/projects`).subscribe({
            next: (data) => this.projectsCache.next(data),
            error: (err) => console.error(err)
        });
    }

    getAllProjects(): Project[] {
        return this.projectsCache.getValue();
    }

    getProjectsByDivision(divisionId: string): Project[] {
        if (!divisionId || divisionId === 'ALL') return this.getAllProjects();
        return this.getAllProjects().filter(p => p.division_id === divisionId);
    }

    getProjectById(id: string): Project | undefined {
        return this.getAllProjects().find(p => p.id_projet === id)
            || this.getAllProjects().find(p => p.acronyme === id);
    }

    getProjectByChefProjet(chefProjetId: string): Project | undefined {
        return this.getAllProjects().find(p => p.chef_projet_id === chefProjetId);
    }

    getGlobalStats() {
        const projs = this.getAllProjects();
        const totalProjects = projs.length;
        const totalBudget = projs.reduce((sum, p) => sum + (p.budget_total || 0), 0);
        const totalSpent = projs.reduce((sum, p) => sum + (p.budget_depense || 0), 0);

        let avgProgress = 0;
        if (totalProjects > 0) {
            const sumProgress = projs.reduce((sum, p) => {
                const perc = parseInt(((p.avancement || '0').toString()).replace('%', ''), 10);
                return sum + (isNaN(perc) ? 0 : perc);
            }, 0);
            avgProgress = Math.round(sumProgress / totalProjects);
        }

        return { totalProjects, totalBudget, totalSpent, avgProgress };
    }

    getDivisionStats(divisionId: string) {
        const divProjects = this.getProjectsByDivision(divisionId);
        const totalBudget = divProjects.reduce((sum, p) => sum + (p.budget_total || 0), 0);
        const totalSpent = divProjects.reduce((sum, p) => sum + (p.budget_depense || 0), 0);

        let avgProgress = 0;
        if (divProjects.length > 0) {
            const sumProgress = divProjects.reduce((sum, p) => {
                const perc = parseInt(((p.avancement || '0').toString()).replace('%', ''), 10);
                return sum + (isNaN(perc) ? 0 : perc);
            }, 0);
            avgProgress = Math.round(sumProgress / divProjects.length);
        }

        return { count: divProjects.length, totalBudget, totalSpent, avgProgress };
    }

    getRecentActivities(): Activity[] {
        return [
            {
                title: 'Système Connecté',
                description: 'Connexion directe à la base de données réussie.',
                type: 'ADMIN',
                time: 'À l\'instant',
                icon: 'dns',
                color: 'emerald'
            },
            {
                title: 'Division Climat',
                description: 'Nouveau rapport budgétaire "Q3-2024" importé par Ahmed Ben Ali.',
                type: 'RAPPORT',
                time: 'Il y a 2m',
                icon: 'upload_file',
                color: 'blue'
            }
        ];
    }

    addProject(project: Partial<Project>) {
        const newProject = {
            id_projet: (project.acronyme || 'PROJ_' + Date.now()).toUpperCase(),
            ...project,
            tasks: project.tasks || []
        };
        this.http.post<Project>(`${this.apiUrl}/projects`, newProject).subscribe({
            next: () => this.fetchProjects(),
            error: (err) => console.error(err)
        });
    }

    updateProject(id: string, updates: Partial<Project>): Observable<Project> {
        return this.http.put<Project>(`${this.apiUrl}/projects/${id}`, updates).pipe(
            tap(() => this.fetchProjects())
        );
    }

    removeProject(id: string) {
        this.http.delete(`${this.apiUrl}/projects/${id}`).subscribe({
            next: () => this.fetchProjects(),
            error: (err) => console.error(err)
        });
    }

    // ----- Task Management -----

    addTask(projectId: string, task: Omit<Task, 'id' | '_id'>) {
        const project = this.getProjectById(projectId);
        if (project) {
            const newTask = { ...task, id: 'task_' + Date.now() };
            const tasks = [...(project.tasks || []), newTask];
            this.updateProject(projectId, { tasks }).subscribe();
        }
    }

    updateTask(projectId: string, taskId: string, updates: Partial<Task>) {
        const project = this.getProjectById(projectId);
        if (project && project.tasks) {
            const tasks = project.tasks.map(t => (t.id === taskId || t._id === taskId) ? { ...t, ...updates } : t);
            this.updateProject(projectId, { tasks }).subscribe();
        }
    }

    deleteTask(projectId: string, taskId: string) {
        const project = this.getProjectById(projectId);
        if (project && project.tasks) {
            const tasks = project.tasks.filter(t => t.id !== taskId && t._id !== taskId);
            this.updateProject(projectId, { tasks }).subscribe();
        }
    }

    toggleTask(projectId: string, taskId: string) {
        const project = this.getProjectById(projectId);
        if (project && project.tasks) {
            const tasks = project.tasks.map(t => {
                if (t.id === taskId || t._id === taskId) {
                    return { ...t, completed: !t.completed };
                }
                return t;
            });
            this.updateProject(projectId, { tasks }).subscribe();
        }
    }

    getTaskProgress(project: Project): number {
        if (!project.tasks || project.tasks.length === 0) return 0;
        return Math.round((project.tasks.filter(t => t.completed).length / project.tasks.length) * 100);
    }

    getBudgetProgress(project: Project): number {
        if (!project.budget_total || project.budget_total === 0) return 0;
        return Math.round(((project.budget_depense || 0) / Math.max(project.budget_total, 1)) * 100);
    }
}
