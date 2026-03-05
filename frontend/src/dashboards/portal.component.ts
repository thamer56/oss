import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../app/services/auth.service';

@Component({
    selector: 'app-portal',
    templateUrl: './portal.component.html',
})
export class PortalComponent implements OnInit {
    constructor(private authService: AuthService, private router: Router) { }

    ngOnInit() {
        const user = this.authService.getCurrentUser();
        if (user) {
            const route = this.authService.getDashboardRoute(user.role);
            this.router.navigate([route]);
        } else {
            this.router.navigate(['/login']);
        }
    }
}
