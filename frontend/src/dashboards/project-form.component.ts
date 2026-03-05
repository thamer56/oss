import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Project } from '../app/services/project.service';

@Component({
    selector: 'app-project-form',
    template: `
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <!-- Header -->
            <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                    <h2 class="text-xl font-bold text-slate-800">{{ isEdit ? 'Modifier le Projet' : 'Nouveau Projet' }}</h2>
                    <p class="text-xs text-slate-500 font-medium">Remplissez les détails pour {{ isEdit ? 'mettre à jour' : 'créer' }} le projet.</p>
                </div>
                <button (click)="close.emit()" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <!-- Form Body -->
            <div class="p-6 max-h-[70vh] overflow-y-auto">
                <form #projectForm="ngForm" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-1.5 md:col-span-2">
                            <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">Nom du Projet</label>
                            <input type="text" name="nom_projet" [(ngModel)]="model.nom_projet" required
                                class="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                placeholder="ex: Technologies innovantes de Dé-Fluoridation...">
                        </div>

                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">ID / Acronyme</label>
                            <input type="text" name="acronyme" [(ngModel)]="model.acronyme" required
                                class="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none" placeholder="ex: FLOWERED">
                        </div>

                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">Axe / Division ID</label>
                            <select name="division_id" [(ngModel)]="model.division_id" required
                                class="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none">
                                <option value="D01">D01 (Climat)</option>
                                <option value="D02">D02 (Eau)</option>
                                <option value="D03">D03 (Terre)</option>
                                <option value="D04">D04 (Biodiversité)</option>
                            </select>
                        </div>

                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">Budget Global ($)</label>
                            <input type="number" name="budget_total" [(ngModel)]="model.budget_total" required
                                class="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none">
                        </div>

                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">Budget Consommé ($)</label>
                            <input type="number" name="budget_depense" [(ngModel)]="model.budget_depense"
                                class="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none">
                        </div>

                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">Année Début</label>
                            <input type="number" name="annee_debut" [(ngModel)]="model.annee_debut"
                                class="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none" placeholder="ex: 2024">
                        </div>
                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">Année Fin</label>
                            <input type="number" name="annee_fin" [(ngModel)]="model.annee_fin"
                                class="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none" placeholder="ex: 2028">
                        </div>

                        <div class="space-y-1.5 md:col-span-2">
                            <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">Pays Bénéficiaires</label>
                            <input type="text" name="beneficiaires_pays" [(ngModel)]="model.beneficiaires_pays"
                                class="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none" placeholder="ex: Ethiopie, Kenya...">
                        </div>

                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">Statut</label>
                            <select name="etat" [(ngModel)]="model.etat" required
                                class="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none">
                                <option value="En Cours">En Cours</option>
                                <option value="Clôturé">Clôturé</option>
                                <option value="En Retard">En Retard</option>
                                <option value="A Risque">A Risque</option>
                            </select>
                        </div>

                        <div class="space-y-1.5 md:col-span-2">
                            <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">Description</label>
                            <textarea name="description" [(ngModel)]="model.description" rows="3"
                                class="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none" placeholder="Détails du projet..."></textarea>
                        </div>
                    </div>
                </form>
            </div>

            <!-- Footer -->
            <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
                <button (click)="close.emit()" 
                    class="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all">
                    Annuler
                </button>
                <button (click)="submit()" [disabled]="!projectForm.valid"
                    class="px-8 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:shadow-none">
                    {{ isEdit ? 'Mettre à jour' : 'Créer le Projet' }}
                </button>
            </div>
        </div>
    </div>
    `
})
export class ProjectFormComponent {
    @Input() isEdit: boolean = false;
    @Input() model: any = {
        id_projet: '',
        nom_projet: '',
        acronyme: '',
        division_id: 'D02',
        etat: 'En Cours',
        annee_debut: new Date().getFullYear(),
        annee_fin: new Date().getFullYear() + 1,
        theme_principal: '',
        budget_total: 0,
        beneficiaires_pays: '',
        partenaires_financiers: '',
        description: ''
    };

    @Output() save = new EventEmitter<any>();
    @Output() close = new EventEmitter<void>();

    submit() {
        if (!this.model.id_projet) {
            this.model.id_projet = this.model.acronyme.toUpperCase();
        }
        this.save.emit(this.model);
    }
}
