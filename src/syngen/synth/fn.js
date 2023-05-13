/**
 * Provides utility functions for the synth factories.
 * @private
 */
syngen.synth.fn = {}

/**
 * Assigns `plugin` to `synth` at `key`, merges its parameters into `synth.param[key]`, and returns `synth`.
 * If `key` already exists, then those plugins will be wrapped in an array.
 * @param {syngen.synth~Synth} synth
 * @param {String} key
 * @param {syngen.synth~Plugin} plugin
 * @private
 * @returns {syngen.synth~Synth}
 * @static
 */
syngen.synth.fn.assign = function (synth, key, plugin) {
  if (!synth.param) {
    synth.param = {}
  }

  if (key in synth) {
    if (!Array.isArray(synth[key])) {
      synth[key] = [synth[key]]
      synth.param[key] = [synth.param[key]]
    }

    synth[key].push(plugin)
    synth.param[key].push(plugin.param || {})
  } else {
    synth[key] = plugin
    synth.param[key] = plugin.param || {}
  }

  return synth
}

/**
 * Adds `plugin` into the output chain for `synth` and returns `synth`.
 * Their stop methods are atuomatically chained.
 * @param {syngen.synth~Synth} synth
 * @param {syngen.synth~Plugin|AudioNode} plugin
 * @private
 * @returns {syngen.synth~Synth}
 * @static
 */
syngen.synth.fn.chain = function (synth, plugin) {
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
 * @param {syngen.synth~Synth} synth
 * @param {Synth} key
 * @param {syngen.synth~Plugin|AudioNode} plugin
 * @private
 * @returns {Object}
 * @see syngen.synth.fn.assign
 * @see syngen.synth.fn.chain
 * @static
 */
syngen.synth.fn.chainAssign = function (synth, key, plugin) {
  this.assign(synth, key, plugin)
  this.chain(synth, plugin)
  return synth
}

/**
 * Wraps `synth` such that `plugin` stops when it stops and returns `synth`.
 * @param {syngen.synth~Synth} synth
 * @param {syngen.synth~Plugin} plugin
 * @private
 * @returns {syngen.synth~Synth}
 * @static
 */
syngen.synth.fn.chainStop = function (synth, plugin) {
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
 * Decorates prefabricated `synth` with synth methods.
 * @param {Object} [synth={}]
 * @private
 * @returns {syngen.synth~Synth}
 * @static
 */
syngen.synth.fn.decorate = (synth = {}) => {
  return Object.setPrototypeOf(synth, syngen.synth.prototype)
}

/**
 * Adds a filter with `options` to the output chain of `synth` and returns `synth`.
 * @param {syngen.synth~Synth} synth
 * @param {Object} [options={}]
 * @private
 * @returns {Object}
 * @static
 */
syngen.synth.fn.filtered = function (synth, {
  detune,
  gain,
  frequency,
  Q,
  type = 'lowpass',
  when = syngen.time(),
} = {}) {
  const filter = syngen.context().createBiquadFilter()

  filter.type = type

  syngen.synth.fn.setAudioParams(
    [filter.detune, detune, when],
    [filter.gain, gain, when],
    [filter.frequency, frequency, when],
    [filter.Q, Q, when],
  )

  return this.chainAssign(synth, 'filter', filter)
}

/**
 * Helper that sets `AudioParam`s to values.
 * Expects multiple arguments in the format `[AudioParam, value, when]`.
 * @private
 * @static
 */
syngen.synth.fn.setAudioParams = function (...params) {
  for (const [param, value, when = syngen.time()] of params) {
    if (param instanceof AudioParam) {
      if (value !== undefined) {
        param.value = value
        param.setValueAtTime(value, when)
      }
    }
  }

  return this
}

/**
 * Inserts a `WaveShaperNode` into the output chain for `synth` and returns `synth`.
 * @param {syngen.synth~Synth} synth
 * @param {Float32Array} curve
 * @private
 * @returns {Object}
 * @static
 */
syngen.synth.fn.shaped = function (synth, curve) {
  const shaper = syngen.context().createWaveShaper()
  shaper.curve = curve
  return this.chainAssign(synth, 'shaper', shaper)
}
