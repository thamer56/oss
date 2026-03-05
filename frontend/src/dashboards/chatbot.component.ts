import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AiService } from '../app/services/ai.service';
import { AuthService } from '../app/services/auth.service';
import { TranslationService } from '../app/services/translation.service';

interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

@Component({
    selector: 'app-chatbot',
    templateUrl: './chatbot.component.html'
})
export class ChatbotComponent {
    isOpen = false;
    inputText = '';
    isWaiting = false;
    messages: ChatMessage[] = [];

    @ViewChild('chatWindow') chatWindow?: ElementRef;

    constructor(
        private aiService: AiService,
        private authService: AuthService,
        private router: Router,
        public translate: TranslationService
    ) {
        this.messages = [{ sender: 'ai', text: this.translate.t.chatWelcome }];
    }

    get isLoginRoute(): boolean {
        return this.router.url === '/login' || this.router.url === '/';
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            setTimeout(() => this.scrollToBottom(), 100);
        }
    }

    sendMessage() {
        if (!this.inputText.trim() || this.isWaiting) return;
        const currentUser = this.authService.getCurrentUser();
        // Check if user is logged in
        if (!currentUser) {
            this.messages.push({ sender: 'ai', text: this.translate.t.chatLoginRequired });
            this.inputText = '';
            return;
        }

        const text = this.inputText.trim();
        this.messages.push({ sender: 'user', text });
        this.inputText = '';
        this.isWaiting = true;
        this.scrollToBottom();

        const context = {
            lang: this.translate.lang,
            role: currentUser.role,
            division: currentUser.division_id || 'Toutes'
        };

        this.aiService.chat(text, context).subscribe({
            next: (res) => {
                this.messages.push({ sender: 'ai', text: res.response });
                this.isWaiting = false;
                this.scrollToBottom();
            },
            error: (err) => {
                console.error(err);
                this.messages.push({ sender: 'ai', text: this.translate.t.chatError });
                this.isWaiting = false;
                this.scrollToBottom();
            }
        });
    }

    scrollToBottom() {
        if (this.chatWindow) {
            setTimeout(() => {
                const el = this.chatWindow!.nativeElement;
                el.scrollTop = el.scrollHeight;
            }, 50);
        }
    }

    formatMessage(text: string): string {
        if (!text) return '';
        let html = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\n\s*[-*]\s+(.*)/g, '<br>• $1');
        html = html.replace(/\n/g, '<br>');
        return html;
    }
}
