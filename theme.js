// theme.js - Shared theming logic

const THEMES = {
    emerald: {
        50: '#ecfdf5',
        100: '#d1fae5',
        200: '#a7f3d0',
        400: '#34d399',
        500: '#10b981',
        600: '#059669',
        700: '#047857',
        shadow: 'rgba(16, 185, 129, 0.3)'
    },
    blue: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        shadow: 'rgba(59, 130, 246, 0.3)'
    },
    purple: {
        50: '#f5f3ff',
        100: '#ede9fe',
        200: '#ddd6fe',
        400: '#a78bfa',
        500: '#8b5cf6',
        600: '#7c3aed',
        700: '#6d28d9',
        shadow: 'rgba(139, 92, 246, 0.3)'
    },
    amber: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
        shadow: 'rgba(245, 158, 11, 0.3)'
    },
    red: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        shadow: 'rgba(239, 68, 68, 0.3)'
    },
    yellow: {
        50: '#fefce8',
        100: '#fef9c3',
        200: '#fde047',
        400: '#facc15',
        500: '#eab308',
        600: '#ca8a04',
        700: '#a16207',
        shadow: 'rgba(234, 179, 8, 0.3)'
    },
    pink: {
        50: '#fdf2f8',
        100: '#fce7f3',
        200: '#fbcfe8',
        400: '#f472b6',
        500: '#ec4899',
        600: '#db2777',
        700: '#be185d',
        shadow: 'rgba(236, 72, 153, 0.3)'
    }
};

function toggleDarkMode() {
    // Check current state from DOM or storage?
    // We rely on the toggle input if it exists, otherwise check class.
    const toggle = document.getElementById('dark-mode-toggle');
    let isDark;

    if (toggle) {
        isDark = toggle.checked;
    } else {
        isDark = !document.documentElement.classList.contains('dark');
    }

    localStorage.setItem('prayerAppDarkMode', isDark);

    const html = document.documentElement;
    if (isDark) {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
    return isDark;
}

function setCustomTheme(hexColor) {
    localStorage.setItem('prayerAppTheme', 'custom');
    localStorage.setItem('prayerAppCustomColor', hexColor);

    const palette = generatePalette(hexColor);
    applyPalette(palette);
    return 'custom';
}

function generatePalette(hex) {
    return {
        50:  adjustBrightness(hex, 0.95), // Very Light
        100: adjustBrightness(hex, 0.90),
        200: adjustBrightness(hex, 0.70),
        400: adjustBrightness(hex, 0.30),
        500: hex,                     // Base
        600: adjustBrightness(hex, -0.10),
        700: adjustBrightness(hex, -0.20),
        shadow: hexToRgba(hex, 0.3)
    };
}

// Helper to lighten/darken hex
function adjustBrightness(col, percent) {
    var usePound = false;
    if (col[0] == "#") {
        col = col.slice(1);
        usePound = true;
    }
    // Simple helper call
    return tintShade(usePound ? "#" + col : col, percent);
}

function tintShade(hex, factor) {
    // Factor > 0: Lighten (Mix with white)
    // Factor < 0: Darken (Mix with black)

    // Parse Hex
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);

    if (factor > 0) {
        // Lighten: Target is 255
        r = Math.round(r + (255 - r) * factor);
        g = Math.round(g + (255 - g) * factor);
        b = Math.round(b + (255 - b) * factor);
    } else {
        // Darken: Target is 0. Factor is negative, so we multiply by (1 + factor) e.g. 0.9
        const f = 1 + factor;
        r = Math.round(r * f);
        g = Math.round(g * f);
        b = Math.round(b * f);
    }

    // Clamp
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hexToRgba(hex, alpha) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyPalette(colors) {
    const root = document.documentElement;
    root.style.setProperty('--color-primary-50', colors[50]);
    root.style.setProperty('--color-primary-100', colors[100]);
    root.style.setProperty('--color-primary-200', colors[200]);
    root.style.setProperty('--color-primary-400', colors[400]);
    root.style.setProperty('--color-primary-500', colors[500]);
    root.style.setProperty('--color-primary-600', colors[600]);
    root.style.setProperty('--color-primary-700', colors[700]);
    root.style.setProperty('--color-primary-shadow', colors.shadow);
}

function setTheme(themeName) {
    if (!THEMES[themeName]) return null;

    localStorage.setItem('prayerAppTheme', themeName);

    applyPalette(THEMES[themeName]);
    return themeName;
}

function loadThemeSettings() {
    // 0. Load Dark Mode
    const savedDarkMode = localStorage.getItem('prayerAppDarkMode');
    let isDark = false;

    if (savedDarkMode === 'true') {
        isDark = true;
        document.documentElement.classList.add('dark');
    } else {
        isDark = false;
        document.documentElement.classList.remove('dark');
    }

    // Update checkbox if exists
    const toggle = document.getElementById('dark-mode-toggle');
    if (toggle) {
        toggle.checked = isDark;
    }

    // 0.1 Load Theme
    const savedTheme = localStorage.getItem('prayerAppTheme');
    let currentTheme = 'emerald';
    let currentCustomColor = null;

    if (savedTheme === 'custom') {
        currentTheme = 'custom';
        const savedCustomColor = localStorage.getItem('prayerAppCustomColor');
        if (savedCustomColor) {
            currentCustomColor = savedCustomColor;
            setCustomTheme(savedCustomColor);
            // Update picker value if exists
            const picker = document.getElementById('custom-color-picker');
            if (picker) picker.value = savedCustomColor;
        } else {
            setTheme('emerald');
            currentTheme = 'emerald';
        }
    } else if (savedTheme && THEMES[savedTheme]) {
        setTheme(savedTheme);
        currentTheme = savedTheme;
    } else {
        setTheme('emerald');
    }

    return { isDark, currentTheme, currentCustomColor };
}
