/**
 * Creates a simple synthesizer with configurable pulse-width modulation.
 * @param {Object} [options={}]
 * @param {Number} [options.detune=0]
 * @param {Number} [options.frequency=440]
 * @param {Number} [options.gain={@link syngen.const.zeroGain}]
 * @param {String} [options.type=sine]
 * @param {Number} [options.when={@link syngen.time|syngen.time()}]
 * @param {Number} [options.width=0]
 * @returns {syngen.synth~Synth}
 * @static
 */
syngen.synth.pwm = ({
  detune = 0,
  frequency,
  gain = syngen.const.zeroGain,
  type = 'sine',
  when = syngen.time(),
  width: widthAmount = 0,
} = {}) => {
  const context = syngen.context(),
    facade = context.createGain(),
    oscillator = context.createOscillator(),
    output = context.createGain(),
    shaperOne = context.createWaveShaper(),
    shaperPulse = context.createWaveShaper(),
    width = context.createGain()

  oscillator.type = type
  shaperOne.curve = syngen.shape.one()
  shaperPulse.curve = syngen.shape.square()

  facade.connect(output)
  oscillator.connect(shaperOne)
  oscillator.connect(shaperPulse)
  shaperOne.connect(width)
  shaperPulse.connect(facade)
  width.connect(shaperPulse)

  oscillator.start(when)

  syngen.synth.fn.setAudioParams(
    [oscillator.detune, detune, when],
    [oscillator.frequency, frequency, when],
    [output.gain, gain, when],
    [width.gain, widthAmount, when],
  )

  return syngen.synth.fn.decorate({
    _chain: facade,
    output,
    param: {
      detune: oscillator.detune,
      frequency: oscillator.frequency,
      gain: output.gain,
      width: width.gain,
    },
    stop: function (when = syngen.time()) {
      oscillator.onended = () => {
        output.disconnect()
      }

      oscillator.stop(when)

      return this
    },
    width,
  })
}
