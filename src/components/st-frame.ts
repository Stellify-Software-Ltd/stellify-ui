import './st-frame.css'

/**
 * <st-frame>
 *
 * Turns a region of the page into an independently-updating subview.
 * Links and form submissions inside the frame fetch the target URL
 * and update only the frame's content, leaving the rest of the page
 * untouched. The browser URL updates via history.pushState.
 *
 * Works without JavaScript — links and forms function as normal
 * navigation. With JavaScript, those navigations happen in place.
 */
export class StFrame extends HTMLElement {
  static observedAttributes = ['src', 'id']

  private _mounted = false
  private _cleanups: Array<() => void> = []
  private _abortController: AbortController | null = null

  connectedCallback() {
    if (this._mounted) return
    this._mounted = true

    if (!this.id) {
      console.warn('<st-frame> requires an id attribute to function.')
      return
    }

    this._initLinkInterception()
    this._initFormInterception()
    this._initPopState()
  }

  disconnectedCallback() {
    this._cleanups.forEach((fn) => fn())
    this._cleanups = []
    this._abortController?.abort()
    this._abortController = null
    this._mounted = false
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (!this._mounted) return

    if (name === 'src' && oldValue !== null && newValue !== null && oldValue !== newValue) {
      // src changed programmatically — trigger navigation
      this._navigate(newValue, { pushState: true })
    }

    if (name === 'id' && oldValue !== null && oldValue !== newValue) {
      console.warn('<st-frame> id should not change after mounting.')
    }
  }

  // ---------- Public API ---------------------------------------------------

  get src(): string | null {
    return this.getAttribute('src')
  }

  set src(value: string | null) {
    if (value === null) {
      this.removeAttribute('src')
    } else {
      this.setAttribute('src', value)
    }
  }

  // ---------- Link interception --------------------------------------------

  private _initLinkInterception() {
    const onClick = (e: MouseEvent) => {
      // Modifier keys — let browser handle (open in new tab, etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href]')
      if (!link) return

      // Check if this frame is the closest ancestor frame for this link
      const closestFrame = link.closest('st-frame')
      if (closestFrame !== this) return

      // Skip external links (different origin)
      if (link.origin !== location.origin) return

      // Skip links with target attribute
      if (link.hasAttribute('target')) return

      // Skip links with download attribute
      if (link.hasAttribute('download')) return

      // Skip links with passthrough attribute
      if (link.hasAttribute('data-st-frame-passthrough')) return

      e.preventDefault()
      this._navigate(link.href, { pushState: true })
    }

    this.addEventListener('click', onClick)
    this._cleanups.push(() => this.removeEventListener('click', onClick))
  }

  // ---------- Form interception --------------------------------------------

  private _initFormInterception() {
    const onSubmit = (e: SubmitEvent) => {
      const form = (e.target as HTMLElement).closest<HTMLFormElement>('form')
      if (!form) return

      // Check if this frame is the closest ancestor frame for this form
      const closestFrame = form.closest('st-frame')
      if (closestFrame !== this) return

      // Determine action URL
      const action = form.action || location.href
      let actionUrl: URL
      try {
        actionUrl = new URL(action, location.origin)
      } catch {
        return // Invalid URL, let default behavior happen
      }

      // Skip external forms (different origin)
      if (actionUrl.origin !== location.origin) return

      // Skip forms with target attribute
      if (form.hasAttribute('target')) return

      // Skip forms with passthrough attribute
      if (form.hasAttribute('data-st-frame-passthrough')) return

      e.preventDefault()

      const formData = new FormData(form)
      const method = (form.method || 'get').toUpperCase()

      if (method === 'GET') {
        // Append form data as query string
        const params = new URLSearchParams()
        for (const [key, value] of formData.entries()) {
          if (typeof value === 'string') {
            params.append(key, value)
          }
        }
        actionUrl.search = params.toString()
        this._navigate(actionUrl.href, { pushState: true })
      } else {
        // POST or other method
        this._navigate(actionUrl.href, {
          method,
          body: formData,
          pushState: true,
        })
      }
    }

    this.addEventListener('submit', onSubmit)
    this._cleanups.push(() => this.removeEventListener('submit', onSubmit))
  }

  // ---------- Browser history ----------------------------------------------

  private _initPopState() {
    const onPopState = (e: PopStateEvent) => {
      // Check if this popstate event is for this frame
      if (e.state?.stFrameId === this.id) {
        // Navigate to current URL but don't push history again
        this._navigate(location.href, { pushState: false })
      }
    }

    window.addEventListener('popstate', onPopState)
    this._cleanups.push(() => window.removeEventListener('popstate', onPopState))
  }

  // ---------- Navigation logic ---------------------------------------------

  private async _navigate(
    url: string,
    options: {
      method?: string
      body?: FormData
      pushState?: boolean
    } = {},
  ) {
    const { method = 'GET', body, pushState = true } = options

    // Cancel any in-flight request
    this._abortController?.abort()
    this._abortController = new AbortController()

    // Set loading state
    this.setAttribute('data-loading', 'true')

    // Dispatch before-load event (cancellable)
    const beforeLoadEvent = new CustomEvent('st-frame:before-load', {
      detail: { url, method },
      bubbles: true,
      cancelable: true,
    })
    this.dispatchEvent(beforeLoadEvent)

    if (beforeLoadEvent.defaultPrevented) {
      this.removeAttribute('data-loading')
      return
    }

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: {
          Accept: 'text/html',
          'X-Requested-With': 'st-frame',
        },
        signal: this._abortController.signal,
      }

      if (body && method !== 'GET') {
        fetchOptions.body = body
      }

      const response = await fetch(url, fetchOptions)

      // Handle errors
      if (!response.ok) {
        this.dispatchEvent(
          new CustomEvent('st-frame:error', {
            detail: {
              status: response.status,
              statusText: response.statusText,
              url,
            },
            bubbles: true,
          }),
        )
        this.removeAttribute('data-loading')
        return
      }

      // Get final URL (after any redirects)
      const finalUrl = response.url

      // Parse response
      const html = await response.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')

      // Find matching frame in response
      const newFrame = doc.querySelector<StFrame>(`st-frame#${CSS.escape(this.id)}`)

      if (!newFrame) {
        this.dispatchEvent(
          new CustomEvent('st-frame:missing', {
            detail: { url: finalUrl },
            bubbles: true,
          }),
        )
        this.removeAttribute('data-loading')
        return
      }

      // Swap content
      this.replaceChildren(...newFrame.childNodes)

      // Update src attribute
      this.setAttribute('src', finalUrl)

      // Update browser history
      if (pushState) {
        history.pushState({ stFrameId: this.id }, '', finalUrl)
      }

      // Dispatch success event
      this.dispatchEvent(
        new CustomEvent('st-frame:load', {
          detail: { url: finalUrl },
          bubbles: true,
        }),
      )
    } catch (error) {
      // Ignore abort errors (expected when cancelling in-flight requests)
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }

      // Network or other errors
      this.dispatchEvent(
        new CustomEvent('st-frame:error', {
          detail: {
            status: 0,
            statusText: error instanceof Error ? error.message : 'Network error',
            url,
          },
          bubbles: true,
        }),
      )
    } finally {
      this.removeAttribute('data-loading')
    }
  }
}

customElements.define('st-frame', StFrame)

declare global {
  interface HTMLElementTagNameMap {
    'st-frame': StFrame
  }
}
