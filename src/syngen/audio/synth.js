/**
 * Provides factories and utilities for building prefabricated synthesizers.
 * @namespace
 */
syngen.audio.synth = {}

/**
 * Assigns `plugin` to `synth` at `key`, merges its parameters into `synth.param[key]`, and returns `synth`.
 * @param {syngen.audio.synth~Synth} synth
 * @param {String} key
 * @param {Object} plugin
 * @private
 * @returns {syngen.audio.synth~Synth}
 * @static
 */
syngen.audio.synth.assign = function (synth, key, plugin) {
  synth[key] = plugin
  synth.param = synth.param || {}
  synth.param[key] = plugin.param || {}
  return synth
}

/**
 * Adds `plugin` into the output chain for `synth` and returns `synth`.
 * Their stop methods are atuomatically chained.
 * @param {syngen.audio.synth~Synth} synth
 * @param {Object} plugin
 * @private
 * @returns {syngen.audio.synth~Synth}
 * @static
 */
syngen.audio.synth.chain = function (synth, plugin) {
  const pluginInput = plugin.input || plugin,
    pluginOutput = plugin.output || plugin,
    synthChain = synth._chain,
    synthOutput = synth.output

  if (!synthChain || !synthChain.connect) {
    throw new Error('Synth has no chain')
  }

  if (!synthOutput || !synthOutput.connect) {
    throw new Error('Synth has no output')
  }

  if (!pluginInput || !pluginInput.connect) {
    throw new Error('Plugin has no input')
  }

  if (!pluginOutput || !pluginOutput.connect) {
    throw new Error('Plugin has no output')
  }

  synthChain.disconnect(synthOutput)
  synthChain.connect(pluginInput)
  pluginOutput.connect(synthOutput)
  synth._chain = pluginOutput

  this.chainStop(synth, plugin)

  return synth
}

/**
 * Chains and assigns `plugin` to `synth` and returns `synth`.
 * @param {syngen.audio.synth~Synth} synth
 * @param {Synth} key
 * @param {Object} plugin
 * @private
 * @returns {Object}
 * @see syngen.audio.synth.assign
 * @see syngen.audio.synth.chain
 * @static
 */
syngen.audio.synth.chainAssign = function (synth, key, plugin) {
  this.assign(synth, key, plugin)
  return this.chain(synth, plugin)
}

/**
 * Wraps `synth` such that `plugin` stops when it stops and returns `synth`.
 * @param {syngen.audio.synth~Synth} synth
 * @param {Object} plugin
 * @private
 * @returns {syngen.audio.synth~Synth}
 * @static
 */
syngen.audio.synth.chainStop = function (synth, plugin) {
  const pluginStop = plugin.stop,
    synthStop = synth.stop

  if (!pluginStop) {
    return synth
  }

  if (!synthStop) {
    throw new Error('Synth has no stop')
  }

  synth.stop = function (...args) {
    pluginStop(...args)
    synthStop(...args)
    return this
  }

  return synth
}

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
 * @param {Number} [options.when={@link syngen.audio.time|syngen.audio.time()}]
 * @returns {syngen.audio.synth~Synth}
 * @static
 */
