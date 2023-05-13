/**
 * Creates an additive synthesizer which wraps configurable harmonics into a unified synth.
 * Each harmonic is calculated from an individual frequency coefficient, gain multiplier, and detune modifier.
 * With `ConstantSourceNode`s their values are controllable in unison such that they maintain their relationships.
 * @param {Object} [options={}]
 * @param {Number} [options.detune=0]
 * @param {Number} [options.frequency=440]
 * @param {Number} [options.gain={@link syngen.const.zeroGain}]
 * @param {Object[]} [options.harmonic=[]]
 *   Each harmonic is an object with these fields:
 * @param {Number} [options.harmonic.coefficient=1]
 * @param {Number} [options.harmonic.detune=0]
 * @param {Number} [options.harmonic.gain=1]
 * @param {String} [options.harmonic.type=sine]
 * @param {Number} [options.when={@link syngen.time|syngen.time()}]
 * @returns {syngen.synth~Synth}
 * @static
 */
syngen.synth.additive = ({
  detune = 0,
  frequency,
  gain = syngen.const.zeroGain,
  harmonic: harmonicParams = [],
  when = syngen.time(),
} = {}) => {
  const context = syngen.context()

  const detuneConstant = context.createConstantSource(),
    frequencyConstant = context.createConstantSource(),
    output = context.createGain(),
    sum = context.createGain()

  detuneConstant.start(when)
  frequencyConstant.start(when)

  const gainDivisor = Math.max(harmonicParams.length - 1, 1)

  const harmonics = harmonicParams.map(({
    coefficient = 1,
    detune = 0,
    gain = 1,
    type = 'sine',
  }) => {
    const frequencyMultiplier = context.createGain(),
      mix = context.createGain(),
      oscillator = context.createOscillator()

    frequencyMultiplier.gain.value = coefficient
    oscillator.detune.value = detune
    oscillator.frequency.value = 0
    oscillator.type = type
    mix.gain.value = gain / gainDivisor

    detuneConstant.connect(oscillator.detune)
    frequencyConstant.connect(frequencyMultiplier)
    frequencyMultiplier.connect(oscillator.frequency)
    oscillator.connect(mix)
    mix.connect(sum)

    oscillator.start(when)

    return {
      oscillator,
      param: {
        coefficient: frequencyMultiplier.gain,
        detune: oscillator.detune,
        gain: mix.gain,
      },
    }
  })

  sum.connect(output)

  syngen.synth.fn.setAudioParams(
    [detuneConstant.offset, detune, when],
    [frequencyConstant.offset, frequency, when],
    [output.gain, gain, when],
  )

  return syngen.synth.fn.decorate({
    _chain: sum,
    output,
    param: {
      detune: detuneConstant.offset,
      frequency: frequencyConstant.offset,
      gain: output.gain,
      harmonic: harmonics.map((synth) => synth.param),
    },
    stop: function (when = syngen.time()) {
      detuneConstant.onended = () => {
        output.disconnect()
      }

      detuneConstant.stop(when)
      frequencyConstant.stop(when)
      harmonics.forEach((harmonic) => harmonic.oscillator.stop(when))

      return this
    }
  })
}
