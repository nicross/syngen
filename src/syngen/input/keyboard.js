/**
 * @namespace
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
     * @memberof syngen.input.keyboard
     */
    get: () => ({...state}),
    /**
     * @memberof syngen.input.keyboard
     */
    is: (key) => state[key] || false,
    /**
     * @memberof syngen.input.keyboard
     */
    reset: function () {
      state = {}
      return this
    },
  }
})()
