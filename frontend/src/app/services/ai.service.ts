import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from './project.service';

@Injectable({
    providedIn: 'root'
})
export class AiService {
    private backendUrl = `http://${window.location.hostname}:3000/api/ai/generate-tasks`;

    constructor(private http: HttpClient) { }

    generateTasks(description: string): Observable<{ tasks: Task[] }> {
        return this.http.post<{ tasks: Task[] }>(this.backendUrl, { description });
    }

    chat(message: string, context: any = {}): Observable<{ response: string }> {
        return this.http.post<{ response: string }>(`http://${window.location.hostname}:3000/api/ai/chat`, { message, context });
    }
}
