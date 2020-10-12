/**
 * @namespace
 */
syngen.audio.synth = {}

/**
 * @static
 */
syngen.audio.synth.assign = function (synth, key, plugin) {
  synth[key] = plugin
  synth.param = synth.param || {}
  synth.param[key] = plugin.param || {}
  return synth
}

/**
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
 * @static
 */
syngen.audio.synth.chainAssign = function (synth, key, plugin) {
  this.assign(synth, key, plugin)
  return this.chain(synth, plugin)
}

/**
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
 * @static
 */
syngen.audio.synth.createAdditive = ({
  detune,
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
    harmonic: harmonics,
    output,
    param: {
      detune: detuneConstant.offset,
      frequency: frequencyConstant.offset,
      gain: output.gain,
    },
    stop: function (when = syngen.audio.time()) {
      if (harmonics.length) {
        harmonics[0].oscillator.onended = () => {
          output.disconnect()
        }
      }

      detuneConstant.stop(when)
      frequencyConstant.stop(when)
      harmonics.forEach((harmonic) => harmonic.oscillator.stop(when))

      return this
    }
  })
}

/**
 * @static
 */
syngen.audio.synth.createAm = ({
  carrierDetune,
  carrierFrequency,
  carrierGain: carrierGainAmount,
  carrierType = 'sine',
  gain = syngen.const.zeroGain,
  modDepth: modDepthAmount,
  modDetune,
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
 * @static
 */
syngen.audio.synth.createAmBuffer = ({
  buffer,
  carrierGain: carrierGainAmount,
  detune,
  gain = syngen.const.zeroGain,
  loop = true,
  loopEnd,
  loopStart,
  modDepth: modDepthAmount,
  modDetune,
  modFrequency,
  modType = 'sine',
  modWhen,
  rate = 1,
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
    [source.playbackRate, rate],
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
      rate: source.playbackRate,
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
 * @static
 */
syngen.audio.synth.createBuffer = ({
  buffer,
  detune,
  gain = syngen.const.zeroGain,
  loop = true,
  loopEnd,
  loopStart,
  rate = 1,
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
    [source.playbackRate, rate],
    [output.gain, gain],
  )

  return syngen.audio.synth.decorate({
    _chain: source,
    output,
    param: {
      detune: source.detune,
      gain: output.gain,
      rate: source.playbackRate,
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
 * @static
 */
syngen.audio.synth.createFm = ({
  carrierDetune,
  carrierFrequency,
  carrierType = 'sine',
  gain = syngen.const.zeroGain,
  modDepth: modDepthAmount,
  modDetune,
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
 * @static
 */
syngen.audio.synth.createLfo = ({
  depth: depthAmount,
  detune,
  frequency,
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
 * @static
 */
syngen.audio.synth.createMod = ({
  amodDepth: amodDepthAmount = syngen.const.zeroGain,
  amodDetune,
  amodFrequency,
  amodType = 'sine',
  amodWhen,
  carrierDetune,
  carrierFrequency,
  carrierGain: carrierGainAmount,
  carrierType = 'sine',
  gain = syngen.const.zeroGain,
  fmodDepth: fmodDepthAmount,
  fmodDetune,
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
 * @static
 */
syngen.audio.synth.createPwm = ({
  detune,
  frequency,
  gain = syngen.const.zeroGain,
  type = 'sine',
  when = syngen.audio.time(),
} = {}) => {
  // SEE: https://github.com/pendragon-andyh/WebAudio-PulseOscillator

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
  width.gain.value = 0

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
 * @static
 */
syngen.audio.synth.createSimple = ({
  detune,
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
 * @static
 */
syngen.audio.synth.decorate = (synth = {}) => {
  return Object.setPrototypeOf(synth, syngen.audio.synth.decoration)
}

/**
 * @static
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
 * @static
 */
syngen.audio.synth.filtered = function (synth, {
  detune,
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
 * @static
 */
syngen.audio.synth.shaped = function (synth, curve) {
  const shaper = syngen.audio.context().createWaveShaper()
  shaper.curve = curve
  return this.chainAssign(synth, 'shaper', shaper)
}
