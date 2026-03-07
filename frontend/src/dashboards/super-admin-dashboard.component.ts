import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../app/services/auth.service';
import { ProjectService } from '../app/services/project.service';
import { NotificationService, Notification } from '../app/services/notification.service';
import { TranslationService } from '../app/services/translation.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TvDetectionService } from '../app/services/tv-detection.service';

@Component({
    selector: 'app-super-admin-dashboard',
    templateUrl: './super-admin-dashboard.component.html',
    styleUrls: ['./super-admin-dashboard.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminDashboardComponent implements OnInit, OnDestroy {
    user: User | null = null;
    stats: any = {};
    divisionStats: any = {};
    projects: any[] = [];
    allProjects: any[] = [];
    activeTab: 'projets' | 'stats' = 'projets';

    // Pre-computed arrays (not getters recomputed on every change-detection cycle)
    activities: any[] = [];
    notifications: Notification[] = [];
    unreadCount: number = 0;
    availableYears: string[] = [];
    availablePays: string[] = [];

    // Filters
    filterDivision: string = '';
    filterYear: string = '';
    filterPays: string = '';

    get selectedDivisionFilter() { return this.filterDivision; }
    get activeFilterCount() { return [this.filterYear, this.filterDivision, this.filterPays].filter(f => f).length; }

    // Form Control
    showProjectForm = false;
    isEdit = false;
    selectedProject: any = {};
    showNotifPanel = false;

    // Unsubscribe trigger — prevents memory leaks
    private destroy$ = new Subject<void>();

    constructor(
        private authService: AuthService,
        private router: Router,
        private projectService: ProjectService,
        public notifService: NotificationService,
        public translate: TranslationService,
        private cdr: ChangeDetectorRef,
        private tvDetection: TvDetectionService
    ) { }

    ngOnInit() {
        if (this.tvDetection.isTvScreen()) {
            this.router.navigate(['/tv-display']);
            return;
        }

        this.user = this.authService.getCurrentUser();

        if (this.user) {
            this.notifService.loadNotifications(this.user.username, this.user.role, this.user.division_id);
        }

        // Subscribe to notifications — unsubscribe on destroy to avoid memory leaks
        this.notifService.notifications$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.refreshNotifications();
                this.cdr.markForCheck();
            });

        // Subscribe to translation changes
        this.translate.lang$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.cdr.markForCheck());

        // Subscribe to project changes
        this.projectService.projects$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.refreshData();
                this.cdr.markForCheck();
            });
    }

    ngOnDestroy() {
        // Unsubscribe from all subscriptions to prevent memory leaks
        this.destroy$.next();
        this.destroy$.complete();
    }

    /** Recompute notification-related arrays (called once per emission, not on every render) */
    private refreshNotifications() {
        if (!this.user) return;

        const all = this.notifService.getNotificationsForUser(
            this.user.username, this.user.role, this.user.division_id
        );

        this.notifications = all;
        this.unreadCount = all.filter(n => !n.read).length;

        // Build activities list (computed once, stored as property)
        const now = new Date().getTime();
        this.activities = all.slice(0, 10).map(n => {
            let color = 'blue';
            let typeText = 'SYSTÈME';
            if (n.type === 'success') { color = 'emerald'; typeText = 'PROJET'; }
            else if (n.type === 'warning') { color = 'amber'; typeText = 'ALERTE'; }
            else if (n.message.includes('Ajouté')) { color = 'blue'; typeText = 'ADMIN'; }

            const diffMs = now - new Date(n.createdAt).getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHrs = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHrs / 24);
            let timeStr = "à l'instant";
            if (diffDays > 0) timeStr = `il y a ${diffDays}j`;
            else if (diffHrs > 0) timeStr = `il y a ${diffHrs}h`;
            else if (diffMins > 0) timeStr = `il y a ${diffMins}m`;

            return {
                icon: n.icon || 'info',
                color,
                title: n.projectName || 'Notification',
                time: timeStr,
                description: n.message,
                type: typeText
            };
        });
    }

    refreshData() {
        this.allProjects = this.projectService.getAllProjects();
        this.applyFilters();
        this.stats = this.projectService.getGlobalStats();
        ['D01', 'D02', 'D03', 'D04'].forEach(div => {
            this.divisionStats[div] = this.projectService.getDivisionStats(div);
        });

        // Recompute filter options from data
        const years = new Set<string>();
        const pays = new Set<string>();
        this.allProjects.forEach(p => {
            if (p.annee_debut) years.add(String(p.annee_debut));
            if (p.beneficiaires_pays) {
                p.beneficiaires_pays.split(',').forEach((c: string) => pays.add(c.trim()));
            }
        });
        this.availableYears = Array.from(years).sort((a, b) => +b - +a);
        this.availablePays = Array.from(pays).sort();
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

    markAllRead() {
        if (!this.user) return;
        this.notifService.markAllRead(this.user.username, this.user.role, this.user.division_id);
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
