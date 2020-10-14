/**
 * The global point of entry and default export for the library.
 * @namespace
 */
const syngen = (() => {
  const ready = new Promise((resolve) => {
    document.addEventListener('DOMContentLoaded', resolve)
  })

  return {
    /**
     * Exposes input across various devices.
     * @memberof syngen
     * @namespace
     */
    input: {},
    /**
     * Objects that can be positioned on the soundstage.
     * @memberof syngen
     * @namespace
     */
    prop: {},
    /**
     * Returns a promise that resolves when the document has finished loading.
     * @memberof syngen
     * @param {Function} [callback] - Called when resolved
     * @returns {Promise}
     */
    ready: (callback) => {
      return typeof callback == 'function'
        ? ready.then(callback)
        : ready
    },
  }
})()
