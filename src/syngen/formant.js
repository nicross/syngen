/**
 * Provides factories that define and create circuits that model human vowel sounds.
 * @namespace
 */
syngen.formant = {}

/**
 * Returns a blend of formants `a` and `b` with `mix`.
 * @param {syngen.formant~Definition} a
 * @param {syngen.formant~Definition} b
 * @param {Number} mix
 *   Expects a number within `[0, 1]`.
 * @static
 */
syngen.formant.blend = (a, b, mix = 0) => {
  const getFrequency = (array, index) => (array[index] && array[index].frequency) || syngen.const.zero
  const getGain = (array, index) => (array[index] && array[index].gain) || syngen.const.zeroGain
  const getQ = (array, index) => (array[index] && array[index].Q) || 1

  return [...Array(Math.max(a.length, b.length))].map((_, i) => ({
    frequency: syngen.fn.lerp(getFrequency(a, i), getFrequency(b, i), mix),
    gain: syngen.fn.lerp(getGain(a, i), getGain(b, i), mix),
    Q: syngen.fn.lerp(getQ(a, i), getQ(b, i), mix),
  }))
}

/**
 * @returns {syngen.synth~Plugin}
 * @static
 */
syngen.formant.create = (frequencies = []) => {
  const context = syngen.context()

  const input = context.createGain(),
    output = context.createGain()

  const filters = frequencies.map(({
    frequency = 0,
    gain = 1,
    Q = 1,
  } = {}) => {
    const filter = context.createBiquadFilter()
    filter.frequency.value = frequency
    filter.Q.value = Q
    filter.type = 'bandpass'

    const gainNode = context.createGain()
    gainNode.gain.value = gain

    input.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(output)

    return {
      filter: {
        frequency: filter.frequency,
        Q: filter.Q,
      },
      gain: gainNode,
    }
  })

  return {
    input,
    output,
    param: {
      filter: filters,
    },
  }
}

/**
 * Transitions formant `plugin` to `definition` over `duration` seconds.
 * Returns a promise that resolves when the transition is complete.
 * The `plugin` can either be an instance or its parameter hash.
 * @param {syngen.formant~Plugin|Object} plugin
 * @param {syngen.formant~Definition} [definition=[]]
 * @param {Number} [duration={@link syngen.const.zeroTime}]
 * @returns {Promise}
 * @static
 */
syngen.formant.transition = function(plugin, definition = [], duration = syngen.const.zeroTime) {
  // Look for formant parameters or expect it directly
  const bank = plugin.param ? plugin.param.filter : plugin

  if (!Array.isArray(bank) || !(bank[0] && bank[0].filter)) {
    throw new Error('Invalid plugin')
  }

  bank.forEach((filter, i) => {
    if (!definition[i]) {
      syngen.fn.rampLinear(filter.gain.gain, syngen.const.zeroGain, duration)
      return
    }

    const {frequency, gain, Q} = definition[i]

    if (typeof frequency != 'undefined') {
      syngen.fn.rampExp(filter.filter.frequency, frequency, duration)
    }

    if (typeof gain != 'undefined') {
      syngen.fn.rampLinear(filter.gain.gain, gain, duration)
    }

    if (typeof Q != 'undefined') {
      syngen.fn.rampExp(filter.filter.Q, Q, duration)
    }
  })

  return syngen.fn.promise(duration * 1000)
}

/**
 * Formant definition that consists of an array of bandpass filter parameters.
 * @property {Number} frequency
 * @property {Number} gain
 * @property {Number} Q
 * @type {Object[]}
 * @typedef syngen.formant~Definition
 */

/**
 * Formant effect that consists of a bank of finely tuned bandpass filters.
 * @type {syngen.synth~Plugin}
 * @typedef syngen.formant~Plugin
 */
