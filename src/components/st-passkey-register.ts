/**
 * <st-passkey-register>
 *
 * Orchestrates WebAuthn passkey registration. Wraps a standard HTML form;
 * on submission, intercepts the request, fetches WebAuthn registration options
 * from the server, triggers navigator.credentials.create() to invoke the
 * browser's passkey UI, then posts the resulting credential to the server.
 *
 * This component is behaviour-only — appearance is consumer territory.
 */

// ---------- Base64url encoding helpers ---------------------------------------

function base64UrlToArrayBuffer(base64Url: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4)
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// ---------- Types ------------------------------------------------------------

interface WebAuthnCreationOptions {
  challenge: string
  rp: { name: string; id?: string }
  user: { id: string; name: string; displayName: string }
  pubKeyCredParams: Array<{ type: 'public-key'; alg: number }>
  timeout?: number
  excludeCredentials?: Array<{ type: 'public-key'; id: string; transports?: string[] }>
  authenticatorSelection?: {
    authenticatorAttachment?: 'platform' | 'cross-platform'
    residentKey?: 'discouraged' | 'preferred' | 'required'
    requireResidentKey?: boolean
    userVerification?: 'discouraged' | 'preferred' | 'required'
  }
  attestation?: 'none' | 'indirect' | 'direct' | 'enterprise'
  extensions?: Record<string, unknown>
}

interface SerializedCredential {
  id: string
  rawId: string
  type: 'public-key'
  response: {
    clientDataJSON: string
    attestationObject: string
  }
  authenticatorAttachment?: string
}

type RegistrationStage = 'options' | 'create' | 'store'

// ---------- Error messages ---------------------------------------------------

const ERROR_MESSAGES = {
  browserUnsupported: 'Your browser does not support passkeys.',
  optionsFailed: 'Could not start passkey registration. Please try again.',
  createFailed: 'Passkey creation failed. Please try again.',
  storeFailed: 'Could not save your passkey. Please try again.',
  cancelled: 'Registration cancelled.',
}

// ---------- Component --------------------------------------------------------

export class StPasskeyRegister extends HTMLElement {
  private _mounted = false
  private _form: HTMLFormElement | null = null
  private _submitButton: HTMLButtonElement | null = null
  private _errorElement: HTMLElement | null = null
  private _cleanups: Array<() => void> = []

  connectedCallback() {
    if (this._mounted) return
    this._mounted = true

    // Read required attributes
    const optionsEndpoint = this.getAttribute('options-endpoint')
    const storeEndpoint = this.getAttribute('store-endpoint')

    if (!optionsEndpoint) {
      console.warn('<st-passkey-register>: Missing required attribute "options-endpoint".')
      return
    }

    if (!storeEndpoint) {
      console.warn('<st-passkey-register>: Missing required attribute "store-endpoint".')
      return
    }

    // Discover inner form
    this._form = this.querySelector<HTMLFormElement>('form')
    if (!this._form) {
      console.warn('<st-passkey-register>: No <form> element found inside.')
      return
    }

    // Discover submit button and error element
    this._submitButton = this._form.querySelector<HTMLButtonElement>('button[type="submit"], button:not([type])')
    this._errorElement = this.querySelector<HTMLElement>('[data-passkey-error]')

    // Check browser support
    if (!this._isWebAuthnSupported()) {
      this._showError(ERROR_MESSAGES.browserUnsupported)
      if (this._submitButton) {
        this._submitButton.disabled = true
      }
      return
    }

    // Wire submit handler
    const onSubmit = (e: Event) => {
      e.preventDefault()
      void this.register()
    }
    this._form.addEventListener('submit', onSubmit)
    this._cleanups.push(() => this._form?.removeEventListener('submit', onSubmit))
  }

  disconnectedCallback() {
    this._cleanups.forEach((fn) => fn())
    this._cleanups = []
    this._mounted = false
  }

  // ---------- Public API -----------------------------------------------------

  async register(): Promise<void> {
    if (!this._form) return

    const optionsEndpoint = this.getAttribute('options-endpoint')
    const storeEndpoint = this.getAttribute('store-endpoint')

    if (!optionsEndpoint || !storeEndpoint) return

    // Fire start event
    this.dispatchEvent(
      new CustomEvent('st-passkey-register:start', { bubbles: true }),
    )

    // Enter loading state
    this._setLoading(true)
    this._clearError()

    try {
      // Step 1: Serialise form data
      const formData = this._serializeForm(this._form)

      // Step 2: Fetch options from server
      let options: WebAuthnCreationOptions
      try {
        options = await this._fetchOptions(optionsEndpoint, formData)
      } catch (err) {
        this._handleError('options', err as Error, ERROR_MESSAGES.optionsFailed)
        return
      }

      // Step 3: Call navigator.credentials.create()
      let credential: PublicKeyCredential
      try {
        const publicKeyOptions = this._decodeOptions(options)
        const result = await navigator.credentials.create({ publicKey: publicKeyOptions })
        if (!result) {
          throw new Error('No credential returned')
        }
        credential = result as PublicKeyCredential
      } catch (err) {
        const error = err as Error
        // Check if user cancelled
        if (this._isUserCancellation(error)) {
          this.dispatchEvent(
            new CustomEvent('st-passkey-register:cancel', { bubbles: true }),
          )
          this._setLoading(false)
          return
        }
        this._handleError('create', error, ERROR_MESSAGES.createFailed)
        return
      }

      // Step 4: Serialise credential and send to store endpoint
      const serializedCredential = this._serializeCredential(credential)
      let response: Response
      try {
        response = await this._storeCredential(storeEndpoint, formData, serializedCredential)
      } catch (err) {
        this._handleError('store', err as Error, ERROR_MESSAGES.storeFailed)
        return
      }

      // Step 5: Handle success
      const responseData = await response.json().catch(() => ({}))

      this.dispatchEvent(
        new CustomEvent('st-passkey-register:success', {
          bubbles: true,
          detail: { response: responseData },
        }),
      )

      // Redirect or reload
      const location = response.headers.get('Location')
      if (location) {
        window.location.href = location
      } else {
        window.location.reload()
      }
    } finally {
      this._setLoading(false)
    }
  }

