/**
 * Exposes keypresses by their codes.
 * @namespace
 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
 */
syngen.input.keyboard = (() => {
  let state = {}

  window.addEventListener('keydown', onKeydown)
  window.addEventListener('keyup', onKeyup)

  function onKeydown(e) {
    if (e.repeat) {
      return
    }

    state[e.code] = true
  }

  function onKeyup(e) {
    state[e.code] = false
  }

  return {
    /**
     * Returns a hash of all pressed keys, keyed by code.
     * For example, if <kbd>F</kbd> is pressed, then `KeyF` is `true`.
     * @memberof syngen.input.keyboard
     * @returns {Object}
     */
    get: () => ({...state}),
    /**
     * Returns whether the key with `code` is pressed.
     * @memberof syngen.input.keyboard
     * @param {String} code
     * @returns {Boolean}
     */
    is: (code) => state[code] || false,
    /**
     * Resets all pressed keys.
     * @memberof syngen.input.keyboard
     */
    reset: function () {
      state = {}
      return this
    },
  }
})()

document.addEventListener('visibilitychange', () => syngen.input.keyboard.reset())
