import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../app/services/auth.service';
import { ProjectService } from '../app/services/project.service';
import { NotificationService } from '../app/services/notification.service';
import { TranslationService } from '../app/services/translation.service';

@Component({
    selector: 'app-super-admin-dashboard',
    templateUrl: './super-admin-dashboard.component.html',
})
export class SuperAdminDashboardComponent implements OnInit {
    user: User | null = null;
    stats: any = {};
    divisionStats: any = {};
    projects: any[] = [];
    allProjects: any[] = [];
    activeTab: 'projets' | 'stats' = 'projets';

    get activities() {
        if (!this.user) return [];
        return this.notifService
            .getNotificationsForUser(this.user.username, this.user.role, this.user.division_id)
            .slice(0, 10) // Show last 10
            .map(n => {
                let color = 'blue';
                let typeText = 'SYSTÈME';
                if (n.type === 'success') {
                    color = 'emerald';
                    typeText = 'PROJET';
                } else if (n.type === 'warning') {
                    color = 'amber';
                    typeText = 'ALERTE';
                } else if (n.message.includes('Ajouté')) {
                    color = 'blue';
                    typeText = 'ADMIN';
                }

                // Simple relative time phrasing
                const diffMs = new Date().getTime() - new Date(n.createdAt).getTime();
                const diffMins = Math.floor(diffMs / 60000);
                const diffHrs = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHrs / 24);
                let timeStr = "à l'instant";
                if (diffDays > 0) timeStr = `il y a ${diffDays}j`;
                else if (diffHrs > 0) timeStr = `il y a ${diffHrs}h`;
                else if (diffMins > 0) timeStr = `il y a ${diffMins}m`;

                // Try to extract title/desc heuristically
                // e.g., "Tâche \"XYZ\" terminée sur le projet \"ABC\" par John."
                let title = n.projectName || 'Notification';
                let desc = n.message;
                return {
                    icon: n.icon || 'info',
                    color: color,
                    title: title,
                    time: timeStr,
                    description: desc,
                    type: typeText
                };
            });
    }

    // Filters
    filterDivision: string = '';
    filterYear: string = '';
    filterPays: string = '';
    get availableYears(): string[] {
        const years = new Set<string>();
        this.allProjects.forEach(p => { if (p.annee_debut) years.add(String(p.annee_debut)); });
        return Array.from(years).sort((a, b) => +b - +a);
    }
    get availablePays(): string[] {
        const pays = new Set<string>();
        this.allProjects.forEach(p => {
            if (p.beneficiaires_pays) p.beneficiaires_pays.split(',').forEach((c: string) => pays.add(c.trim()));
        });
        return Array.from(pays).sort();
    }
    // Keep old name for division card clicks
    get selectedDivisionFilter() { return this.filterDivision; }
    get activeFilterCount() { return [this.filterYear, this.filterDivision, this.filterPays].filter(f => f).length; }

    // Form Control
    showProjectForm = false;
    isEdit = false;
    selectedProject: any = {};
    showNotifPanel = false;

    get notifications() {
        if (!this.user) return [];
        return this.notifService.getNotificationsForUser(this.user.username, this.user.role, this.user.division_id);
    }

    get unreadCount(): number {
        if (!this.user) return 0;
        return this.notifService.getUnreadCount(this.user.username, this.user.role, this.user.division_id);
    }

    markAllRead() {
        if (!this.user) return;
        this.notifService.markAllRead(this.user.username, this.user.role, this.user.division_id);
    }

    constructor(
        private authService: AuthService,
        private router: Router,
        private projectService: ProjectService,
        public notifService: NotificationService,
        public translate: TranslationService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.user = this.authService.getCurrentUser();
        // Load notifications from backend (shared between mobile & web)
        if (this.user) {
            this.notifService.loadNotifications(this.user.username, this.user.role, this.user.division_id);
        }
        this.notifService.notifications$.subscribe(() => this.cdr.markForCheck());
        this.translate.lang$.subscribe(() => this.cdr.markForCheck());
        this.projectService.projects$.subscribe(() => {
            this.refreshData();
        });
    }

    refreshData() {
        this.allProjects = this.projectService.getAllProjects();
        this.filterProjects();
        this.stats = this.projectService.getGlobalStats();
        ['D01', 'D02', 'D03', 'D04'].forEach(div => {
            this.divisionStats[div] = this.projectService.getDivisionStats(div);
        });
    }

    filterProjects(division?: string) {
        if (division) {
            this.filterDivision = division === this.filterDivision ? '' : division;
        }
        this.applyFilters();
        if (division) {
            setTimeout(() => {
                document.getElementById('projects-pipeline')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }

    applyFilters() {
        this.projects = this.allProjects.filter(p => {
            const divOk = !this.filterDivision || p.division_id === this.filterDivision;
            const yearOk = !this.filterYear || +p.annee_debut === +this.filterYear || +p.annee_fin === +this.filterYear;
            const paysOk = !this.filterPays || (p.beneficiaires_pays || '').toLowerCase().includes(this.filterPays.toLowerCase());
            return divOk && yearOk && paysOk;
        });
    }

    resetFilters() {
        this.filterDivision = '';
        this.filterYear = '';
        this.filterPays = '';
        this.applyFilters();
    }

    openAddProject() {
        this.router.navigate(['/project/new']);
    }

    editProject(p: any) {
        this.isEdit = true;
        this.selectedProject = { ...p };
        this.showProjectForm = true;
    }

    saveProject(data: any) {
        if (this.isEdit) {
            this.projectService.updateProject(data.id_projet, data);
        } else {
            this.projectService.addProject(data);
        }
        this.showProjectForm = false;
        this.refreshData();
    }

    deleteProject(id: string) {
        if (confirm(this.translate.t.deleteConfirm)) {
            this.projectService.removeProject(id);
            this.refreshData();
        }
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
