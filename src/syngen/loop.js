/**
 * Provides an event-driven main loop for the application.
 * Systems can subscribe to each frame and respond to state changes.
 * Beware that the loop remains running while paused, which they must choose to respect.
 * @implements syngen.utility.pubsub
 * @namespace
 */
syngen.loop = (() => {
  const pubsub = syngen.utility.pubsub.create()

  let activeRequest,
    delta = 0,
    frameCount = 0,
    idleRequest,
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

    /**
     * Fired every loop frame.
     * @event syngen.loop#event:frame
     * @property {Number} delta - Time elapsed since last frame
     * @property {Number} frame - Current frame count of loop
     * @property {Boolean} paused - Whether the loop is paused
     * @property {Number} time - Total elapsed time of loop
     * @type {Object}
     */
    pubsub.emit('frame', {
      delta,
      frame: frameCount,
      paused: !isRunning,
      time,
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
    /**
     * Returns the time elapsed since the previous frame.
     * @memberof syngen.loop
     * @returns {Number}
     */
    delta: () => delta,
    /**
     * Returns the current frame number since the loop began.
     * @memberof syngen.loop
     * @returns {Number}
     */
    frame: () => frameCount,
    /**
     * Returns whether the loop is currently paused.
     * @memberof syngen.loop
     * @returns {Boolean}
     */
    isPaused: () => !isRunning,
    /**
     * Returns whether the loop is currently running.
     * @memberof syngen.loop
     * @returns {Boolean}
     */
    isRunning: () => isRunning,
    /**
     * Pauses the loop.
     * @fires syngen.loop#event:pause
     * @memberof syngen.loop
     */
    pause: function () {
      if (!isRunning) {
        return this
      }

      isRunning = false

      /**
       * Fired when the loop is paused.
       * @event syngen.loop#event:pause
       */
      pubsub.emit('pause')

      return this
    },
    /**
     * Resumes the loop.
     * @fires syngen.loop#event:resume
     * @memberof syngen.loop
     */
    resume: function () {
      if (isRunning) {
        return this
      }

      isRunning = true

      /**
       * Fired when the loop is resumed.
       * @event syngen.loop#event:resume
       */
      pubsub.emit('resume')

      return this
    },
    /**
     * Starts the loop.
     * @fires syngen.loop#event:start
     * @memberof syngen.loop
     * @todo Deprecate and always leave running
     */
    start: function () {
      if (isRunning) {
        return this
      }

      isRunning = true
      lastFrame = performance.now()

      scheduleFrame()

      /**
       * Fired when the loop starts.
       * @event syngen.loop#event:start
       * @todo Deprecate
       */
      pubsub.emit('start')

      return this
    },
    /**
     * Stops the loop.
     * @fires syngen.loop#event:stop
     * @memberof syngen.loop
     * @todo Deprecate and always leave running
     */
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

      /**
       * Fired when the loop stops.
       * @event syngen.loop#event:stop
       * @todo Deprecate
       */
      pubsub.emit('stop')

      return this
    },
    /**
     * Returns the time elapsed since the loop began.
     * @memberof syngen.loop
     * @returns {Number}
     */
    time: () => time,
  }, pubsub)
})()
