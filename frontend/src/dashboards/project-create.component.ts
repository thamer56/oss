import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../app/services/auth.service';
import { ProjectService, Task } from '../app/services/project.service';
import { AiService } from '../app/services/ai.service';
import { NotificationService } from '../app/services/notification.service';

@Component({
    selector: 'app-project-create',
    templateUrl: './project-create.component.html'
})
export class ProjectCreateComponent implements OnInit {
    currentUser: User | null = null;
    availableChefProjets: User[] = [];
    draftProjectId: string = 'DRAFT_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

    model: any = {
        nom_projet: '',
        acronyme: '',
        division_id: 'D02',
        etat: 'En Cours',
        annee_debut: new Date().getFullYear(),
        annee_fin: new Date().getFullYear() + 1,
        theme_principal: '',
        budget_total: 0,
        budget_depense: 0,
        beneficiaires_pays: '',
        partenaires_financiers: 'OSS / Partenaires',
        description: '',
        chef_projet_id: ''
    };

    tasks: Task[] = [];
    newTaskTitle: string = '';
    newTaskBudget: number = 0;
    editingTaskId: string | null = null;
    editingTaskTitle: string = '';
    editingTaskBudget: number = 0;

    isGeneratingAI = false;
    aiError: string = '';
    isSaving = false;
    divisions = [
        { id: 'D01', label: 'Climat' },
        { id: 'D02', label: 'Eau' },
        { id: 'D03', label: 'Terre' },
        { id: 'D04', label: 'Biodiversité' }
    ];
    isAxeLocked = false;

    constructor(
        private router: Router,
        private authService: AuthService,
        private projectService: ProjectService,
        private aiService: AiService,
        private notifService: NotificationService
    ) { }

    ngOnInit() {
        this.currentUser = this.authService.getCurrentUser();

        if (!this.currentUser || !this.authService.canCreateProject(this.currentUser)) {
            this.router.navigate(['/login']);
            return;
        }

        // Chef Division: lock division to their own
        if (this.currentUser.role === 'chef_division') {
            this.model.division_id = this.currentUser.division_id;
            this.isAxeLocked = true;
        }

        this.refreshChefProjets();
    }

    refreshChefProjets() {
        const div = this.isAxeLocked
            ? this.currentUser!.division_id
            : this.model.division_id;
        this.availableChefProjets = this.authService.getUsersByDivision(div || '');
    }

    onAxeChange() {
        this.model.chef_projet_id = '';
        this.refreshChefProjets();
    }

    generateTasksWithAI() {
        if (!this.model.description || this.model.description.trim().length < 10) {
            this.aiError = 'Veuillez saisir une description du projet (minimum 10 caractères) avant de générer les tâches.';
            return;
        }
        this.isGeneratingAI = true;
        this.aiError = '';

        this.aiService.generateTasks(this.model.description).subscribe({
            next: (response) => {
                this.tasks = response.tasks;
                this.isGeneratingAI = false;
            },
            error: (err) => {
                this.aiError = err.error?.error || 'Erreur de connexion au serveur IA. Assurez-vous que le backend est démarré.';
                this.isGeneratingAI = false;
            }
        });
    }

    addTask() {
        if (!this.newTaskTitle.trim()) return;
        this.tasks.push({
            id: 'manual_' + Date.now(),
            title: this.newTaskTitle.trim(),
            completed: false,
            estimatedBudget: this.newTaskBudget || 0
        });
        this.newTaskTitle = '';
        this.newTaskBudget = 0;
    }

    removeTask(id: string) {
        this.tasks = this.tasks.filter(t => t.id !== id);
    }

    startEditTask(task: Task) {
        this.editingTaskId = task.id;
        this.editingTaskTitle = task.title;
        this.editingTaskBudget = task.estimatedBudget;
    }

    saveEditTask() {
        if (!this.editingTaskId) return;
        const t = this.tasks.find(t => t.id === this.editingTaskId);
        if (t) {
            t.title = this.editingTaskTitle;
            t.estimatedBudget = this.editingTaskBudget;
        }
        this.editingTaskId = null;
    }

    cancelEditTask() {
        this.editingTaskId = null;
    }

    toggleTask(id: string) {
        const t = this.tasks.find(t => t.id === id);
        if (t) t.completed = !t.completed;
    }

    get taskProgress(): number {
        if (!this.tasks.length) return 0;
        return Math.round(this.tasks.filter(t => t.completed).length / this.tasks.length * 100);
    }

    get totalTaskBudget(): number {
        return this.tasks.reduce((s, t) => s + (t.estimatedBudget || 0), 0);
    }

    getSelectedChefNom(): string {
        const chef = this.availableChefProjets.find(u => u.id_user === this.model.chef_projet_id);
        return chef ? chef.nom : '';
    }

    getChefDivisionUsername(): string {
        const users = this.authService.getAllUsers();
        const chefDiv = users.find(u =>
            u.role === 'chef_division' && u.division_id === this.model.division_id
        );
        return chefDiv ? chefDiv.username : '';
    }

    save() {
        if (!this.model.nom_projet.trim() || !this.model.acronyme.trim()) return;
        this.isSaving = true;

        const chefNom = this.getSelectedChefNom();

        this.projectService.addProject({
            id_projet: this.draftProjectId,
            ...this.model,
            tasks: this.tasks
        });

        // Trigger notifications
        this.notifService.notifyProjectCreated(
            this.model.nom_projet,
            this.model.acronyme.toUpperCase(),
            this.model.division_id,
            this.getChefDivisionUsername(),
            this.model.chef_projet_id,
            chefNom,
            this.currentUser?.nom || 'Admin'
        );

        this.isSaving = false;
        this.router.navigate(['/super-admin']);
    }

    cancel() {
        this.router.navigate([-1 as any]);
    }

    goBack() {
        window.history.back();
    }
}
