# trust
Protect your JavaScript local (web) applications with the Trust active protector

To add in your html application, use this:

| Src | data-trust-load | data-trust-integrity |
| :--- | :--- | :--- |
| **Source of the Script** | Comma-separated remote sources for the plugins | Comma-separated sha-384 array of the data-trust-load |

```html
<script 
    src="/engine/index.js" 
    data-trust-load="plugin1,plugin2..."
    data-trust-integrity="sha used in plugin 1, sha used in plugin 2...">
</script>
```