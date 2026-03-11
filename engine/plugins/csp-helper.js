/**
 * TrustJS - CSP Helper
 *
 * Ensures that a restrictive Content Security Policy is applied and that
 * iframe sandboxing is used where appropriate.  If no CSP meta tag or
 * header is present it injects a default policy, and it warns if any
 * `iframe` elements lack a sandbox attribute.
 *
 * Configuration (on engine <script>):
 *   data-trust-csp="default-src 'self'; script-src 'self'"  – custom policy
 *   data-trust-csp-enforce="1"                            – block scripts violating CSP
 */
(function(Trust){
    if (!Trust) {
        console.error('TrustJS engine missing – csp-helper inactive');
        return;
    }

    Trust.plugin('csp-helper', Trust => {
        const engine = document.querySelector('script[data-trust-load]');
        const custom = engine && engine.getAttribute('data-trust-csp');
        const enforce = engine && engine.getAttribute('data-trust-csp-enforce') === '1';
        const defaultPolicy = "default-src 'self'; script-src 'self'";
        const policy = custom || defaultPolicy;

        // inject meta if no CSP header observed
        const hasMeta = !!document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (!hasMeta) {
            const m = document.createElement('meta');
            m.httpEquiv = 'Content-Security-Policy';
            m.content = policy;
            document.head.appendChild(m);
            Trust.log('CSP meta tag injected');
        }

        if (enforce) {
            const applyToScript = (s) => {
                if (!s.hasAttribute('nonce')) {
                    const nonce = Math.random().toString(36).slice(2);
                    s.setAttribute('nonce', nonce);
                }
            };
            document.querySelectorAll('script').forEach(applyToScript);
            const obs = new MutationObserver(muts => {
                muts.forEach(m => {
                    m.addedNodes.forEach(n => {
                        if (n.tagName === 'SCRIPT') applyToScript(n);
                    });
                });
            });
            obs.observe(document.documentElement, {childList:true,subtree:true});
        }

        // warn about unsandboxed iframes
        const checkIframes = () => {
            document.querySelectorAll('iframe').forEach(f => {
                if (!f.hasAttribute('sandbox')) {
                    Trust.log('iframe without sandbox detected', 'warn');
                }
            });
        };
        checkIframes();
        const obs2 = new MutationObserver(muts => checkIframes());
        obs2.observe(document.body, {childList:true,subtree:true});

        Trust.log('csp-helper plugin enabled with policy: ' + policy);
    });
})(window.Trust);