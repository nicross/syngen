/**
 * Creates a feedback delay line with a filter inserted into its feedback loop.
 * @param {Object} [options={}]
 * @param {Number} [options.delay=0.5]
 * @param {Number} [options.dry=1]
 * @param {Number} [options.feedback=0.5]
 * @param {Number} [options.filterDetune=0]
 * @param {Number} [options.filterFrequency={@link syngen.const.maxFrequency}]
 * @param {Number} [options.filterGain=0]
 * @param {Number} [options.filterQ=1]
 * @param {String} [options.filterType=lowpass]
 * @param {Number} [options.maxDelayTime=1]
 * @param {Number} [options.wet=0.5]
 * @returns {syngen.synth~Plugin}
 * @static
 */
syngen.effect.dubDelay = function ({
  delay: delayAmount = 0.5,
  dry: dryAmount = 1,
  feedback: feedbackAmount = 0.5,
  filterDetune = 0,
  filterFrequency = syngen.const.maxFrequency,
  filterGain = 0,
  filterQ = 1,
  filterType = 'lowpass',
  maxDelayTime = 1,
  wet: wetAmount = 0.5,
} = {}) {
  const context = syngen.context()

  const delay = context.createDelay(maxDelayTime),
    dry = context.createGain(),
    feedback = context.createGain(),
    filter = context.createBiquadFilter(),
    input = context.createGain(),
    output = context.createGain(),
    wet = context.createGain()

  input.connect(delay)
  input.connect(dry)
  delay.connect(filter)
  filter.connect(feedback)
  filter.connect(wet)
  feedback.connect(delay)
  dry.connect(output)
  wet.connect(output)

  delay.delayTime.value = delayAmount
  dry.gain.value = dryAmount
  feedback.gain.value = feedbackAmount
  filter.detune.value = filterDetune
  filter.frequency.value = filterFrequency
  filter.gain.value = filterGain
  filter.Q.value = filterQ
  filter.type = filterType
  input.gain.value = 1
  output.gain.value = 1
  wet.gain.value = wetAmount

  return {
    input,
    output,
    param: {
      dry: dry.gain,
      delay: delay.delayTime,
      feedback: feedback.gain,
      filter: {
        detune: filter.detune,
        gain: filter.gain,
        frequency: filter.frequency,
        Q: filter.Q,
      },
      gain: output.gain,
      wet: wet.gain,
    },
  }
}
