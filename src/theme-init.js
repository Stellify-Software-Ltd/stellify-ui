/**
 * Theme Initialization Script
 *
 * Paste this IIFE into your <head> BEFORE any stylesheets or modules load.
 * It reads the user's saved theme preference from localStorage and applies
 * the `.dark` class to <html> synchronously, preventing flash of wrong theme.
 *
 * Usage:
 *   <script>
 *   (function(){try{var t=localStorage.getItem("stellify.theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})();
 *   </script>
 *
 * Or expanded for readability:
 */
;(function () {
  try {
    var theme = localStorage.getItem('stellify.theme')
    var isDark =
      theme === 'dark' ||
      (theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)
    if (isDark) {
      document.documentElement.classList.add('dark')
    }
  } catch (e) {
    // localStorage unavailable (private mode, disabled, etc.)
  }
})()
