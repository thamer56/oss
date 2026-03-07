import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class TvDetectionService {
    constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

    /**
     * Detects if the current device is likely a TV screen.
     * This checks:
     * 1. If we are running in the browser.
     * 2. If the URL contains an explicit '?tv=true' parameter.
     * 3. If the screen width is >= 1900px (standard 1080p/4K TV width).
     */
    isTvScreen(): boolean {
        if (!isPlatformBrowser(this.platformId)) {
            return false; // Not in browser, default to false
        }

        // 1. Check for explicit URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('tv') === 'true') {
            return true;
        }

        // 2. Check screen width (>= 1900px to cover 1920x1080 and above)
        // We use screen.width instead of window.innerWidth to get the actual monitor resolution
        return window.screen.width >= 1900;
    }
}
