import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../app/services/auth.service';
import { TranslationService } from '../app/services/translation.service';

@Component({
    selector: 'app-user-signup',
    templateUrl: './user-signup.component.html',
    styles: [`
        .oss-split-bg {
            background: #f8fafc;
        }
    `]
})
export class UserSignupComponent {
    model: any = {
        nom: '',
        username: '',
        role: '',
        division_id: '',
        projet: '',
        password: ''
    };

    divisions = ['Eau', 'Climat', 'Terre', 'Biodiversite'];
    roles = [
        { label: 'Directeur', value: 'Directeur' },
        { label: 'Chef de Division', value: 'Chef Division' },
        { label: 'Chef de Projet', value: 'Chef Projet' }
    ];

    requiresDivision(): boolean {
        return this.model.role === 'chef_division' || this.model.role === 'chef_projet';
    }

    onRoleChange() {
        if (!this.requiresDivision()) {
            this.model.division_id = 'ALL';
        } else {
            this.model.division_id = '';
        }
    }

    constructor(private authService: AuthService, private router: Router, public translate: TranslationService) { }

    createAccount() {
        if (!this.model.nom || !this.model.username || !this.model.role) {
            alert(this.translate.t.required);
            return;
        }
        if (!this.model.password) {
            this.model.password = 'OSS2024';
        }
        this.authService.addUser({ ...this.model });
        alert(this.translate.t.userCreated);
        this.router.navigate(['/super-admin']);
    }

    cancel() {
        this.router.navigate(['/super-admin']);
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
