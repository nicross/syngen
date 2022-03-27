/**
 * The global point of entry and default export for the framework.
 * @namespace
 */
const syngen = (() => {
  const context = new AudioContext()

  const ready = new Promise((resolve) => {
    document.addEventListener('DOMContentLoaded', resolve)
  })

  return {
    /**
     * Useful functions for generating [AudioBuffers](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer).
     * @memberof syngen
     * @namespace
     */
    buffer: {},
    /**
     * Provides factories that create miscellaneous audio circuits with practical use cases.
     * @memberof syngen
     * @namespace
     */
     circuit: {},
    /**
     * Returns the main `AudioContext`.
     * @memberof syngen
     * @returns {AudioContext}
     */
    context: () => context,
    /**
     * Provides factories for aural processers.
     * @memberof syngen
     * @namespace
     */
     ear: {
       filterModel: {},
       gainModel: {},
     },
    /**
     * Provides factories that create circuits for effects processing.
     * Importantly, these are _not_ the only way to create effects for use with syngen.
     * Implementations can build their own effects or use any external library that supports connecting to its audio graph.
     * @memberof syngen
     * @namespace
     */
     effect: {},
    /**
     * Exposes input across various devices.
     * @memberof syngen
     * @namespace
     */
    input: {},
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
    /**
     * Returns the `currentTime` for the main `AudioContext` plus an optional `duration`.
     * @memberof syngen
     * @param {Number} [duration=0]
     * @returns {Number}
     */
    time: (duration = 0) => context.currentTime + duration,
    /**
     * A collection of reusable tools and data structures.
     * @memberof syngen
     * @namespace
     */
    tool: {},
  }
})()
