/* maid-atelier.inject.js
 * DOM injection layer for the opencode desktop app.
 * Ensures the data-maid-skin attribute stays on <html> across React re-renders.
 */
;(function () {
  'use strict'

  function ensureSkinAttr() {
    var html = document.documentElement
    if (html.getAttribute('data-maid-skin') !== 'deep-sea-maid-atelier') {
      html.setAttribute('data-maid-skin', 'deep-sea-maid-atelier')
    }
  }

  function start() {
    ensureSkinAttr()
    if (window.MutationObserver) {
      var observer = new MutationObserver(function () {
        ensureSkinAttr()
      })
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-maid-skin'] })
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start)
  } else {
    start()
  }
})()
