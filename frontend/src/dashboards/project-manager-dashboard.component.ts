import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../app/services/auth.service';
import { ProjectService, Project } from '../app/services/project.service';
import { NotificationService } from '../app/services/notification.service';
import { TranslationService } from '../app/services/translation.service';

@Component({
    selector: 'app-project-manager-dashboard',
    templateUrl: './project-manager-dashboard.component.html',
    styleUrls: ['./project-manager-dashboard.component.css'],
})
export class ProjectManagerDashboardComponent implements OnInit {
    user: User | null = null;
    projects: Project[] = [];
    showNotifPanel = false;

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
        if (!this.user) { this.router.navigate(['/login']); return; }
        // Load notifications from backend (shared between mobile & web)
        this.notifService.loadNotifications(this.user.username, this.user.role, this.user.division_id);
        this.notifService.notifications$.subscribe(() => this.cdr.markForCheck());
        this.translate.lang$.subscribe(() => this.cdr.markForCheck());
        this.projectService.projects$.subscribe(() => this.refreshProjectData());
    }

    refreshProjectData() {
        if (!this.user) return;
        const all = this.projectService.getAllProjects();
        // Show all projects assigned to this chef_projet by id_user
        this.projects = all.filter(p =>
            p.chef_projet_id === this.user!.id_user ||
            p.id_projet === this.user!.projet_id
        );
    }

    get notifications() {
        if (!this.user) return [];
        return this.notifService.getNotificationsForUser(this.user.username, this.user.role, this.user.division_id);
    }

    get unreadCount(): number {
        if (!this.user) return 0;
        return this.notifService.getUnreadCount(this.user.username, this.user.role, this.user.division_id);
    }

    get activeCount(): number {
        return this.projects.filter(p => p.etat === 'En Cours').length;
    }

    get totalBudget(): number {
        return this.projects.reduce((s, p) => s + (p.budget_total || 0), 0);
    }

    getProgress(p: Project): number {
        if (!p.tasks || p.tasks.length === 0) return 0;
        const done = p.tasks.filter((t: any) => t.completed).length;
        return Math.round((done / p.tasks.length) * 100);
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

    goToProject(p: Project) {
        this.router.navigate(['/project', p.id_projet]);
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
