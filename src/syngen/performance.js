/**
 * Calculates and exposes real-time performance metrics.
 * @namespace
 */
syngen.performance = (() => {
  const deltas = [],
    maxFrames = 30

  let index = 0,
    medianDelta = 0,
    medianFps = 0

  return {
    /**
     * Returns the median duration of frames.
     * @memberof syngen.performance
     * @returns {Number}
     */
    delta: () => medianDelta,
    /**
     * Returns the average number of frames per second.
     * @memberof syngen.performance
     * @returns {Number}
     */
    fps: () => medianFps,
    /**
     * Recalculates performance metrics.
     * @listens syngen.loop#event:frame
     * @memberof syngen.performance
     */
    update: function ({
      delta
    } = {}) {
      deltas[index] = delta

      if (index < maxFrames - 1) {
        index += 1
      } else {
        index = 0
      }

      const sortedDeltas = deltas.slice().sort()

      medianDelta = syngen.fn.choose(sortedDeltas, 0.5)
      medianFps = 1 / medianDelta

      return this
    },
  }
})()

syngen.loop.on('frame', (e) => syngen.performance.update(e))
