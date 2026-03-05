const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'dashboards');
const filesToUpdate = [
    'super-admin-dashboard.component.html',
    'director-dashboard.component.html',
    'division-chief-dashboard.component.html',
    'project-manager-dashboard.component.html',
    'equipe.component.html'
];

function modernizeSidebar(html) {
    // 1. Update the sidebar container classes
    html = html.replace(
        /class="[^"]*hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 z-50[^"]*"/,
        'class="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 z-50 flex-shrink-0"'
    );
    
    // 2. Standardize nav container
    html = html.replace(
        /<div class="flex-1 overflow-y-auto py-6 px-4 space-y-1">/g,
        '<nav class="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">'
    );
    // Note: since replacing <div with <nav, need to replace closing div
    // We'll leave it simple: just let it be a div if it's too complex to pair, or we can just keep the div tag and add the class.
    html = html.replace(
        /<div class="flex-1 overflow-y-auto py-6 px-4 space-y-1">/g,
        '<div class="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">'
    );

    // 3. Update the menu headers
    html = html.replace(
        /<p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">([^<]+)<\/p>/g,
        '<p class="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mt-2 mb-2">$1</p>'
    );

    // 4. Modernize a tags - default inactive state + active binding
    // Matches links that look like <a routerLink="..." class="...">
    const aTagRegex = /<a (routerLink="[^"]*"|href="[^"]*")\s+class="[^"]*"([^>]*)>/g;
    
    html = html.replace(aTagRegex, (match, linkAttr, rest) => {
        // Strip out existing active classes usually left hardcoded (e.g. bg-blue-50 text-blue-700)
        return `<a ${linkAttr} routerLinkActive="bg-blue-50 text-blue-700 font-bold shadow-sm" [routerLinkActiveOptions]="{exact: true}" class="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-all font-medium group"${rest}>`;
    });

    // 5. Update the spans containing icons inside the links to have hover zoom
    const iconRegex = /<span (?:class="material-symbols-[^"]*")([^>]*)>([^<]+)<\/span>/g;
    html = html.replace(iconRegex, (match, rest, innerText) => {
        if(innerText.trim().length > 0 && !innerText.includes('<')) {
           return `<span class="material-symbols-outlined group-hover:scale-110 transition-transform"${rest}>${innerText}</span>`;
        }
        return match;
    });

    // 6. Logout button
    html = html.replace(
        /<button \(click\)="logout\(\)"[^>]*>([\s\S]*?)<\/button>/,
        `<button (click)="logout()" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                <span class="material-symbols-outlined text-lg">logout</span> {{ translate?.t?.logout || 'Déconnexion' }}
            </button>`
    );

    return html;
}

for (const file of filesToUpdate) {
    const fullPath = path.join(srcDir, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = modernizeSidebar(content);
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated sidebar in ${file}`);
    } else {
        console.warn(`File ${file} not found.`);
    }
}
