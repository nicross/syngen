/**
 * Creates a distortion effect with a configurable `curve`.
 * @param {Object} [options={}]
 * @param {Float32Array} [options.curve={@link syngen.shape.warm|syngen.shape.warm()}]
 * @param {Number} [options.dry=1]
 * @param {Number} [options.preGain=1]
 * @param {Number} [options.wet=1]
 * @returns {syngen.synth~Plugin}
 * @see syngen.shape
 * @static
 */
syngen.effect.shaper = ({
  curve = syngen.shape.warm(),
  dry: dryAmount = 0,
  preGain: preGainAmount = 1,
  wet: wetAmount = 1,
} = {}) => {
  const context = syngen.context(),
    dry = context.createGain(),
    input = context.createGain(),
    output = context.createGain(),
    preGain = context.createGain(),
    shaper = context.createWaveShaper(),
    wet = context.createGain()

  dry.gain.value = dryAmount
  preGain.gain.value = preGainAmount
  shaper.curve = curve
  wet.gain.value = wetAmount

  input.connect(dry)
  input.connect(preGain)
  preGain.connect(shaper)
  shaper.connect(wet)
  dry.connect(output)
  wet.connect(output)

  return {
    input,
    output,
    param: {
      dry: dry.gain,
      gain: output.gain,
      preGain: inputGain.gain,
      wet: wet.gain,
    }
  }
}
