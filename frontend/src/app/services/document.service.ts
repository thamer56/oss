import { Injectable } from '@angular/core';

export interface ProjectDocument {
    id: string;
    name: string;
    size: string;
    type: string;       // MIME type e.g. 'image/jpeg', 'application/pdf', 'video/mp4'
    date: string;
    dataUrl: string;    // base64 data URL for preview / download
}

@Injectable({
    providedIn: 'root'
})
export class DocumentService {
    /** Map<projectId, documents> */
    private store = new Map<string, ProjectDocument[]>();

    constructor() {
        this.loadFromStorage();
    }

    private loadFromStorage() {
        try {
            const data = localStorage.getItem('oss_project_documents');
            if (data) {
                const parsed = JSON.parse(data);
                for (const key of Object.keys(parsed)) {
                    this.store.set(key, parsed[key]);
                }
            }
        } catch (e) {
            console.error('Failed to load documents', e);
        }
    }

    private saveToStorage() {
        try {
            const obj: any = {};
            this.store.forEach((value, key) => {
                obj[key] = value;
            });
            localStorage.setItem('oss_project_documents', JSON.stringify(obj));
        } catch (e) {
            console.error('LocalStorage quota exceeded or failed to save documents', e);
            alert('Attention : L\'espace de stockage local est plein. Impossible de sauvegarder plus de documents en mémoire cache.');
        }
    }

    getDocuments(projectId: string): ProjectDocument[] {
        return this.store.get(projectId) || [];
    }

    addDocument(projectId: string, doc: ProjectDocument): void {
        const docs = this.getDocuments(projectId);
        this.store.set(projectId, [doc, ...docs]);
        this.saveToStorage();
    }

    removeDocument(projectId: string, docId: string): void {
        const docs = this.getDocuments(projectId).filter(d => d.id !== docId);
        this.store.set(projectId, docs);
        this.saveToStorage();
    }

    /** Trigger a browser download */
    downloadDocument(doc: ProjectDocument): void {
        const a = document.createElement('a');
        a.href = doc.dataUrl;
        a.download = doc.name;
        a.click();
    }

    /** Read a File object and store it for the given project. Returns promise when done. */
    readAndStore(projectId: string, file: File): Promise<ProjectDocument> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                const doc: ProjectDocument = {
                    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    name: file.name,
                    size: this.formatBytes(file.size),
                    type: file.type,
                    date: new Date().toLocaleDateString('fr-FR'),
                    dataUrl: e.target.result
                };
                this.addDocument(projectId, doc);
                resolve(doc);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}
