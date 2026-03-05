import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Notification {
    id: string;
    message: string;
    targetRole?: string;
    targetUsername?: string;
    targetDivision?: string;
    read: boolean;
    createdAt: Date;
    projectId?: string;
    projectName?: string;
    icon: string;
    type: 'info' | 'success' | 'warning';
    changedBy?: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private readonly API = `${environment.apiUrl}/notifications`;
    private notificationsSubject = new BehaviorSubject<Notification[]>([]);
    public notifications$ = this.notificationsSubject.asObservable();

    constructor(private http: HttpClient) { }

    private get notifications(): Notification[] {
        return this.notificationsSubject.getValue();
    }

    /**
     * Load notifications from the backend for the given user (call after login).
     */
    loadNotifications(username: string, role: string, divisionId?: string): void {
        let params: any = { username, role };
        if (divisionId) params['divisionId'] = divisionId;
        this.http.get<Notification[]>(this.API, { params }).subscribe({
            next: (notifs) => this.notificationsSubject.next(notifs),
            error: (err) => console.error('Failed to load notifications', err)
        });
    }

    /**
     * Returns the currently cached notifications filtered for a user.
     * After calling loadNotifications() the subject already contains the right list.
     */
    getNotificationsForUser(username: string, role: string, divisionId?: string): Notification[] {
        return this.notifications;
    }

    /**
     * Adds a notification by posting to the backend.
     */
    addNotification(notif: Omit<Notification, 'id' | 'createdAt'>): void {
        this.http.post<Notification>(this.API, notif).subscribe({
            next: (created) => {
                const updated = [created, ...this.notifications].slice(0, 200);
                this.notificationsSubject.next(updated);
            },
            error: (err) => console.error('Failed to create notification', err)
        });
    }

    markRead(id: string): void {
        this.http.put<Notification>(`${this.API}/${id}/read`, {}).subscribe({
            next: () => {
                const updated = this.notifications.map(n =>
                    n.id === id ? { ...n, read: true } : n
                );
                this.notificationsSubject.next(updated);
            },
            error: (err) => console.error('Failed to mark read', err)
        });
    }

    markAllRead(username: string, role: string, divisionId?: string): void {
        let params: any = { username, role };
        if (divisionId) params['divisionId'] = divisionId;
        this.http.put(`${this.API}/mark-all-read`, {}, { params }).subscribe({
            next: () => {
                const updated = this.notifications.map(n => ({ ...n, read: true }));
                this.notificationsSubject.next(updated);
            },
            error: (err) => console.error('Failed to mark all read', err)
        });
    }

    getUnreadCount(username: string, role: string, divisionId?: string): number {
        return this.notifications.filter(n => !n.read).length;
    }

    // ── Notification helpers (same interface as before) ──────────────────────

    notifyProjectCreated(
        projectName: string,
        projectId: string,
        division: string,
        chefDivisionUsername: string,
        chefProjetUsername: string,
        chefProjetName: string,
        createdByName: string
    ) {
        if (chefProjetUsername) {
            this.addNotification({
                message: `Vous avez été assigné(e) au projet "${projectName}". Bonne chance !`,
                targetUsername: chefProjetUsername,
                read: false, projectId, projectName,
                icon: 'assignment_ind', type: 'success', changedBy: createdByName
            });
        }
        if (chefDivisionUsername) {
            this.addNotification({
                message: `Nouveau projet "${projectName}" créé dans votre division (${division}) par ${createdByName}.`,
                targetUsername: chefDivisionUsername,
                read: false, projectId, projectName,
                icon: 'add_circle', type: 'info', changedBy: createdByName
            });
        }
        this.addNotification({
            message: `Nouveau projet "${projectName}" créé (${division}) par ${createdByName}.`,
            targetRole: 'directeur', targetDivision: division,
            read: false, projectId, projectName,
            icon: 'dashboard', type: 'info', changedBy: createdByName
        });
        this.addNotification({
            message: `Nouveau projet créé : "${projectName}" (Division: ${division}) — Chef: ${chefProjetName || 'non assigné'} par ${createdByName}.`,
            targetRole: 'se',
            read: false, projectId, projectName,
            icon: 'dashboard', type: 'info', changedBy: createdByName
        });
    }

    notifyBudgetChanged(
        projectName: string,
        projectId: string,
        division: string,
        chefProjetUsername: string,
        oldBudget: number,
        newBudget: number,
        changedByName: string,
        isDepense: boolean
    ) {
        const budgetLabel = isDepense ? 'Budget dépensé' : 'Budget total';
        const message = `${budgetLabel} du projet "${projectName}" mis à jour: ${oldBudget.toLocaleString()} → ${newBudget.toLocaleString()} USD par ${changedByName}.`;

        if (chefProjetUsername) {
            this.addNotification({
                message, targetUsername: chefProjetUsername,
                read: false, projectId, projectName,
                icon: 'account_balance_wallet', type: 'info', changedBy: changedByName
            });
        }
        this.addNotification({
            message, targetRole: 'chef_division', targetDivision: division,
            read: false, projectId, projectName,
            icon: 'account_balance_wallet', type: isDepense ? 'warning' : 'info', changedBy: changedByName
        });
        this.addNotification({
            message, targetRole: 'directeur',
            read: false, projectId, projectName,
            icon: 'account_balance_wallet', type: 'info', changedBy: changedByName
        });
        this.addNotification({
            message, targetRole: 'se',
            read: false, projectId, projectName,
            icon: 'account_balance_wallet', type: 'info', changedBy: changedByName
        });
    }

    notifyStatusChanged(
        projectName: string,
        projectId: string,
        division: string,
        chefProjetUsername: string,
        oldStatus: string,
        newStatus: string,
        changedByName: string
    ) {
        const message = `Statut du projet "${projectName}" changé : "${oldStatus}" → "${newStatus}" par ${changedByName}.`;
        const type: 'warning' | 'info' = (newStatus === 'En Retard' || newStatus === 'A Risque') ? 'warning' : 'info';

        if (chefProjetUsername) {
            this.addNotification({
                message, targetUsername: chefProjetUsername,
                read: false, projectId, projectName,
                icon: 'update', type, changedBy: changedByName
            });
        }
        this.addNotification({
            message, targetRole: 'chef_division', targetDivision: division,
            read: false, projectId, projectName,
            icon: 'update', type, changedBy: changedByName
        });
        this.addNotification({
            message, targetRole: 'directeur',
            read: false, projectId, projectName,
            icon: 'update', type: 'info', changedBy: changedByName
        });
        this.addNotification({
            message, targetRole: 'se',
            read: false, projectId, projectName,
            icon: 'update', type: 'info', changedBy: changedByName
        });
    }

    notifyTaskToggled(
        projectName: string,
        projectId: string,
        division: string,
        chefProjetUsername: string,
        taskTitle: string,
        isCompleted: boolean,
        changedByName: string
    ) {
        const statusText = isCompleted ? 'terminée' : 'marquée non-terminée';
        const message = `Tâche "${taskTitle}" ${statusText} sur le projet "${projectName}" par ${changedByName}.`;
        const type: 'success' | 'info' = isCompleted ? 'success' : 'info';
        const icon = isCompleted ? 'check_circle' : 'radio_button_unchecked';

        if (chefProjetUsername) {
            this.addNotification({
                message, targetUsername: chefProjetUsername,
                read: false, projectId, projectName,
                icon, type, changedBy: changedByName
            });
        }
        this.addNotification({
            message, targetRole: 'chef_division', targetDivision: division,
            read: false, projectId, projectName,
            icon, type, changedBy: changedByName
        });
        this.addNotification({
            message, targetRole: 'directeur',
            read: false, projectId, projectName,
            icon, type, changedBy: changedByName
        });
        this.addNotification({
            message, targetRole: 'se',
            read: false, projectId, projectName,
            icon, type, changedBy: changedByName
        });
    }
}
