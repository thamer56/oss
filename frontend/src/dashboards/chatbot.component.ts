import {
    Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener, ChangeDetectorRef, Renderer2
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

    // ── Drag state ──────────────────────────────────────────────────────────
    isDragging = false;
    dragX: number | null = null;   // left px from window left
    dragY: number | null = null;   // top px from window top
    private _dragActive = false;   // true while pointer is moving during drag
    private _justDragged = false;  // blocks the click that fires right after mouseup
    private _longPressTimer: any = null;
    private _dragStartX = 0;
    private _dragStartY = 0;
    private _botOffsetX = 0;
    private _botOffsetY = 0;
    private _unlisteners: (() => void)[] = [];

    @ViewChild('chatWindow') chatWindow?: ElementRef;
    @ViewChild('botEl') botEl?: ElementRef;

    private scrollTimer: any;
    private lastScrollY = 0;

    constructor(
        private aiService: AiService,
        private authService: AuthService,
        private router: Router,
        public translate: TranslationService,
        private cdr: ChangeDetectorRef,
        private renderer: Renderer2
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
        this._clearLongPress();
        this._unlisteners.forEach(fn => fn());
        this._unlisteners = [];
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

        // WHOLE BOT rotates 3D toward cursor: ±30deg horizontal
        this.headRotY = Math.max(-30, Math.min(30, (dx / dist) * 30));

        // Pupils ALSO track cursor within eyes: ±5px
        this.eyeX = Math.max(-5, Math.min(5, (dx / dist) * 5));
        this.eyeY = Math.max(-4, Math.min(4, (dy / dist) * 4));

        // headRotX stays from scroll — don't override here

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

    // ── Drag: long-press activates drag ────────────────────────────────────
    onBotPointerDown(event: MouseEvent | TouchEvent) {
        // Determine start coordinates
        const clientX = event instanceof TouchEvent ? event.touches[0].clientX : (event as MouseEvent).clientX;
        const clientY = event instanceof TouchEvent ? event.touches[0].clientY : (event as MouseEvent).clientY;
        this._dragStartX = clientX;
        this._dragStartY = clientY;
        this._dragActive = false;

        if (this.botEl) {
            const rect = this.botEl.nativeElement.getBoundingClientRect();
            // Offset of pointer inside the bot element
            this._botOffsetX = clientX - rect.left;
            this._botOffsetY = clientY - rect.top;
        }

        this._clearLongPress();
        this._longPressTimer = setTimeout(() => {
            this.isDragging = true;
            this._dragActive = false; // movement not started yet, just activated
            this.cdr.detectChanges();
            this._attachDragListeners();
        }, 350);

        // prevent context menu on long-press
        event.preventDefault();
    }

    private _clearLongPress() {
        if (this._longPressTimer) {
            clearTimeout(this._longPressTimer);
            this._longPressTimer = null;
        }
    }

    private _attachDragListeners() {
        // Mouse
        const onMouseMove = (e: MouseEvent) => this._onDragMove(e.clientX, e.clientY);
        const onMouseUp = () => this._onDragEnd();
        // Touch
        const onTouchMove = (e: TouchEvent) => { e.preventDefault(); this._onDragMove(e.touches[0].clientX, e.touches[0].clientY); };
        const onTouchEnd = () => this._onDragEnd();

        const u1 = this.renderer.listen('document', 'mousemove', onMouseMove);
        const u2 = this.renderer.listen('document', 'mouseup', onMouseUp);
        // touchmove needs passive:false so we can preventDefault — use native addEventListener
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        const u4 = this.renderer.listen('document', 'touchend', onTouchEnd);
        this._unlisteners.push(u1, u2, () => document.removeEventListener('touchmove', onTouchMove), u4);
    }

    private _onDragMove(clientX: number, clientY: number) {
        if (!this.isDragging) return;
        this._dragActive = true;

        // Calculate new top-left position so the pointer stays at _botOffset inside the element
        let newLeft = clientX - this._botOffsetX;
        let newTop = clientY - this._botOffsetY;

        // Clamp within viewport
        const el: HTMLElement = this.botEl?.nativeElement;
        const w = el ? el.offsetWidth : 70;
        const h = el ? el.offsetHeight : 130;
        newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - w));
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - h));

        this.dragX = newLeft;
        this.dragY = newTop;
        this.cdr.detectChanges();
    }

    private _onDragEnd() {
        this._clearLongPress();
        this._unlisteners.forEach(fn => fn());
        this._unlisteners = [];
        const wasDragging = this._dragActive;
        this.isDragging = false;
        this._dragActive = false;
        if (wasDragging) {
            // Block the click that fires right after mouseup/touchend
            this._justDragged = true;
            setTimeout(() => { this._justDragged = false; }, 0);
        }
        this.cdr.detectChanges();
    }

    get botDragStyle(): { [key: string]: string } {
        if (this.dragX !== null && this.dragY !== null) {
            return {
                left: this.dragX + 'px',
                top: this.dragY + 'px',
                right: 'auto',
                bottom: 'auto'
            };
        }
        return {};
    }

    // ── Chat toggle with jump ───────────────────────────────────────────────
    toggleChat() {
        // Don't open chat if the user just finished dragging
        if (this._justDragged) return;
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

    get botBodyTransform(): string {
        return `rotateX(${this.headRotX}deg) rotateY(${this.headRotY}deg)`;
    }

    get pupilTransform(): string {
        return `translate(${this.eyeX}px, ${this.eyeY}px)`;
    }
}
