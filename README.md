# trust
Protect your JavaScript local (web) applications with the Trust active protector

The core `index.js` must be loaded before any plugin; plugins assume
`window.Trust` exists and use its logging helper so that all messages
share the same styled prefix (`Trust:`).  Plugins are expected to call
`Trust.plugin(name, initFn)` during evaluation, which gives a consistent
"<name> plugin initialized" log and catches any startup errors.

You can optionally supply integrity hashes (SRI) for each plugin.  If a
hash is omitted the engine will still load the script, but will emit a
console warning (especially when running on `localhost` during development).
In production it's **strongly recommended** to include the hashes.

Example markup:

| Src | data-trust-load | data-trust-integrity |
| :--- | :--- | :--- |
| **Source of the Script** | Comma-separated remote sources for the plugins | Comma-separated sha-384 array of the data-trust-load |

```html
<script 
    src="/engine/index.js" 
    data-trust-load="/plugins/pwdleak.js,/plugins/selfdefender.js"
    data-trust-integrity="sha384-abc123,sha384-def456">
</script>
```