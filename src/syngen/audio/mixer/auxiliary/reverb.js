/**
 * Provides a auxiliary send for global reverb processing.
 * Because `ConvolverNode`s are quite intensive, implementations are encouraged to leverage this to provide a single global reverb.
 * @augments syngen.utility.pubsub
 * @namespace
 * @see syngen.audio.mixer.send.reverb
 */
syngen.audio.mixer.auxiliary.reverb = (() => {
  const context = syngen.audio.context(),
    delay = context.createDelay(),
    input = context.createGain(),
    output = syngen.audio.mixer.createBus(),
    pubsub = syngen.utility.pubsub.create()

  let active = true,
    convolver = context.createConvolver(),
    highpass,
    lowpass

  convolver.buffer = syngen.audio.buffer.impulse.small()
  delay.delayTime.value = 1/64

  input.connect(delay)
  createFilters()
  convolver.connect(output)

  function createFilters(highpassFrequency = syngen.const.minFrequency, lowpassFrequency = syngen.const.maxFrequency) {
    highpass = context.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = highpassFrequency

    lowpass = context.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = lowpassFrequency

    delay.connect(highpass)
    highpass.connect(lowpass)
    lowpass.connect(convolver)
  }

  function destroyFilters() {
    delay.disconnect()
    lowpass.disconnect()
    lowpass = null
    highpass.disconnect()
    highpass = null
  }

  return syngen.utility.pubsub.decorate({
    /**
     * Creates a `GainNode` that's connected to the reverb input.
     * @memberof syngen.audio.mixer.auxiliary.reverb
     * @returns {GainNode}
     */
    createSend: () => {
      const gain = context.createGain()
      gain.connect(input)
      return gain
    },
    /**
     * Returns whether the processing is active.
     * @memberof syngen.audio.mixer.auxiliary.reverb
     * @returns {Boolean}
     */
    isActive: () => active,
    /**
     * Returns the output node for the send.
     * @deprecated
     * @memberof syngen.audio.mixer.auxiliary.reverb
     * @returns {GainNode}
     */
    output: () => output,
    /**
     * Exposes the parameters associated with reverb processing.
     * @memberof syngen.audio.mixer.auxiliary.reverb
     * @property {AudioParam} delay
     * @property {AudioParam} gain
     * @property {Object} highpass
     * @property {AudioParam} highpass.frequency
     * @property {Object} lowpass
     * @property {AudioParam} lowpass.frequency
     */
    param: {
      delay: delay.delayTime,
      gain: output.gain,
      highpass: {
        frequency: highpass.frequency,
      },
      lowpass: {
        frequency: lowpass.frequency,
      },
    },
    /**
     * Occasionally the filters can enter an unstable or bad state.
     * This provides a solution for replacing them with stable filters.
     * @memberof syngen.audio.mixer.auxiliary.reverb
     * @see syngen.audio.mixer.rebuildFilters
     */
    rebuildFilters: function () {
      const highpassFrequency = highpass.frequency.value,
        lowpassFrequency = lowpass.frequency.value

      destroyFilters()
      createFilters(highpassFrequency, lowpassFrequency)

      this.param.highpass.frequency = highpass.frequency
      this.param.lowpass.frequency = lowpass.frequency

      return this
    },
    /**
     * Sets the active state.
     * Implementations can disable processing for a performance boost.
     * @fires syngen.audio.mixer.auxiliary.reverb#event:activate
     * @fires syngen.audio.mixer.auxiliary.reverb#event:deactivate
     * @memberof syngen.audio.mixer.auxiliary.reverb
     * @param {Boolean} state
     */
    setActive: function (state) {
      if (active == state) {
        return this
      }

      active = Boolean(state)

      if (active) {
        /**
         * Fired whenever the send is activated.
         * @event syngen.audio.mixer.auxiliary.reverb#event:activate
         */
        pubsub.emit('activate')
        input.connect(delay)
      } else {
        /**
         * Fired whenever the send is deactivated.
         * @event syngen.audio.mixer.auxiliary.reverb#event:deactivate
         */
        pubsub.emit('deactivate')
        input.disconnect(delay)
      }

      return this
    },
    /**
     * Sets the impulse buffer for the inner `ConvolverNode`.
     * To prevent pops and clicks, the tail of the previous buffer persists until it fades out.
     * @memberof syngen.audio.mixer.auxiliary.reverb
     * @param {BufferSource} buffer
     */
    setImpulse: function (buffer) {
      input.disconnect()

      convolver = context.createConvolver()
      convolver.buffer = buffer
      convolver.connect(output)

      if (active) {
        input.connect(convolver)
      }

      return this
    },
  }, pubsub)
})()
