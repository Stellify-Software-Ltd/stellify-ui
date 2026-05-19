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
- `<st-menu>` — dropdown/popup menu primitive with keyboard navigation
- `<st-frame>` — independently-updating subview: links and forms fetch and swap content without full page reload
- `<st-dialog>` — modal and non-modal dialog built on native `<dialog>` with trigger integration and light dismiss

More components ship as Stellify's surface area grows. The architecture supports `<st-toggle>`, `<st-table>` etc. on the same model.

### st-sidebar

A collapsible navigation sidebar component. Manages expanded / rail (icon-only) state with persistence, keyboard shortcut (⌘B / Ctrl+B), animated transitions, and accessible arrow-key navigation between items.

```html
<st-sidebar class="border-r bg-card text-foreground">
  <header>
    <a href="/" class="nav-item">
      <svg><!-- logo --></svg>
      <span>App name</span>
    </a>
  </header>

  <nav>
    <div class="nav-section-label">Platform</div>
    <ul>
      <li>
        <a href="/dashboard" class="nav-item">
          <svg><!-- icon --></svg>
          <span>Dashboard</span>
        </a>
      </li>
    </ul>
  </nav>

  <footer>
    <st-menu placement="top-start">
      <button data-menu-trigger type="button">
        <span><!-- avatar --></span>
        <span>User name</span>
        <svg><!-- chevron --></svg>
      </button>
      <div data-menu-content role="menu" hidden>
        <!-- menu items -->
      </div>
    </st-menu>
  </footer>
</st-sidebar>
```

#### Class hooks

The component recognises a few conventional class names on descendants:

- `.nav-item` — Navigation entries (anchors, buttons). In rail mode their text labels hide and their icons centre. The component also uses this class for arrow-key navigation.
- `.nav-section-label` — Section headings like "Platform" or "Settings". Hidden in rail mode.
- `.nav-icon` (optional) — Wrap a non-`<svg>` non-`<img>` icon (e.g. an inline span with a background image) with this class so it's treated as an icon in rail mode.

#### Surface appearance

Apply background, border, text colour, shadows, etc. directly to the `<st-sidebar>` element via Tailwind utilities or your own CSS. The component does not paint its own surface — that's an application-level decision.

Common patterns:

```html
<!-- Card-like sidebar with right border -->
<st-sidebar class="border-r bg-card text-foreground">

<!-- Floating sidebar with shadow -->
<st-sidebar class="rounded-lg border bg-card text-foreground shadow-sm">

<!-- Sidebar matching the page background, no border -->
<st-sidebar class="bg-background text-foreground">
```

#### Customising dimensions and transition

Override these CSS variables on `st-sidebar` to adjust collapse behaviour:

| Variable | Default | Purpose |
|----------|---------|---------|
| `--st-sidebar-width` | `16rem` | Expanded width |
| `--st-sidebar-rail-width` | `4rem` | Collapsed (rail) width |
| `--st-sidebar-duration` | `200ms` | Width transition duration |

```css
st-sidebar {
  --st-sidebar-width: 18rem;
  --st-sidebar-rail-width: 3.5rem;
  --st-sidebar-duration: 150ms;
}
```

#### Toggle button

Any element with the `data-sidebar-toggle` attribute, anywhere on the page, will toggle the sidebar when clicked:

```html
<button type="button" data-sidebar-toggle>Toggle sidebar</button>
```

If the sidebar has an `id`, the component prefers a toggle button with `aria-controls="sidebar-id"` for explicit pairing.

#### Keyboard

- ⌘B (Mac) / Ctrl+B (other) toggles state from anywhere on the page.
- ArrowDown / ArrowUp move focus between `.nav-item` elements when one is focused.

#### What you no longer need

Consumers should *not* add the following to their markup any more — the component owns these behaviours:

- Width classes like `w-64`, `data-[state=rail]:w-16`
- Transition classes like `transition-[width]`, `duration-200`, `ease-in-out`
- Flex direction or overflow on the sidebar itself
- Per-element collapse classes (`sidebar-rail:hidden`, `sidebar-rail:justify-center`, etc.)

The component's CSS handles all of these. Just write semantic markup with the class hooks above.

### st-menu

A dropdown/popup menu primitive. Used for user menus, action menus, and other lists of choices anchored to a trigger button.

```html
<st-menu>
  <button data-menu-trigger type="button" class="...">
    Open menu
  </button>

  <div data-menu-content role="menu" class="..." hidden>
    <a href="/settings" role="menuitem" class="...">Settings</a>
    <button type="button" role="menuitem" class="...">Log out</button>
  </div>
</st-menu>
```

The component discovers the trigger and content via `data-menu-trigger` and `data-menu-content` attributes. Menu items inside the content should have `role="menuitem"` for keyboard navigation.

#### Attributes

- `placement` — Menu position relative to trigger. One of `"top"`, `"bottom"`, `"top-start"`, `"top-end"`, `"bottom-start"`, `"bottom-end"`. Defaults to `"bottom-start"`.

#### Keyboard

- `ArrowDown` / `ArrowUp` — Move between menu items.
- `Home` / `End` — Jump to first / last item.
- `Enter` / `Space` — Activate the focused item.
- `Escape` — Close the menu.
- `Tab` — Close the menu and continue tabbing.

The menu uses the native Popover API where available, with a fallback for older browsers. No additional library required.

### st-frame

A region of the page that updates independently. Links and forms inside the frame navigate without a full page reload — they fetch the target URL and swap only the frame's content. Everything outside the frame stays untouched.

