import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../app/services/auth.service';
import { ProjectService, Project } from '../app/services/project.service';
import { NotificationService } from '../app/services/notification.service';
import { TranslationService } from '../app/services/translation.service';
import { TvDetectionService } from '../app/services/tv-detection.service';

@Component({
    selector: 'app-division-chief-dashboard',
    templateUrl: './division-chief-dashboard.component.html',
    styleUrls: ['./division-chief-dashboard.component.css'],
})
export class DivisionChiefDashboardComponent implements OnInit {
    user: User | null = null;
    projects: Project[] = [];
    allProjects: Project[] = [];
    stats: any = {};
    teamMembers: User[] = [];
    activeTab: 'projets' | 'stats' = 'projets';
    showNotifPanel = false;

    // Filters (year + country only for division chief)
    filterYear: string = '';
    filterPays: string = '';
    get availableYears(): string[] {
        const years = new Set<string>();
        this.allProjects.forEach((p: any) => { if (p.annee_debut) years.add(String(p.annee_debut)); });
        return Array.from(years).sort((a, b) => +b - +a);
    }
    get availablePays(): string[] {
        const pays = new Set<string>();
        this.allProjects.forEach((p: any) => {
            if (p.beneficiaires_pays) p.beneficiaires_pays.split(',').forEach((c: string) => pays.add(c.trim()));
        });
        return Array.from(pays).sort();
    }
    get activeFilterCount() { return [this.filterYear, this.filterPays].filter(f => f).length; }

    // Form Control
    showProjectForm = false;
    isEdit = false;
    selectedProject: any = {};

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
        if (this.user) {
            this.allProjects = this.projectService.getProjectsByDivision(this.user.division_id || "");
            this.stats = this.projectService.getDivisionStats(this.user.division_id || "");
            this.applyFilters();
        }
        // Load real team members for this division
        this.authService.users$.subscribe(allUsers => {
            if (this.user) {
                this.teamMembers = allUsers.filter(
                    (u: User) => u.division_id === this.user!.division_id && u.role === 'chef_projet'
                );
            }
        });
    }

    getProjectCountForUser(userId: string): number {
        return this.allProjects.filter((p: any) => p.chef_projet_id === userId).length;
    }

    getInitials(nom: string): string {
        return (nom || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    }

    getDivisionName(divId: string | null | undefined): string {
        const map: Record<string, string> = {
            'D01': 'Division Climat',
            'D02': 'Division Eau',
            'D03': 'Division Terre',
            'D04': 'Division Biodiversité',
        };
        return divId ? (map[divId] || divId) : '';
    }

    applyFilters() {
        this.projects = this.allProjects.filter((p: any) => {
            const yearOk = !this.filterYear || +p.annee_debut === +this.filterYear || +p.annee_fin === +this.filterYear;
            const paysOk = !this.filterPays || (p.beneficiaires_pays || '').toLowerCase().includes(this.filterPays.toLowerCase());
            return yearOk && paysOk;
        });
    }

    resetFilters() {
        this.filterYear = '';
        this.filterPays = '';
        this.applyFilters();
    }

    openAddProject() {
        this.router.navigate(['/project/new']);
    }

    get notifications() {
        if (!this.user) return [];
        return this.notifService.getNotificationsForUser(this.user.username, this.user.role);
    }

    get unreadCount(): number {
        if (!this.user) return 0;
        return this.notifService.getUnreadCount(this.user.username, this.user.role);
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

    viewProjectDetail(id: string) {
        this.router.navigate(['/project', id]);
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