  // ---------- Browser support ------------------------------------------------

  private _isWebAuthnSupported(): boolean {
    return (
      'credentials' in navigator &&
      'create' in navigator.credentials
    )
  }

  // ---------- Form handling --------------------------------------------------

  private _serializeForm(form: HTMLFormElement): Record<string, unknown> {
    const formData = new FormData(form)
    const data: Record<string, unknown> = {}
    formData.forEach((value, key) => {
      data[key] = value
    })
    return data
  }

  // ---------- CSRF handling --------------------------------------------------

  private _getCsrfToken(): string | null {
    // Try meta tag first
    const metaTag = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
    if (metaTag?.content) {
      return metaTag.content
    }

    // Try form field
    if (this._form) {
      const tokenInput = this._form.querySelector<HTMLInputElement>('input[name="_token"]')
      if (tokenInput?.value) {
        return tokenInput.value
      }
    }

    return null
  }

  private _getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    const csrfToken = this._getCsrfToken()
    if (csrfToken) {
      headers['X-CSRF-TOKEN'] = csrfToken
    }

    return headers
  }

  // ---------- Server communication -------------------------------------------

  private async _fetchOptions(
    endpoint: string,
    formData: Record<string, unknown>,
  ): Promise<WebAuthnCreationOptions> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: this._getHeaders(),
      body: JSON.stringify(formData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  private async _storeCredential(
    endpoint: string,
    formData: Record<string, unknown>,
    credential: SerializedCredential,
  ): Promise<Response> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: this._getHeaders(),
      body: JSON.stringify({
        ...formData,
        credential,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || ERROR_MESSAGES.storeFailed)
    }

    return response
  }

  // ---------- WebAuthn encoding ----------------------------------------------

  private _decodeOptions(options: WebAuthnCreationOptions): PublicKeyCredentialCreationOptions {
    const decoded: PublicKeyCredentialCreationOptions = {
      challenge: base64UrlToArrayBuffer(options.challenge),
      rp: options.rp,
      user: {
        id: base64UrlToArrayBuffer(options.user.id),
        name: options.user.name,
        displayName: options.user.displayName,
      },
      pubKeyCredParams: options.pubKeyCredParams,
    }

    if (options.timeout !== undefined) {
      decoded.timeout = options.timeout
    }

    if (options.authenticatorSelection) {
      decoded.authenticatorSelection = options.authenticatorSelection
    }

    if (options.attestation) {
      decoded.attestation = options.attestation
    }

    if (options.extensions) {
      decoded.extensions = options.extensions
    }

    if (options.excludeCredentials) {
      decoded.excludeCredentials = options.excludeCredentials.map((cred) => ({
        type: cred.type,
        id: base64UrlToArrayBuffer(cred.id),
        transports: cred.transports as AuthenticatorTransport[] | undefined,
      }))
    }

    return decoded
  }

  private _serializeCredential(credential: PublicKeyCredential): SerializedCredential {
    const response = credential.response as AuthenticatorAttestationResponse

    const serialized: SerializedCredential = {
      id: credential.id,
      rawId: arrayBufferToBase64Url(credential.rawId),
      type: 'public-key',
      response: {
        clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
        attestationObject: arrayBufferToBase64Url(response.attestationObject),
      },
    }

    if (credential.authenticatorAttachment) {
      serialized.authenticatorAttachment = credential.authenticatorAttachment
    }

    return serialized
  }

  // ---------- Error handling -------------------------------------------------

  private _isUserCancellation(error: Error): boolean {
    // WebAuthn throws NotAllowedError when user cancels
    return (
      error.name === 'NotAllowedError' ||
      error.message.includes('cancelled') ||
      error.message.includes('canceled')
    )
  }

  private _handleError(stage: RegistrationStage, error: Error, fallbackMessage: string): void {
    const message = error.message || fallbackMessage

    this.dispatchEvent(
      new CustomEvent('st-passkey-register:error', {
        bubbles: true,
        detail: { stage, error },
      }),
    )

    this._showError(message)
    this._setLoading(false)
  }

  // ---------- UI state -------------------------------------------------------

  private _setLoading(loading: boolean): void {
    if (loading) {
      this.setAttribute('data-loading', 'true')
      if (this._submitButton) {
        this._submitButton.disabled = true
      }
    } else {
      this.removeAttribute('data-loading')
      if (this._submitButton) {
        this._submitButton.disabled = false
      }
    }
  }

  private _showError(message: string): void {
    if (this._errorElement) {
      this._errorElement.textContent = message
      this._errorElement.hidden = false
    } else {
      console.error('<st-passkey-register>:', message)
    }
  }

  private _clearError(): void {
    if (this._errorElement) {
      this._errorElement.textContent = ''
      this._errorElement.hidden = true
    }
  }
}

customElements.define('st-passkey-register', StPasskeyRegister)

declare global {
  interface HTMLElementTagNameMap {
    'st-passkey-register': StPasskeyRegister
  }
}
