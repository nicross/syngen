/**
 * @namespace
 */
const syngen = (() => {
  const ready = new Promise((resolve) => {
    document.addEventListener('DOMContentLoaded', resolve)
  })

  return {
    input: {},
    prop: {},
    /**
     * @memberof syngen
     * @param {Function} [callback]
     * @returns {Promise}
     */
    ready: (callback) => {
      return typeof callback == 'function'
        ? ready.then(callback)
        : ready
    },
  }
})()
