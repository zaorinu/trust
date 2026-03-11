/**
 * TrustJS - Simple ID Protection
 * Automatically reverts any unauthorized type change.
 */
(function(Trust) {
    if (!Trust) {
        console.error('TrustJS engine not found – plugin will not run');
        return;
    }

    Trust.plugin('pwdleak', Trust => {
        // Unique session token that the browser treats as "text"
        const SECRET_TOKEN = "pwdl-" + crypto.randomUUID();

        document.addEventListener('click', (event) => {
            const targetId = event.target.getAttribute('data-trust-toggle');
            if (targetId) {
                const input = document.getElementById(targetId);
                if (input) {
                    // Switch between password and the secret token
                    input.type = (input.type === 'password') ? SECRET_TOKEN : 'password';
                }
            }
        });

        const shield = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                const target = mutation.target;

                if (mutation.attributeName === 'type') {
                    const rawType = target.getAttribute('type');

                    // If the type is NOT 'password' and NOT our 'SECRET_TOKEN', it's unauthorized
                    if (rawType !== 'password' && rawType !== SECRET_TOKEN) {
                        target.value = ''; // Wipe data for security
                        target.type = 'password'; // Force revert
                        Trust.log('Unauthorized password field type change blocked', 'warn');
                    } 
                    
                    // Optional: Auto-revert to password after 5 seconds if shown
                    else if (rawType === SECRET_TOKEN) {
                        setTimeout(() => {
                            if (target.getAttribute('type') === SECRET_TOKEN) {
                                target.type = 'password';
                            }
                        }, 5000);
                    }
                }
            }
        });

        // Start watching the whole page for any password field tampering
        shield.observe(document.body, { 
            attributes: true, 
            subtree: true, 
            attributeFilter: ['type'] 
        });

        Trust.log('Password protection plugin enabled');
    });
})(window.Trust);