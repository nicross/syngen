/**
 * Provides factories that create miscellaneous audio circuits with practical use cases.
 * @namespace
 */
syngen.audio.circuit = {}

/**
 * Creates a `GainNode` that inverts a signal with `scale`.
 * @param {Object} [options={}]
 * @param {AudioNode|AudioParam} [options.from]
 * @param {Number} [options.scale=1]
 * @param {AudioNode|AudioParam} [options.to]
 * @returns {GainNode}
 * @static
 */
syngen.audio.circuit.invert = ({
  from,
  scale = 1,
  to,
} = {}) => {
  const context = syngen.audio.context(),
    inverter = context.createGain()

  inverter.gain.value = -Math.abs(scale)

  if (from) {
    from.connect(inverter)
  }

  if (to) {
    inverter.connect(to)
  }

  return inverter
}

/**
 * Creates a circuit that interpolates an input signal linearly within `[0, 1]` to `[min, max]`.
 * Beware that it leverages `ConstantSourceNode`s.
 * Pass a `chainStop` or call the returned `stop` method to free resources when no longer in use.
 * @param {Object} [options={}]
 * @param {syngen.audio.synth~Synth} [options.chainStop]
 * @param {AudioNode|AudioParam} [options.from]
 *  Typically a `ConstantSourceNode`.
 * @param {Number} [options.max=1]
 * @param {Number} [options.min=0]
 * @param {AudioNode|AudioParam} [options.to]
 *  Typically an `AudioParam`.
 * @returns {Object}
 * @static
 */
syngen.audio.circuit.lerp = ({
  chainStop,
  from,
  max: maxValue = 1,
  min: minValue = 0,
  to,
  when,
} = {}) => {
  const context = syngen.audio.context()

  const lerp = context.createGain(),
    max = context.createConstantSource(),
    min = context.createConstantSource()

  lerp.gain.value = 0
  max.offset.value = maxValue - minValue
  min.offset.value = minValue
  to.value = 0

  from.connect(lerp.gain)
  max.connect(lerp)
  lerp.connect(to)
  min.connect(to)

  max.start(when)
  min.start(when)

  const wrapper = {
    stop: (when = syngen.audio.time()) => {
      max.stop(when)
      min.stop(when)
      return this
    },
  }

  if (chainStop) {
    syngen.audio.synth.chainStop(chainStop, wrapper)
  }

  return wrapper
}

/**
 * Creates a circuit that scales an input signal linearly within `[fromMin, fromMax]` to `[toMin, toMax]`.
 * Beware that it leverages `ConstantSourceNode`s.
 * Pass a `chainStop` or call the returned `stop` method to free resources when no longer in use.
 * @param {Object} [options={}]
 * @param {syngen.audio.synth~Synth} [options.chainStop]
 * @param {AudioNode|AudioParam} [options.from]
 *  Typically a `ConstantSourceNode`.
 * @param {Number} [options.fromMax=1]
 * @param {Number} [options.fromMin=0]
 * @param {AudioNode|AudioParam} [options.to]
 *   Typically an `AudioParam`.
 * @param {Number} [options.toMax=1]
 * @param {Number} [options.toMin=0]
 * @returns {Object}
 * @static
 */
syngen.audio.circuit.scale = ({
  chainStop,
  from,
  fromMax = 1,
  fromMin = 0,
  to,
  toMax = 1,
  toMin = 0,
  when,
} = {}) => {
  const context = syngen.audio.context()

  const offset = context.createConstantSource(),
    scale = context.createGain()

  offset.offset.value = -fromMin // Translate to [0,fromMax-fromMin]
  scale.gain.value = 1 / (fromMax - fromMin) // Scale down to [0,1]

  offset.connect(scale)

  if (from) {
    from.connect(scale)
  }

  offset.start(when)

  // Leverage lerp to handle upscale
  const lerp = syngen.audio.circuit.lerp({
    from: scale,
    max: toMax,
    min: toMin,
    to,
    when,
  })

  const wrapper = {
    stop: (when = syngen.audio.time()) => {
      lerp.stop(when)
      offset.stop(when)
      return this
    },
  }

  if (chainStop) {
    syngen.audio.synth.chainStop(chainStop, wrapper)
  }

  return wrapper
}
