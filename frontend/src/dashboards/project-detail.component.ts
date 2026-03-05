import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService, Project, Task } from '../app/services/project.service';
import { AuthService, User } from '../app/services/auth.service';
import { DocumentService, ProjectDocument } from '../app/services/document.service';
import { AiService } from '../app/services/ai.service';
import { TranslationService } from '../app/services/translation.service';
import { NotificationService } from '../app/services/notification.service';

@Component({
    selector: 'app-project-detail',
    templateUrl: './project-detail.component.html',
})
export class ProjectDetailComponent implements OnInit {
    project: Project | undefined;
    chefDeProjet: User | undefined;
    currentUser: User | null = null;
    docs: ProjectDocument[] = [];
    activePreview: ProjectDocument | null = null;
    availableChefs: User[] = [];

    // Edit mode
    isEditingInfo = false;
    editModel: any = {};

    // Task management
    newTaskTitle = '';
    newTaskBudget = 0;
    editingTaskId: string | null = null;
    editingTaskTitle = '';
    editingTaskBudget = 0;

    isGeneratingAI = false;
    aiError = '';

    // Budget adjustment
    manualSpentAdjust = 0;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private projectService: ProjectService,
        private authService: AuthService,
        private docService: DocumentService,
        private aiService: AiService,
        public translate: TranslationService,
        private cdr: ChangeDetectorRef,
        private notifService: NotificationService
    ) { }

    ngOnInit() {
        this.currentUser = this.authService.getCurrentUser();
        this.translate.lang$.subscribe(() => this.cdr.markForCheck());
        const id = this.route.snapshot.paramMap.get('id') || '';
        this.projectService.projects$.subscribe(() => {
            this.loadProject(id);
        });
        this.authService.users$.subscribe(() => {
            if (this.project) {
                this.loadProject(id);
            }
        });
    }

    loadProject(id: string) {
        this.project = this.projectService.getProjectById(id);
        if (this.project) {
            this.chefDeProjet = this.authService.getAllUsers().find(
                u => u.role === 'chef_projet' && u.id_user === this.project!.chef_projet_id
            );
            this.availableChefs = this.authService.getAllUsers().filter(u => u.role === 'chef_projet');
            this.docs = this.docService.getDocuments(this.project.id_projet);
        }
    }

    get isChefProjetOwner(): boolean {
        return !!(this.currentUser &&
            this.currentUser.role === 'chef_projet' &&
            this.project?.chef_projet_id === this.currentUser.id_user);
    }

    get isSuperUser(): boolean {
        return !!(this.currentUser &&
            ['se', 'directeur', 'chef_division'].includes(this.currentUser.role));
    }

    get canEdit(): boolean {
        return this.isChefProjetOwner || this.isSuperUser;
    }

    get taskProgress(): number {
        return this.project ? this.projectService.getTaskProgress(this.project) : 0;
    }

    get budgetProgress(): number {
        return this.project ? this.projectService.getBudgetProgress(this.project) : 0;
    }

    get completedTaskCount(): number {
        return this.project?.tasks?.filter(t => t.completed).length || 0;
    }

    get totalTaskCount(): number {
        return this.project?.tasks?.length || 0;
    }

    // ----- Info Edit -----

    startEditInfo() {
        if (!this.project) return;
        this.editModel = { ...this.project };
        this.isEditingInfo = true;
    }

    saveEditInfo() {
        if (!this.project) return;
        const oldStatus = this.project.etat;
        const oldBudgetTotal = this.project.budget_total || 0;
        const newStatus = this.editModel.etat;
        const newBudgetTotal = this.editModel.budget_total || 0;
        const changedBy = this.currentUser?.nom || 'Inconnu';

        this.projectService.updateProject(this.project.id_projet, this.editModel).subscribe({
            next: () => {
                // Notify on status change
                if (oldStatus !== newStatus) {
                    const chefProjetUser = this.authService.getAllUsers().find(
                        u => u.id_user === this.project!.chef_projet_id
                    );
                    this.notifService.notifyStatusChanged(
                        this.project!.nom_projet,
                        this.project!.id_projet,
                        this.project!.division_id,
                        chefProjetUser?.username || '',
                        oldStatus,
                        newStatus,
                        changedBy
                    );
                }
                // Notify on budget total change
                if (oldBudgetTotal !== newBudgetTotal) {
                    const chefProjetUser = this.authService.getAllUsers().find(
                        u => u.id_user === this.project!.chef_projet_id
                    );
                    this.notifService.notifyBudgetChanged(
                        this.project!.nom_projet,
                        this.project!.id_projet,
                        this.project!.division_id,
                        chefProjetUser?.username || '',
                        oldBudgetTotal,
                        newBudgetTotal,
                        changedBy,
                        false
                    );
                }
                this.loadProject(this.project!.id_projet);
                this.isEditingInfo = false;
            }
        });
    }

    cancelEditInfo() {
        this.isEditingInfo = false;
    }

    // ----- Task Management -----

    addTask() {
        if (!this.newTaskTitle.trim() || !this.project) return;
        this.projectService.addTask(this.project.id_projet, {
            title: this.newTaskTitle.trim(),
            completed: false,
            estimatedBudget: this.newTaskBudget || 0
        });
        this.newTaskTitle = '';
        this.newTaskBudget = 0;
        this.loadProject(this.project.id_projet);
    }

    generateTasksWithAI() {
        if (!this.project || !this.project.description || this.project.description.trim().length < 10) {
            this.aiError = 'Le projet manque d\'une description valide (min. 10 caractères) pour générer des tâches.';
            return;
        }
        this.isGeneratingAI = true;
        this.aiError = '';

        this.aiService.generateTasks(this.project.description).subscribe({
            next: (response) => {
                const newTasks = response.tasks;
                const tasksToAdd = newTasks.map((t: any) => ({
                    id: 'task_' + Math.random().toString(36).substr(2, 9),
                    title: t.title,
                    completed: false,
                    estimatedBudget: t.estimatedBudget || 0
                }));
                const updatedTasks = [...(this.project!.tasks || []), ...tasksToAdd];

                this.projectService.updateProject(this.project!.id_projet, { tasks: updatedTasks }).subscribe({
                    next: () => {
                        this.isGeneratingAI = false;
                        this.loadProject(this.project!.id_projet);
                    },
                    error: (err) => {
                        this.aiError = 'Erreur lors de la sauvegarde des tâches.';
                        this.isGeneratingAI = false;
                    }
                });
            },
            error: (err) => {
                this.aiError = err.error?.error || 'Erreur de connexion au serveur IA.';
                this.isGeneratingAI = false;
            }
        });
    }

    toggleTask(taskId: string) {
        if (!this.project) return;

        // Find the task before toggling to know if it's becoming completed or uncompleted
        const task = this.project.tasks?.find((t: any) => t.id === taskId);
        const willBeCompleted = task ? !task.completed : false;
        const taskTitle = task ? task.title : 'Tâche inconnue';

        this.projectService.toggleTask(this.project.id_projet, taskId);

        // Trigger notification
        const chefProjetUser = this.authService.getAllUsers().find(
            u => u.id_user === this.project!.chef_projet_id
        );
        const changedBy = this.currentUser?.nom || 'Inconnu';

        this.notifService.notifyTaskToggled(
            this.project.nom_projet,
            this.project.id_projet,
            this.project.division_id,
            chefProjetUser?.username || '',
            taskTitle,
            willBeCompleted,
            changedBy
        );

        this.loadProject(this.project.id_projet);
    }

    deleteTask(taskId: string) {
        if (!this.project) return;
        this.projectService.deleteTask(this.project.id_projet, taskId);
        this.loadProject(this.project.id_projet);
    }

    startEditTask(task: Task) {
        this.editingTaskId = task.id;
        this.editingTaskTitle = task.title;
        this.editingTaskBudget = task.estimatedBudget;
    }

    saveEditTask() {
        if (!this.project || !this.editingTaskId) return;
        this.projectService.updateTask(this.project.id_projet, this.editingTaskId, {
            title: this.editingTaskTitle,
            estimatedBudget: this.editingTaskBudget
        });
        this.editingTaskId = null;
        this.loadProject(this.project.id_projet);
    }

    cancelEditTask() {
        this.editingTaskId = null;
    }

    // ----- Budget Adjustment -----

    adjustSpent(delta: number) {
        if (!this.project) return;
        const oldSpent = this.project.budget_depense || 0;
        const newSpent = Math.max(0, oldSpent + delta);
        const changedBy = this.currentUser?.nom || 'Inconnu';

        this.projectService.updateProject(this.project.id_projet, { budget_depense: newSpent }).subscribe({
            next: () => {
                const chefProjetUser = this.authService.getAllUsers().find(
                    u => u.id_user === this.project!.chef_projet_id
                );
                this.notifService.notifyBudgetChanged(
                    this.project!.nom_projet,
                    this.project!.id_projet,
                    this.project!.division_id,
                    chefProjetUser?.username || '',
                    oldSpent,
                    newSpent,
                    changedBy,
                    true
                );
                this.loadProject(this.project!.id_projet);
            }
        });
    }

    // ----- Docs -----

    refreshDocs() {
        if (this.project) {
            this.docs = this.docService.getDocuments(this.project.id_projet);
        }
    }

    goBack() {
        window.history.back();
    }

    preview(doc: ProjectDocument) { this.activePreview = doc; }
    download(doc: ProjectDocument) { this.docService.downloadDocument(doc); }

    isImage(type: string) { return type.startsWith('image/'); }
    isVideo(type: string) { return type.startsWith('video/'); }
    isPdf(type: string) { return type === 'application/pdf'; }
    isOther(type: string) { return !this.isImage(type) && !this.isVideo(type) && !this.isPdf(type); }

    getStatusClass(etat: string): string {
        const map: { [k: string]: string } = {
            'En Cours': 'bg-blue-100 text-blue-700 border-blue-200',
            'Clôturé': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'En Retard': 'bg-amber-100 text-amber-700 border-amber-200',
            'A Risque': 'bg-red-100 text-red-700 border-red-200'
        };
        return map[etat] || 'bg-slate-100 text-slate-700 border-slate-200';
    }

    getAxisEmoji(axe: string): string {
        const map: { [k: string]: string } = { 'D02': '💧', 'D01': '🌍', 'D03': '🌾', 'D04': '🌱' };
        return map[axe] || '📁';
    }
}
