/**
 * Creates a phaser or flange effect.
 * Beware that this is not an out-of-the-box solution.
 * Parameter values must be carefully chosen to achieve the desired effect.
 * @param {Object} [options={}]
 * @param {Number} [options.dry=0.5]
 * @param {Number} [options.depth=0.001]
 * @param {Number} [options.delay=0.01]
 * @param {Number} [options.feedback={@link syngen.const.zeroGain}]
 * @param {Number} [options.rate=1]
 * @param {String} [options.type=sine]
 * @param {Number} [options.wet=0.5]
 * @param {Number} [options.when={@link syngen.time|syngen.time()}]
 * @returns {syngen.synth~Plugin}
 * @static
 */
syngen.effect.phaser = ({
  dry: dryAmount = 0.5,
  depth: depthAmount = 0.001,
  delay: delayTimeAmount = 0.01,
  feedback: feedbackAmount = syngen.const.zeroGain,
  frequency = 1,
  type = 'sine',
  wet: wetAmount = 0.5,
  when = syngen.time(),
} = {}) => {
  const context = syngen.context(),
    delay = context.createDelay(),
    depth = context.createGain(),
    dry = context.createGain(),
    feedback = context.createGain(),
    input = context.createGain(),
    lfo = context.createOscillator(),
    output = context.createGain(),
    wet = context.createGain()

  delay.delayTime.value = delayTimeAmount
  depth.gain.value = depthAmount
  dry.gain.value = dryAmount
  feedback.gain.value = feedbackAmount
  lfo.frequency.value = frequency
  wet.gain.value = wetAmount

  input.connect(dry)
  input.connect(delay)
  delay.connect(wet)
  delay.connect(feedback)
  feedback.connect(delay)
  dry.connect(output)
  wet.connect(output)

  lfo.connect(depth)
  lfo.type = type
  lfo.start(when)
  depth.connect(delay.delayTime)

  return {
    input,
    output,
    param: {
      delay: delay.delayTime,
      depth: depth.gain,
      dry: dry.gain,
      feedback: feedback.gain,
      frequency: lfo.frequency,
      gain: output.gain,
      wet: wet.gain,
    },
    stop: function (when = syngen.time()) {
      lfo.stop(when)
      return this
    },
  }
}
