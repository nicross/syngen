/**
 * Provides an event-driven main loop for the application.
 * Systems can subscribe to each frame and respond to state changes.
 * Beware that the loop remains running while paused, which they must choose to respect.
 * @implements syngen.tool.pubsub
 * @namespace
 */
syngen.loop = (() => {
  const pubsub = syngen.tool.pubsub.create()

  let activeRequest,
    count = 0,
    delta = 0,
    idleRequest,
    isPaused = false,
    isRunning = false,
    lastFrame = 0,
    time = 0

  function cancel() {
    cancelAnimationFrame(activeRequest)
    clearTimeout(idleRequest)
  }

  function frame() {
    const now = performance.now()

    delta = lastFrame
      ? (now - lastFrame) / 1000
      : 0

    lastFrame = now

    count += 1
    time += delta

    /**
     * Fired every loop frame.
     * @event syngen.loop#event:frame
     * @property {Number} count - Current frame count of loop
     * @property {Number} delta - Time elapsed since last frame
     * @property {Boolean} paused - Whether the loop is paused
     * @property {Number} time - Total elapsed time of loop
     * @type {Object}
     */
    pubsub.emit('frame', {
      count,
      delta,
      paused: isPaused,
      time,
    })

    schedule()
  }

  function schedule() {
    if (document.hidden) {
      idleRequest = setTimeout(frame)
    } else {
      activeRequest = requestAnimationFrame(frame)
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (!isRunning) {
      return
    }

    cancel()
    schedule()
  })

  return pubsub.decorate({
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
    frame: () => count,
    /**
     * Returns whether the loop is currently paused.
     * @memberof syngen.loop
     * @returns {Boolean}
     */
    isPaused: () => isPaused,
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
      if (isPaused) {
        return this
      }

      isPaused = true

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
      if (!isPaused) {
        return this
      }

      isPaused = false

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
     */
    start: function () {
      if (isRunning) {
        return this
      }

      isRunning = true

      schedule()

      /**
       * Fired when the loop starts.
       * @event syngen.loop#event:start
       */
      pubsub.emit('start')

      return this
    },
    /**
     * Stops the loop.
     * @fires syngen.loop#event:stop
     * @memberof syngen.loop
     */
    stop: function () {
      if (!isRunning) {
        return this
      }

      cancel()

      count = 0
      delta = 0
      isPaused = false
      isRunning = false
      lastFrame = 0
      time = 0

      /**
       * Fired when the loop stops.
       * @event syngen.loop#event:stop
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
  })
})()
