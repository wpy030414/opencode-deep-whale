// inject.js
// Shared DOM injection layer for all skin packages.
// Ensures the data-skin attribute stays on <html> across React re-renders.
;(function () {
  'use strict'

  function ensureSkinAttr() {
    var html = document.documentElement
    if (html.getAttribute('data-skin') !== 'active') {
      html.setAttribute('data-skin', 'active')
    }
  }

  function start() {
    ensureSkinAttr()
    if (window.MutationObserver) {
      var observer = new MutationObserver(function () {
        ensureSkinAttr()
      })
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-skin'] })
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start)
  } else {
    start()
  }
})()
