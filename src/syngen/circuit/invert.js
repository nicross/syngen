/**
 * Creates a `GainNode` that inverts a signal with `scale`.
 * @param {Object} [options={}]
 * @param {AudioNode|AudioParam} [options.from]
 * @param {Number} [options.scale=1]
 * @param {AudioNode|AudioParam} [options.to]
 * @returns {GainNode}
 * @static
 */
syngen.circuit.invert = ({
  from,
  scale = 1,
  to,
} = {}) => {
  const context = syngen.context(),
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
