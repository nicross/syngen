/**
 * Creates a circuit that interpolates an input signal linearly within `[0, 1]` to `[min, max]`.
 * Beware that it leverages `ConstantSourceNode`s.
 * Pass a `chainStop` or call the returned `stop` method to free resources when no longer in use.
 * @param {Object} [options={}]
 * @param {syngen.synth~Synth} [options.chainStop]
 * @param {AudioNode|AudioParam} [options.from]
 *  Typically a `ConstantSourceNode`.
 * @param {Number} [options.max=1]
 * @param {Number} [options.min=0]
 * @param {AudioNode|AudioParam} [options.to]
 *  Typically an `AudioParam`.
 * @returns {Object}
 * @static
 */
syngen.circuit.lerp = ({
  chainStop,
  from,
  max: maxValue = 1,
  min: minValue = 0,
  to,
  when,
} = {}) => {
  const context = syngen.context()

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
    stop: (when = syngen.time()) => {
      max.stop(when)
      min.stop(when)
      return this
    },
  }

  if (chainStop) {
    syngen.synth.chainStop(chainStop, wrapper)
  }

  return wrapper
}
