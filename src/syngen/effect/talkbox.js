/**
 * Creates a talk box that seamlessly blends between two formants with its `mix` parameter.
 * @param {Object} [options={}]
 * @param {Number} [options.dry=0]
 * @param {syngen.formant~Plugin} [options.format0={@link syngen.formant.createU|syngen.formant.createU()}]
 * @param {syngen.formant~Plugin} [options.format1={@link syngen.formant.createA|syngen.formant.createA()}]
 * @param {Number} [options.mix=0.5]
 * @param {Number} [options.wet=1]
 * @returns {syngen.synth~Plugin}
 * @static
 */
syngen.effect.talkbox = ({
  dry: dryAmount = 0,
  formant0 = syngen.formant.createU(),
  formant1 = syngen.formant.createA(),
  mix: mixAmount = 0.5,
  wet: wetAmount = 1,
} = {}) => {
  const context = syngen.context(),
    dry = context.createGain(),
    input = context.createGain(),
    invert = context.createGain(),
    mix = context.createConstantSource(),
    mix0 = context.createGain(),
    mix1 = context.createGain(),
    output = context.createGain(),
    wet = context.createGain()

  dry.gain.value = dryAmount
  mix.offset.value = mixAmount
  wet.gain.value = wetAmount

  mix.connect(mix1.gain)
  mix1.gain.value = 0

  mix.connect(invert)
  invert.connect(mix0.gain)
  invert.gain.value = -1
  mix0.gain.value = 1

  input.connect(dry)
  input.connect(mix0)
  input.connect(mix1)
  mix.start()
  mix0.connect(formant0.input)
  mix1.connect(formant1.input)
  formant0.output.connect(wet)
  formant1.output.connect(wet)
  dry.connect(output)
  wet.connect(output)

  return {
    input,
    output,
    param: {
      dry: dry.gain,
      formant0: formant0.param,
      formant1: formant1.param,
      mix: mix.offset,
      wet: wet.gain,
    },
    stop: function (when = syngen.time()) {
      mix.stop(when)
      return this
    },
  }
}
