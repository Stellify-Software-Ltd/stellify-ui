# @stellify/ui

Web Component primitives and design tokens for Stellify-rendered apps. Ships as a single bundled file (`stellify-ui.js`) plus a set of token CSS files you copy into your app.

## Philosophy

The library follows the **HTML Web Components** pattern — components wrap existing markup and enhance it, rather than rendering Shadow DOM. The user authors regular HTML; Stellify (or the importer's transformer) adds custom-element wrappers; the bundle attaches behaviour at runtime. If JavaScript fails to load, the underlying markup still works.

This is the desktop-toolkit pattern applied to web: the renderer owns the design system, components are stateful instances with proper lifecycle, and visual decisions live in tokens rather than per-component code.

## Install

```bash
npm install @stellify/ui
```

## Use

Load the bundle and one of the theme stylesheets in your layout:

```html
<link rel="stylesheet" href="@stellify/ui/tokens/base.css">
<link rel="stylesheet" href="@stellify/ui/tokens/shadcn.css">
<script type="module" src="@stellify/ui"></script>
```

Then use the elements anywhere in your markup:

```html
<sk-sidebar id="primary" data-state="expanded">
  <header class="sidebar-header">…</header>
  <nav class="sidebar-nav">…</nav>
  <footer class="sidebar-footer">…</footer>
</sk-sidebar>

<button aria-controls="primary">Toggle sidebar</button>
```

## Themes

Three theme stylesheets ship with the package. Pick one (or write your own).

- **`shadcn.css`** — default. Mirrors the Laravel starter kit's shadcn palette so Tailwind classes like `bg-background` and `text-foreground` work alongside Stellify components.
- **`editorial.css`** — warm-paper neutral with Fraunces serif display + Geist UI. More distinctive, suitable for content-led products.
- **`neutral.css`** — cool charcoal grays + system fonts. Closest to native desktop defaults, minimal expression.

All three share `base.css` for structural tokens (spacing, radii, motion, typography scale). Themes only override colour and font-family tokens.

## Components (v0.1)

- `<sk-sidebar>` — collapsible navigation rail with keyboard shortcut, persistent state, tooltips
- `<sk-form>` — form orchestrator: synchronous validation, focus management, alert state
- `<sk-field>` — input wrapper: validates on blur, drives existing error markup
- `<sk-checkbox>` — accessible checkbox primitive

More components ship as Stellify's surface area grows. The architecture supports `<sk-dialog>`, `<sk-toggle>`, `<sk-dropdown>`, `<sk-table>` etc. on the same model.

## Laravel Blade integration

`<sk-field>` works with Laravel's `@error` directive out of the box.
Server-rendered errors take precedence on first render; client-side
validation takes over the moment the user interacts with the field.

```blade
<sk-field class="grid gap-2">
  <label for="email">Email address</label>
  <input
    id="email"
    name="email"
    type="email"
    value="{{ old('email') }}"
    required
    @error('email') aria-invalid="true" @enderror
    class="...">

  <div data-error
       @error('email') data-server-error @else style="display: none;" @enderror>
    <p>@error('email'){{ $message }}@enderror</p>
  </div>
</sk-field>
```

The `data-server-error` marker tells `<sk-field>` that the error is
authoritative and should persist until the user interacts. After that,
the component's normal input/blur lifecycle takes over.

### Two patterns for server errors

**Full-page reload (traditional Laravel forms):** Let Blade render errors
directly into `data-server-error` containers as shown above. The component
detects the marker on mount — no JavaScript required.

**Fetch-based submission (no page reload):** Use `<sk-form>`'s
`setServerErrors()` method instead. It accepts Laravel's native 422
response shape:

```js
const skForm = document.querySelector('sk-form')
const form = skForm.querySelector('form')

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const res = await fetch(form.action, {
    method: 'POST',
    body: new FormData(form),
    headers: { 'Accept': 'application/json' }
  })
  if (res.status === 422) {
    const { errors } = await res.json()
    skForm.setServerErrors(errors)
  } else if (res.ok) {
    window.location = '/dashboard'
  }
})
```

## Build

```bash
npm run build      # produces dist/stellify-ui.js + dist/tokens/*.css
npm run dev        # watch mode
npm run type-check # tsc --noEmit
```

## License

MIT
