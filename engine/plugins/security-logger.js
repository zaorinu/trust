/**
 * TrustJS - Security Logger
 *
 * Captures client-side errors, unhandled promise rejections, network
 * failures, console warnings/errors and forwards them to a remote
 * logging endpoint or stores them locally.  Useful for real-time
 * monitoring of client-side security events in accordance with
 * OWASP A09.
 *
 * Configuration (on engine <script>):
 *   data-trust-log-url="https://example.com/log"  – where to POST logs
 *   data-trust-log-local="1"                       – also persist to localStorage
 */
(function(Trust){
    if (!Trust) {
        console.error('TrustJS engine missing – security-logger inactive');
        return;
    }

    Trust.plugin('security-logger', Trust => {
        const engine = document.querySelector('script[data-trust-load]');
        const logUrl = engine && engine.getAttribute('data-trust-log-url');
        const saveLocal = engine && engine.getAttribute('data-trust-log-local') === '1';
        const localKey = 'trust-security-logs';
        
        // detect if running in production (not localhost)
        const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(location.hostname);
        const isProduction = !isLocalHost;

        const send = (entry) => {
            // only send remote logs if in production
            if (logUrl && isProduction) {
                try {
                    fetch(logUrl, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(entry),
                    }).catch(e=>{
                        console.warn('security-logger: failed to send log', e);
                    });
                } catch(e){ /* ignore */ }
            }
            if (saveLocal) {
                try {
                    const arr = JSON.parse(localStorage.getItem(localKey) || '[]');
                    arr.push(entry);
                    localStorage.setItem(localKey, JSON.stringify(arr));
                } catch(e) {}
            }
        };

        window.addEventListener('error', e => {
            const entry = {type:'error', message:e.message, filename:e.filename, lineno:e.lineno, colno:e.colno, stack:e.error && e.error.stack, ts:Date.now()};
            send(entry);
        });

        window.addEventListener('unhandledrejection', e => {
            const entry = {type:'unhandledrejection', reason: e.reason && e.reason.stack ? e.reason.stack : e.reason, ts:Date.now()};
            send(entry);
        });

        ['warn','error','info','log'].forEach(level => {
            const orig = console[level];
            console[level] = function(...args) {
                try { send({type:'console', level, args, ts:Date.now()}); } catch(_){}
                orig.apply(console, args);
            };
        });

        // network failures
        const origFetch = window.fetch;
        window.fetch = function(input, init) {
            return origFetch.apply(this, arguments).catch(err => {
                send({type:'network', phase:'fetch', input: typeof input==='string'? input : input.url, error:String(err), ts:Date.now()});
                throw err;
            });
        };

        Trust.log('security-logger plugin enabled');
    });
})(window.Trust);