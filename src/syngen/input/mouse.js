/**
 * Exposes mouse movement, scrolling, and buttons pressed.
 * @namespace
 */
syngen.input.mouse = (() => {
  let memory = {
    moveX: 0,
    moveY: 0,
    wheelX: 0,
    wheelY: 0,
    wheelZ: 0,
  }

  let state = {
    button: {},
    moveX: 0,
    moveY: 0,
    wheelX: 0,
    wheelY: 0,
    wheelZ: 0,
  }

  window.addEventListener('mousedown', onMousedown)
  window.addEventListener('mousemove', onMousemove)
  window.addEventListener('mouseup', onMouseup)
  window.addEventListener('wheel', onWheel)

  function onMousedown(e) {
    state.button[e.button] = true
  }

  function onMousemove(e) {
    state.moveX += e.movementX
    state.moveY += e.movementY
  }

  function onMouseup(e) {
    state.button[e.button] = false
  }

  function onWheel(e) {
    state.wheelX += e.deltaX
    state.wheelY += e.deltaY
    state.wheelZ += e.deltaZ
  }

  return {
    /**
     * Returns the mouse state.
     * @memberof syngen.input.mouse
     * @returns {Object}
     */
    get: () => ({
      ...state,
      button: {...state.button},
    }),
    /**
     * Returns any movement along the x-axis during the previous frame, in pixels.
     * @memberof syngen.input.mouse
     * @returns {Number}
     */
    getMoveX: () => state.moveX || 0,
    /**
     * Returns any movement along the y-axis during the previous frame, in pixels.
     * @memberof syngen.input.mouse
     * @returns {Number}
     */
    getMoveY: () => state.moveY || 0,
    /**
     * Returns any scrolling along the x-axis during the previous frame.
     * Beware that this is unitless.
     * @memberof syngen.input.mouse
     * @returns {Number}
     * @todo Consider {@link https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaMode|WheelEvent.deltaMode} to normalize values across devices
     */
    getWheelX: () => state.wheelX || 0,
    /**
     * Returns any scrolling along the y-axis during the previous frame.
     * Beware that this is unitless.
     * @memberof syngen.input.mouse
     * @returns {Number}
     * @todo Consider {@link https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaMode|WheelEvent.deltaMode} to normalize values across devices
     */
    getWheelY: () => state.wheelY || 0,
    /**
     * Returns any scrolling along the z-axis during the previous frame.
     * Beware that this is unitless.
     * @memberof syngen.input.mouse
     * @returns {Number}
     * @todo Consider {@link https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaMode|WheelEvent.deltaMode} to normalize values across devices
     */
    getWheelZ: () => state.wheelZ || 0,
    /**
     * Returns whether `button` is pressed.
     * @memberof syngen.input.mouse
     * @param {Number} button
     * @returns {boolean}
     * @see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
     */
    isButton: (button) => state.button[button] || false,
    /**
     * Resets the mouse state.
     * @memberof syngen.input.mouse
     */
    reset: function () {
      memory = {
        moveX: 0,
        moveY: 0,
        wheelX: 0,
        wheelY: 0,
        wheelZ: 0,
      }

      state = {
        button: {},
        moveX: 0,
        moveY: 0,
        wheelX: 0,
        wheelY: 0,
        wheelZ: 0,
      }

      return this
    },
    /**
     * Decrements previous from current state values so they reflect only changes since last frame.
     * @listens syngen.loop#event:frame
     * @memberof syngen.input.mouse
     */
    update: function () {
      state.moveX -= memory.moveX
      state.moveY -= memory.moveY
      state.wheelX -= memory.wheelX
      state.wheelY -= memory.wheelY
      state.wheelZ -= memory.wheelZ

      memory = {
        moveX: state.moveX,
        moveY: state.moveY,
        wheelX: state.wheelX,
        wheelY: state.wheelY,
        wheelZ: state.wheelZ,
      }

      return this
    },
  }
})()

syngen.loop.on('frame', () => syngen.input.mouse.update())
