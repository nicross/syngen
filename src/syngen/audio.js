syngen.audio = (() => {
  const context = new AudioContext()

  return {
    buffer: {
      impulse: {},
      noise: {},
    },
    context: () => context,
    nyquist: (coefficient = 1) => coefficient * context.sampleRate / 2,
    send: {},
    start: function () {
      context.resume()
      return this
    },
    time: (duration = 0) => context.currentTime + syngen.const.audioLookaheadTime + duration,
    zeroTime: () => context.currentTime + syngen.const.audioLookaheadTime + syngen.const.zeroTime,
  }
})()
