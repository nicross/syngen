syngen.loop = (() => {
  const pubsub = syngen.utility.pubsub.create()

  let activeRequest,
    delta = 0,
    frameCount = 0,
    idleRequest,
    isPaused = false,
    isRunning = false,
    lastFrame = 0,
    time = 0

  function cancelFrame() {
    cancelAnimationFrame(activeRequest)
    clearTimeout(idleRequest)
  }

  function doActiveFrame() {
    const now = performance.now()

    delta = (now - lastFrame) / 1000
    lastFrame = now

    frame()
  }

  function doIdleFrame() {
    delta = syngen.const.idleDelta
    lastFrame = performance.now()

    frame()
  }

  function getNextIdleDelay() {
    const deltaTime = lastFrame ? performance.now() - lastFrame : 0
    return Math.max(0, (syngen.const.idleDelta * 1000) - deltaTime)
  }

  function frame() {
    frameCount += 1
    time += delta

    pubsub.emit('frame', {
      delta,
      frame: frameCount,
      time,
      paused: isPaused,
    })

    scheduleFrame()
  }

  function scheduleFrame() {
    if (document.hidden) {
      idleRequest = setTimeout(doIdleFrame, getNextIdleDelay())
    } else {
      activeRequest = requestAnimationFrame(doActiveFrame)
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (!isRunning) {
      return
    }

    cancelFrame()
    scheduleFrame()
  })

  return syngen.utility.pubsub.decorate({
    delta: () => delta,
    frame: () => frameCount,
    isPaused: () => isPaused,
    isRunning: () => isRunning,
    pause: function () {
      if (isPaused) {
        return this
      }

      isPaused = true
      pubsub.emit('pause')

      return this
    },
    resume: function () {
      if (!isPaused) {
        return this
      }

      isPaused = false
      pubsub.emit('resume')

      return this
    },
    start: function () {
      if (isRunning) {
        return this
      }

      isRunning = true
      lastFrame = performance.now()

      scheduleFrame()
      pubsub.emit('start')

      return this
    },
    stop: function () {
      if (!isRunning) {
        return this
      }

      cancelFrame()

      delta = 0
      frameCount = 0
      isRunning = false
      lastFrame = 0
      time = 0

      pubsub.emit('stop')

      return this
    },
    time: () => time,
  }, pubsub)
})()
