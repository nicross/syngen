/**
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
     * @memberof syngen.performance
     */
    delta: () => medianDelta,
    /**
     * @memberof syngen.performance
     */
    fps: () => medianFps,
    /**
     * @memberof syngen.performance
     */
    update: function ({delta}) {
      deltas[index] = delta

      if (index < maxFrames - 1) {
        index += 1
      } else {
        index = 0
      }

      const sortedDeltas = deltas.slice().sort()

      medianDelta = syngen.utility.choose(sortedDeltas, 0.5)
      medianFps = 1 / medianDelta

      return this
    },
  }
})()

syngen.loop.on('frame', (e) => syngen.performance.update(e))
