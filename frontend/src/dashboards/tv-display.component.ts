import {
    Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, ViewChild, ElementRef
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../app/services/auth.service';
import { ProjectService, Project } from '../app/services/project.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

declare const Chart: any;

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

    @ViewChild('etatChart') etatChartRef!: ElementRef;
    @ViewChild('budgetChart') budgetChartRef!: ElementRef;
    @ViewChild('avancementChart') avancementChartRef!: ElementRef;

    private charts: any[] = [];
    private destroy$ = new Subject<void>();
    private apiUrl = environment.apiUrl;

    get roleLabel(): string {
        const r = this.user?.role?.toLowerCase() || '';
        if (r === 'se') return 'Secrétariat Exécutif';
        if (r === 'directeur') return 'Direction Générale';
        if (r === 'chef_division') return `Division ${this.getDivisionName(this.user?.division_id)}`;
        return this.user?.role || '';
    }

    readonly divisionNames: Record<string, string> = {
        'D01': 'Climat',
        'D02': 'Eau',
        'D03': 'Terre',
        'D04': 'Biodiversité',
    };

    readonly divisions = Object.keys(this.divisionNames);

    getDivisionName(divId: string | null | undefined): string {
        if (!divId) return '';
        return this.divisionNames[divId] || divId;
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
                setTimeout(() => {
                    this.renderCharts();
                    this.cdr.detectChanges();
                }, 100);
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

    private destroyCharts() {
        this.charts.forEach(c => { try { c.destroy(); } catch (e) { } });
        this.charts = [];
    }

    renderCharts() {
        this.destroyCharts();
        if (!this.stats) return;

        // --- Donut: Projets par état ---
        const etatEl = this.etatChartRef?.nativeElement;
        if (etatEl) {
            const etats = this.stats.parEtat || {};
            const etatLabels = Object.keys(etats);
            const etatData = etatLabels.map((k: string) => etats[k]);
            const colorMap: Record<string, string> = {
                'En Cours': '#3b82f6',
                'Clôturé': '#10b981',
                'En Retard': '#f59e0b',
                'A Risque': '#ef4444',
                'En Attente': '#8b5cf6',
            };
            const etatColors = etatLabels.map((k: string) => colorMap[k] || '#6b7280');

            const c1 = new Chart(etatEl, {
                type: 'doughnut',
                data: {
                    labels: etatLabels,
                    datasets: [{ data: etatData, backgroundColor: etatColors, borderWidth: 2, borderColor: '#fff' }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 14 } } }
                }
            });
            this.charts.push(c1);
        }

        // --- Bar: Budget total vs dépensé par division ---
        const budgetEl = this.budgetChartRef?.nativeElement;
        if (budgetEl) {
            const divs = this.stats.parDivision || [];
            const labels = divs.map((d: any) => this.getDivisionName(d.division));
            const c2 = new Chart(budgetEl, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Budget Total',
                            data: divs.map((d: any) => d.budget_total),
                            backgroundColor: 'rgba(59,130,246,0.7)',
                            borderRadius: 6
                        },
                        {
                            label: 'Budget Dépensé',
                            data: divs.map((d: any) => d.budget_depense),
                            backgroundColor: 'rgba(16,185,129,0.7)',
                            borderRadius: 6
                        },
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } },
                    scales: {
                        x: { grid: { display: false } },
                        y: { ticks: { callback: (v: number) => this.formatBudget(v) } }
                    }
                }
            });
            this.charts.push(c2);
        }

        // --- Horizontal Bar: Avancement moyen par division ---
        const avancementEl = this.avancementChartRef?.nativeElement;
        if (avancementEl) {
            const divs = this.stats.parDivision || [];
            const labels = divs.map((d: any) => this.getDivisionName(d.division));
            const c3 = new Chart(avancementEl, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Avancement Moyen (%)',
                        data: divs.map((d: any) => d.avancement_moyen),
                        backgroundColor: divs.map((d: any) => {
                            const v = d.avancement_moyen;
                            if (v >= 80) return 'rgba(16,185,129,0.75)';
                            if (v >= 50) return 'rgba(59,130,246,0.75)';
                            return 'rgba(245,158,11,0.75)';
                        }),
                        borderRadius: 6
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { max: 100, ticks: { callback: (v: number) => `${v}%` } },
                        y: { grid: { display: false } }
                    }
                }
            });
            this.charts.push(c3);
        }
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
