import './st-dialog.css'

/**
 * <st-dialog>
 *
 * Modal and non-modal dialog component built on the native <dialog> element.
 * The native element handles focus trapping, escape-to-close, top-layer
 * rendering, and the backdrop. This component adds trigger integration,
 * light dismiss, and event hooks.
 */
export class StDialog extends HTMLElement {
  private _mounted = false
  private _dialog: HTMLDialogElement | null = null
  private _cleanups: Array<() => void> = []
  private _triggerCleanups: Array<() => void> = []

  connectedCallback() {
    if (this._mounted) return
    this._mounted = true

    this._ensureDialog()
    if (!this._dialog) return

    this._initCloseListener()
    this._initLightDismiss()
    this.refreshTriggers()
  }

  disconnectedCallback() {
    this._cleanups.forEach((fn) => fn())
    this._cleanups = []
    this._triggerCleanups.forEach((fn) => fn())
    this._triggerCleanups = []
    this._mounted = false
  }

  // ---------- Public API ---------------------------------------------------

  get isOpen(): boolean {
    return this._dialog?.open ?? false
  }

  open(): void {
    if (!this._dialog || this._dialog.open) return

    this._dialog.showModal()
    this.dispatchEvent(
      new CustomEvent('st-dialog:open', {
        bubbles: true,
        detail: { modal: true },
      }),
    )
  }

  openNonModal(): void {
    if (!this._dialog || this._dialog.open) return

    this._dialog.show()
    this.dispatchEvent(
      new CustomEvent('st-dialog:open', {
        bubbles: true,
        detail: { modal: false },
      }),
    )
  }

  close(returnValue?: string): void {
    if (!this._dialog || !this._dialog.open) return

    this._dialog.close(returnValue)
  }

  refreshTriggers(): void {
    // Clean up existing trigger listeners
    this._triggerCleanups.forEach((fn) => fn())
    this._triggerCleanups = []

    if (!this.id) return

    const triggers = document.querySelectorAll<HTMLElement>(
      `[data-dialog-trigger="${this.id}"]`,
    )

    triggers.forEach((trigger) => {
      const onClick = this._onTriggerClick.bind(this)
      trigger.addEventListener('click', onClick)
      this._triggerCleanups.push(() => trigger.removeEventListener('click', onClick))
    })
  }

  // ---------- Dialog setup -------------------------------------------------

  private _ensureDialog(): void {
    // Check if there's already a dialog child
    const existing = this.querySelector('dialog')
    if (existing) {
      this._dialog = existing
      return
    }

    // Auto-wrap: move all children into a new dialog element
    const dialog = document.createElement('dialog')
    while (this.firstChild) {
      dialog.appendChild(this.firstChild)
    }
    this.appendChild(dialog)
    this._dialog = dialog
  }

  // ---------- Event handling -----------------------------------------------

  private _initCloseListener(): void {
    if (!this._dialog) return

    const onClose = () => {
      this.dispatchEvent(
        new CustomEvent('st-dialog:close', {
          bubbles: true,
          detail: { returnValue: this._dialog?.returnValue ?? '' },
        }),
      )
    }

    this._dialog.addEventListener('close', onClose)
    this._cleanups.push(() => this._dialog?.removeEventListener('close', onClose))
  }

  private _initLightDismiss(): void {
    if (!this._dialog) return

    const onClick = (e: MouseEvent) => {
      // Check if light dismiss is disabled
      if (this.hasAttribute('data-st-dialog-no-light-dismiss')) return

      // Only close if the click target is the dialog itself (backdrop click)
      if (e.target === this._dialog) {
        this.close('dismiss')
      }
    }

    this._dialog.addEventListener('click', onClick)
    this._cleanups.push(() => this._dialog?.removeEventListener('click', onClick))
  }

  private _onTriggerClick = (e: Event): void => {
    e.preventDefault()
    const trigger = e.currentTarget as HTMLElement
    const modal = trigger.getAttribute('data-dialog-modal') !== 'false'
    if (modal) {
      this.open()
    } else {
      this.openNonModal()
    }
  }
}

customElements.define('st-dialog', StDialog)

declare global {
  interface HTMLElementTagNameMap {
    'st-dialog': StDialog
  }
}
