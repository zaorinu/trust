/**
 * TrustJS Engine
 * Verifies hashes, injects with SRI, and removes itself from the DOM when done.
 */
(function() {
    "use strict";

    const Trust = {
        isDead: false, 

        computeHash: async (text) => {
            const buffer = await crypto.subtle.digest('SHA-384', new TextEncoder().encode(text));
            return `sha384-${btoa(String.fromCharCode(...new Uint8Array(buffer)))}`;
        },

        report: function(errors, metrics) {
            if (errors.length > 0) {
                console.groupCollapsed(`%cTrust: ${errors.length} Critical Issue(s)`, "background:#eb4d4b;color:#fff;padding:2px 5px;border-radius:3px;font-weight:bold;");
                errors.forEach(err => {
                    console.warn(`%cTarget: %c${err.src}`, "font-weight:bold", "color:#f0932b");
                    const reason = err.reason || (typeof err === 'string' ? err : "Unknown Error");
                    console.log(`%cReason: %c${reason}`, "font-weight:bold", "color:inherit");
                    if (err.actual) {
                        console.log(`%cActual Hash (Copy this):%c\n${err.actual}`, "font-weight:bold;font-family:monospace;background:#f1f2f6;padding:5px;display:block;margin-top:5px;border-left:4px solid #eb4d4b;");
                    }
                });
                console.groupEnd();
            }
            if (metrics.length > 0) {
                console.groupCollapsed("%cTrust: Performance Audit", "background:#686de0;color:#fff;padding:2px 5px;border-radius:3px;font-weight:bold;");
                console.table(metrics);
                console.groupEnd();
            }
        },

        activateKillSwitch: function(failedSrc, errorObj, metrics) {
            if (this.isDead) return;
            this.isDead = true;
            this.report([{ src: failedSrc, ...errorObj }], metrics);

            document.documentElement.innerHTML = `
                <head><title>Security Check Required</title>
                <style>body{font-family:-apple-system,sans-serif;padding:100px 50px;background:#fff}.c{max-width:600px;margin:0 auto}h1{font-size:24px;color:#000}.m{font-family:monospace;font-size:13px;color:#666;margin-top:40px;border-top:1px solid #eee;padding-top:20px}a{color:#0066cc;text-decoration:none}</style></head>
                <body><div class="c"><h1>Trust system didn't load correctly</h1><p>A script failed the integrity check.</p>
                <div class="m"><strong>Developer Note:</strong> Check console for details.<br><br><a href="https://codeberg.org/abacate/trust">Documentation</a></div></div></body>`;
            
            window.stop();
            throw `[Trust] Terminated: ${failedSrc}`;
        },

        init: async function(el) {
            const srcs = (el.getAttribute('data-trust-load') || "").split(',').map(s => s.trim()).filter(Boolean);
            const shas = (el.getAttribute('data-trust-integrity') || "").split(',').map(s => s.trim()).filter(Boolean);
            const errors = [], metrics = [], queue = new Array(srcs.length);

            const tasks = srcs.map(async (src, i) => {
                const startTime = performance.now();
                const expectedSha = shas[i];
                try {
                    if (!expectedSha) throw { reason: "Missing SHA" };
                    const response = await fetch(src);
                    if (!response.ok) throw { reason: `HTTP ${response.status}` };
                    
                    const code = await response.text();
                    const actualSha = await this.computeHash(code);

                    if (actualSha !== expectedSha) {
                        this.activateKillSwitch(src, { reason: "Integrity mismatch", actual: actualSha }, metrics);
                        return;
                    }

                    const blobUrl = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
                    const script = document.createElement('script');
                    script.src = blobUrl;
                    script.integrity = expectedSha;
                    script.crossOrigin = "anonymous";
                    script.async = false;
                    queue[i] = script;

                    metrics.push({ Script: src.split('/').pop(), "ms": (performance.now() - startTime).toFixed(1), Status: "Secure" });
                } catch (err) {
                    if (this.isDead) return;
                    errors.push({ src, ...err });
                    metrics.push({ Script: src.split('/').pop(), Status: "Failed" });
                }
            });

            await Promise.all(tasks);

            if (!this.isDead) {
                queue.forEach(s => {
                    if (s) {
                        document.head.appendChild(s);
                        s.onload = () => URL.revokeObjectURL(s.src);
                    }
                });
                this.report(errors, metrics);
            }
        }
    };

    const engine = document.currentScript;
    if (engine) {
        Trust.init(engine)
            .catch(err => {
                if (typeof err === 'string' && err.includes('[Trust]')) return;
                console.error(err);
            })
            .finally(() => {
                // DELETE SELF: Removes the <script src="loader.js"> tag from the DOM
                engine.remove();
            });
    }
})();