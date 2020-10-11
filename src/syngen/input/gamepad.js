syngen.input.gamepad = (() => {
  let deadzone = 0.1875

  let state = {
    analog: {},
    axis: {},
    digital: {},
  }

  function applyDeadzone(value) {
    const ratio = (Math.abs(value) - deadzone) / (1 - deadzone)

    return ratio > 0
      ? syngen.utility.sign(value) * ratio
      : 0
  }

  return {
    get: () => ({...state}),
    getAnalog: function (key, invert = false) {
      const value = state.analog[key] || 0

      if (invert && value) {
        return -1 * value
      }

      return value
    },
    getAxis: function (key, invert = false) {
      const value = state.axis[key] || 0

      if (invert && value) {
        return -1 * value
      }

      return value
    },
    hasAxis: function (...keys) {
      for (const key of keys) {
        if (!(key in state.axis)) {
          return false
        }
      }

      return true
    },
    isDigital: (key) => Boolean(state.digital[key]),
    reset: function () {
      state = {
        analog: {},
        axis: {},
        digital: {},
      }

      return this
    },
    setDeadzone: function (value = 0) {
      deadzone = Number(value) || 0
      return this
    },
    update: function () {
      const gamepads = navigator.getGamepads()

      this.reset()

      for (const gamepad of gamepads) {
        if (!gamepad) {
          continue
        }

        gamepad.axes.forEach((value, i) => {
          value = applyDeadzone(value)

          if (!(i in state.axis)) {
            state.axis[i] = 0
          }

          state.axis[i] = syngen.utility.clamp(state.axis[i] + value, -1, 1) || 0
        })

        gamepad.buttons.forEach((button, i) => {
          if (!(i in state.analog)) {
            state.analog[i] = 0
          }

          state.analog[i] = Math.min(state.analog[i] + button.value, 1) || 0
          state.digital[i] |= button.pressed
        })
      }

      return this
    },
  }
})()

syngen.loop.on('frame', () => syngen.input.gamepad.update())
