/**
 * Tooltip manager — global, singleton.
 *
 * Components opt in by adding `data-tooltip="label"` (and optionally
 * `data-shortcut="⌘ K"`) to any element they own. The manager lazily
 * creates a single tooltip element on document.body and handles
 * hover/blur/Esc dismissal with a deliberate 350ms show delay and
 * instant hide.
 *
 * Components can scope the manager with `attach(rootElement, predicate)`
 * — used by <st-sidebar> to only show tooltips when in rail mode.
 */

const TOOLTIP_DELAY = 350
const TOOLTIP_CLASS = 'st-tooltip'

let tooltipEl: HTMLDivElement | null = null

function ensureTooltipEl(): HTMLDivElement {
  if (tooltipEl) return tooltipEl
  const existing = document.querySelector<HTMLDivElement>(`.${TOOLTIP_CLASS}`)
  if (existing) {
    tooltipEl = existing
    return existing
  }
  const el = document.createElement('div')
  el.className = TOOLTIP_CLASS
  el.setAttribute('role', 'tooltip')
  el.setAttribute('aria-hidden', 'true')
  document.body.appendChild(el)
  tooltipEl = el
  return el
}

export interface TooltipScope {
  /** Returns true if a tooltip should be shown for the given target. */
  shouldShow?: (target: HTMLElement) => boolean
  /** Cleans up listeners and hides any visible tooltip. */
  detach: () => void
}

export const tooltipManager = {
  /**
   * Attach hover-tooltip behaviour to a root element. Children with
   * `data-tooltip` will produce tooltips on hover.
   */
  attach(root: HTMLElement, options?: { shouldShow?: (target: HTMLElement) => boolean }): TooltipScope {
    const tip = ensureTooltipEl()
    let timer: ReturnType<typeof setTimeout> | null = null
    let active: HTMLElement | null = null

    const show = (target: HTMLElement) => {
      if (options?.shouldShow && !options.shouldShow(target)) return
      const label = target.dataset.tooltip
      if (!label) return
      active = target
      const shortcut = target.dataset.shortcut
      tip.innerHTML = label + (shortcut ? `<span class="kbd-inline">${shortcut}</span>` : '')
      const rect = target.getBoundingClientRect()
      tip.style.left = `${rect.right + 8}px`
      tip.setAttribute('data-visible', 'true')
      tip.setAttribute('aria-hidden', 'false')
      // Centre vertically once dimensions are known
      tip.style.top = `${rect.top + rect.height / 2 - tip.offsetHeight / 2}px`
    }

    const hide = () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      tip.setAttribute('data-visible', 'false')
      tip.setAttribute('aria-hidden', 'true')
      active = null
    }

    const onOver = (e: Event) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>('[data-tooltip]')
      if (!target || target === active) return
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => show(target), TOOLTIP_DELAY)
    }

    const onOut = (e: Event) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>('[data-tooltip]')
      if (!target) return
      hide()
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide()
    }

    root.addEventListener('mouseover', onOver)
    root.addEventListener('mouseout', onOut)
    document.addEventListener('keydown', onKey)

    return {
      shouldShow: options?.shouldShow,
      detach() {
        root.removeEventListener('mouseover', onOver)
        root.removeEventListener('mouseout', onOut)
        document.removeEventListener('keydown', onKey)
        hide()
      },
    }
  },
}
