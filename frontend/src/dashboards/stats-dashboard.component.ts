import {
    Component, OnInit, OnDestroy, Input, AfterViewInit, OnChanges,
    SimpleChanges, ElementRef, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

declare const Chart: any;

@Component({
    selector: 'app-stats-dashboard',
    templateUrl: './stats-dashboard.component.html',
    // Default change detection — parent uses OnPush but this child manages its own state
    changeDetection: ChangeDetectionStrategy.Default,
})
export class StatsDashboardComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() divisionId: string | null = null;
    @Input() userRole: string = '';
    @Input() isTvMode: boolean = false;

    @ViewChild('etatChart') etatChartRef!: ElementRef;
    @ViewChild('budgetChart') budgetChartRef!: ElementRef;
    @ViewChild('avancementChart') avancementChartRef!: ElementRef;

    stats: any = null;
    loading = true;
    error = '';

    private apiUrl = environment.apiUrl;
    private charts: any[] = [];
    private viewReady = false;
    private destroy$ = new Subject<void>();

    constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

    ngOnInit() {
        this.loadStats();
    }

    ngAfterViewInit() {
        this.viewReady = true;
        // If stats already arrived before the view was ready, render now
        if (this.stats) {
            this.renderCharts();
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['divisionId'] && !changes['divisionId'].firstChange) {
            this.loadStats();
        }
    }

    ngOnDestroy() {
        this.destroyCharts();
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadStats() {
        this.loading = true;
        this.error = '';
        // Explicitly trigger CD so spinner appears immediately even in OnPush parents
        this.cdr.detectChanges();

        const url = this.divisionId
            ? `${this.apiUrl}/stats/${this.divisionId}`
            : `${this.apiUrl}/stats`;

        this.http.get<any>(url).subscribe({
            next: (data) => {
                this.stats = data;
                this.loading = false;
                // Force change detection so the view updates synchronously
                this.cdr.detectChanges();
                // Give Angular one tick to render *ngIf="stats" before drawing charts
                setTimeout(() => {
                    this.renderCharts();
                    this.cdr.detectChanges();
                }, 50);
            },
            error: (err) => {
                this.error = 'Erreur de chargement des statistiques. Veuillez réessayer.';
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    formatBudget(val: number): string {
        if (!val) return '$0';
        if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
        if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
        return `$${val}`;
    }

    get tauxConsommation(): number {
        if (!this.stats || !this.stats.budgetTotal) return 0;
        return Math.min(100, Math.round((this.stats.budgetDepense / this.stats.budgetTotal) * 100));
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
                    plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 10 } } }
                }
            });
            this.charts.push(c1);
        }

        // --- Bar: Budget total vs dépensé par division ---
        const budgetEl = this.budgetChartRef?.nativeElement;
        if (budgetEl) {
            const divs = this.stats.parDivision || [];
            const labels = divs.map((d: any) => d.division);
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
            const labels = divs.map((d: any) => d.division);
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
}
