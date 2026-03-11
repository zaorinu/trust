/**
 * TrustJS - Self‑defending runtime
 *
 * Watches for tampering with the Trust engine itself or other critical
 * DOM elements.  If malicious modifications are detected the plugin will
 * trigger the same killswitch mechanism used by the core engine (clears
 * page and stops execution).
 *
 * Usage: simply include it in your data-trust-load list.  It runs early
 * and attaches observers to:
 *   * the <script> tag that loaded Trust
 *   * any other <script> with data-trust-load or data-trust-integrity
 *   * chosen elements marked with data-trust-protect
 */
(function(Trust){
    if (!Trust) {
        console.error('TrustJS engine missing – selfdefender inactive');
        return;
    }

    Trust.plugin('selfdefender', Trust => {
        const KILL = () => {
            document.documentElement.innerHTML = `<head><title>Security Check Required</title>
                    <style>body{font-family:-apple-system,sans-serif;padding:100px 50px;background:#fff}.c{max-width:600px;margin:0 auto}h1{font-size:24px;color:#000}.m{font-family:monospace;font-size:13px;color:#666;margin-top:40px;border-top:1px solid #eee;padding-top:20px}a{color:#0066cc;text-decoration:none}</style></head>
                    <body><div class="c"><h1>Trust system integrity violated</h1><p>Page integrity check failed.</p>
                    <div class="m"><strong>Developer Note:</strong> An unauthorized DOM change was blocked.<br><br><a href="https://codeberg.org/abacate/trust">Documentation</a></div></div></body>`;
            window.stop();
            throw '[Trust] Self-defense activated';
        };

        const watched = new Set();
        const observeNode = (node) => {
            if (!node || watched.has(node)) return;
            watched.add(node);
            const obs = new MutationObserver(muts => {
                for (const m of muts) {
                    if (m.type === 'attributes') {
                        // any change at all is suspicious (except harmless integrity attr)
                        if (m.attributeName !== 'data-trust-protect' && m.attributeName !== 'integrity') {
                            Trust.log('Self-defender detected attribute alteration', 'warn');
                            KILL();
                        }
                    } else if (m.type === 'childList') {
                        if (m.removedNodes.length || m.addedNodes.length) {
                            Trust.log('Self-defender detected DOM children change', 'warn');
                            KILL();
                        }
                    }
                }
            });
            obs.observe(node, { attributes: true, childList: true, subtree: false });
        };

        // Add watchers for the script tags that load the engine/plugins
        document.querySelectorAll('script[data-trust-load]').forEach(s => observeNode(s));

        // Also allow developers to opt-in protecting arbitrary elements
        document.querySelectorAll('[data-trust-protect]').forEach(el => observeNode(el));

        // If new elements are injected later with those markers, watch them too
        const globalObserver = new MutationObserver(muts => {
            for (const m of muts) {
                for (const node of m.addedNodes) {
                    if (node.nodeType === 1) {
                        if (node.matches && node.matches('script[data-trust-load]')) observeNode(node);
                        if (node.hasAttribute && node.hasAttribute('data-trust-protect')) observeNode(node);
                    }
                }
            }
        });
        globalObserver.observe(document.documentElement, { childList: true, subtree: true });

        Trust.log('self-defender plugin enabled');
    });
})(window.Trust);
