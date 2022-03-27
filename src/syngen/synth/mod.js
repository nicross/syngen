/**
 * Creates a synthesizer with both amplitude and frequency modulation.
 * @param {Object} [options={}]
 * @param {Number} [options.amodDepth={@link syngen.const.zeroGain|syngen.const.zeroGain}]
 * @param {Number} [options.amodDetune=0]
 * @param {Number} [options.amodFrequency=440]
 * @param {Number} [options.amodType=sine]
 * @param {Number} [options.amodWhen]
 * @param {Number} [options.carrierDetune=0]
 * @param {Number} [options.carrierFrequency=440]
 * @param {Number} [options.carrierGain=1]
 * @param {Number} [options.carrierType=sine]
 * @param {Number} [options.fmodDepth={@link syngen.const.zeroGain|syngen.const.zeroGain}]
 * @param {Number} [options.fmodDetune=0]
 * @param {Number} [options.fmodFrequency=440]
 * @param {Number} [options.fmodType=sine]
 * @param {Number} [options.fmodWhen]
 * @param {Number} [options.gain={@link syngen.const.zeroGain}]
 * @param {Number} [options.when={@link syngen.time|syngen.time()}]
 * @returns {syngen.synth~Synth}
 * @static
 * @todo Leverage {@link syngen.synth.createLfo} internally
 */
syngen.synth.mod = ({
  amodDepth: amodDepthAmount = syngen.const.zeroGain,
  amodDetune = 0,
  amodFrequency,
  amodType = 'sine',
  amodWhen,
  carrierDetune = 0,
  carrierFrequency,
  carrierGain: carrierGainAmount = 1,
  carrierType = 'sine',
  gain = syngen.const.zeroGain,
  fmodDepth: fmodDepthAmount = syngen.const.zeroGain,
  fmodDetune = 0,
  fmodFrequency,
  fmodType = 'sine',
  fmodWhen,
  when = syngen.time(),
} = {}) => {
  const context = syngen.context()

  const amodDepth = context.createGain(),
    amodOscillator = context.createOscillator(),
    carrierGain = context.createGain(),
    carrierOscillator = context.createOscillator(),
    fmodDepth = context.createGain(),
    fmodOscillator = context.createOscillator(),
    output = context.createGain()

  carrierGain.connect(output)

  carrierOscillator.connect(carrierGain)
  carrierOscillator.type = carrierType
  carrierOscillator.start(when)

  amodDepth.connect(carrierGain.gain)
  amodOscillator.connect(amodDepth)
  amodOscillator.type = amodType
  amodOscillator.start(amodWhen || when)

  fmodDepth.connect(carrierOscillator.frequency)
  fmodOscillator.connect(fmodDepth)
  fmodOscillator.type = fmodType
  fmodOscillator.start(fmodWhen || when)

  syngen.synth.fn.setAudioParams(
    [amodDepth.gain, amodDepthAmount],
    [amodOscillator.detune, amodDetune],
    [amodOscillator.frequency, amodFrequency],
    [carrierGain.gain, carrierGainAmount],
    [carrierOscillator.detune, carrierDetune],
    [carrierOscillator.frequency, carrierFrequency],
    [fmodDepth.gain, fmodDepthAmount],
    [fmodOscillator.detune, fmodDetune],
    [fmodOscillator.frequency, fmodFrequency],
    [output.gain, gain],
  )

  return syngen.synth.fn.decorate({
    _chain: carrierGain,
    output,
    param: {
      amod: {
        depth: amodDepth.gain,
        detune: amodOscillator.detune,
        frequency: amodOscillator.frequency,
      },
      carrierGain: carrierGain.gain,
      fmod: {
        depth: fmodDepth.gain,
        detune: fmodOscillator.detune,
        frequency: fmodOscillator.frequency,
      },
      detune: carrierOscillator.detune,
      frequency: carrierOscillator.frequency,
      gain: output.gain,
    },
    stop: function (when = syngen.time()) {
      carrierOscillator.onended = () => {
        output.disconnect()
      }

      amodOscillator.stop(when)
      carrierOscillator.stop(when)
      fmodOscillator.stop(when)

      return this
    },
  })
}
