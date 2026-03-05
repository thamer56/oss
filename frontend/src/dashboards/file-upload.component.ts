import { Component, Input, OnInit } from '@angular/core';
import { DocumentService, ProjectDocument } from '../app/services/document.service';

@Component({
    selector: 'app-file-upload',
    template: `
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 class="font-bold text-slate-800 flex items-center gap-2">
                <span class="material-symbols-outlined text-blue-600">attach_file</span>
                Documents &amp; Pièces Jointes
            </h3>
            <span class="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                {{ docs.length }} fichier{{ docs.length !== 1 ? 's' : '' }}
            </span>
        </div>

        <div class="p-5">
            <!-- Dropzone -->
            <div (click)="fileInput.click()" (dragover)="$event.preventDefault()" (drop)="onDrop($event)"
                class="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group">
                <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                    <span class="material-symbols-outlined text-3xl">cloud_upload</span>
                </div>
                <div class="text-center">
                    <p class="text-sm font-bold text-slate-800">Cliquez ou glissez-déposez</p>
                    <p class="text-xs text-slate-500 mt-1">Images, PDF, Vidéos supportés</p>
                </div>
                <input #fileInput type="file" class="hidden" (change)="onFileSelected($event)" multiple accept="image/*,video/*,.pdf">
            </div>

            <!-- Upload Progress -->
            <div *ngIf="uploading" class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-bold text-blue-700">Téléchargement...</span>
                    <span class="text-xs font-bold text-blue-700">{{ uploadProgress }}%</span>
                </div>
                <div class="w-full h-1.5 bg-blue-200 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-600 transition-all duration-300" [style.width.%]="uploadProgress"></div>
                </div>
            </div>

            <!-- File List -->
            <div *ngIf="docs.length > 0" class="mt-5 space-y-3">
                <div *ngFor="let doc of docs"
                    class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors group">

                    <!-- Thumbnail / Icon -->
                    <div class="w-14 h-14 rounded-lg flex-none overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
                        <img *ngIf="isImage(doc.type)" [src]="doc.dataUrl" alt="preview"
                            class="w-full h-full object-cover cursor-pointer" (click)="preview(doc)" />
                        <span *ngIf="isPdf(doc.type)" class="material-symbols-outlined text-red-500 text-3xl">picture_as_pdf</span>
                        <span *ngIf="isVideo(doc.type)" class="material-symbols-outlined text-purple-500 text-3xl">play_circle</span>
                        <span *ngIf="isOther(doc.type)" class="material-symbols-outlined text-slate-400 text-3xl">draft</span>
                    </div>

                    <!-- Info -->
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-bold text-slate-800 truncate">{{ doc.name }}</p>
                        <p class="text-[10px] text-slate-500 font-medium uppercase mt-0.5">{{ doc.size }} &bull; {{ doc.date }}</p>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button (click)="preview(doc)" title="Visualiser"
                            class="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-white transition-all">
                            <span class="material-symbols-outlined text-lg">visibility</span>
                        </button>
                        <button (click)="download(doc)" title="Télécharger"
                            class="p-1.5 text-slate-400 hover:text-emerald-600 rounded-md hover:bg-white transition-all">
                            <span class="material-symbols-outlined text-lg">download</span>
                        </button>
                        <button (click)="remove(doc)" title="Supprimer"
                            class="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-white transition-all">
                            <span class="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div *ngIf="docs.length === 0 && !uploading" class="mt-4 text-center py-4">
                <p class="text-xs text-slate-400 font-medium italic">Aucun document joint pour le moment.</p>
            </div>
        </div>
    </div>

    <!-- Inline Viewer Modal -->
    <div *ngIf="activePreview" class="fixed inset-0 z-[999] bg-black/80 flex items-center justify-center p-4" (click)="activePreview = null">
        <div class="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col" (click)="$event.stopPropagation()">
            <!-- Header -->
            <div class="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
                <span class="font-bold text-slate-800 text-sm truncate">{{ activePreview.name }}</span>
                <div class="flex gap-2">
                    <button (click)="download(activePreview)" class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <span class="material-symbols-outlined">download</span>
                    </button>
                    <button (click)="activePreview = null" class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
            </div>
            <!-- Body -->
            <div class="flex-1 overflow-auto flex items-center justify-center bg-slate-900 p-4" style="min-height:300px">
                <img *ngIf="isImage(activePreview.type)" [src]="activePreview.dataUrl" alt="preview" class="max-w-full max-h-[75vh] rounded-lg object-contain shadow-lg" />
                <video *ngIf="isVideo(activePreview.type)" [src]="activePreview.dataUrl" controls autoplay class="max-w-full max-h-[75vh] rounded-lg shadow-lg"></video>
                <iframe *ngIf="isPdf(activePreview.type)" [src]="activePreview.dataUrl | safeUrl" class="w-full h-[75vh] rounded-lg" frameborder="0"></iframe>
                <div *ngIf="isOther(activePreview.type)" class="text-center text-white">
                    <span class="material-symbols-outlined text-6xl mb-4 block">draft</span>
                    <p class="font-bold">Aperçu non disponible</p>
                    <button (click)="download(activePreview)" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">
                        Télécharger le fichier
                    </button>
                </div>
            </div>
        </div>
    </div>
    `
})
export class FileUploadComponent implements OnInit {
    @Input() projectId: string = '';

    docs: ProjectDocument[] = [];
    uploading = false;
    uploadProgress = 0;
    activePreview: ProjectDocument | null = null;

    constructor(private docService: DocumentService) { }

    ngOnInit() {
        this.docs = this.docService.getDocuments(this.projectId);
    }

    onFileSelected(event: any) {
        this.processFiles(event.target.files);
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        if (event.dataTransfer?.files) {
            this.processFiles(event.dataTransfer.files);
        }
    }

    async processFiles(fileList: FileList) {
        this.uploading = true;
        this.uploadProgress = 0;

        // Animate progress bar
        const interval = setInterval(() => {
            if (this.uploadProgress < 85) this.uploadProgress += 15;
        }, 100);

        for (let i = 0; i < fileList.length; i++) {
            await this.docService.readAndStore(this.projectId, fileList[i]);
        }

        clearInterval(interval);
        this.uploadProgress = 100;
        setTimeout(() => {
            this.uploading = false;
            this.uploadProgress = 0;
            this.docs = this.docService.getDocuments(this.projectId);
        }, 400);
    }

    remove(doc: ProjectDocument) {
        this.docService.removeDocument(this.projectId, doc.id);
        this.docs = this.docService.getDocuments(this.projectId);
    }

    download(doc: ProjectDocument) {
        this.docService.downloadDocument(doc);
    }

    preview(doc: ProjectDocument) {
        this.activePreview = doc;
    }

    isImage(type: string) { return type.startsWith('image/'); }
    isVideo(type: string) { return type.startsWith('video/'); }
    isPdf(type: string) { return type === 'application/pdf'; }
    isOther(type: string) { return !this.isImage(type) && !this.isVideo(type) && !this.isPdf(type); }
}
