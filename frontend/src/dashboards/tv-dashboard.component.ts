import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../app/services/auth.service';
import { ProjectService, Project } from '../app/services/project.service';
import { NotificationService } from '../app/services/notification.service';

@Component({
    selector: 'app-tv-dashboard',
    templateUrl: './tv-dashboard.component.html',
    styleUrls: ['./tv-dashboard.component.css']
})
export class TvDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('scrollContainer') scrollContainer!: ElementRef;

    projects: Project[] = [];
    refreshInterval: any;
    user: any = null;
    isFullscreen = false;

    get activities() {
        if (!this.user) return [];
        return this.notifService
            .getNotificationsForUser(this.user.username, this.user.role, this.user.division_id)
            .slice(0, 5)
            .map(n => {
                let color = 'blue';
                let typeText = 'SYSTÈME';
                if (n.type === 'success') { color = 'emerald'; typeText = 'PROJET'; }
                else if (n.type === 'warning') { color = 'amber'; typeText = 'ALERTE'; }
                else if (n.message.includes('Ajouté')) { color = 'blue'; typeText = 'ADMIN'; }

                const diffMins = Math.floor((new Date().getTime() - new Date(n.createdAt).getTime()) / 60000);
                const diffHrs = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHrs / 24);
                let timeStr = "à l'instant";
                if (diffDays > 0) timeStr = `il y a ${diffDays}j`;
                else if (diffHrs > 0) timeStr = `il y a ${diffHrs}h`;
                else if (diffMins > 0) timeStr = `il y a ${diffMins}m`;

                return {
                    icon: n.icon || 'info', color: color,
                    title: n.projectName || 'Notification',
                    time: timeStr, description: n.message, type: typeText
                };
            });
    }

    constructor(
        private authService: AuthService,
        private projectService: ProjectService,
        private notifService: NotificationService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.user = this.authService.getCurrentUser();
        if (!this.user || !['se', 'superadmin', 'directeur'].includes(this.user.role.toLowerCase())) {
            this.router.navigate(['/login']);
            return;
        }

        this.loadData();
        this.projectService.projects$.subscribe(projs => {
            this.projects = projs;
        });

        // Auto-refresh data every 60 seconds
        this.refreshInterval = setInterval(() => {
            this.loadData();
        }, 60000);

        // Listen for fullscreen changes (e.g., when user presses Esc)
        document.addEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
    }

    onFullscreenChange() {
        this.isFullscreen = !!document.fullscreenElement;
    }

    loadData() {
        if (this.user) {
            this.notifService.loadNotifications(this.user.username, this.user.role, this.user.division_id);
            this.projectService.fetchProjects();
        }
    }

    ngAfterViewInit(): void {
        // Auto-scroll disabled per user request
    }

    ngOnDestroy(): void {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        document.removeEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
    }

    toggleFullscreen() {
        if (!this.isFullscreen) {
            document.documentElement.requestFullscreen().then(() => {
                this.isFullscreen = true;
            }).catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().then(() => {
                    this.isFullscreen = false;
                }).catch(err => console.error(err));
            }
        }
    }

    exitTvMode() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
