/**
 * Provides factories that create circuits for effects processing.
 * Importantly, these are _not_ the only way to create effects for use with syngen.
 * Implementations can build their own effects or use any external library that supports connecting to its audio graph.
 * @namespace
 */
syngen.audio.effect = {}

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
 * @returns {syngen.audio.synth~Plugin}
 * @static
 */
syngen.audio.effect.createDubDelay = function ({
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
  const context = syngen.audio.context()

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

/**
 * Creates a feedback delay line.
 * @param {Object} [options={}]
 * @param {Number} [options.delay=0.5]
 * @param {Number} [options.dry=1]
 * @param {Number} [options.feedback=0.5]
 * @param {Number} [options.maxDelayTime=1]
 * @param {Number} [options.wet=0.5]
 * @returns {syngen.audio.synth~Plugin}
 * @static
 */
syngen.audio.effect.createFeedbackDelay = ({
  delay: delayAmount = 0.5,
  dry: dryAmount = 1,
  feedback: feedbackAmount = 0.5,
  maxDelayTime = 1,
  wet: wetAmount = 0.5,
} = {}) => {
  const context = syngen.audio.context()

  const delay = context.createDelay(maxDelayTime),
    dry = context.createGain(),
    feedback = context.createGain(),
    input = context.createGain(),
    output = context.createGain(),
    wet = context.createGain()

  input.connect(delay)
  input.connect(dry)
  delay.connect(feedback)
  delay.connect(wet)
  feedback.connect(delay)
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
 * @returns {syngen.audio.synth~Plugin}
 * @static
 */
syngen.audio.effect.createMultitapFeedbackDelay = ({
  dry: dryAmount = 1,
  tap: tapParams = [],
  wet: wetAmount = 0.5,
} = {}) => {
  const context = syngen.audio.context(),
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
 * @param {Number} [options.when={@link syngen.audio.time|syngen.audio.time()}]
 * @returns {syngen.audio.synth~Plugin}
 * @static
 */
syngen.audio.effect.createPhaser = ({
  dry: dryAmount = 0.5,
  depth: depthAmount = 0.001,
  delay: delayTimeAmount = 0.01,
  feedback: feedbackAmount = syngen.const.zeroGain,
  frequency = 1,
  type = 'sine',
  wet: wetAmount = 0.5,
  when = syngen.audio.time(),
} = {}) => {
  const context = syngen.audio.context(),
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
    stop: function (when = syngen.audio.time()) {
      lfo.stop(when)
      return this
    },
  }
}

/**
 * Creates a feedback delay line that bounces between stereo channels.
 * @param {Object} [options={}]
 * @param {Number} [options.delay=0.5]
 * @param {Number} [options.dry=1]
 * @param {Number} [options.feedback=0.5]
 * @param {Number} [options.maxDelayTime=1]
 * @param {Number} [options.wet=0.5]
 * @returns {syngen.audio.synth~Plugin}
 * @static
 */
syngen.audio.effect.createPingPongDelay = function ({
  delay: delayAmount = 0.5,
  dry: dryAmount = 1,
  feedback: feedbackAmount = 0.5,
  maxDelayTime = 1,
  wet: wetAmount = 0.5,
} = {}) {
  const context = syngen.audio.context()

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

/**
 * Creates a distortion effect with a configurable `curve`.
 * @param {Object} [options={}]
 * @param {Float32Array} [options.curve={@link syngen.audio.shape.warm|syngen.audio.shape.warm()}]
 * @param {Number} [options.dry=1]
 * @param {Number} [options.preGain=1]
 * @param {Number} [options.wet=1]
 * @returns {syngen.audio.synth~Plugin}
 * @see syngen.audio.shape
 * @static
 */
syngen.audio.effect.createShaper = ({
  curve = syngen.audio.shape.warm(),
  dry: dryAmount = 0,
  preGain: preGainAmount = 1,
  wet: wetAmount = 1,
} = {}) => {
  const context = syngen.audio.context(),
    dry = context.createGain(),
    input = context.createGain(),
    output = context.createGain(),
    preGain = context.createGain(),
    shaper = context.createWaveShaper(),
    wet = context.createGain()

  dry.gain.value = dryAmount
  preGain.gain.value = preGainAmount
  shaper.curve = curve
  wet.gain.value = wetAmount

  input.connect(dry)
  input.connect(preGain)
  preGain.connect(shaper)
  shaper.connect(wet)
  dry.connect(output)
  wet.connect(output)

  return {
    input,
    output,
    param: {
      dry: dry.gain,
      gain: output.gain,
      preGain: inputGain.gain,
      wet: wet.gain,
    }
  }
}

/**
 * Creates a talk box that seamlessly blends between two formants with its `mix` parameter.
 * @param {Object} [options={}]
 * @param {Number} [options.dry=0]
 * @param {syngen.audio.formant~Plugin} [options.format0={@link syngen.audio.formant.createU|syngen.audio.formant.createU()}]
 * @param {syngen.audio.formant~Plugin} [options.format1={@link syngen.audio.formant.createA|syngen.audio.formant.createA()}]
 * @param {Number} [options.mix=0.5]
 * @param {Number} [options.wet=1]
 * @returns {syngen.audio.synth~Plugin}
 * @static
 */
syngen.audio.effect.createTalkbox = ({
  dry: dryAmount = 0,
  formant0 = syngen.audio.formant.createU(),
  formant1 = syngen.audio.formant.createA(),
  mix: mixAmount = 0.5,
  wet: wetAmount = 1,
} = {}) => {
  const context = syngen.audio.context(),
    dry = context.createGain(),
    input = context.createGain(),
    invert = context.createGain(),
    mix = context.createConstantSource(),
    mix0 = context.createGain(),
    mix1 = context.createGain(),
    output = context.createGain(),
    wet = context.createGain()

  dry.gain.value = dryAmount
  mix.offset.value = mixAmount
  wet.gain.value = wetAmount

  mix.connect(mix1.gain)
  mix1.gain.value = 0

  mix.connect(invert)
  invert.connect(mix0.gain)
  invert.gain.value = -1
  mix0.gain.value = 1

  input.connect(dry)
  input.connect(mix0)
  input.connect(mix1)
  mix.start()
  mix0.connect(formant0.input)
  mix1.connect(formant1.input)
  formant0.output.connect(wet)
  formant1.output.connect(wet)
  dry.connect(output)
  wet.connect(output)

  return {
    input,
    output,
    param: {
      dry: dry.gain,
      formant0: formant0.param,
      formant1: formant1.param,
      mix: mix.offset,
      wet: wet.gain,
    },
    stop: function (when = syngen.audio.time()) {
      mix.stop(when)
      return this
    },
  }
}
