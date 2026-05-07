/**
 * Small typed wrapper over localStorage. All operations swallow
 * exceptions (private mode, quota exceeded, disabled storage)
 * and return null/false rather than throwing.
 */
export const persistedState = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },

  set(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value)
      return true
    } catch {
      return false
    }
  },

  remove(key: string): boolean {
    try {
      localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  },
}
