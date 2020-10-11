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
    get: () => ({...state}),
    is: (key) => state[key] || false,
    reset: function () {
      state = {}
      return this
    },
  }
})()
