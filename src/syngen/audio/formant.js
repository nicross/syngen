/**
 * Provides factories that define and create circuits that model human vowel sounds.
 * @namespace
 */
syngen.audio.formant = {}

/**
 * Returns a blend of formants `a` and `b` with `mix`.
 * @param {syngen.audio.formant~Definition} a
 * @param {syngen.audio.formant~Definition} b
 * @param {Number} mix
 *   Expects a number within `[0, 1]`.
 * @static
 */
syngen.audio.formant.blend = (a, b, mix = 0) => {
  const getFrequency = (array, index) => (array[index] && array[index].frequency) || syngen.const.zero
  const getGain = (array, index) => (array[index] && array[index].gain) || syngen.const.zeroGain
  const getQ = (array, index) => (array[index] && array[index].Q) || 1

  return [...Array(Math.max(a.length, b.length))].map((_, i) => ({
    frequency: syngen.utility.lerp(getFrequency(a, i), getFrequency(b, i), mix),
    gain: syngen.utility.lerp(getGain(a, i), getGain(b, i), mix),
    Q: syngen.utility.lerp(getQ(a, i), getQ(b, i), mix),
  }))
}

/**
 * @returns {syngen.audio.synth~Plugin}
 * @static
 */
syngen.audio.formant.create = (frequencies = []) => {
  const context = syngen.audio.context()

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
 * Creates a formant effect for the vowel A.
 * @returns {syngen.audio.synth~Plugin}
 * @static
 */
syngen.audio.formant.createA = function () {
  return this.create(
    this.a()
  )
}

/**
 * Creates a formant effect for the vowel E.
 * @returns {syngen.audio.synth~Plugin}
 * @static
 */
syngen.audio.formant.createE = function () {
  return this.create(
    this.e()
  )
}

/**
 * Creates a formant effect for the vowel I.
 * @returns {syngen.audio.synth~Plugin}
 * @static
 */
syngen.audio.formant.createI = function () {
  return this.create(
    this.i()
  )
}

/**
 * Creates a formant effect for the vowel O.
 * @returns {syngen.audio.synth~Plugin}
 * @static
 */
syngen.audio.formant.createO = function () {
  return this.create(
    this.o()
  )
}

/**
 * Creates a formant effect for the vowel U.
 * @returns {syngen.audio.synth~Plugin}
 * @static
 */
syngen.audio.formant.createU = function () {
  return this.create(
    this.u()
  )
}

/**
 * Transitions formant `plugin` to `definition` over `duration` seconds.
 * Returns a promise that resolves when the transition is complete.
 * The `plugin` can either be an instance or its parameter hash.
 * @param {syngen.audio.formant~Plugin|Object} plugin
 * @param {syngen.audio.formant~Definition} [definition=[]]
 * @param {Number} [duration={@link syngen.const.zeroTime}]
 * @returns {Promise}
 * @static
 */
syngen.audio.formant.transition = function(plugin, definition = [], duration = syngen.const.zeroTime) {
  // Look for formant parameters or expect it directly
  const bank = plugin.param ? plugin.param.filter : plugin

  if (!Array.isArray(bank) || !(bank[0] && bank[0].filter)) {
    throw new Error('Invalid plugin')
  }

  bank.forEach((filter, i) => {
    if (!definition[i]) {
      syngen.audio.ramp.linear(filter.gain.gain, syngen.const.zeroGain, duration)
      return
    }

    const {frequency, gain, Q} = definition[i]

    if (typeof frequency != 'undefined') {
      syngen.audio.ramp.exponential(filter.filter.frequency, frequency, duration)
    }

    if (typeof gain != 'undefined') {
      syngen.audio.ramp.linear(filter.gain.gain, gain, duration)
    }

    if (typeof Q != 'undefined') {
      syngen.audio.ramp.exponential(filter.filter.Q, Q, duration)
    }
  })

  return syngen.utility.timing.promise(duration * 1000)
}

/**
 * Returns a formant definition for the vowel A.
 * @returns {syngen.audio.formant~Definition}
 * @static
 */
syngen.audio.formant.a = () => [
  {
    frequency: 599,
    gain: 1,
    Q: 5,
  },
  {
    frequency: 1001,
    gain: 1,
    Q: 20,
  },
  {
    frequency: 2045,
    gain: 1,
    Q: 50,
  },
  {
    frequency: 2933,
    gain: 1,
    Q: 80,
  },
]

/**
 * Returns a formant definition for the vowel E.
 * @returns {syngen.audio.formant~Definition}
 * @static
 */
syngen.audio.formant.e = () => [
  {
    frequency: 469,
    gain: 1,
    Q: 5,
  },
  {
    frequency: 2150,
    gain: 1,
    Q: 20,
  },
  {
    frequency: 2836,
    gain: 1,
    Q: 50,
  },
  {
    frequency: 3311,
    gain: 1,
    Q: 80,
  },
]

/**
 * Returns a formant definition for the vowel I.
 * @returns {syngen.audio.formant~Definition}
 * @static
 */
syngen.audio.formant.i = () => [
  {
    frequency: 274,
    gain: 1,
    Q: 5,
  },
  {
    frequency: 1704,
    gain: 1,
    Q: 20,
  },
  {
    frequency: 2719,
    gain: 1,
    Q: 50,
  },
  {
    frequency: 3404,
    gain: 1,
    Q: 80,
  },
]

/**
 * Returns a formant definition for the vowel O.
 * @returns {syngen.audio.formant~Definition}
 * @static
 */
syngen.audio.formant.o = () => [
  {
    frequency: 411,
    gain: 1,
    Q: 5,
  },
  {
    frequency: 784,
    gain: 1,
    Q: 20,
  },
  {
    frequency: 2176,
    gain: 1,
    Q: 50,
  },
  {
    frequency: 2987,
    gain: 1,
    Q: 80,
  },
]

/**
 * Returns a formant definition for the vowel U.
 * @returns {syngen.audio.formant~Definition}
 * @static
 */
syngen.audio.formant.u = () => [
  {
    frequency: 290,
    gain: 1,
    Q: 5,
  },
  {
    frequency: 685,
    gain: 1,
    Q: 20,
  },
  {
    frequency: 2190,
    gain: 1,
    Q: 50,
  },
  {
    frequency: 3154,
    gain: 1,
    Q: 80,
  },
]

/**
 * Formant definition that consists of an array of bandpass filter parameters.
 * @property {Number} frequency
 * @property {Number} gain
 * @property {Number} Q
 * @type {Object[]}
 * @typedef syngen.audio.formant~Definition
 */

/**
 * Formant effect that consists of a bank of finely tuned bandpass filters.
 * @type {syngen.audio.synth~Plugin}
 * @typedef syngen.audio.formant~Plugin
 */
