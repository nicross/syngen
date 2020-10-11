syngen.input.mouse = (() => {
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
    get: () => ({...state}),
    getMoveX: state.moveX || 0,
    getMoveY: state.moveY || 0,
    getWheelX: state.wheelX || 0,
    getWheelY: state.wheelY || 0,
    getWheelZ: state.wheelZ || 0,
    isButton: (key) => state.button[key] || false,
    reset: function () {
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
    update: function () {
      // XXX: Reset between frames
      setTimeout(() => {
        state.moveX = 0
        state.moveY = 0

        state.wheelX = 0
        state.wheelY = 0
        state.wheelZ = 0
      })

      return this
    },
  }
})()

syngen.loop.on('frame', () => syngen.input.mouse.update())
