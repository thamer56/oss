import { Component, OnInit, Input, AfterViewInit, OnChanges, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

declare const Chart: any;

@Component({
    selector: 'app-stats-dashboard',
    templateUrl: './stats-dashboard.component.html',
})
export class StatsDashboardComponent implements OnInit, AfterViewInit, OnChanges {
    @Input() divisionId: string | null = null; // null = all data (admin/director)
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

    constructor(private http: HttpClient) { }

    ngOnInit() {
        this.loadStats();
    }

    ngAfterViewInit() {
        if (this.stats && !this.loading) {
            this.renderCharts();
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['divisionId'] && !changes['divisionId'].firstChange) {
            this.loadStats();
        }
    }

    loadStats() {
        this.loading = true;
        this.error = '';
        const url = this.divisionId
            ? `${this.apiUrl}/stats/${this.divisionId}`
            : `${this.apiUrl}/stats`;

        this.http.get<any>(url).subscribe({
            next: (data) => {
                this.stats = data;
                this.loading = false;
                setTimeout(() => this.renderCharts(), 150);
            },
            error: (err) => {
                this.error = 'Erreur de chargement des statistiques';
                this.loading = false;
                console.error("Stats error:", err);
            }
        });
    }

    formatBudget(val: number): string {
        if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
        if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
        return `$${val}`;
    }

    get tauxConsommation(): number {
        if (!this.stats || !this.stats.budgetTotal) return 0;
        return Math.round((this.stats.budgetDepense / this.stats.budgetTotal) * 100);
    }

    private destroyCharts() {
        this.charts.forEach(c => { try { c.destroy(); } catch (e) { } });
        this.charts = [];
    }



    renderCharts() {
        this.destroyCharts();
        if (!this.stats || !this.etatChartRef || !this.budgetChartRef || !this.avancementChartRef) return;

        // --- Donut: Projets par état ---
        if (this.etatChartRef?.nativeElement) {
            const etats = this.stats.parEtat || {};
            const etatLabels = Object.keys(etats);
            const etatData = etatLabels.map((k: string) => etats[k]);
            const etatColors = etatLabels.map((k: string) => {
                if (k === 'En Cours') return '#3b82f6';
                if (k === 'Clôturé') return '#10b981';
                if (k === 'En Attente') return '#f59e0b';
                return '#6b7280';
            });

            const c1 = new Chart(this.etatChartRef.nativeElement, {
                type: 'doughnut',
                data: {
                    labels: etatLabels,
                    datasets: [{ data: etatData, backgroundColor: etatColors, borderWidth: 2, borderColor: '#fff' }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { font: { size: 12 } } } }
                }
            });
            this.charts.push(c1);
        }

        // --- Bar: Budget total vs dépensé par division ---
        if (this.budgetChartRef?.nativeElement) {
            const divs = this.stats.parDivision || [];
            const labels = divs.map((d: any) => d.division);
            const c2 = new Chart(this.budgetChartRef.nativeElement, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        { label: 'Budget Total', data: divs.map((d: any) => d.budget_total), backgroundColor: 'rgba(59,130,246,0.7)', borderRadius: 6 },
                        { label: 'Budget Dépensé', data: divs.map((d: any) => d.budget_depense), backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 6 },
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } },
                    scales: { x: { grid: { display: false } }, y: { ticks: { callback: (v: number) => this.formatBudget(v) } } }
                }
            });
            this.charts.push(c2);
        }

        // --- Horizontal Bar: Avancement moyen par division ---
        if (this.avancementChartRef?.nativeElement) {
            const divs = this.stats.parDivision || [];
            const labels = divs.map((d: any) => d.division);
            const c3 = new Chart(this.avancementChartRef.nativeElement, {
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
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { x: { max: 100, ticks: { callback: (v: number) => `${v}%` } }, y: { grid: { display: false } } }
                }
            });
            this.charts.push(c3);
        }
    }
}
