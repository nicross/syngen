/**
 * Creates a synthesizer with amplitude modulation.
 * @param {Object} [options={}]
 * @param {Number} [options.carrierDetune=0]
 * @param {Number} [options.carrierFrequency=440]
 * @param {Number} [options.carrierGain=1]
 * @param {Number} [options.carrierType=sine]
 * @param {Number} [options.gain={@link syngen.const.zeroGain}]
 * @param {Number} [options.modDepth={@link syngen.const.zeroGain|syngen.const.zeroGain}]
 * @param {Number} [options.modDetune=0]
 * @param {Number} [options.modFrequency=440]
 * @param {Number} [options.modType=sine]
 * @param {Number} [options.modWhen]
 * @param {Number} [options.when={@link syngen.time|syngen.time()}]
 * @returns {syngen.synth~Synth}
 * @static
 * @todo Leverage {@link syngen.synth.createLfo} internally
 */
syngen.synth.am = ({
  carrierDetune = 0,
  carrierFrequency,
  carrierGain: carrierGainAmount = 1,
  carrierType = 'sine',
  gain = syngen.const.zeroGain,
  modDepth: modDepthAmount = syngen.const.zeroGain,
  modDetune = 0,
  modFrequency,
  modType = 'sine',
  modWhen,
  when = syngen.time(),
} = {}) => {
  const context = syngen.context()

  const carrierGain = context.createGain(),
    carrierOscillator = context.createOscillator(),
    modDepth = context.createGain(),
    modOscillator = context.createOscillator(),
    output = context.createGain()

  modWhen = modWhen || when

  carrierGain.connect(output)

  carrierOscillator.connect(carrierGain)
  carrierOscillator.type = carrierType
  carrierOscillator.start(when)

  modDepth.connect(carrierGain.gain)
  modOscillator.connect(modDepth)
  modOscillator.type = modType
  modOscillator.start(modWhen)

  syngen.synth.fn.setAudioParams(
    [carrierGain.gain, carrierGainAmount, when],
    [carrierOscillator.detune, carrierDetune, when],
    [carrierOscillator.frequency, carrierFrequency, when],
    [modDepth.gain, modDepthAmount, modWhen],
    [modOscillator.detune, modDetune, modWhen],
    [modOscillator.frequency, modFrequency, modWhen],
    [output.gain, gain, when],
  )

  return syngen.synth.fn.decorate({
    _chain: carrierGain,
    output,
    param: {
      carrierGain: carrierGain.gain,
      detune: carrierOscillator.detune,
      frequency: carrierOscillator.frequency,
      gain: output.gain,
      mod: {
        depth: modDepth.gain,
        detune: modOscillator.detune,
        frequency: modOscillator.frequency,
      },
    },
    stop: function (when = syngen.time()) {
      carrierOscillator.onended = () => {
        output.disconnect()
      }

      carrierOscillator.stop(when)
      modOscillator.stop(when)

      return this
    },
  })
}
