import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../app/services/auth.service';
import { ProjectService } from '../app/services/project.service';
import { TranslationService } from '../app/services/translation.service';
import { NotificationService, Notification } from '../app/services/notification.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-director-dashboard',
    templateUrl: './director-dashboard.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DirectorDashboardComponent implements OnInit, OnDestroy {
    user: User | null = null;
    divisionStats: any = {};
    projects: any[] = [];
    allProjects: any[] = [];
    activeTab: 'vue' | 'stats' = 'vue';
    showNotifPanel = false;

    // Pre-computed arrays (avoids getter re-evaluation every change-detection cycle)
    notifications: Notification[] = [];
    unreadCount: number = 0;
    alerts: any[] = [];
    availableYears: string[] = [];
    availablePays: string[] = [];

    // Filters
    filterDivision: string = '';
    filterYear: string = '';
    filterPays: string = '';
    get activeFilterCount() { return [this.filterYear, this.filterDivision, this.filterPays].filter(f => f).length; }

    chiefs = [
        { emoji: '🌱', bg: 'bg-blue-100', name: 'Bio Chief', div: 'D04' },
        { emoji: '🌍', bg: 'bg-emerald-100', name: 'Clim Chief', div: 'D01' },
        { emoji: '💧', bg: 'bg-cyan-100', name: 'Eau Chief', div: 'D02' },
        { emoji: '🌾', bg: 'bg-amber-100', name: 'Terre Chief', div: 'D03' },
    ];

    // Unsubscribe trigger — prevents memory leaks
    private destroy$ = new Subject<void>();

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

        if (this.user) {
            this.notifService.loadNotifications(this.user.username, this.user.role, this.user.division_id);
        }

        // Subscribe to notifications without memory leak
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
                ['D01', 'D02', 'D03', 'D04'].forEach(div => {
                    this.divisionStats[div] = this.projectService.getDivisionStats(div);
                });
                this.allProjects = this.projectService.getAllProjects();
                this.applyFilters();
                this.refreshFilterOptions();
                // Recompute alerts from allProjects (stored prop, not getter)
                this.alerts = this.allProjects.filter(
                    (p: any) => p.etat === 'En Retard' || p.etat === 'A Risque' || p.budget_depense > p.budget_total
                );
                this.cdr.markForCheck();
            });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private refreshNotifications() {
        if (!this.user) return;
        const all = this.notifService.getNotificationsForUser(
            this.user.username, this.user.role, this.user.division_id
        );
        this.notifications = all;
        this.unreadCount = all.filter(n => !n.read).length;
    }

    private refreshFilterOptions() {
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

    markAllRead() {
        if (!this.user) return;
        this.notifService.markAllRead(this.user.username, this.user.role, this.user.division_id);
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
