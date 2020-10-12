/**
 * @namespace
 */
syngen.audio = (() => {
  const context = new AudioContext()

  return {
    buffer: {
      /**
       * @namespace syngen.audio.buffer.impulse
       */
      impulse: {},
      /**
       * @namespace syngen.audio.buffer.noise
       */
      noise: {},
    },
    /**
     * @memberof syngen.audio
     */
    context: () => context,
    /**
     * @memberof syngen.audio
     */
    nyquist: (coefficient = 1) => coefficient * context.sampleRate / 2,
    send: {},
    /**
     * @memberof syngen.audio
     */
    start: function () {
      context.resume()
      return this
    },
    /**
     * @memberof syngen.audio
     */
    time: (duration = 0) => context.currentTime + syngen.const.audioLookaheadTime + duration,
    /**
     * @memberof syngen.audio
     */
    zeroTime: () => context.currentTime + syngen.const.audioLookaheadTime + syngen.const.zeroTime,
  }
})()
