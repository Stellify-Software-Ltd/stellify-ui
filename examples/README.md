# Examples

Working examples demonstrating @stellify/ui components.

## Running the examples

Build the library first:

```bash
npm install
npm run build
```

Then open any HTML file in a browser. For local development with live reload, use a simple static server:

```bash
npx serve .
```

Then visit `http://localhost:3000/examples/login-form.html`.

## Examples

### login-form.html

A complete login form demonstrating:

- `<sk-form>` — Form validation orchestration and loading states
- `<sk-field>` — Field-level validation (required, email format, password length)
- Password reveal toggle via `[data-reveal]`
- Design tokens from the shadcn theme

Try submitting with empty fields or an invalid email to see validation in action.
