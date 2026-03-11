/**
 * TrustJS - Idle logout / session watchdog
 *
 * Monitors user activity (mouse, keyboard, touch) and triggers a callback
 * when a period of inactivity passes.  Useful for client-side applications
 * that want to automatically clear sensitive data or force a reload after
 * the user has been away.
 *
 * The timeout can be configured with the `data-trust-idle` attribute on the
 * `<script>` tag loading Trust, in seconds.  If omitted, a default of 300s
 * (5 minutes) is used.  You may also provide a function name in
 * `data-trust-idle-callback` which will be called when the timer expires; the
 * default behavior is to `location.reload()`.
 *
 * Example:
 *
 * <script src="/engine/index.js"
 *         data-trust-load="/plugins/idle-logout.js"
 *         data-trust-idle="600"
 *         data-trust-idle-callback="onIdle">
 * </script>
 *
 * <script>
 *   function onIdle() {
 *     alert('Session expired, returning to login.');
 *     // clear sensitive state, redirect, etc.
 *     location.href = '/login';
 *   }
 * </script>
 */
(function(Trust){
    if (!Trust) {
        console.error('TrustJS engine missing – idle-logout inactive');
        return;
    }

    Trust.plugin('idle-logout', Trust => {
        const engineScript = document.querySelector('script[data-trust-load]');
        if (!engineScript) return;
        const attr = engineScript.getAttribute.bind(engineScript);
        let timeout = parseInt(attr('data-trust-idle'), 10);
        if (isNaN(timeout) || timeout <= 0) timeout = 300;

        const callbackName = attr('data-trust-idle-callback');
        let callback = null;
        if (callbackName && typeof window[callbackName] === 'function') {
            callback = window[callbackName];
        }
        if (!callback) {
            callback = () => location.reload();
        }

        let timer = null;

        const resetTimer = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                try { callback(); }
                catch (e) { Trust.log('idle-logout callback failed: ' + e, 'error'); }
            }, timeout * 1000);
        };

        ['mousemove','mousedown','keydown','scroll','touchstart'].forEach(ev =>
            document.addEventListener(ev, resetTimer, { passive: true })
        );

        resetTimer();
        Trust.log('idle-logout plugin enabled (timeout ' + timeout + 's)');
    });
})(window.Trust);
