import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../app/services/auth.service';
import { ProjectService } from '../app/services/project.service';
import { TranslationService } from '../app/services/translation.service';
import { NotificationService } from '../app/services/notification.service';

@Component({
    selector: 'app-director-dashboard',
    templateUrl: './director-dashboard.component.html',
})
export class DirectorDashboardComponent implements OnInit {
    user: User | null = null;
    divisionStats: any = {};
    projects: any[] = [];
    allProjects: any[] = [];
    activeTab: 'vue' | 'stats' = 'vue';
    showNotifPanel = false;

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
    get activeFilterCount() { return [this.filterYear, this.filterDivision, this.filterPays].filter(f => f).length; }
    get alerts() {
        return this.allProjects.filter((p: any) => p.etat === 'En Retard' || p.etat === 'A Risque' || p.budget_depense > p.budget_total);
    }

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

    chiefs = [
        { emoji: '🌱', bg: 'bg-blue-100', name: 'Bio Chief', div: 'D04' },
        { emoji: '🌍', bg: 'bg-emerald-100', name: 'Clim Chief', div: 'D01' },
        { emoji: '💧', bg: 'bg-cyan-100', name: 'Eau Chief', div: 'D02' },
        { emoji: '🌾', bg: 'bg-amber-100', name: 'Terre Chief', div: 'D03' },
    ];

    constructor(
        private authService: AuthService,
        private router: Router,
        private projectService: ProjectService,
        public translate: TranslationService,
        public notifService: NotificationService,
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
            ['D01', 'D02', 'D03', 'D04'].forEach(div => {
                this.divisionStats[div] = this.projectService.getDivisionStats(div);
            });
            this.allProjects = this.projectService.getAllProjects();
            this.applyFilters();
        });
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

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
