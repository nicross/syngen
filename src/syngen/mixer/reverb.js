/**
 * Provides a auxiliary send for global reverb processing.
 * Because `ConvolverNode`s are quite intensive, implementations are encouraged to leverage this to provide a single global reverb.
 * @augments syngen.tool.pubsub
 * @namespace
 * @see syngen.mixer.send.reverb
 */
syngen.mixer.reverb = (() => {
  const context = syngen.context(),
    delay = context.createDelay(),
    input = context.createGain(),
    output = syngen.mixer.createBus(),
    pubsub = syngen.tool.pubsub.create()

  let active = true,
    convolver = context.createConvolver(),
    highpass,
    lowpass

  convolver.buffer = syngen.buffer.impulse({
    buffer: syngen.buffer.whiteNoise({
      channels: 2,
      duration: 1,
    }),
    power: 4,
  })

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

  return pubsub.decorate({
    /**
     * Creates a `GainNode` that's connected to the reverb input.
     * @memberof syngen.mixer.reverb
     * @returns {GainNode}
     */
    createBus: () => {
      const gain = context.createGain()
      gain.connect(input)
      return gain
    },
    /**
     * Built-in gain models.
     * @namespace syngen.mixer.reverb.gainModel
     */
    gainModel: {},
    /**
     * Returns whether the processing is active.
     * @memberof syngen.mixer.reverb
     * @returns {Boolean}
     */
    isActive: () => active,
    /**
     * Returns the output node for the send.
     * @deprecated
     * @memberof syngen.mixer.reverb
     * @returns {GainNode}
     */
    output: () => output,
    /**
     * Exposes the parameters associated with reverb processing.
     * @memberof syngen.mixer.reverb
     * @property {AudioParam} delay
     * @property {AudioParam} gain
     * @property {Object} highpass
     * @property {AudioParam} highpass.frequency
     * @property {Object} lowpass
     * @property {AudioParam} lowpass.frequency
     * @property {AudioParam} preGain
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
      preGain: input.gain,
    },
    /**
     * Occasionally the filters can enter an unstable or bad state.
     * This provides a solution for replacing them with stable filters.
     * @memberof syngen.mixer.reverb
     * @see syngen.mixer.rebuildFilters
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
     * @fires syngen.mixer.reverb#event:activate
     * @fires syngen.mixer.reverb#event:deactivate
     * @memberof syngen.mixer.reverb
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
         * @event syngen.mixer.reverb#event:activate
         */
        pubsub.emit('activate')
        input.connect(delay)
      } else {
        /**
         * Fired whenever the send is deactivated.
         * @event syngen.mixer.reverb#event:deactivate
         */
        pubsub.emit('deactivate')
        input.disconnect(delay)
      }

      return this
    },
    /**
     * Sets the impulse buffer for the inner `ConvolverNode`.
     * To prevent pops and clicks, the tail of the previous buffer persists until it fades out.
     * @memberof syngen.mixer.reverb
     * @param {BufferSource} buffer
     */
    setImpulse: function (buffer) {
      input.disconnect()

      convolver = context.createConvolver()
      convolver.buffer = buffer
      convolver.connect(output)

      if (active) {
        input.connect(delay)
      }

      return this
    },
  })
})()
