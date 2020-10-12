/**
 * @implements syngen.utility.pubsub
 * @namespace
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

  convolver.buffer = syngen.audio.buffer.impulse.large()
  convolver.connect(output)

  return syngen.utility.pubsub.decorate({
    /**
     * @memberof syngen.audio.mixer.auxiliary.reverb
     */
    createSend: () => {
      const gain = context.createGain()
      gain.connect(input)
      return gain
    },
    /**
     * @memberof syngen.audio.mixer.auxiliary.reverb
     */
    isActive: () => active,
    /**
     * @memberof syngen.audio.mixer.auxiliary.reverb
     */
    output: () => output,
    /**
     * @memberof syngen.audio.mixer.auxiliary.reverb
     */
    setActive: function (state) {
      if (active == state) {
        return this
      }

      active = Boolean(state)

      if (active) {
        input.connect(convolver)
        pubsub.emit('activate')
      } else {
        input.disconnect(convolver)
        pubsub.emit('deactivate')
      }

      return this
    },
    /**
     * @memberof syngen.audio.mixer.auxiliary.reverb
     */
    setGain: function (gain, duration) {
      syngen.audio.ramp.linear(output.gain, gain, duration)
      return this
    },
    /**
     * @memberof syngen.audio.mixer.auxiliary.reverb
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
