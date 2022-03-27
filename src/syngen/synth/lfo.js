/**
 * Creates a simple low-frequency oscillator intended for modulation.
 * This is identical to {@link |createSimple()} except with different terminology.
 * @param {Object} [options={}]
 * @param {Number} [options.depth={@link syngen.const.zeroGain}]
 * @param {Number} [options.detune=0]
 * @param {Number} [options.frequency=0]
 * @param {String} [options.type=sine]
 * @param {Number} [options.when={@link syngen.time|syngen.time()}]
 * @returns {syngen.synth~Synth}
 * @static
 */
syngen.synth.lfo = ({
  depth: depthAmount = syngen.const.zeroGain,
  detune = 0,
  frequency = 0,
  type = 'sine',
  when = syngen.time(),
} = {}) => {
  const context = syngen.context()

  const depth = context.createGain(),
    oscillator = context.createOscillator()

  oscillator.type = type
  oscillator.connect(depth)
  oscillator.start(when)

  syngen.synth.fn.setAudioParams(
    [depth.gain, depthAmount],
    [oscillator.detune, detune],
    [oscillator.frequency, frequency],
  )

  return syngen.synth.fn.decorate({
    _chain: oscillator,
    param: {
      depth: depth.gain,
      detune: oscillator.detune,
      frequency: oscillator.frequency,
    },
    output: depth,
    stop: function (when = syngen.time()) {
      oscillator.onended = () => {
        depth.disconnect()
      }

      oscillator.stop(when)

      return this
    },
  })
}
