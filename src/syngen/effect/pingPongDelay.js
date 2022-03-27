/**
 * Creates a feedback delay line that bounces between stereo channels.
 * @param {Object} [options={}]
 * @param {Number} [options.delay=0.5]
 * @param {Number} [options.dry=1]
 * @param {Number} [options.feedback=0.5]
 * @param {Number} [options.maxDelayTime=1]
 * @param {Number} [options.wet=0.5]
 * @returns {syngen.synth~Plugin}
 * @static
 */
syngen.effect.pingPongDelay = function ({
  delay: delayAmount = 0.5,
  dry: dryAmount = 1,
  feedback: feedbackAmount = 0.5,
  maxDelayTime = 1,
  wet: wetAmount = 0.5,
} = {}) {
  const context = syngen.context()

  const delay = context.createDelay(maxDelayTime),
    dry = context.createGain(),
    feedback = context.createGain(),
    input = context.createGain(),
    merger = context.createChannelMerger(2),
    output = context.createGain(),
    panner = context.createStereoPanner(),
    splitter = context.createChannelSplitter(2),
    wet = context.createGain()

  input.connect(dry)
  input.connect(panner)
  panner.connect(splitter)
  splitter.connect(merger, 0, 1)
  splitter.connect(merger, 1, 0)
  merger.connect(delay)
  delay.connect(feedback)
  delay.connect(wet)
  feedback.connect(panner)
  dry.connect(output)
  wet.connect(output)

  delay.delayTime.value = delayAmount
  dry.gain.value = dryAmount
  feedback.gain.value = feedbackAmount
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
      gain: output.gain,
      wet: wet.gain,
    },
  }
}
