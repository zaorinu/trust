/**
 * TrustJS - Frame Guard
 * Prevents the page from being displayed inside an iframe.  Useful to
 * protect against clickjacking and UI redressing attacks.
 *
 * When the script detects it is framed it will replace the document
 * body with a notice and stop further execution.
 */
(function(Trust){
    if (!Trust) {
        console.error('TrustJS engine missing – frame-guard inactive');
        return;
    }

    Trust.plugin('frame-guard', Trust => {
        if (window.top !== window.self) {
            // replace everything with a simple static page and halt all activity
            const message = `
                <p>This website doesn't accept being loaded from an iframe.</p>
                <p>Please <a href="" onclick="top.location.href=location.href;return false;">click here</a> to open it directly.</p>`;
            document.open();
            document.write(message);
            document.close();

            // stop any further resource loading or scripts
            if (typeof window.stop === 'function') window.stop();

            Trust.log('frame-guard activated – page was framing', 'warn');

            // remove reference to Trust so plugin won't run again
            try { delete window.Trust; } catch(e) {}

            // ensure no further plugin logic executes
            return;
        }
    });
})(window.Trust);