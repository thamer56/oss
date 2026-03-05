import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../app/services/auth.service';
import { ProjectService, Project } from '../app/services/project.service';
import { TranslationService } from '../app/services/translation.service';

@Component({
    selector: 'app-budget',
    templateUrl: './budget.component.html',
})
export class BudgetComponent implements OnInit {
    user: User | null = null;
    projects: Project[] = [];
    allProjects: Project[] = [];

    // Stats
    totalBudget: number = 0;
    totalSpent: number = 0;

    // For HTML template mathematical operations
    math = Math;

    // Filters
    filterYear: string = '';
    filterDivision: string = '';

    get availableYears(): string[] {
        const years = new Set<string>();
        this.allProjects.forEach(p => { if (p.annee_debut) years.add(String(p.annee_debut)); });
        return Array.from(years).sort((a, b) => +b - +a);
    }

    get activeFilterCount() { return [this.filterYear, this.filterDivision].filter(f => f).length; }

    constructor(
        private authService: AuthService,
        private projectService: ProjectService,
        private router: Router,
        public translate: TranslationService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.user = this.authService.getCurrentUser();
        if (!this.user) {
            this.router.navigate(['/login']);
            return;
        }

        this.translate.lang$.subscribe(() => this.cdr.markForCheck());

        // Initial fetch logic based on user role
        this.projectService.projects$.subscribe(() => {
            if (this.user?.role === 'se' || this.user?.role === 'directeur') {
                this.allProjects = this.projectService.getAllProjects();
            } else if (this.user?.role === 'chef_division') {
                this.allProjects = this.projectService.getProjectsByDivision(this.user.division_id || "");
            } else if (this.user?.role === 'chef_projet') {
                const proj = this.projectService.getProjectByChefProjet(this.user.id_user || "");
                this.allProjects = proj ? [proj] : [];
            } else {
                this.allProjects = [];
            }

            this.applyFilters();
        });
    }

    applyFilters() {
        this.projects = this.allProjects.filter(p => {
            const yearOk = !this.filterYear || +p.annee_debut! === +this.filterYear || +p.annee_fin! === +this.filterYear;
            const divOk = !this.filterDivision || p.division_id === this.filterDivision;
            return yearOk && divOk;
        });

        this.calculateStats();
    }

    resetFilters() {
        this.filterYear = '';
        this.filterDivision = '';
        this.applyFilters();
    }

    calculateStats() {
        this.totalBudget = this.projects.reduce((sum, p) => sum + (p.budget_total || 0), 0);
        this.totalSpent = this.projects.reduce((sum, p) => sum + (p.budget_depense || 0), 0);
    }

    get burnRate(): number {
        if (this.totalBudget === 0) return 0;
        return Math.round((this.totalSpent / this.totalBudget) * 100);
    }

    get remainingBudget(): number {
        return Math.max(0, this.totalBudget - this.totalSpent);
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    goBack() {
        window.history.back();
    }
}
