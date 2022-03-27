/**
 * Creates a feedback delay line with multiple taps.
 * @param {Object} [options={}]
 * @param {Number} [options.dry=1]
 * @param {Object[]} [options.tap=[]]
 * @param {Object[]} [options.tap.delay=0.5}
 * @param {Object[]} [options.tap.feedback=0.5}
 * @param {Object[]} [options.tap.gain=1}
 * @param {Object[]} [options.tap.maxDelayTime=1}
 * @param {Number} [options.wet=1]
 * @returns {syngen.synth~Plugin}
 * @static
 */
syngen.effect.multitapDelay = ({
  dry: dryAmount = 1,
  tap: tapParams = [],
  wet: wetAmount = 0.5,
} = {}) => {
  const context = syngen.context(),
    dry = context.createGain(),
    input = context.createGain(),
    output = context.createGain(),
    wet = context.createGain()

  input.connect(dry)
  dry.connect(output)
  wet.connect(output)

  dry.gain.value = dryAmount
  input.gain.value = 1
  output.gain.value = 1
  wet.gain.value = wetAmount

  const taps = tapParams.map(({
    delay: delayAmount = 0.5,
    feedback: feedbackAmount = 0.5,
    gain: gainAmount = 1,
    maxDelayTime = 1,
  } = {}) => {
    const delay = context.createDelay(maxDelayTime),
      feedback = context.createGain(),
      gain = context.createGain()

    input.connect(gain)
    gain.connect(delay)
    delay.connect(feedback)
    delay.connect(wet)
    feedback.connect(delay)

    delay.delayTime.value = delayAmount
    feedback.gain.value = feedbackAmount
    gain.gain.value = gainAmount

    return {
      delay: delay.delayTime,
      feedback: feedback.gain,
      gain: gain.gain,
    }
  })

  return {
    input,
    output,
    param: {
      dry: dry.gain,
      gain: output.gain,
      tap: taps,
      wet: wet.gain,
    },
  }
}
