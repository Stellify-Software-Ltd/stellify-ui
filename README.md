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
<st-sidebar id="primary" data-state="expanded">
  <header class="sidebar-header">…</header>
  <nav class="sidebar-nav">…</nav>
  <footer class="sidebar-footer">…</footer>
</st-sidebar>

<button aria-controls="primary">Toggle sidebar</button>
```

## Themes

Three theme stylesheets ship with the package. Pick one (or write your own).

- **`shadcn.css`** — default. Mirrors the Laravel starter kit's shadcn palette so Tailwind classes like `bg-background` and `text-foreground` work alongside Stellify components.
- **`editorial.css`** — warm-paper neutral with Fraunces serif display + Geist UI. More distinctive, suitable for content-led products.
- **`neutral.css`** — cool charcoal grays + system fonts. Closest to native desktop defaults, minimal expression.

All three share `base.css` for structural tokens (spacing, radii, motion, typography scale). Themes only override colour and font-family tokens.

## Components (v0.1)

- `<st-sidebar>` — collapsible navigation rail with keyboard shortcut, persistent state, tooltips
- `<st-form>` — form orchestrator: synchronous validation, focus management, alert state
- `<st-field>` — input wrapper: validates on blur, drives existing error markup
- `<st-checkbox>` — accessible checkbox primitive

More components ship as Stellify's surface area grows. The architecture supports `<st-dialog>`, `<st-toggle>`, `<st-dropdown>`, `<st-table>` etc. on the same model.

## Laravel Blade integration

`<st-field>` works with Laravel's `@error` directive out of the box.
Server-rendered errors are the source of truth on initial load; client-side
validation takes over the moment the user interacts with the field.

### Server-rendered errors

`st-field` reads its initial error state from the DOM produced by your server. There is no `error` attribute. Render the field naturally with Blade:

```blade
<st-field class="grid gap-2">
  <label for="email">Email address</label>
  <input
    id="email"
    name="email"
    type="email"
    required
    value="{{ old('email') }}"
    @error('email') aria-invalid="true" @enderror
  >
  @error('email')
    <p data-error class="text-sm text-destructive">{{ $message }}</p>
  @enderror
</st-field>
```

When the page renders, `st-field` discovers the existing `<p data-error>` element (if present) and the input's `aria-invalid` attribute. If either is present, the component treats the field as touched, so subsequent client-side validation updates the error message in place rather than waiting for a fresh blur event.

If there is no server error, the `<p data-error>` element is absent from the rendered HTML. When client-side validation later produces an error, the component creates the element and inserts it.

This pattern works without JavaScript: the form renders, errors display, the user can submit. JavaScript adds client-side validation and dynamic error updates on top.

### Fetch-based submission

For forms that submit via fetch (no page reload), use `<st-form>`'s
`setServerErrors()` method. It accepts Laravel's native 422 response shape:

```js
const stForm = document.querySelector('st-form')
const form = stForm.querySelector('form')

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const res = await fetch(form.action, {
    method: 'POST',
    body: new FormData(form),
    headers: { 'Accept': 'application/json' }
  })
  if (res.status === 422) {
    const { errors } = await res.json()
    stForm.setServerErrors(errors)
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
