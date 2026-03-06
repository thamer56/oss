import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../app/services/auth.service';
import { ProjectService, Project } from '../app/services/project.service';

@Component({
    selector: 'app-tv-dashboard',
    templateUrl: './tv-dashboard.component.html',
    styleUrls: ['./tv-dashboard.component.css']
})
export class TvDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('scrollContainer') scrollContainer!: ElementRef;

    projects: Project[] = [];
    scrollInterval: any;
    isFullscreen = false;
    currentTime = new Date();
    clockInterval: any;

    constructor(
        private authService: AuthService,
        private projectService: ProjectService,
        private router: Router
    ) { }

    ngOnInit(): void {
        const user = this.authService.getCurrentUser();
        if (!user || !['se', 'superadmin', 'directeur'].includes(user.role.toLowerCase())) {
            this.router.navigate(['/login']);
            return;
        }

        // Combine all projects for the TV view
        this.projectService.projects$.subscribe(projs => {
            this.projects = projs.slice(0, 15); // Show latest 15 projects
        });

        this.clockInterval = setInterval(() => {
            this.currentTime = new Date();
        }, 1000);
    }

    ngAfterViewInit(): void {
        this.startAutoScroll();
    }

    ngOnDestroy(): void {
        if (this.scrollInterval) clearInterval(this.scrollInterval);
        if (this.clockInterval) clearInterval(this.clockInterval);
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                this.isFullscreen = true;
            }).catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                this.isFullscreen = false;
            }
        }
    }

    startAutoScroll() {
        if (!this.scrollContainer) return;

        let container = this.scrollContainer.nativeElement;
        let scrollPos = 0;

        this.scrollInterval = setInterval(() => {
            // Scroll down by 1 pixel slowly
            scrollPos += 1;
            container.scrollTop = scrollPos;

            // If arrived at bottom, wait a bit then jump back to top
            if (container.scrollTop + container.clientHeight >= container.scrollHeight - 2) {
                clearInterval(this.scrollInterval);
                setTimeout(() => {
                    scrollPos = 0;
                    container.scrollTop = 0;
                    this.startAutoScroll();
                }, 5000); // Wait 5 seconds at the bottom before resetting
            }
        }, 40); // 40ms = approx 25fps smooth scrolling
    }

    exitTvMode() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
