/**
 * Provides a auxiliary send for global reverb processing.
 * Because `ConvolverNode`s are quite intensive, implementations are encouraged to leverage this to provide a single global reverb.
 * @augments syngen.utility.pubsub
 * @namespace
 * @see syngen.audio.mixer.send.reverb
 * @todo Add highpass, lowpass, and pre-delay to processing with parameters
 * @todo Add resetFilters method
 */
syngen.audio.mixer.auxiliary.reverb = (() => {
  const context = syngen.audio.context(),
    input = context.createGain(),
    output = syngen.audio.mixer.createBus(),
    pubsub = syngen.utility.pubsub.create()

  let active = true,
    convolver = context.createConvolver()

  if (active) {
    input.connect(convolver)
  }

  convolver.buffer = syngen.audio.buffer.impulse.small()
  convolver.connect(output)

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
     * @property {AudioParam} gain
     */
    param: {
      gain: output.gain,
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
        input.connect(convolver)
      } else {
        /**
         * Fired whenever the send is deactivated.
         * @event syngen.audio.mixer.auxiliary.reverb#event:deactivate
         */
        pubsub.emit('deactivate')
        input.disconnect(convolver)
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
