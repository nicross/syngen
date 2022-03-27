/**
 * Creates a simple synthesizer with a single oscillator.
 * @param {Object} [options={}]
 * @param {Number} [options.detune=0]
 * @param {Number} [options.frequency=440]
 * @param {Number} [options.gain={@link syngen.const.zeroGain}]
 * @param {String} [options.type=sine]
 * @param {Number} [options.when={@link syngen.time|syngen.time()}]
 * @returns {syngen.synth~Synth}
 * @static
 */
syngen.synth.simple = ({
  detune = 0,
  frequency,
  gain = syngen.const.zeroGain,
  type = 'sine',
  when = syngen.time(),
} = {}) => {
  const context = syngen.context()

  const oscillator = context.createOscillator(),
    output = context.createGain()

  oscillator.connect(output)
  oscillator.type = type
  oscillator.start(when)

  syngen.synth.fn.setAudioParams(
    [oscillator.detune, detune],
    [oscillator.frequency, frequency],
    [output.gain, gain],
  )

  return syngen.synth.fn.decorate({
    _chain: oscillator,
    output,
    param: {
      detune: oscillator.detune,
      frequency: oscillator.frequency,
      gain: output.gain,
    },
    stop: function (when = syngen.time()) {
      oscillator.onended = () => {
        output.disconnect()
      }

      oscillator.stop(when)

      return this
    },
  })
}
