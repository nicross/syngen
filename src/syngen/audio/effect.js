syngen.audio.effect = {}

syngen.audio.effect.createDubDelay = function ({
  filterFrequency = syngen.const.maxFrequency,
  filterType = 'lowpass',
  ...options
} = {}) {
  const context = syngen.audio.context(),
    feedbackDelay = this.createFeedbackDelay(options),
    filter = context.createBiquadFilter()

  filter.frequency.value = filterFrequency
  filter.type = filterType

  // Rewire filter into feedback loop
  feedbackDelay.delay.disconnect(feedbackDelay.feedback)
  feedbackDelay.delay.disconnect(feedbackDelay.wet)
  feedbackDelay.delay.connect(filter)
  filter.connect(feedbackDelay.feedback)
  filter.connect(feedbackDelay.wet)

  feedbackDelay.filter = filter
  feedbackDelay.param.filterFrequency = filter.frequency

  return feedbackDelay
}

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
    delay,
    dry,
    feedback,
    input,
    output,
    wet,
    param: {
      dry: dry.gain,
      delay: delay.delayTime,
      feedback: feedback.gain,
      gain: output.gain,
      wet: wet.gain,
    },
  }
}

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
    dry,
    input,
    output,
    wet,
    param: {
      dry: dry.gain,
      gain: output.gain,
      tap: taps,
      wet: wet.gain,
    },
    transition: function (taps = [], duration) {
      this.param.tap.forEach((tap, i) => {
        if (!taps[i]) {
          syngen.utility.ramp.linear(tap.gain, syngen.const.zeroGain, duration)
          return
        }

        const {delay, feedback, gain} = taps[i]

        if (typeof delay != 'undefined') {
          syngen.utility.ramp.linear(tap.delay, delay, duration)
        }

        if (typeof feedback != 'undefined') {
          syngen.utility.ramp.linear(tap.feedback, feedback, duration)
        }

        if (typeof gain != 'undefined') {
          syngen.utility.ramp.linear(tap.gain, gain, duration)
        }
      })

      return this
    },
  }
}

// This is not an out-of-the-box solution for phaser, chorus, or flange
// Depth and rate values must be exact values, e.g. 20ms delayTime, 1ms depth, 1/2hz rate
syngen.audio.effect.createPhaser = ({
  dry: dryAmount = 1/2,
  depth: depthAmount = 0.001,
  delay: delayTimeAmount = 0.01,
  feedback: feedbackAmount = syngen.const.zeroGain,
  rate: rateAmount = 1,
  type = 'sine',
  wet: wetAmount = 1/2,
  when = 0,
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
  lfo.frequency.value = rateAmount
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
    delay,
    depth,
    dry,
    feedback,
    input,
    lfo,
    output,
    wet,
    param: {
      delay: delay.delayTime,
      depth: depth.gain,
      dry: dry.gain,
      feedback: feedback.gain,
      gain: output.gain,
      rate: lfo.frequency,
      wet: wet.gain,
    },
    stop: function (when = syngen.audio.time()) {
      lfo.stop(when)
      return this
    },
  }
}

syngen.audio.effect.createPingPongDelay = function (options) {
  const context = syngen.audio.context(),
    feedbackDelay = this.createFeedbackDelay(options),
    merger = context.createChannelMerger(2),
    panner = context.createStereoPanner(),
    splitter = context.createChannelSplitter(2)

  // XXX: Panner forces mono signals to be stereo so they don't cancel
  panner.connect(splitter)
  splitter.connect(merger, 0, 1)
  splitter.connect(merger, 1, 0)

  // Rewire splitter/merger between input and wet
  feedbackDelay.input.disconnect(feedbackDelay.delay)
  feedbackDelay.input.connect(panner)
  feedbackDelay.feedback.disconnect(feedbackDelay.delay)
  feedbackDelay.feedback.connect(panner)
  merger.connect(feedbackDelay.delay)

  return feedbackDelay
}

syngen.audio.effect.createShaper = ({
  curve = syngen.audio.shape.warm(),
  dry: dryAmount = 0,
  inputGain: inputGainAmount = 1,
  wet: wetAmount = 1,
} = {}) => {
  const context = syngen.audio.context(),
    dry = context.createGain(),
    input = context.createGain(),
    inputGain = context.createGain(),
    output = context.createGain(),
    shaper = context.createWaveShaper(),
    wet = context.createGain()

  dry.gain.value = dryAmount
  inputgain.gain.value = inputGainAmount
  shaper.curve = curve
  wet.gain.value = wetAmount

  input.connect(dry)
  input.connect(inputGain)
  inputGain.connect(shaper)
  shaper.connect(wet)
  dry.connect(output)
  wet.connect(output)

  return {
    dry,
    input,
    inputGain,
    shaper,
    output,
    wet,
    param: {
      dry: dry.gain,
      inputGain: inputGain.gain,
      outputGain: output.gain,
      wet: wet.gain,
    }
  }
}

syngen.audio.effect.createTalkbox = ({
  dry: dryAmount = 0,
  formant0 = syngen.audio.formant.createU(),
  formant1 = syngen.audio.formant.createA(),
  mix: mixAmount = 1/2,
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
    dry,
    formant: [
      formant0,
      formant1,
    ],
    input,
    mix,
    output,
    wet,
    param: {
      dry: dry.gain,
      mix: mix.offset,
      wet: wet.gain,
    },
    stop: function (when = syngen.audio.time()) {
      mix.stop(when)
      return this
    },
  }
}
