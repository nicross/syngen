/**
 * Queries gamepad input once per frame and exposes its state.
 * @namespace
 */
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
    /**
     * Returns the gamepad state.
     * @memberof syngen.input.gamepad
     * @returns {Object}
     */
    get: () => ({
      analog: {...state.analog},
      axis: {...state.axis},
      digital: {...state.digital},
    }),
    /**
     * Returns the analog input for `button`.
     * @memberof syngen.input.gamepad
     * @param {Number} button
     * @param {Boolean} [invert=false]
     * @returns {Number}
     */
    getAnalog: function (button, invert = false) {
      const value = state.analog[button] || 0

      if (invert && value) {
        return 1 - value
      }

      return value
    },
    /**
     * Returns the analog input for `axis`.
     * @memberof syngen.input.gamepad
     * @param {Number} axis
     * @param {Boolean} [invert=false]
     * @returns {Number}
     */
    getAxis: function (axis, invert = false) {
      const value = state.axis[axis] || 0

      if (invert && value) {
        return -1 * value
      }

      return value
    },
    /**
     * Returns whether one or more `axes` exist.
     * @memberof syngen.input.gamepad
     * @param {...Number} ...axes
     * @returns {Number}
     */
    hasAxis: function (...axes) {
      for (const axis of axes) {
        if (!(axis in state.axis)) {
          return false
        }
      }

      return true
    },
    /**
     * Returns whether `button` is pressed.
     * @memberof syngen.input.gamepad
     * @param {Number} button
     * @returns {Number}
     */
    isDigital: (button) => Boolean(state.digital[button]),
    /**
     * Resets the gamepad state.
     * @memberof syngen.input.gamepad
     */
    reset: function () {
      state = {
        analog: {},
        axis: {},
        digital: {},
      }

      return this
    },
    /**
     * Sets the deadzone for axis input under which smaller values are considered zero.
     * @memberof syngen.input.gamepad
     * @param {Number} [value=0]
     *   Float within `[0, 1]`.
     *   For best results use a small configurable value.
     */
    setDeadzone: function (value = 0) {
      deadzone = Number(value) || 0
      return this
    },
    /**
     * Queries the gamepad state.
     * @listens syngen.loop#event:frame
     * @memberof syngen.input.gamepad
     */
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
