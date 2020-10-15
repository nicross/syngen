/**
 * Wrapper for the main [AudioContext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext) and umbrella for all [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)-related utilities.
 * @namespace
 */
syngen.audio = (() => {
  const context = new AudioContext()

  return {
    /**
     * A collection of programmatically generated [AudioBuffers](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer).
     * @namespace syngen.audio.buffer
     */
    buffer: {
      /**
       * Programatically generated reverb impulses intended for use with [ConvolverNodes](https://developer.mozilla.org/en-US/docs/Web/API/ConvolverNode).
       * @namespace syngen.audio.buffer.impulse
       */
      impulse: {},
      /**
       * Programmatically generated noise intended for use with [AudioBufferSourceNodes](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode).
       * @namespace syngen.audio.buffer.noise
       */
      noise: {},
    },
    /**
     * Returns the main `AudioContext`.
     * @memberof syngen.audio
     * @returns {AudioContext}
     */
    context: () => context,
    /**
     * Returns the Nyquist frequency for the current sample rate multiplied by an optional coefficient.
     * @memberof syngen.audio
     * @param {Number} [coefficient=1]
     * @returns {Number}
     * @see https://en.wikipedia.org/wiki/Nyquist_frequency
     */
    nyquist: (coefficient = 1) => coefficient * context.sampleRate / 2,
    /**
     * Resumes the main `AudioContext`.
     * Must be called after the first user gesture so playback works in all browsers.
     * @memberof syngen.audio
     */
    start: function () {
      context.resume()
      return this
    },
    /**
     * Suspends the main `AudioContext`.
     * @memberof syngen.audio
     */
    stop: function () {
      context.suspend()
      return this
    },
    /**
     * Returns the `currentTime` for the main `AudioContext` plus an optional duration and lookahead time.
     * @memberof syngen.audio
     * @param {Number} [duration=0]
     * @returns {Number}
     * @see syngen.const.audioLookaheadTime
     */
    time: (duration = 0) => context.currentTime + syngen.const.audioLookaheadTime + duration,
    /**
     * Returns the next appreciable timestamp.
     * @memberof syngen.audio
     * @returns {Number}
     * @see syngen.const.audioLookaheadTime
     * @see syngen.const.zeroTime
     */
    zeroTime: () => context.currentTime + syngen.const.audioLookaheadTime + syngen.const.zeroTime,
  }
})()
