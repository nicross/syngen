/**
 * Creates a synthesizer with frequency modulation.
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
syngen.synth.fm = ({
  carrierDetune = 0,
  carrierFrequency,
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

  const carrierOscillator = context.createOscillator(),
    modDepth = context.createGain(),
    modOscillator = context.createOscillator(),
    output = context.createGain()

  carrierOscillator.connect(output)
  carrierOscillator.type = carrierType
  carrierOscillator.start(when)

  modDepth.connect(carrierOscillator.frequency)
  modOscillator.connect(modDepth)
  modOscillator.type = modType
  modOscillator.start(modWhen || when)

  syngen.synth.fn.setAudioParams(
    [carrierOscillator.detune, carrierDetune],
    [carrierOscillator.frequency, carrierFrequency],
    [modDepth.gain, modDepthAmount],
    [modOscillator.detune, modDetune],
    [modOscillator.frequency, modFrequency],
    [output.gain, gain],
  )

  return syngen.synth.fn.decorate({
    _chain: carrierOscillator,
    output,
    param: {
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
