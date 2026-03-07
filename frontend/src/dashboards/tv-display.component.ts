import {
    Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, HostListener
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../app/services/auth.service';
import { ProjectService, Project } from '../app/services/project.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-tv-display',
    templateUrl: './tv-display.component.html',
    styleUrls: ['./tv-display.component.css'],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class TvDisplayComponent implements OnInit, OnDestroy {
    user: User | null = null;
    projects: Project[] = [];
    stats: any = null;
    divisionStats: any = {};
    isFullscreen = false;
    loadingStats = true;

    private destroy$ = new Subject<void>();
    private apiUrl = environment.apiUrl;

    get roleLabel(): string {
        const r = this.user?.role?.toLowerCase() || '';
        if (r === 'se') return 'Secrétariat Exécutif';
        if (r === 'directeur') return 'Direction Générale';
        if (r === 'chef_division') return `Division ${this.user?.division_id || ''}`;
        return this.user?.role || '';
    }

    get divisionColor(): string {
        const div = this.user?.division_id;
        if (div === 'D01') return '#10b981'; // climat — emerald
        if (div === 'D02') return '#06b6d4'; // eau   — cyan
        if (div === 'D03') return '#f59e0b'; // terre  — amber
        if (div === 'D04') return '#3b82f6'; // bio    — blue
        return '#0067B1';
    }

    get projectsToShow(): Project[] {
        const r = this.user?.role?.toLowerCase() || '';
        if (r === 'chef_division' && this.user?.division_id) {
            return this.projects.filter(p => p.division_id === this.user!.division_id);
        }
        return this.projects;
    }

    get hasAlerts(): boolean {
        return this.projectsToShow.some(p => p.etat === 'A Risque' || p.etat === 'En Retard');
    }

    constructor(
        private authService: AuthService,
        private router: Router,
        private projectService: ProjectService,
        private http: HttpClient,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.user = this.authService.getCurrentUser();
        if (!this.user) { this.router.navigate(['/login']); return; }

        // Subscribe to projects
        this.projectService.projects$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.projects = this.projectService.getAllProjects();
                this.loadDivisionStats();
                this.cdr.detectChanges();
            });

        // Load global stats
        this.http.get<any>(`${this.apiUrl}/stats`).subscribe({
            next: (data) => {
                this.stats = data;
                this.loadingStats = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loadingStats = false;
                this.cdr.detectChanges();
            }
        });

        // Track fullscreen change (Esc key etc.)
        document.addEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
        document.removeEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
    }

    private loadDivisionStats() {
        ['D01', 'D02', 'D03', 'D04'].forEach(div => {
            this.divisionStats[div] = this.projectService.getDivisionStats(div);
        });
    }

    private onFullscreenChange() {
        this.isFullscreen = !!document.fullscreenElement;
        this.cdr.detectChanges();
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                this.isFullscreen = true;
                this.cdr.detectChanges();
            }).catch(() => { });
        } else {
            document.exitFullscreen().then(() => {
                this.isFullscreen = false;
                this.cdr.detectChanges();
            }).catch(() => { });
        }
    }

    @HostListener('document:keydown', ['$event'])
    onKeydown(e: KeyboardEvent) {
        if (e.key === 'F11') {
            e.preventDefault();
            this.toggleFullscreen();
        }
    }

    formatBudget(val: number): string {
        if (!val) return '$0';
        if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
        if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
        return `$${val}`;
    }

    getBudgetPct(p: Project): number {
        if (!p.budget_total || p.budget_total === 0) return 0;
        return Math.min(100, Math.round(((p.budget_depense || 0) / p.budget_total) * 100));
    }

    getStatusClass(etat: string): string {
        if (etat === 'En Cours') return 'status-progress';
        if (etat === 'Clôturé') return 'status-closed';
        if (etat === 'En Retard') return 'status-late';
        if (etat === 'A Risque') return 'status-risk';
        return 'status-default';
    }

    logout() {
        if (document.fullscreenElement) {
            document.exitFullscreen().finally(() => {
                this.authService.logout();
                this.router.navigate(['/login']);
            });
        } else {
            this.authService.logout();
            this.router.navigate(['/login']);
        }
    }
}
