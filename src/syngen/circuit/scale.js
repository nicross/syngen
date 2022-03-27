/**
 * Creates a circuit that scales an input signal linearly within `[fromMin, fromMax]` to `[toMin, toMax]`.
 * Beware that it leverages `ConstantSourceNode`s.
 * Pass a `chainStop` or call the returned `stop` method to free resources when no longer in use.
 * @param {Object} [options={}]
 * @param {syngen.synth~Synth} [options.chainStop]
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
syngen.circuit.scale = ({
  chainStop,
  from,
  fromMax = 1,
  fromMin = 0,
  to,
  toMax = 1,
  toMin = 0,
  when,
} = {}) => {
  const context = syngen.context()

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
  const lerp = syngen.circuit.lerp({
    from: scale,
    max: toMax,
    min: toMin,
    to,
    when,
  })

  const wrapper = {
    stop: (when = syngen.time()) => {
      lerp.stop(when)
      offset.stop(when)
      return this
    },
  }

  if (chainStop) {
    syngen.synth.chainStop(chainStop, wrapper)
  }

  return wrapper
}
