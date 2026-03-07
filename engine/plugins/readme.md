# List of plugins

## (pwdleak.js) Password leaking protection
This plugin uses attribute types to know if an 'password' field has been modified by the user to a 'text' field, that would expose the password to any user viewing the screen.

By using this plugin, you need to attribute an id to your password fields, and, if you want the password being visible, insert `data-trust-toggle="pass"` into your button, so pwdleak.js will let the user view the typed characters for 5 seconds.

Example code snippet:
```html
<div>
    <input type="password" id="pass">
    <button type="button" data-trust-toggle="pass">Show</button>
</div>

<!--Trust tag-->
<script 
    src="/engine/index.js" 
    data-trust-load="/plugins/pwdleak.js"
    data-trust-integrity="sha384-reported-sha-from-trust">
</script>
```