```html
<st-frame id="stats" src="/dashboard/stats">
  <!-- initial server-rendered content -->
  <div>Active users: 1,234</div>
  <a href="/dashboard/stats?period=week">View weekly</a>
</st-frame>
```

When a link inside the frame is clicked, the component fetches the target URL, finds an `<st-frame>` with the same `id` in the response, and swaps its content into the existing frame. The browser URL updates via `history.pushState`. The rest of the page is unaffected.

#### Server response requirements

The server must return a complete HTML document containing an `<st-frame>` with the same `id` as the source frame. The simplest approach is to render the full page as normal — the component extracts the matching frame and ignores everything else. There's no need for a separate "frame-only" route.

For Laravel apps, this means your dashboard route can render the full layout (sidebar, header, frame content) and the frame component will pull out only the frame portion from the response.

#### Attributes

- `id` (required) — Unique identifier for the frame. Used to match frames between current page and response.
- `src` (optional) — Initial URL the frame represents. Updated automatically as the frame navigates.

#### Events

All events bubble.

- `st-frame:before-load` — Cancellable. Fired before fetching. Detail: `{ url, method }`.
- `st-frame:load` — Fired after successful content swap. Detail: `{ url }`.
- `st-frame:error` — Fired on fetch failure or non-OK response. Detail: `{ status, statusText, url }`.
- `st-frame:missing` — Fired if the response did not contain a matching frame. Detail: `{ url }`.

#### Loading state

While a frame is fetching, `data-loading="true"` is set on the host element. Default styling reduces opacity to 0.6 and disables pointer events. Override or extend via CSS:

```css
st-frame[data-loading="true"] {
  opacity: 0.4;
  position: relative;
}

st-frame[data-loading="true"]::after {
  content: 'Loading…';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

#### Opting out

A link or form inside the frame can opt out of interception with `data-st-frame-passthrough`:

```html
<st-frame id="stats">
  <a href="/dashboard/stats?period=day">Day</a> <!-- intercepted -->
  <a href="/help" data-st-frame-passthrough>Help</a> <!-- normal navigation -->
</st-frame>
```

External links (different origin), links with `target="_blank"`, and links with the `download` attribute are never intercepted.

#### Browser back/forward

The component plays nicely with browser navigation. Clicking the back button restores the previous frame state without a full page reload, provided the user has been navigating within the same frame.

#### No-JavaScript fallback

If JavaScript is disabled or hasn't loaded yet, links and forms inside the frame work as normal navigation — full page reloads. The frame degrades gracefully; nothing breaks.

### st-dialog

A modal or non-modal dialog component built on the native `<dialog>` element. The native element handles focus trapping, escape-to-close, top-layer rendering, and the backdrop. `st-dialog` adds trigger integration, light dismiss, and event hooks.

```html
<button type="button" data-dialog-trigger="confirm-delete">
  Delete account
</button>

<st-dialog id="confirm-delete">
  <h2 class="text-lg font-semibold">Delete your account?</h2>
  <p class="mt-2 text-sm text-muted-foreground">
    This action cannot be undone.
  </p>

  <form method="dialog" class="mt-4 flex justify-end gap-2">
    <button type="submit" value="cancel" class="rounded-md border px-3 py-1.5 text-sm">
      Cancel
    </button>
    <button type="submit" value="confirm" class="rounded-md bg-destructive px-3 py-1.5 text-sm text-destructive-foreground">
      Delete
    </button>
  </form>
</st-dialog>
```

#### Triggers

Any element with `data-dialog-trigger="<dialog-id>"` opens the dialog when clicked. Triggers are discovered automatically on connection. Multiple triggers can target the same dialog.

By default, dialogs open as modals (blocking, with backdrop). To open non-modal, add `data-dialog-modal="false"` to the trigger.

#### Form integration

Use `<form method="dialog">` inside the dialog to handle Cancel / Confirm patterns. Submitting the form closes the dialog automatically; the submitter button's `value` is exposed as the dialog's return value:

```ts
const dialog = document.getElementById('confirm-delete')
dialog.addEventListener('st-dialog:close', (e) => {
  if (e.detail.returnValue === 'confirm') {
    // perform action
  }
})
```

For regular forms (POST to a server), the form submits normally; close the dialog manually after success if desired.

#### Programmatic API

```ts
const dialog = document.getElementById('my-dialog') as StDialog

dialog.open()                  // Open as modal
dialog.openNonModal()          // Open as non-modal
dialog.close()                 // Close without return value
dialog.close('confirmed')      // Close with return value
dialog.isOpen                  // Check open state
```

#### Light dismiss

By default, clicking outside the dialog (on the backdrop) closes it. To disable for critical dialogs:

```html
<st-dialog id="x" data-st-dialog-no-light-dismiss>
  …
</st-dialog>
```

#### Events

All events bubble.

- `st-dialog:open` — Fired after the dialog opens. Detail: `{ modal: boolean }`.
- `st-dialog:close` — Fired after the dialog closes. Detail: `{ returnValue: string }`.

#### Styling

Default styling matches the shadcn popover aesthetic — bordered, rounded, padded, with a subtle backdrop and entrance animation. Override on the inner `<dialog>` element or via global CSS:

```css
st-dialog dialog {
  max-width: 28rem;
  padding: 2rem;
}
```

For full control, write your `<dialog>` element explicitly inside the `<st-dialog>`:

```html
<st-dialog id="custom">
  <dialog class="my-custom-dialog">
    <!-- your styling, your structure -->
  </dialog>
</st-dialog>
```

The component uses your `<dialog>` instead of auto-wrapping.

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
