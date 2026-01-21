(function() {
    // Configuration matches CSS duration
    const ANIMATION_DURATION = 500;

    // Helper to get normalized filename
    const getPath = () => {
        const path = window.location.pathname;
        // Handle trailing slash or empty path as index.html
        if (path.endsWith('/') || path === '') return 'index.html';
        return path.split('/').pop();
    };

    function handlePageEntry(persisted = false) {
        // If loaded from bfcache (persisted), clear exit classes to ensure visibility
        if (persisted) {
            document.body.classList.remove('pt-exit-forward', 'pt-exit-backward', 'pt-exit-default');
            // Force opacity reset in case animation left it at 0
            document.body.style.opacity = '1';
            return;
        }

        const transitionType = sessionStorage.getItem('pt-transition-type');
        sessionStorage.removeItem('pt-transition-type'); // Clear immediately

        let enterClass = 'pt-enter-default';

        if (transitionType === 'forward') {
            enterClass = 'pt-enter-forward';
        } else if (transitionType === 'backward') {
            enterClass = 'pt-enter-backward';
        }

        // Apply class
        document.body.classList.add(enterClass);

        // Optional: Remove class after animation ends to clean up
        setTimeout(() => {
            document.body.classList.remove(enterClass);
        }, ANIMATION_DURATION + 50);
    }

    // Run on load
    window.addEventListener('pageshow', (event) => {
        handlePageEntry(event.persisted);
    });

    // Run on DOMContentLoaded just in case (redundant usually but safe)
    // Note: pageshow fires after load, so it covers everything usually.

    // Intercept Links
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link) return;

        // Validations
        if (link.origin !== window.location.origin) return; // External
        if (link.target === '_blank') return;
        if (link.hasAttribute('download')) return;

        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; // Modifier keys

        // Stop default navigation
        e.preventDefault();

        const targetUrl = link.href;
        const targetPath = new URL(targetUrl).pathname.split('/').pop() || 'index.html';
        const currentPath = getPath();

        // Determine Direction
        let direction = 'default';

        // Logic: index <-> 99names
        // Normalize paths for comparison (remove leading slashes if any)
        const cur = currentPath.replace(/^\//, '');
        const tgt = targetPath.replace(/^\//, '');

        if ((cur === 'index.html' || cur === '') && tgt === '99names.html') {
            direction = 'forward';
        } else if (cur === '99names.html' && (tgt === 'index.html' || tgt === '')) {
            direction = 'backward';
        }

        // Store intent
        sessionStorage.setItem('pt-transition-type', direction);

        // Apply Exit Animation
        let exitClass = 'pt-exit-default';
        if (direction === 'forward') exitClass = 'pt-exit-forward';
        if (direction === 'backward') exitClass = 'pt-exit-backward';

        document.body.classList.add(exitClass);

        // Navigate after animation
        setTimeout(() => {
            window.location.href = targetUrl;
        }, ANIMATION_DURATION);
    });
})();
