import {
    Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener, ChangeDetectorRef
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AiService } from '../app/services/ai.service';
import { AuthService } from '../app/services/auth.service';
import { TranslationService } from '../app/services/translation.service';
import { filter } from 'rxjs/operators';

interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

@Component({
    selector: 'app-chatbot',
    templateUrl: './chatbot.component.html',
    styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit, OnDestroy {
    isOpen = false;
    inputText = '';
    isWaiting = false;
    messages: ChatMessage[] = [];

    // Bot state
    eyeX = 0;       // pupil horizontal offset px
    eyeY = 0;       // pupil vertical offset px
    headRotY = 0;   // head horizontal tilt deg
    headRotX = 0;   // head vertical tilt from scroll deg
    isWaving = false;
    isJumping = false;
    showWelcome = false;
    welcomeText = '';

    @ViewChild('chatWindow') chatWindow?: ElementRef;
    @ViewChild('botEl') botEl?: ElementRef;

    private scrollTimer: any;
    private lastScrollY = 0;

    constructor(
        private aiService: AiService,
        private authService: AuthService,
        private router: Router,
        public translate: TranslationService,
        private cdr: ChangeDetectorRef
    ) {
        this.messages = [{ sender: 'ai', text: this.translate.t.chatWelcome }];
    }

    ngOnInit() {
        // Show welcome bubble on each login (navigating from /login → dashboard)
        this.router.events.pipe(
            filter(e => e instanceof NavigationEnd)
        ).subscribe((e: any) => {
            const url: string = e.urlAfterRedirects || e.url || '';
            if (!url.includes('/login') && !url.includes('/tv-display') && !url.includes('/portal')) {
                this.welcomeText = 'Bienvenue ! 👋';
                this.showWelcome = true;
                this.isWaving = true;   // wave on login arrival
                setTimeout(() => {
                    this.showWelcome = false;
                    this.isWaving = false;
                    this.cdr.detectChanges();
                }, 2200);
                this.cdr.detectChanges();
            }
        });

        this.lastScrollY = window.scrollY;
    }

    ngOnDestroy() {
        clearTimeout(this.scrollTimer);
    }

    get isLoginRoute(): boolean {
        const url = this.router.url;
        return url === '/login' || url === '/' || url.includes('/portal');
    }

    // ── Cursor tracking → eyes follow ──────────────────────────────────────
    @HostListener('document:mousemove', ['$event'])
    onMouseMove(e: MouseEvent) {
        if (!this.botEl) return;
        const rect = this.botEl.nativeElement.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.max(80, Math.sqrt(dx * dx + dy * dy));

        // No pupil movement — head rotates instead
        this.eyeX = 0;
        this.eyeY = 0;

        // HEAD rotates toward cursor: ±28deg horizontal, ±18deg vertical
        this.headRotY = Math.max(-28, Math.min(28, (dx / dist) * 28));
        this.headRotX = this.headRotX; // keep scroll value; don't override

        // Detect hovering over logout button
        const target = e.target as HTMLElement;
        const btn = target.closest('button')?.closest ? target.closest('button') : null;
        if (btn) {
            const icon = (btn as HTMLElement).querySelector('.material-symbols-outlined');
            const iconText = icon?.textContent?.trim() || '';
            const btnText = ((btn as HTMLElement).textContent || '').toLowerCase();
            const isLogout = iconText === 'logout' || btnText.includes('déconnexion') || btnText.includes('quitter');
            if (!this.showWelcome) this.isWaving = isLogout;
        } else {
            if (!this.showWelcome) this.isWaving = false;
        }

        this.cdr.detectChanges();
    }

    // ── Scroll → head looks up/down ────────────────────────────────────────
    @HostListener('window:scroll')
    onScroll() {
        const delta = window.scrollY - this.lastScrollY;
        this.lastScrollY = window.scrollY;

        if (Math.abs(delta) > 2) {
            this.headRotX = delta > 0 ? 14 : -10;  // look down / look up
            this.cdr.detectChanges();
        }

        clearTimeout(this.scrollTimer);
        this.scrollTimer = setTimeout(() => {
            this.headRotX = 0;
            this.cdr.detectChanges();
        }, 800);
    }

    // ── Chat toggle with jump ───────────────────────────────────────────────
    toggleChat() {
        if (!this.isOpen) {
            // Jump animation before opening
            this.isJumping = true;
            setTimeout(() => {
                this.isJumping = false;
                this.isOpen = true;
                this.cdr.detectChanges();
                setTimeout(() => this.scrollToBottom(), 120);
            }, 550);
        } else {
            this.isOpen = false;
        }
        this.cdr.detectChanges();
    }

    // ── Messaging ─────────────────────────────────────────────────────────
    sendMessage() {
        if (!this.inputText.trim() || this.isWaiting) return;
        const currentUser = this.authService.getCurrentUser();
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
            error: () => {
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

    get headTransform(): string {
        return `rotateX(${this.headRotX}deg) rotateY(${this.headRotY}deg)`;
    }

    get pupilTransform(): string {
        return `translate(${this.eyeX}px, ${this.eyeY}px)`;
    }
}
