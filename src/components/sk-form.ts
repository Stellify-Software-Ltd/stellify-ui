import type { SkField } from './sk-field.js'

/**
 * <sk-form>
 *
 * Wraps an existing <form> element and orchestrates client-side
 * desktop-grade behaviour around it:
 *
 *   - On submit (click or Enter), runs sk-field validation
 *     synchronously across all fields. If any fail, prevents
 *     submission and focuses the first invalid field.
 *   - Reflects loading state on the submit button via [loading]
 *     and [disabled] attributes (CSS handles the visual)
 *   - Shows form-level alerts via [data-form-alert] container
 *
 * Native form submission still happens — the component intercepts
 * only to gate on validation. If validation passes, the form
 * submits to its action attribute as normal.
 *
 * v0.2 will add optional StellifyJS Form binding for richer
 * client-side validation rules and 422 response handling.
 */
export class SkForm extends HTMLElement {
  private _mounted = false
  private _form: HTMLFormElement | null = null
  private _submitBtn: HTMLButtonElement | null = null
  private _alert: HTMLElement | null = null
  private _cleanups: Array<() => void> = []

  override connectedCallback() {
    if (this._mounted) return
    this._mounted = true
    // Wait for child custom elements to upgrade
    queueMicrotask(() => this._init())
  }

  override disconnectedCallback() {
    this._cleanups.forEach((fn) => fn())
    this._cleanups = []
    this._mounted = false
  }

  private _init() {
    this._form = this.querySelector('form')
    if (!this._form) return

    this._submitBtn = this._form.querySelector('button[type="submit"]')
    this._alert = this._form.querySelector('[data-form-alert]')

    const onSubmit = (e: Event) => this._onSubmit(e)
    this._form.addEventListener('submit', onSubmit)
    this._cleanups.push(() => this._form?.removeEventListener('submit', onSubmit))
  }

  // ---------- Submit handler ----------------------------------------------

  private _onSubmit(e: Event) {
    const fields = [...this.querySelectorAll<SkField>('sk-field')]

    let allValid = true
    for (const field of fields) {
      if (!field.validate()) allValid = false
    }

    if (!allValid) {
      e.preventDefault()
      this._focusFirstInvalid()
      this._setAlert('Please fix the highlighted fields and try again.')
      return
    }

    // Validation passed — let the form submit naturally.
    this._setAlert('')
    this._setLoading(true)

    // If the consumer prevented default elsewhere (e.g. for fetch-based
    // submission), reset loading state after a moment so the UI
    // doesn't hang. Real apps integrating with Stellify Forms will
    // override this in v0.2.
    setTimeout(() => this._setLoading(false), 8000)
  }

  // ---------- UI helpers ---------------------------------------------------

  private _focusFirstInvalid() {
    const invalid = this.querySelector<SkField>(
      'sk-field [aria-invalid="true"]',
    )?.closest<SkField>('sk-field')
    invalid?.focus()
  }

  private _setLoading(loading: boolean) {
    if (!this._submitBtn) return
    if (loading) {
      this._submitBtn.setAttribute('loading', '')
      this._submitBtn.setAttribute('disabled', '')
      this._submitBtn.setAttribute('aria-busy', 'true')
    } else {
      this._submitBtn.removeAttribute('loading')
      this._submitBtn.removeAttribute('disabled')
      this._submitBtn.removeAttribute('aria-busy')
    }
  }

  private _setAlert(message: string) {
    if (!this._alert) return
    if (message) {
      this._alert.textContent = message
      this._alert.setAttribute('active', '')
      this._alert.style.removeProperty('display')
    } else {
      this._alert.removeAttribute('active')
      this._alert.textContent = ''
      this._alert.style.display = 'none'
    }
  }

  // ---------- Public API ---------------------------------------------------

  /** Set field-level errors from a server response. */
  setServerErrors(errors: Record<string, string[] | string>) {
    const fields = [...this.querySelectorAll<SkField>('sk-field')]
    for (const field of fields) {
      const fieldErrors = errors[field.fieldName]
      if (fieldErrors) {
        const message = Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors
        if (message) field.setServerError(message)
      }
    }
    this._focusFirstInvalid()
  }
}

customElements.define('sk-form', SkForm)

declare global {
  interface HTMLElementTagNameMap {
    'sk-form': SkForm
  }
}
