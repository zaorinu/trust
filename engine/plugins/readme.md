# List of plugins

_All plugins depend on the core engine (`index.js`)._ They should
register themselves via **`Trust.plugin(name, initFn)`** and use
`Trust.log` for output; that keeps a uniform appearance and allows
Trust to catch initialization errors.

Plugins may also be protected with SRI hashes by setting
`data-trust-integrity` on the loader script; if a hash is omitted, the
engine will still fetch the file but will issue a warning (especially
on `localhost`).


## (pwdleak.js) Password leaking protection
This plugin requires the core TrustJS engine to be loaded first; it
attaches to `window.Trust` and uses the shared `Trust.log` helper so all
output uses the same styling as the engine itself.

It watches for attempts to change an `<input type="password">` to a
non-password type and automatically reverts the field (clearing its
value for safety).

Usage is straightforward: give your password field an `id`, and add
`data-trust-toggle="pass"` to the control that should temporarily show
its contents.  On activation you’ll see a console message like
`Trust: Password protection plugin enabled`.

Example:
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

---

## (selfdefender.js) Self‑defending runtime
This plugin needs TrustJS itself – it hooks `window.Trust` and uses the
same `Trust.log` formatting.  If the engine isn't present the plugin
aborts silently.

It watches for tampering of the engine `<script>` tag or any element
marked with `data-trust-protect`.  On unauthorized attribute changes or
node additions/removals it triggers the engine kill‑switch, clearing the
page and halting execution.  It's a lightweight guard against
DOM‑injection, rogue extensions, or other runtime interference.

Usage is as simple as adding `/plugins/selfdefender.js` to your
`data-trust-load` list; you can optionally annotate other critical
nodes (`<div data-trust-protect>…</div>`) to have them monitored as well.

---

## (idle-logout.js) Automatic idle timer
Depends on the TrustJS engine and uses `Trust.log` for its console
messages.

It tracks user activity (mouse/keyboard/scroll/touch) and fires after a
period of inactivity.  Configure the duration in seconds with
`data-trust-idle` on the engine `<script>`, and optionally supply
a global function name via `data-trust-idle-callback` to run when the
timer elapses.  Defaults to reloading the page after 300 s.

Great for client‑side apps that need to clear sensitive state or
redirect users when they've walked away.