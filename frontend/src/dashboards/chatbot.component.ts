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
    eyeX = 0;
    eyeY = 0;
    headRotY = 0;
    headRotX = 0;
    isWaving = false;
    isJumping = false;
    showWelcome = false;
    welcomeText = '';

    // ── Drag state ──────────────────────────────────────────────────────────
    isDragging = false;
    dragX: number | null = null;   // left px from viewport left edge
    dragY: number | null = null;   // top  px from viewport top  edge

    // PC sticky-drag (double-click activates, single-click deactivates)
    private _pcDragMode = false;
    private _clickCount = 0;
    private _clickTimer: any = null;
    private _botOffsetX = 0;
    private _botOffsetY = 0;

    // Mobile long-press drag
    private _longPressTimer: any = null;
    private _touchDragActive = false; // true once finger starts moving after long-press
    private _justDragged = false;     // blocks spurious click after touch drag
    private _unlisteners: (() => void)[] = [];
    private _touchStartTime = 0;
    private _touchStartX = 0;
    private _touchStartY = 0;

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
        this.router.events.pipe(
            filter(e => e instanceof NavigationEnd)
        ).subscribe((e: any) => {
            const url: string = e.urlAfterRedirects || e.url || '';
            if (!url.includes('/login') && !url.includes('/tv-display') && !url.includes('/portal')) {
                this.welcomeText = 'Bienvenue ! 👋';
                this.showWelcome = true;
                this.isWaving = true;
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
        clearTimeout(this._longPressTimer);
        clearTimeout(this._clickTimer);
        this._unlisteners.forEach(fn => fn());
        this._unlisteners = [];
    }

    get isLoginRoute(): boolean {
        const url = this.router.url;
        return url === '/login' || url === '/' || url.includes('/portal');
    }

    // ── Cursor / eye tracking + PC drag movement ────────────────────────────
    @HostListener('document:mousemove', ['$event'])
    onMouseMove(e: MouseEvent) {
        // PC sticky-drag: bot follows mouse
        if (this._pcDragMode && this.isDragging) {
            this._moveBotTo(e.clientX, e.clientY);
            return; // skip eye tracking while dragging
        }

        if (!this.botEl) return;
        const rect = this.botEl.nativeElement.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.max(80, Math.sqrt(dx * dx + dy * dy));

        this.headRotY = Math.max(-30, Math.min(30, (dx / dist) * 30));
        this.eyeX = Math.max(-5, Math.min(5, (dx / dist) * 5));
        this.eyeY = Math.max(-4, Math.min(4, (dy / dist) * 4));

        // Detect logout button hover
        const target = e.target as HTMLElement;
        const btn = target.closest('button') as HTMLElement | null;
        if (btn) {
            const icon = btn.querySelector('.material-symbols-outlined');
            const iconText = icon?.textContent?.trim() || '';
            const btnText = (btn.textContent || '').toLowerCase();
            const isLogout = iconText === 'logout' || btnText.includes('déconnexion') || btnText.includes('quitter');
            if (!this.showWelcome) this.isWaving = isLogout;
        } else {
            if (!this.showWelcome) this.isWaving = false;
        }

        this.cdr.detectChanges();
    }

    // ── Scroll → head looks up/down ─────────────────────────────────────────
    @HostListener('window:scroll')
    onScroll() {
        const delta = window.scrollY - this.lastScrollY;
        this.lastScrollY = window.scrollY;
        if (Math.abs(delta) > 2) {
            this.headRotX = delta > 0 ? 14 : -10;
            this.cdr.detectChanges();
        }
        clearTimeout(this.scrollTimer);
        this.scrollTimer = setTimeout(() => {
            this.headRotX = 0;
            this.cdr.detectChanges();
        }, 800);
    }

    // ── PC: double-click detection on bot click ──────────────────────────────
    //   1st click  → wait 280ms, if no 2nd click → open/close chat
    //   2nd click within 280ms → activate sticky drag mode
    //   While in PC drag mode, any click → exit drag mode
    onBotClick(event: MouseEvent) {
        // Escape drag mode on a single click
        if (this._pcDragMode && this.isDragging) {
            this._exitPCDrag();
            return;
        }
        if (this._justDragged) return;

        // Double-click detection
        this._clickCount++;
        clearTimeout(this._clickTimer);

        if (this._clickCount >= 2) {
            this._clickCount = 0;
            this._activatePCDrag(event);
            return;
        }

        this._clickTimer = setTimeout(() => {
            this._clickCount = 0;
            // Treat as single click → toggle chat
            this._doToggleChat();
        }, 280);
    }

    private _activatePCDrag(event: MouseEvent) {
        const el = this.botEl?.nativeElement as HTMLElement;
        if (el) {
            const rect = el.getBoundingClientRect();
            this._botOffsetX = event.clientX - rect.left;
            this._botOffsetY = event.clientY - rect.top;
        } else {
            this._botOffsetX = 35;
            this._botOffsetY = 65;
        }
        this._pcDragMode = true;
        this.isDragging = true;
        this.cdr.detectChanges();
    }

    private _exitPCDrag() {
        this._pcDragMode = false;
        this.isDragging = false;
        this.cdr.detectChanges();
    }

    // ── Mobile: tap + long-press drag ───────────────────────────────────────
    onBotTouchStart(event: TouchEvent) {
        const touch = event.touches[0];
        this._touchDragActive = false;
        this._touchStartTime = Date.now();
        this._touchStartX = touch.clientX;
        this._touchStartY = touch.clientY;

        if (this.botEl) {
            const rect = this.botEl.nativeElement.getBoundingClientRect();
            this._botOffsetX = touch.clientX - rect.left;
            this._botOffsetY = touch.clientY - rect.top;
        }

        clearTimeout(this._longPressTimer);
        this._longPressTimer = setTimeout(() => {
            // Only activate drag if finger hasn't moved much
            this.isDragging = true;
            this.cdr.detectChanges();
            this._attachTouchDragListeners();
        }, 400);

        // Attach a one-shot touchend to detect tap (short press, no movement)
        const onTouchEndForTap = (e: TouchEvent) => {
            document.removeEventListener('touchend', onTouchEndForTap);
            if (this.isDragging || this._touchDragActive) return; // drag already started

            const dt = Date.now() - this._touchStartTime;
            const changedTouch = e.changedTouches[0];
            const dx = Math.abs(changedTouch.clientX - this._touchStartX);
            const dy = Math.abs(changedTouch.clientY - this._touchStartY);

            if (dt < 350 && dx < 10 && dy < 10) {
                // It's a tap — cancel long-press and toggle chat
                clearTimeout(this._longPressTimer);
                this._doToggleChat();
            }
        };
        document.addEventListener('touchend', onTouchEndForTap, { once: true });

        // Prevent default only to block browser scroll on the bot element,
        // but we manually handle the tap above so click propagation is fine.
        event.preventDefault();
    }

    private _attachTouchDragListeners() {
        const onTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            this._touchDragActive = true;
            this._moveBotTo(e.touches[0].clientX, e.touches[0].clientY);
        };
        const onTouchEnd = () => {
            clearTimeout(this._longPressTimer);
            this._unlisteners.forEach(fn => fn());
            this._unlisteners = [];
            const wasDragging = this._touchDragActive;
            this.isDragging = false;
            this._touchDragActive = false;
            if (wasDragging) {
                this._justDragged = true;
                setTimeout(() => { this._justDragged = false; }, 300);
            }
            this.cdr.detectChanges();
        };

        document.addEventListener('touchmove', onTouchMove, { passive: false });
        const u2 = this.renderer.listen('document', 'touchend', onTouchEnd);
        this._unlisteners.push(
            () => document.removeEventListener('touchmove', onTouchMove),
            u2
        );
    }

    // ── Shared movement helper ───────────────────────────────────────────────
    private _moveBotTo(clientX: number, clientY: number) {
        let newLeft = clientX - this._botOffsetX;
        let newTop = clientY - this._botOffsetY;

        const el = this.botEl?.nativeElement as HTMLElement;
        const w = el ? el.offsetWidth : 70;
        const h = el ? el.offsetHeight : 130;
        newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - w));
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - h));

        this.dragX = newLeft;
        this.dragY = newTop;
        this.cdr.detectChanges();
    }

    // ── Style applied to bot-scene when moved ───────────────────────────────
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

    // ── Chat toggle (called by close button + internal) ──────────────────────
    toggleChat() {
        this._doToggleChat();
    }

    private _doToggleChat() {
        if (!this.isOpen) {
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

    // ── Messaging ────────────────────────────────────────────────────────────
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
