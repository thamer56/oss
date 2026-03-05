import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface User {
    _id?: string;
    id_user?: string;
    nom: string;
    username: string;
    email: string;
    role: string;
    division_id?: string;
    projet_id?: string;
    password?: string;
    is_active?: boolean;
    must_change_password?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = `http://${window.location.hostname}:3000/api`;
    private usersCache = new BehaviorSubject<User[]>([]);
    public users$ = this.usersCache.asObservable();
    private currentUserCache = new BehaviorSubject<User | null>(null); // Added this line
    public currentUser$ = this.currentUserCache.asObservable(); // Added this line

    constructor(private http: HttpClient) {
        this.fetchUsers();
        const storedUser = localStorage.getItem('currentUser'); // Added this line
        if (storedUser) { // Added this line
            this.currentUserCache.next(JSON.parse(storedUser)); // Added this line
        } // Added this line
    }

    login(email: string, password: string): Observable<User | null> {
        return this.http.post<{ message: string, user: User }>(`${this.apiUrl}/login`, { email, password }).pipe(
            map(response => {
                if (response && response.user) {
                    localStorage.setItem('currentUser', JSON.stringify(response.user)); // Kept this line from original
                    this.currentUserCache.next(response.user);
                    return response.user;
                }
                return null;
            }),
            catchError(err => {
                console.error("Login failed", err);
                return of(null);
            })
        );
    }

    getCurrentUser(): User | null {
        // This method now relies on the BehaviorSubject for consistency
        return this.currentUserCache.getValue();
    }

    logout() {
        localStorage.removeItem('currentUser');
    }

    fetchUsers() {
        this.http.get<User[]>(`${this.apiUrl}/users`).subscribe({
            next: (data) => this.usersCache.next(data),
            error: (err) => console.error("Error fetching users", err)
        });

        // Ensure SI user exists based on our plan
        this.http.post(`${this.apiUrl}/users/check-si`, {}).subscribe();
    }

    addUser(user: User): void {
        this.http.post(`${this.apiUrl}/users`, user).subscribe({
            next: () => this.fetchUsers(),
            error: (err) => console.error("Error creating user", err)
        });
    }

    updateUserPassword(userId: string, password: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/users/${userId}/password`, { password }).pipe(
            tap(() => this.fetchUsers())
        );
    }

    getAllUsers(): User[] {
        return this.usersCache.getValue();
    }

    getUsersByDivision(divisionId: string): User[] {
        return this.getAllUsers().filter(u =>
            u.role === 'chef_projet' && u.division_id === divisionId
        );
    }

    canCreateProject(user: User): boolean {
        return ['se', 'directeur', 'chef_division'].includes(user.role?.toLowerCase() || "");
    }

    getDashboardRoute(role: string): string {
        switch (role?.toLowerCase()) {
            case 'se':
                return '/super-admin';
            case 'directeur':
                return '/director';
            case 'chef_division':
                return '/division-chief';
            case 'chef_projet':
                return '/project-manager';
            default:
                return '/login';
        }
    }
}