syngen.audio.synth.createAdditive = ({
  detune = 0,
  frequency,
  gain = syngen.const.zeroGain,
  harmonic: harmonicParams = [],
  when = syngen.audio.time(),
} = {}) => {
  const context = syngen.audio.context()

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

  syngen.audio.synth.setAudioParams(
    [detuneConstant.offset, detune],
    [frequencyConstant.offset, frequency],
    [output.gain, gain],
  )

  return syngen.audio.synth.decorate({
    _chain: sum,
    output,
    param: {
      detune: detuneConstant.offset,
      frequency: frequencyConstant.offset,
      gain: output.gain,
      harmonic: harmonics.map((synth) => synth.param),
    },
    stop: function (when = syngen.audio.time()) {
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

/**
 * Creates a synthesizer with amplitude modulation.
 * @param {Object} [options={}]
 * @param {Number} [options.carrierDetune=0]
 * @param {Number} [options.carrierFrequency=440]
 * @param {Number} [options.carrierGain=1]
 * @param {Number} [options.carrierType=sine]
 * @param {Number} [options.gain={@link syngen.const.zeroGain}]
 * @param {Number} [options.modDepth={@link syngen.const.zeroGain|syngen.const.zeroGain}]
 * @param {Number} [options.modDetune=0]
 * @param {Number} [options.modFrequency=440]
 * @param {Number} [options.modType=sine]
 * @param {Number} [options.modWhen]
 * @param {Number} [options.when={@link syngen.audio.time|syngen.audio.time()}]
 * @returns {syngen.audio.synth~Synth}
 * @static
 */
syngen.audio.synth.createAm = ({
  carrierDetune = 0,
  carrierFrequency,
  carrierGain: carrierGainAmount = 1,
  carrierType = 'sine',
  gain = syngen.const.zeroGain,
  modDepth: modDepthAmount = syngen.const.zeroGain,
  modDetune = 0,
  modFrequency,
  modType = 'sine',
  modWhen,
  when = syngen.audio.time(),
} = {}) => {
  const context = syngen.audio.context()

  const carrierGain = context.createGain(),
    carrierOscillator = context.createOscillator(),
    modDepth = context.createGain(),
    modOscillator = context.createOscillator(),
    output = context.createGain()

  carrierGain.connect(output)

  carrierOscillator.connect(carrierGain)
  carrierOscillator.type = carrierType
  carrierOscillator.start(when)

  modDepth.connect(carrierGain.gain)
  modOscillator.connect(modDepth)
  modOscillator.type = modType
  modOscillator.start(modWhen || when)

  syngen.audio.synth.setAudioParams(
    [carrierGain.gain, carrierGainAmount],
    [carrierOscillator.detune, carrierDetune],
    [carrierOscillator.frequency, carrierFrequency],
    [modDepth.gain, modDepthAmount],
    [modOscillator.detune, modDetune],
    [modOscillator.frequency, modFrequency],
    [output.gain, gain],
  )

  return syngen.audio.synth.decorate({
    _chain: carrierGain,
    output,
    param: {
      carrierGain: carrierGain.gain,
      detune: carrierOscillator.detune,
      frequency: carrierOscillator.frequency,
      gain: output.gain,
      mod: {
        depth: modDepth.gain,
        detune: modOscillator.detune,
        frequency: modOscillator.frequency,
      },
    },
    stop: function (when = syngen.audio.time()) {
      carrierOscillator.onended = () => {
        output.disconnect()
      }

      carrierOscillator.stop(when)
      modOscillator.stop(when)

      return this
    },
  })
}

/**
 * Creates a synthesizer which applies amplitude modulation to an `AudioBufferSourceNode`.
 * @param {Object} [options={}]
 * @param {AudioBuffer} options.buffer
 * @param {Number} [options.carrierGain=1]
 * @param {Number} [options.detune=0]
 * @param {Number} [options.gain={@link syngen.const.zeroGain}]
 * @param {Boolean} [options.loop=true]
 * @param {Number} [options.loopEnd]
 * @param {Number} [options.loopStart]
 * @param {Number} [options.modDepth={@link syngen.const.zeroGain}]
 * @param {Number} [options.modDetune=0]
 * @param {Number} [options.modFrequency=440]
 * @param {String} [options.modType=sine]
 * @param {String} [options.modWhen]
 * @param {String} [options.playbackRate=1]
 * @param {Number} [options.when={@link syngen.audio.time|syngen.audio.time()}]
 * @returns {syngen.audio.synth~Synth}
 * @static
 */
syngen.audio.synth.createAmBuffer = ({
  buffer,
  carrierGain: carrierGainAmount = 1,
  detune = 0,
  gain = syngen.const.zeroGain,
  loop = true,
  loopEnd,
  loopStart,
  modDepth: modDepthAmount = syngen.const.zeroGain,
  modDetune = 0,
  modFrequency,
  modType = 'sine',
  modWhen,
  playbackRate = 1,
  when = syngen.audio.time(),
} = {}) => {
  const context = syngen.audio.context()

  const carrierGain = context.createGain(),
    modDepth = context.createGain(),
    modOscillator = context.createOscillator(),
    output = context.createGain(),
    source = context.createBufferSource()

  carrierGain.connect(output)

  source.buffer = buffer
  source.loop = loop
  source.connect(carrierGain)
  source.start(when, syngen.utility.random.float(0, buffer.length))

  if (loop && loopEnd !== undefined) {
    source.loopEnd = loopEnd
  }

  if (loop && loopStart !== undefined) {
    source.loopStart = loopStart
  }

  modDepth.connect(carrierGain.gain)
  modOscillator.connect(modDepth)
  modOscillator.type = modType
  modOscillator.start(modWhen || when)

  syngen.audio.synth.setAudioParams(
    [carrierGain.gain, carrierGainAmount],
    [source.detune, detune],
    [source.playbackRate, playbackRate],
    [modDepth.gain, modDepthAmount],
    [modOscillator.detune, modDetune],
    [modOscillator.frequency, modFrequency],
    [output.gain, gain],
  )

  return syngen.audio.synth.decorate({
    _chain: carrierGain,
    output,
    param: {
      carrierGain: carrierGain.gain,
      detune: source.detune,
      gain: output.gain,
      mod: {
        depth: modDepth.gain,
        detune: modOscillator.detune,
        frequency: modOscillator.frequency,
      },
      playbackRate: source.playbackRate,
    },
    stop: function (when = syngen.audio.time()) {
      source.onended = () => {
        output.disconnect()
      }

      source.stop(when)
      modOscillator.stop(when)

      return this
    },
  })
}

/**
 * Creates a synthesizer which uses an `AudioBufferSourceNode`.
 * @param {Object} [options={}]
 * @param {AudioBuffer} options.buffer
 * @param {Number} [options.detune=0]
 * @param {Number} [options.gain={@link syngen.const.zeroGain}]
 * @param {Boolean} [options.loop=true]
 * @param {Number} [options.loopEnd]
 * @param {Number} [options.loopStart]
 * @param {String} [options.playbackRate=1]
 * @param {Number} [options.when={@link syngen.audio.time|syngen.audio.time()}]
 * @returns {syngen.audio.synth~Synth}
 * @static
 */
syngen.audio.synth.createBuffer = ({
  buffer,
  detune = 0,
  gain = syngen.const.zeroGain,
  loop = true,
  loopEnd,
  loopStart,
  playbackRate = 1,
  when = syngen.audio.time(),
} = {}) => {
  const context = syngen.audio.context()

  const output = context.createGain(),
    source = context.createBufferSource()

  source.buffer = buffer
  source.loop = loop
  source.connect(output)
  source.start(when, syngen.utility.random.float(0, buffer.length))

  if (loop && loopEnd !== undefined) {
    source.loopEnd = loopEnd
  }

  if (loop && loopStart !== undefined) {
    source.loopStart = loopStart
  }

  syngen.audio.synth.setAudioParams(
    [source.detune, detune],
    [source.playbackRate, playbackRate],
    [output.gain, gain],
  )

  return syngen.audio.synth.decorate({
    _chain: source,
    output,
    param: {
      detune: source.detune,
      gain: output.gain,
      playbackRate: source.playbackRate,
    },
    source,
    stop: function (when = syngen.audio.time()) {
      source.onended = () => {
        output.disconnect()
      }

      source.stop(when)

      return this
    },
  })
}

/**
 * Creates a synthesizer with frequency modulation.
 * @param {Object} [options={}]
 * @param {Number} [options.carrierDetune=0]
 * @param {Number} [options.carrierFrequency=440]
 * @param {Number} [options.carrierGain=1]
 * @param {Number} [options.carrierType=sine]
 * @param {Number} [options.gain={@link syngen.const.zeroGain}]
 * @param {Number} [options.modDepth={@link syngen.const.zeroGain|syngen.const.zeroGain}]
 * @param {Number} [options.modDetune=0]
 * @param {Number} [options.modFrequency=440]
 * @param {Number} [options.modType=sine]
 * @param {Number} [options.modWhen]
 * @param {Number} [options.when={@link syngen.audio.time|syngen.audio.time()}]
 * @returns {syngen.audio.synth~Synth}
 * @static
 */
syngen.audio.synth.createFm = ({
  carrierDetune = 0,
  carrierFrequency,
  carrierType = 'sine',
  gain = syngen.const.zeroGain,
  modDepth: modDepthAmount = syngen.const.zeroGain,
  modDetune = 0,
  modFrequency,
  modType = 'sine',
  modWhen,
  when = syngen.audio.time(),
} = {}) => {
  const context = syngen.audio.context()

  const carrierOscillator = context.createOscillator(),
    modDepth = context.createGain(),
    modOscillator = context.createOscillator(),
    output = context.createGain()

  carrierOscillator.connect(output)
  carrierOscillator.type = carrierType
  carrierOscillator.start(when)

  modDepth.connect(carrierOscillator.frequency)
  modOscillator.connect(modDepth)
  modOscillator.type = modType
  modOscillator.start(modWhen || when)

  syngen.audio.synth.setAudioParams(
    [carrierOscillator.detune, carrierDetune],
    [carrierOscillator.frequency, carrierFrequency],
    [modDepth.gain, modDepthAmount],
    [modOscillator.detune, modDetune],
    [modOscillator.frequency, modFrequency],
    [output.gain, gain],
  )

  return syngen.audio.synth.decorate({
    _chain: carrierOscillator,
    output,
    param: {
      detune: carrierOscillator.detune,
      frequency: carrierOscillator.frequency,
      gain: output.gain,
      mod: {
        depth: modDepth.gain,
        detune: modOscillator.detune,
        frequency: modOscillator.frequency,
      },
    },
    stop: function (when = syngen.audio.time()) {
      carrierOscillator.onended = () => {
        output.disconnect()
      }

      carrierOscillator.stop(when)
      modOscillator.stop(when)

      return this
    },
  })
}

/**
 * Creates a simple low-frequency oscillator intended for modulation.
 * This is identical to {@link |createSimple()} except with different terminology.
 * @param {Object} [options={}]
 * @param {Number} [options.depth={@link syngen.const.zeroGain}]
 * @param {Number} [options.detune=0]
 * @param {Number} [options.frequency=0]
 * @param {String} [options.type=sine]
 * @param {Number} [options.when={@link syngen.audio.time|syngen.audio.time()}]
 * @returns {syngen.audio.synth~Synth}
 * @static
 */
syngen.audio.synth.createLfo = ({
  depth: depthAmount = syngen.const.zeroGain,
  detune = 0,
  frequency = 0,
  type = 'sine',
  when = syngen.audio.time(),
} = {}) => {
  const context = syngen.audio.context()

  const depth = context.createGain(),
    oscillator = context.createOscillator()

  oscillator.type = type
  oscillator.connect(depth)
  oscillator.start(when)

  syngen.audio.synth.setAudioParams(
    [depth.gain, depthAmount],
    [oscillator.detune, detune],
    [oscillator.frequency, frequency],
  )

  return syngen.audio.synth.decorate({
    _chain: oscillator,
    param: {
      depth: depth.gain,
      detune: oscillator.detune,
      frequency: oscillator.frequency,
    },
    output: depth,
    stop: function (when = syngen.audio.time()) {
      oscillator.onended = () => {
        depth.disconnect()
      }

      oscillator.stop(when)

      return this
    },
  })
}

/**
 * Creates a synthesizer with both amplitude and frequency modulation.
 * @param {Object} [options={}]
 * @param {Number} [options.amodDepth={@link syngen.const.zeroGain|syngen.const.zeroGain}]
 * @param {Number} [options.amodDetune=0]
 * @param {Number} [options.amodFrequency=440]
 * @param {Number} [options.amodType=sine]
 * @param {Number} [options.amodWhen]
 * @param {Number} [options.carrierDetune=0]
 * @param {Number} [options.carrierFrequency=440]
 * @param {Number} [options.carrierGain=1]
 * @param {Number} [options.carrierType=sine]
 * @param {Number} [options.fmodDepth={@link syngen.const.zeroGain|syngen.const.zeroGain}]
 * @param {Number} [options.fmodDetune=0]
 * @param {Number} [options.fmodFrequency=440]
 * @param {Number} [options.fmodType=sine]
 * @param {Number} [options.fmodWhen]
 * @param {Number} [options.gain={@link syngen.const.zeroGain}]
 * @param {Number} [options.when={@link syngen.audio.time|syngen.audio.time()}]
 * @returns {syngen.audio.synth~Synth}
 * @static
 */
syngen.audio.synth.createMod = ({
  amodDepth: amodDepthAmount = syngen.const.zeroGain,
  amodDetune = 0,
  amodFrequency,
  amodType = 'sine',
  amodWhen,
  carrierDetune = 0,
  carrierFrequency,
  carrierGain: carrierGainAmount = 1,
  carrierType = 'sine',
  gain = syngen.const.zeroGain,
  fmodDepth: fmodDepthAmount = syngen.const.zeroGain,
  fmodDetune = 0,
  fmodFrequency,
  fmodType = 'sine',
  fmodWhen,
  when = syngen.audio.time(),
} = {}) => {
  const context = syngen.audio.context()

  const amodDepth = context.createGain(),
    amodOscillator = context.createOscillator(),
    carrierGain = context.createGain(),
    carrierOscillator = context.createOscillator(),
    fmodDepth = context.createGain(),
    fmodOscillator = context.createOscillator(),
    output = context.createGain()

  carrierGain.connect(output)

  carrierOscillator.connect(carrierGain)
  carrierOscillator.type = carrierType
  carrierOscillator.start(when)

  amodDepth.connect(carrierGain.gain)
  amodOscillator.connect(amodDepth)
  amodOscillator.type = amodType
  amodOscillator.start(amodWhen || when)

  fmodDepth.connect(carrierOscillator.frequency)
  fmodOscillator.connect(fmodDepth)
  fmodOscillator.type = fmodType
  fmodOscillator.start(fmodWhen || when)

  syngen.audio.synth.setAudioParams(
    [amodDepth.gain, amodDepthAmount],
    [amodOscillator.detune, amodDetune],
    [amodOscillator.frequency, amodFrequency],
    [carrierGain.gain, carrierGainAmount],
    [carrierOscillator.detune, carrierDetune],
    [carrierOscillator.frequency, carrierFrequency],
    [fmodDepth.gain, fmodDepthAmount],
    [fmodOscillator.detune, fmodDetune],
    [fmodOscillator.frequency, fmodFrequency],
    [output.gain, gain],
  )

  return syngen.audio.synth.decorate({
    _chain: carrierGain,
    output,
    param: {
      amod: {
        depth: amodDepth.gain,
        detune: amodOscillator.detune,
        frequency: amodOscillator.frequency,
      },
      carrierGain: carrierGain.gain,
      fmod: {
        depth: fmodDepth.gain,
        detune: fmodOscillator.detune,
        frequency: fmodOscillator.frequency,
      },
      detune: carrierOscillator.detune,
      frequency: carrierOscillator.frequency,
      gain: output.gain,
    },
    stop: function (when = syngen.audio.time()) {
      carrierOscillator.onended = () => {
        output.disconnect()
      }

      amodOscillator.stop(when)
      carrierOscillator.stop(when)
      fmodOscillator.stop(when)

      return this
    },
  })
}

/**
 * Creates a simple synthesizer with configurable pulse-width modulation.
 * @param {Object} [options={}]
 * @param {Number} [options.detune=0]
 * @param {Number} [options.frequency=440]
 * @param {Number} [options.gain={@link syngen.const.zeroGain}]
 * @param {String} [options.type=sine]
 * @param {Number} [options.when={@link syngen.audio.time|syngen.audio.time()}]
 * @param {Number} [options.width=0]
 * @returns {syngen.audio.synth~Synth}
 * @static
 */
syngen.audio.synth.createPwm = ({
  detune = 0,
  frequency,
  gain = syngen.const.zeroGain,
  type = 'sine',
  when = syngen.audio.time(),
  width: widthAmount = 0,
} = {}) => {
  const context = syngen.audio.context(),
    facade = context.createGain(),
    oscillator = context.createOscillator(),
    output = context.createGain(),
    shaperOne = context.createWaveShaper(),
    shaperPulse = context.createWaveShaper(),
    width = context.createGain()

  oscillator.type = type
  shaperOne.curve = syngen.audio.shape.one()
  shaperPulse.curve = syngen.audio.shape.square()

  facade.connect(output)
  oscillator.connect(shaperOne)
  oscillator.connect(shaperPulse)
  shaperOne.connect(width)
  shaperPulse.connect(facade)
  width.connect(shaperPulse)

  oscillator.start(when)

  syngen.audio.synth.setAudioParams(
    [oscillator.detune, detune],
    [oscillator.frequency, frequency],
    [output.gain, gain],
    [width.gain, widthAmount],
  )

  return syngen.audio.synth.decorate({
    _chain: facade,
    output,
    param: {
      detune: oscillator.detune,
      frequency: oscillator.frequency,
      gain: output.gain,
      width: width.gain,
    },
    stop: function (when = syngen.audio.time()) {
      oscillator.onended = () => {
        output.disconnect()
      }

      oscillator.stop(when)

      return this
    },
    width,
  })
}

/**
 * Creates a simple synthesizer with a single oscillator.
 * @param {Object} [options={}]
 * @param {Number} [options.detune=0]
 * @param {Number} [options.frequency=440]
 * @param {Number} [options.gain={@link syngen.const.zeroGain}]
 * @param {String} [options.type=sine]
 * @param {Number} [options.when={@link syngen.audio.time|syngen.audio.time()}]
 * @returns {syngen.audio.synth~Synth}
 * @static
 */
syngen.audio.synth.createSimple = ({
  detune = 0,
  frequency,
  gain = syngen.const.zeroGain,
  type = 'sine',
  when = syngen.audio.time(),
} = {}) => {
  const context = syngen.audio.context()

  const oscillator = context.createOscillator(),
    output = context.createGain()

  oscillator.connect(output)
  oscillator.type = type
  oscillator.start(when)

  syngen.audio.synth.setAudioParams(
    [oscillator.detune, detune],
    [oscillator.frequency, frequency],
    [output.gain, gain],
  )

  return syngen.audio.synth.decorate({
    _chain: oscillator,
    output,
    param: {
      detune: oscillator.detune,
      frequency: oscillator.frequency,
      gain: output.gain,
    },
    stop: function (when = syngen.audio.time()) {
      oscillator.onended = () => {
        output.disconnect()
      }

      oscillator.stop(when)

      return this
    },
  })
}

/**
 * Decorates prefabricated `synth` with synth methods.
 * @param {Object} [synth={}]
 * @private
 * @returns {syngen.audio.synth~Synth}
 * @static
 */
syngen.audio.synth.decorate = (synth = {}) => {
  return Object.setPrototypeOf(synth, syngen.audio.synth.decoration)
}

/**
 * A prefabricated synth returned from a {@link syngen.audio.synth} factory method.
 * They wrap their `AudioNode`s with an interface that exposes their `AudioParam`s and provides methods to build more sophisticated circuits.
 * Internally they maintain a pointer to the last node before output so they can unlink them and dynamically add plugins to the output chain.
 * @property {Function} assign
 *   Assigns `plugin` to `key` and merges its parameters.
 * @property {Function} chain
 *   Adds `plugin` to the output chain and ensures they stop together.
 * @property {Function} chainAssign
 *   Assigns and chains `plugin` to `key`.
 * @property {Function} chainStop
 *   Ensures `plugin` stops when the synth is stopped.
 * @property {Function} connect
 *   Connects output to node.
 * @property {Function} disconnect
 *   Disconnects output from node.
 * @property {Function} filtered
 *   Adds a `BiquadFilterNode` to the output chain with `options`.
 * @property {GainNode} output
 *   The final output after all chained plugins.
 * @property {Object} param
 *   Hash of all `AudioParam`s.
 * @property {Function} shaped
 *   Adds a `WaveShaperNode` to the output chain with `curve`.
 * @property {Function} stop
 *   Stops the synth and all chained plugins.
 * @todo Improve documentation
 * @typedef {Object} syngen.audio.synth~Synth
 */
syngen.audio.synth.decoration = {
  assign: function (...args) {
    return syngen.audio.synth.assign(this, ...args)
  },
  chain: function (...args) {
    return syngen.audio.synth.chain(this, ...args)
  },
  chainAssign: function (...args) {
    return syngen.audio.synth.chainAssign(this, ...args)
  },
  chainStop: function (...args) {
    return syngen.audio.synth.chainStop(this, ...args)
  },
  connect: function (...args) {
    this.output.connect(...args)
    return this
  },
  disconnect: function (...args) {
    this.output.disconnect(...args)
    return this
  },
  filtered: function (...args) {
    if (!this.filter) {
      return syngen.audio.synth.filtered(this, ...args)
    }

    return this
  },
  shaped: function (...args) {
    if (!this.shaper) {
      return syngen.audio.synth.shaped(this, ...args)
    }

    return this
  },
}

/**
 * Adds a filter with `options` to the output chain of `synth` and returns `synth`.
 * @param {syngen.audio.synth~Synth} synth
 * @param {Object} [options={}]
 * @private
 * @returns {Object}
 * @static
 */
syngen.audio.synth.filtered = function (synth, {
  detune = 0,
  gain,
  frequency,
  Q,
  type = 'lowpass',
} = {}) {
  const filter = syngen.audio.context().createBiquadFilter()

  filter.type = type

  syngen.audio.synth.setAudioParams(
    [filter.detune, detune],
    [filter.gain, gain],
    [filter.frequency, frequency],
    [filter.Q, Q],
  )

  return this.chainAssign(synth, 'filter', filter)
}

/**
 * Helper that sets `AudioParam`s to values.
 * Expects multiple arguments in the format `[AudioParam, value]`.
 * @private
 * @static
 */
syngen.audio.synth.setAudioParams = function (...params) {
  for (const [param, value] of params) {
    if (param instanceof AudioParam) {
      if (value !== undefined) {
        param.value = value
      }
    }
  }

  return this
}

/**
 * Inserts a `WaveShaperNode` into the output chain for `synth` and returns `synth`.
 * @param {syngen.audio.synth~Synth} synth
 * @param {Float32Array} curve
 * @private
 * @returns {Object}
 * @static
 */
syngen.audio.synth.shaped = function (synth, curve) {
  const shaper = syngen.audio.context().createWaveShaper()
  shaper.curve = curve
  return this.chainAssign(synth, 'shaper', shaper)
}
