/* maid-atelier.inject.js
 * DOM injection layer for the opencode desktop app, delivered inside the
 * patched oc-theme-preload.js bootstrap. Presentation-only.
 *
 * __MAID_ATELIER_ICON_B64__ is replaced at patch time with the base64 body of
 * maid-atelier/art.ts MAID_ATELIER_ICON (a webp), used for the default
 * project avatar swap.
 */
;(function () {
  'use strict'

  var ICON_DATA_URI = 'data:image/webp;base64,__MAID_ATELIER_ICON_B64__'

  var LOGO_MARK_SVG =
    '<svg data-component="logo-mark" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg" data-maid-skin-owner="true">' +
    '<path d="M8 4c-1.8 3.2-4.6 4.4-4.6 8.2 0 2.1 1.3 3.4 2.8 3.4 1 0 1.8-.5 2.3-1.4l-.5-2.2-1.2-.4.4-1.8 2.9 1c.8-.8 1.3-1.8 1.3-2.9 0-2.2-1.7-3.9-3.4-3.9z" fill="var(--icon-weak-base)"/>' +
    '<path d="M8 4.2c-.6 1.2-1.6 2.1-2.7 2.8.9 2.6 1.4 5.1 2.1 7.7.4-.6.9-.9 1.5-1 .3-2.4.6-4.6.6-7 0-.8-.6-1.5-1.5-1.5z" fill="var(--icon-strong-base)"/>' +
    '<path d="M8 12.4c-1 .5-1.5 1.4-1.5 2.4 0 1 .6 1.8 1.5 1.8s1.5-.8 1.5-1.8c0-1-.5-1.9-1.5-2.4z" fill="var(--icon-strong-base)"/>' +
    '</svg>'

  function ensureSkinAttr() {
    var html = document.documentElement
    if (html.getAttribute('data-maid-skin') !== 'deep-sea-maid-atelier') {
      html.setAttribute('data-maid-skin', 'deep-sea-maid-atelier')
    }
  }

  function install() {
    var root = document.getElementById('root')
    if (!root) return false

    ensureSkinAttr()

    // Project avatar of the default project points at the remote opencode
    // favicon; reroute it to the bundled maid icon so nothing is fetched.
    document.querySelectorAll('img[data-component="app-icon"]').forEach(function (img) {
      var src = img.getAttribute('src') || ''
      if (src.indexOf('opencode.ai/favicon') >= 0 && img.getAttribute('data-maid-skin-owner') !== 'true') {
        img.setAttribute('data-maid-skin-owner', 'true')
        img.setAttribute('src', ICON_DATA_URI)
      }
    })

    // Sidebar logo mark: swap the product glyph for the maid mark.
    document.querySelectorAll('svg[data-component="logo-mark"]').forEach(function (svg) {
      if (svg.getAttribute('data-maid-skin-owner') === 'true') return
      svg.setAttribute('data-maid-skin-owner', 'true')
      svg.innerHTML = LOGO_MARK_SVG
        .replace(/^<svg[^>]*>/, '')
        .replace(/<\/svg>$/, '')
    })

    return true
  }

  function start() {
    ensureSkinAttr()
    if (install()) return
    var attempts = 0
    var timer = window.setInterval(function () {
      attempts += 1
      if (install() || attempts > 60) window.clearInterval(timer)
    }, 500)
    // Keep hosts alive across SPA re-renders (React may clear body children).
    if (window.MutationObserver) {
      var observer = new MutationObserver(function () {
        install()
      })
      observer.observe(document.body, { childList: true, subtree: true })
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start)
  } else {
    start()
  }
})()