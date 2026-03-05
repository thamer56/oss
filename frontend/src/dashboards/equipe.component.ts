import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../app/services/auth.service';
import { TranslationService } from '../app/services/translation.service';

@Component({
    selector: 'app-equipe',
    templateUrl: './equipe.component.html'
})
export class EquipeComponent implements OnInit {
    currentUser: User | null = null;
    teamMembers: User[] = [];
    allUsers: User[] = [];

    // Password editing state
    editingPasswordId: string | null = null;
    newPassword = '';

    constructor(
        private authService: AuthService,
        private router: Router,
        public translate: TranslationService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.currentUser = this.authService.getCurrentUser();
        this.translate.lang$.subscribe(() => this.cdr.markForCheck());
        if (!this.currentUser) {
            this.router.navigate(['/login']);
            return;
        }

        this.authService.users$.subscribe(users => {
            this.allUsers = users;
            this.filterTeam();
        });
    }

    filterTeam() {
        if (!this.currentUser) return;

        // Règle de Visibilité
        if (this.currentUser.role === 'chef_division') {
            // Chef Division -> Filtre: `role == 'chef_projet'` et `division_id == currentUser.division_id`
            this.teamMembers = this.allUsers.filter(u =>
                u.role === 'chef_projet' && u.division_id === this.currentUser!.division_id
            );
        } else if (['se', 'directeur', 'admin'].includes(this.currentUser.role)) {
            // Admin / SI -> Filtre: pas de filtre, voit tout le monde
            this.teamMembers = this.allUsers;
        } else {
            // Pour les autres (ex: Chef Projet), peut-être voir sa propre division
            this.teamMembers = this.allUsers.filter(u => u.division_id === this.currentUser!.division_id);
        }
    }

    goBack() {
        window.history.back();
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    get canEditPasswords(): boolean {
        return !!this.currentUser && ['admin', 'se'].includes(this.currentUser.role);
    }

    startEditPassword(user: User) {
        if (!user._id) return;
        this.editingPasswordId = user._id;
        this.newPassword = user.password || '';
    }

    savePassword(user: User) {
        if (!user._id || !this.newPassword.trim()) return;
        this.authService.updateUserPassword(user._id, this.newPassword.trim()).subscribe({
            next: () => {
                this.editingPasswordId = null;
                this.newPassword = '';
            },
            error: (err) => console.error(err)
        });
    }

    cancelEditPassword() {
        this.editingPasswordId = null;
        this.newPassword = '';
    }

    getRoleColor(role: string): string {
        const map: { [key: string]: string } = {
            'se': 'bg-purple-100 text-purple-700',
            'directeur': 'bg-red-100 text-red-700',
            'admin': 'bg-slate-800 text-white',
            'chef_division': 'bg-blue-100 text-blue-700',
            'chef_projet': 'bg-emerald-100 text-emerald-700'
        };
        return map[role] || 'bg-gray-100 text-gray-700';
    }
}
