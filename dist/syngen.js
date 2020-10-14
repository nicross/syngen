/*! syngen v0.1.0 */
(() => {
'use strict'

/**
 * The global point of entry and default export for the library.
 * @namespace
 */
const syngen = (() => {
  const ready = new Promise((resolve) => {
    document.addEventListener('DOMContentLoaded', resolve)
  })

  return {
    /**
     * Exposes input across various devices.
     * @memberof syngen
     * @namespace
     */
    input: {},
    /**
     * Objects that can be positioned on the soundstage.
     * @memberof syngen
     * @namespace
     */
    prop: {},
    /**
     * Returns a promise that resolves when the document has finished loading.
     * @memberof syngen
     * @param {Function} [callback] - Called when resolved
     * @returns {Promise}
     */
    ready: (callback) => {
      return typeof callback == 'function'
        ? ready.then(callback)
        : ready
    },
  }
})()

/**
 * A collection of useful utility methods.
 * @namespace
 */
syngen.utility = {}

/**
 * Adds a musical `interval` to a `frequency`, in Hertz.
 * @param {Number} frequency
 * @param {Number} interval
 *   Each integer multiple represents an octave.
 *   For example, `2` raises the frequency by two octaves.
 *   Likewise, `-1/12` lowers by one half-step, whereas `-1/100` lowers by one cent.
 * @static
 */
syngen.utility.addInterval = (frequency, interval) => frequency * (2 ** interval)

/**
 * Returns whether `value` is between `min` and `max` (inclusive).
 * @param {Number} value
 * @param {Number} min
 * @param {Number} max
 * @returns {Boolean}
 * @static
 */
syngen.utility.between = (value, min, max) => value >= min && value <= max

/**
 * Calculates the geometric center of variadic vectors or vector-likes.
 * @param {syngen.utility.vector3d[]|syngen.utility.vector2d[]|Object[]} vectors
 * @returns {syngen.utility.vector3d}
 * @static
 */
syngen.utility.centroid = (vectors = []) => {
  // NOTE: Returns origin if empty set
  if (!vectors.length) {
    return syngen.utility.vector3d.create()
  }

  let xSum = 0,
    ySum = 0,
    zSum = 0

  for (const vector of vectors) {
    xSum += vector.x || 0
    ySum += vector.y || 0
    zSum += vector.z || 0
  }

  return syngen.utility.vector3d.create({
    x: xSum / vectors.length,
    y: ySum / vectors.length,
    z: zSum / vectors.length,
  })
}

/**
 * Returns the element of `options` at the index determined by percentage `value`.
 * @param {Array} options
 * @param {Number} [value=0]
 *   Float within `[0, 1]`.
 * @returns {*}
 * @static
 */
syngen.utility.choose = (options = [], value = 0) => {
  value = syngen.utility.clamp(value, 0, 1)

  const index = Math.round(value * (options.length - 1))
  return options[index]
}

/**
 * Splices and returns the element of `options` at the index determined by percentage `value`.
 * Beward that this mutates the passed array.
 * @param {Array} options
 * @param {Number} [value=0]
 *   Float within `[0, 1]`.
 * @returns {*}
 * @static
 */
syngen.utility.chooseSplice = (options = [], value = 0) => {
  value = syngen.utility.clamp(value, 0, 1)

  const index = Math.round(value * (options.length - 1))
  return options.splice(index, 1)[0]
}

/**
 * Returns the element of `options` at the index determined by weighted percentage `value`.
 * @param {Array} options
 *   Each element is expected to have a `weight` key which is a positive number.
 *   Higher weights are more likely to be chosen.
 *   Beware that elements are not sorted by weight before selection.
 * @param {Number} [value=0]
 *   Float within `[0, 1]`.
 * @returns {*}
 * @static
 */
syngen.utility.chooseWeighted = (options = [], value = 0) => {
  // SEE: https://medium.com/@peterkellyonline/weighted-random-selection-3ff222917eb6
  value = syngen.utility.clamp(value, 0, 1)

  const totalWeight = options.reduce((total, option) => {
    return total + (option.weight || 0)
  }, 0)

  let weight = value * totalWeight

  for (const option of options) {
    weight -= option.weight || 0

    if (weight <= 0) {
      return option
    }
  }
}

/**
 * Returns `value` clamped between `min` and `max`.
 * @param {Number} value
 * @param {Number} min
 * @param {Number} max
 * @returns {Number}
 * @static
 */
syngen.utility.clamp = (value, min, max) => {
  if (value > max) {
    return max
  }

  if (value < min) {
    return min
  }

  return value
}

/**
 * Returns whichever value, `a` or `b`, that is closer to `x`.
 * @param {Number} x
 * @param {Number} a
 * @param {Number} b
 * @returns {Number}
 * @static
 */
syngen.utility.closer = (x, a, b) => {
  return Math.abs(x - a) <= Math.abs(x - b) ? a : b
}

/**
 * Returns the closest value to `x` in the array `values`.
 * @param {Number} x
 * @param {Number[]} values
 * @returns {Number}
 * @static
 * @todo Improve performance with a version for pre-sorted arrays
 */
syngen.utility.closest = function (x, values = []) {
  return values.reduce((closest, value) => syngen.utility.closer(x, closest, value))
}

/**
 * Instantiates `octaves` Perlin noise generators of `type` with `seed` and returns a wrapper object that calculates their combined values.
 * @param {syngen.utility.perlin1d|syngen.utility.perlin2d|syngen.utility.perlin3d|syngen.utility.perlin4d} type
 *   Must be a Perlin noise utility, and not a factory method or an instance.
 * @param {*} seed
 * @param {Number} [octaves=2]
 * @returns {Object}
 * @static
 * @todo Port into individual perlin utilities for clarity
 */
syngen.utility.createPerlinWithOctaves = (type, seed, octaves = 2) => {
  const compensation = 1 / (1 - (2 ** -octaves)),
    perlins = []

  if (!Array.isArray(seed)) {
    seed = [seed]
  }

  for (let i = 0; i < octaves; i += 1) {
    perlins.push(
      type.create(...seed, 'octave', i)
    )
  }

  return {
    perlin: perlins,
    reset: function () {
      for (let perlin of this.perlin) {
        perlin.reset()
      }
      return this
    },
    value: function (...args) {
      let amplitude = 1/2,
        frequency = 1,
        sum = 0

      for (let perlin of this.perlin) {
        sum += perlin.value(...args.map((value) => value * frequency)) * amplitude
        amplitude /= 2
        frequency *= 2
      }

      sum *= compensation

      return sum
    },
  }
}

/**
 * Converts `degrees` to radians.
 * @param {Number} degrees
 * @returns {Number}
 * @static
 */
syngen.utility.degreesToRadians = (degrees) => degrees * Math.PI / 180

/**
 * Adds a musical interval to `frequency` in `cents`.
 * @param {Number} frequency
 * @param {Number} [cents=0]
 *   Every 1200 represents an octave.
 *   For example, `2400` raises the frequency by two octaves.
 *   Likewise, `-100` lowers by one half-step, whereas `-1` lowers by one cent.
 * @returns {Number}
 * @static
 */
syngen.utility.detune = (frequency, cents = 0) => frequency * (2 ** (cents / 1200))

/**
 * Calculates the distance between two vectors or vector-likes.
 * @param {syngen.utility.vector2d|syngen.utility.vector3d|Object} a
 * @param {syngen.utility.vector2d|syngen.utility.vector3d|Object} b
 * @returns {Number}
 * @static
 */
syngen.utility.distance = (a, b) => Math.sqrt(syngen.utility.distance2(a, b))

/**
 * Calculates the squared distance between two vectors or vector-likes.
 * @param {syngen.utility.vector2d|syngen.utility.vector3d|Object} a
 * @param {syngen.utility.vector2d|syngen.utility.vector3d|Object} b
 * @returns {Number}
 * @static
 */
syngen.utility.distance2 = ({
  x: x1 = 0,
  y: y1 = 0,
  z: z1 = 0,
} = {}, {
  x: x2 = 0,
  y: y2 = 0,
  z: z2 = 0,
} = {}) => ((x2 - x1) ** 2) + ((y2 - y1) ** 2) + ((z2 - z1) ** 2)

/**
 * Calculated the gain for a sound source `distance` meters away, normalized to zero decibels.
 * The distance model is determined by the values of several constants.
 * Importantly, it is a combination of inverse-squared and linear functions.
 * @param {Number} [distance=0]
 * @returns {Number}
 * @see syngen.const.distancePower
 * @see syngen.const.distancePowerHorizon
 * @see syngen.const.distancePowerHorizonExponent
 * @see syngen.streamer.getRadius
 * @static
 * @todo Move to dedicated distance models
 */
syngen.utility.distanceToPower = (distance = 0) => {
  // XXX: One is added so all distances yield sensible values
  distance = Math.max(1, distance + 1)

  const distancePower = distance ** -syngen.const.distancePower
  let horizonPower = 1

  if (syngen.const.distancePowerHorizon) {
    // XXX: One is added because of above
    const distancePowerHorizon = syngen.streamer.getRadius() + 1
    horizonPower = Math.max(0, distancePowerHorizon - distance) / distancePowerHorizon
    horizonPower **= syngen.const.distancePowerHorizonExponent
  }

  return distancePower * horizonPower
}

/**
 * Converts `frequency`, in Hertz, to its corresponding MIDI note number.
 * The returned value is not rounded.
 * @param {Number} frequency
 * @returns {Number}
 * @see syngen.const.midiReferenceFrequency
 * @see syngen.const.midiReferenceNote
 * @static
 */
syngen.utility.frequencyToMidi = (frequency) => (Math.log2(frequency / syngen.const.midiReferenceFrequency) * 12) + syngen.const.midiReferenceNote

/**
 * Converts `decibels` to its equivalent gain value.
 * @param {Number} decibels
 * @returns {Number}
 * @static
 */
syngen.utility.fromDb = (decibels) => 10 ** (decibels / 10)

/**
 * Converts `value` to an integer via the Jenkins hash function.
 * @param {String} value
 * @returns {Number}
 * @static
 */
syngen.utility.hash = (value) => {
  value = String(value)

  let hash = 0,
    i = value.length

  while (i--) {
    hash += value.charCodeAt(i)
    hash += hash << 10
    hash ^= hash >> 6
  }

  hash += (hash << 3)
  hash ^= (hash >> 11)
  hash += (hash << 15)

	return Math.abs(hash)
}

/**
 * Adds a random value to `baseValue` within the range of negative to positive `amount`.
 * @param {Number} baseValue
 * @param {Number} amount
 * @returns {Number}
 * @static
 */
syngen.utility.humanize = (baseValue = 1, amount = 0) => {
  return baseValue + syngen.utility.random.float(-amount, amount)
}

/**
 * Adds a random gain to `baseGain` within the range of negative to positive `decibels`, first converted to gain.
 * @param {Number} baseGain
 * @param {Number} decibels
 * @returns {Number}
 * @static
 */
syngen.utility.humanizeDb = (baseGain = 1, decibels = 0) => {
  const amount = syngen.utility.fromDb(decibels)
  return baseGain * syngen.utility.random.float(1 - amount, 1 + amount)
}

/**
 * Returns whether rectangular prisms `a` and `b` intersect.
 * A rectangular prism has a bottom-left vertex with coordinates `(x, y, z)` and `width`, `height`, and `depth` along those axes respectively.
 * An intersection occurs if their faces intersect, they share vertices, or one is contained within the other.
 * This function works for one- and two-dimensional shapes as well.
 * @param {Object} a
 * @param {Object} b
 * @returns {Boolean}
 * @static
 * @todo Define a rectangular prism utility or type
 */
syngen.utility.intersects = ({
  depth: depth1 = 0,
  height: height1 = 0,
  width: width1 = 0,
  x: x1 = 0,
  y: y1 = 0,
  z: z1 = 0,
} = {}, {
  depth: depth2 = 0,
  height: height2 = 0,
  width: width2 = 0,
  x: x2 = 0,
  y: y2 = 0,
  z: z2 = 0,
} = {}) => {
  const between = syngen.utility.between

  const xOverlap = between(x1, x2, x2 + width2)
    || between(x2, x1, x1 + width1)

  const yOverlap = between(y1, y2, y2 + height2)
    || between(y2, y1, y1 + height1)

  const zOverlap = between(z1, z2, z2 + depth2)
    || between(z2, z1, z1 + depth1)

  return xOverlap && yOverlap && zOverlap
}

/**
 * Linearly interpolates between `min` and `max` with `value`.
 * @param {Number} min
 * @param {Number} max
 * @param {Number} [value=0]
 *   Float within `[0, 1]`.
 * @returns {Number}
 * @static
 */
syngen.utility.lerp = (min, max, value = 0) => (min * (1 - value)) + (max * value)

/**
 * Linearly interpolates between `min` and `max` with `value` raised to `power`.
 * @param {Number} min
 * @param {Number} max
 * @param {Number} [value=0]
 *   Float within `[0, 1]`.
 * @param {Number} [power=2]
 * @returns {Number}
 * @static
 */
syngen.utility.lerpExp = (min, max, value = 0, power = 2) => {
  return syngen.utility.lerp(min, max, value ** power)
}

/**
 * Returns a random value within the range where the lower bound is the interpolated value within `[lowMin, highMin]`, the upper bound is the interpolated value within `[lowMax, highMax]`.
 * Values are interpolated with {@link syngen.utility.lerpExpRandom|lerpExpRandom}.
 * @param {Number[]} lowRange
 *   Expects `[lowMin, lowMax]`.
 * @param {Number[]} highRange
 *   Expects `[highMin, highMax]`.
 * @param {Number} [value]
 * @param {Number} [power]
 * @returns {Number}
 * @see syngen.utility.lerpExp
 * @static
 */
syngen.utility.lerpExpRandom = ([lowMin, lowMax], [highMin, highMax], value, power) => {
  return syngen.utility.random.float(
    syngen.utility.lerpExp(lowMin, highMin, value, power),
    syngen.utility.lerpExp(lowMax, highMax, value, power),
  )
}

/**
 * Linearly interpolates between `min` and `max` with `value` logarithmically with `base`.
 * @param {Number} min
 * @param {Number} max
 * @param {Number} [value=0]
 *   Float within `[0, 1]`.
 * @param {Number} [base=2]
 * @returns {Number}
 * @static
 */
syngen.utility.lerpLog = (min, max, value = 0, base = 2) => {
  value *= base - 1
  return syngen.utility.lerp(min, max, Math.log(1 + value) / Math.log(base))
}

/**
 * Linearly interpolates between `min` and `max` with `value` logarithmically with `base`.
 * This function is shorthand for `{@link syngen.utility.lerpLog|lerpLog}(min, max, 1 - value, 1 / base)` which results in curve that inversely favors larger values.
 * This is similar to but distinct from {@link syngen.utility.lerpExp|lerpExp}.
 * @param {Number} min
 * @param {Number} max
 * @param {Number} [value=0]
 *   Float within `[0, 1]`.
 * @param {Number} [base=2]
 * @returns {Number}
 * @see syngen.utility.lerpLog
 * @static
 */
syngen.utility.lerpLogi = (min, max, value, base) => {
  return syngen.utility.lerpLog(max, min, 1 - value, base)
}

/**
 * Returns a random value within the range where the lower bound is the interpolated value within `[lowMin, highMin]`, the upper bound is the interpolated value within `[lowMax, highMax]`.
 * Values are interpolated with {@link syngen.utility.lerpLogi|lerpLogi}.
 * @param {Number[]} lowRange
 *   Expects `[lowMin, lowMax]`.
 * @param {Number[]} highRange
 *   Expects `[highMin, highMax]`.
 * @param {Number} [value]
 * @param {Number} [power]
 * @returns {Number}
 * @see syngen.utility.lerpLogi
 * @static
 */
syngen.utility.lerpLogiRandom = ([lowMin, lowMax], [highMin, highMax], value) => {
  return syngen.utility.random.float(
    syngen.utility.lerpLogi(lowMin, highMin, value),
    syngen.utility.lerpLogi(lowMax, highMax, value),
  )
}

/**
 * Returns a random value within the range where the lower bound is the interpolated value within `[lowMin, highMin]`, the upper bound is the interpolated value within `[lowMax, highMax]`.
 * Values are interpolated with {@link syngen.utility.lerpLog|lerpLog}.
 * @param {Number[]} lowRange
 *   Expects `[lowMin, lowMax]`.
 * @param {Number[]} highRange
 *   Expects `[highMin, highMax]`.
 * @param {Number} [value]
 * @param {Number} [base]
 * @returns {Number}
 * @see syngen.utility.lerpLog
 * @static
 */
syngen.utility.lerpLogRandom = ([lowMin, lowMax], [highMin, highMax], value, base) => {
  return syngen.utility.random.float(
    syngen.utility.lerpLog(lowMin, highMin, value, base),
    syngen.utility.lerpLog(lowMax, highMax, value, base),
  )
}

/**
 * Returns a random value within the range where the lower bound is the interpolated value within `[lowMin, highMin]`, the upper bound is the interpolated value within `[lowMax, highMax]`.
 * Values are interpolated with {@link syngen.utility.lerp|lerp}.
 * @param {Number[]} lowRange
 *   Expects `[lowMin, lowMax]`.
 * @param {Number[]} highRange
 *   Expects `[highMin, highMax]`.
 * @param {Number} [value]
 * @param {Number} [base]
 * @returns {Number}
 * @see syngen.utility.lerp
 * @static
 */
syngen.utility.lerpRandom = ([lowMin, lowMax], [highMin, highMax], value) => {
  return syngen.utility.random.float(
    syngen.utility.lerp(lowMin, highMin, value),
    syngen.utility.lerp(lowMax, highMax, value),
  )
}

/**
 * Converts a MIDI `note` number to its frequency, in Hertz.
 * @param {Number} note
 * @returns {Number}
 * @see syngen.const.midiReferenceFrequency
 * @see syngen.const.midiReferenceNote
 * @static
 */
syngen.utility.midiToFrequency = (note) => {
  return syngen.const.midiReferenceFrequency * Math.pow(2, (note - syngen.const.midiReferenceNote) / 12)
}

/**
 * Normalizes `angle` within therange of `[0, 2π]`.
 * @param {Number} angle
 * @returns {Number}
 * @static
 */
syngen.utility.normalizeAngle = (angle = 0) => {
  const tau = Math.PI * 2

  if (angle > tau) {
    angle %= tau
  } else if (angle < 0) {
    angle %= tau
    angle += tau
  }

  return angle
}

/**
 * Normalizes `angle` within the range of `[-π, +π]`.
 * @param {Number} angle
 * @returns {Number}
 * @static
 */
syngen.utility.normalizeAngleSigned = (angle) => {
  const tau = 2 * Math.PI

  angle %= tau

  if (angle > Math.PI) {
    angle -= tau
  }

  if (angle < -Math.PI) {
    angle += tau
  }

  return angle
}

/**
 * Calculates the real solutions to the quadratic equation with coefficients `a`, `b`, and `c`.
 * @param {Number} a
 * @param {Number} b
 * @param {Number} c
 * @returns {Number[]}
 *   Typically there are two real solutions; however, implementations must check for imaginary solutions with {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/isNaN|isNaN}.
 * @static
 */
syngen.utility.quadratic = (a, b, c) => {
  return [
    (-1 * b + Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a),
    (-1 * b - Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a),
  ]
}

/**
 * Converts `radians` to degrees.
 * @param {Number} radians
 * @returns {Number}
 * @static
 */
syngen.utility.radiansToDegrees = (radians) => radians * 180 / Math.PI

/**
 * Calculates the interior angle of a regular polygon with `sides`.
 * @param {Number} sides
 * @returns {Number}
 * @static
 */
syngen.utility.regularPolygonInteriorAngle = (sides) => (sides - 2) * Math.PI / sides

/**
 * Rounds `value` to `precision` places.
 * Beward that `precision` is an inverse power of ten.
 * For example, `3` rounds to the nearest thousandth, whereas `-3` rounds to the nearest thousand.
 * @param {Number} value
 * @param {Number} precision
 * @returns {Number}
 * @static
 */
syngen.utility.round = (value, precision = 0) => {
  precision = 10 ** precision
  return Math.round(value * precision) / precision
}

/**
 * Scales `value` within the range `[min, max]` to an equivalent value between `[a, b]`.
 * @param {Number} value
 * @param {Number} min
 * @param {Number} max
 * @param {Number} a
 * @param {Number} b
 * @returns {Number}
 * @static
 */
syngen.utility.scale = (value, min, max, a, b) => ((b - a) * (value - min) / (max - min)) + a

/**
 * Returns a shuffled shallow copy of `array` using `random` algorithm.
 * For example, implementations could leverage {@link syngen.utility.srand|srand()} to produce the same results each time given the same seed value.
 * @param {Array} array
 * @param {Function} [random=Math.random]
 * @static
 */
syngen.utility.shuffle = (array, random = Math.random) => {
  array = [].slice.call(array)

  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }

  return array
}

/**
 * Returns the sign of `value` as positive or negative `1`.
 * @param {Number} value
 * @returns {Number}
 * @static
 */
syngen.utility.sign = (value) => value >= 0 ? 1 : -1

/**
 * Returns a pseudo-random, linear congruential, seeded random number generator with variadic `seeds`.
 * Seeds are prepended with the global {@link syngen.seed} and concatenated with {@link syngen.const.seedSeparator}.
 * @param {...String} [...seeds]
 * @returns {syngen.utility.srandGenerator}
 * @static
 */
syngen.utility.srand = (...seeds) => {
  const increment = 1,
    modulus = 34359738337,
    multiplier = 185852,
    rotate = (seed) => ((seed * multiplier) + increment) % modulus

  let seed = syngen.utility.hash(
    [
      syngen.seed.get(),
      ...seeds,
    ].join(syngen.const.seedSeparator)
  )

  seed = rotate(seed)

  /**
   * A pseudo-random, linear congruential, seeded random number generator that returns a value within `[min, max]`.
   * @param {Number} [min=0]
   * @param {Number} [max=1]
   * @returns {Number}
   * @type {Function}
   * @typedef syngen.utility.srandGenerator
   */
  const generator = (min = 0, max = 1) => {
    seed = rotate(seed)
    return min + ((seed / modulus) * (max - min))
  }

  return generator
}

/**
 * Calculates the musical interval between two frequencies, in cents.
 * @param {Number} a
 * @param {Number} b
 * @returns {Number}
 * @static
 */
syngen.utility.toCents = (a, b) => (b - a) / a * 1200

/**
 * Converts `gain` to its equivalent decibel value.
 * @param {Number} gain
 * @returns {Number}
 * @static
 */
syngen.utility.toDb = (gain) => 10 * Math.log10(gain)

/**
 * Scales `frequency` by integer multiples so it's an audible frequency within the sub-bass range.
 * @param {Number} frequency
 * @param {Number} [subFrequency={@link syngen.const.subFrequency}]
 * @param {Number} [minFrequency={@link syngen.const.minFrequency}]
 * @returns {Number}
 * @static
 */
syngen.utility.toSubFrequency = (frequency, subFrequency = syngen.const.subFrequency, minFrequency = syngen.const.minFrequency) => {
  while (frequency > subFrequency) {
    frequency /= 2
  }

  while (frequency < minFrequency) {
    frequency *= 2
  }

  return frequency
}

/**
 * Generates a universally unique identifier.
 * @returns {String}
 * @static
 */
syngen.utility.uuid = () => {
  // SEE: https://stackoverflow.com/a/2117523
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}

/**
 * Wraps `value` around the range `[min, max)` with modular arithmetic.
 * Beware that `min` is congruent to `max`, so returned values will approach the limit of `max` before wrapping back to `min`.
 * A way to visualize this operation is that the range repeats along the number line.
 * @param {Number} value
 * @param {Number} [min=0]
 * @param {Number} [max=1]
 * @returns {Number}
 * @static
 */
syngen.utility.wrap = (value, min = 0, max = 1) => {
  const range = max - min

  if (value >= max) {
    return min + ((value - min) % range)
  }

  if (value < min) {
    return min + ((value + max) % range)
  }

  return value
}

/**
 * Maps `value` to an alternating oscillation of the range `[min, max]`.
 * A way to visualize this operation is that the range repeats alternately along the number line, such that `min` goes to `max` back to `min`.
 * @param {Number} value
 * @param {Number} [min=0]
 * @param {Number} [max=1]
 * @returns {Number}
 * @static
 */
syngen.utility.wrapAlternate = (value, min = 0, max = 1) => {
  const range = max - min
  const period = range * 2

  if (value > max) {
    value -= min

    if (value % period < range) {
      return min + (value % range)
    }

    return max - (value % range)
  }

  if (value < min) {
    if (Math.abs(value % period) < range) {
      return max - range + Math.abs(value % range)
    }

    return min + range - Math.abs(value % range)
  }

  return value
}

/**
 * @interface
 */
syngen.utility.bitree = {}

/**
 * @static
 */
syngen.utility.bitree.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

/**
 * @static
 */
syngen.utility.bitree.from = function (items = [], options = {}) {
  const tree = this.create(options)

  for (const item of items) {
    tree.insert(item)
  }

  return tree
}

syngen.utility.bitree.prototype = {
  /**
   * @instance
   */
  clear: function () {
    this.items.length = 0
    this.nodes.length = 0
    return this
  },
  /**
   * @instance
   */
  construct: function ({
    dimension = 'x',
    maxItems = 12,
    value = -syngen.const.maxSafeFloat,
    width = syngen.const.maxSafeFloat * 2,
  } = {}) {
    this.dimension = dimension
    this.items = []
    this.maxItems = maxItems
    this.nodes = []
    this.value = value
    this.width = width

    return this
  },
  /**
   * @instance
   */
  destroy: function () {
    return this.clear()
  },
  /**
   * @instance
   */
  find: function (query, radius = Infinity) {
    // XXX: Assumes query[this.dimension] exists

    if (isFinite(radius) && !this.intersects(query[this.dimension] - radius, radius * 2)) {
      return
    }

    const distance = (item) => Math.abs(item[this.dimension] - query[this.dimension]),
      index = this.getIndex(query)

    if (index == -1) {
      let minDistance = radius,
        result

      for (const item of this.items) {
        if (item === query) {
          continue
        }

        const d = distance(item)

        if (d < minDistance) {
          minDistance = d
          result = item
        }
      }

      return result
    }

    let result = this.nodes[index].find(query, radius)
    let minDistance = result ? distance(result) : Infinity

    for (const node of this.nodes) {
      if (node === this.nodes[index]) {
        continue
      }

      const item = node.find(query, minDistance)

      if (!item) {
        continue
      }

      const d = distance(item)

      if (d < minDistance) {
        minDistance = d
        result = item
      }
    }

    return result
  },
  /**
   * @instance
   */
  getIndex: function (item) {
    if (!this.nodes.length) {
      return -1
    }

    const middle = this.value + (this.width / 2)

    if (item[this.dimension] <= middle) {
      return 0
    }

    return 1
  },
  /**
   * @instance
   */
  insert: function (item = {}) {
    // XXX: Assumes item[this.dimension] exists

    const index = this.getIndex(item)

    if (index != -1) {
      this.nodes[index].insert(item)
      return this
    }

    this.items.push(item)

    // TODO: Max depth constant to prevent call stack size exceeded
    if (this.items.length > this.maxItems) {
      this.split()
    }

    return this
  },
  /**
   * @instance
   */
  intersects: function (value, width) {
    return syngen.utility.between(this.value, value, value + width)
      || syngen.utility.between(value, this.value, this.value + this.width)
  },
  /**
   * @instance
   */
  retrieve: function (value, width) {
    const items = []

    if (!this.intersects(value, width)) {
      return items
    }

    for (const item of this.items) {
      if (item[this.dimension] >= value && item[this.dimension] <= value + width) {
        items.push(item)
      }
    }

    for (const node of this.nodes) {
      items.push(
        ...node.retrieve(value, width)
      )
    }

    return items
  },
  /**
   * @instance
   */
  split: function () {
    if (this.nodes.length) {
      return this
    }

    const width = this.width / 2

    this.nodes[0] = syngen.utility.bitree.create({
      dimension: this.dimension,
      maxItems: this.maxItems,
      value: this.value,
      width,
    })

    this.nodes[1] = syngen.utility.bitree.create({
      dimension: this.dimension,
      maxItems: this.maxItems,
      value: this.value + width,
      width,
    })

    for (const item of this.items) {
      const index = this.getIndex(item)
      this.nodes[index].insert(item)
    }

    this.items.length = 0

    return this
  },
}

/**
 * @interface
 * @property {Number} pitch
 * @property {Number} roll
 * @property {Number} yaw
 */
syngen.utility.euler = {}

/**
 * @static
 */
syngen.utility.euler.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

/**
 * @static
 */
syngen.utility.euler.fromQuaternion = function ({
  w = 0,
  x = 0,
  y = 0,
  z = 0,
} = {}, sequence = syngen.const.eulerToQuaternion) {
  // SEE: http://bediyap.com/programming/convert-quaternion-to-euler-rotations/
  const w2 = w ** 2,
    wx = w * x,
    wy = w * y,
    wz = w * z,
    x2 = x ** 2,
    xy = x * y,
    xz = x * z,
    y2 = y ** 2,
    yz = y * z,
    z2 = z ** 2

  switch (sequence) {
    case 'XYZ':
      return this.create({
        pitch: Math.asin(2 * (xz + wy)),
        roll: Math.atan2(-2 * (yz - wx), w2 - x2 - y2 + z2),
        yaw: Math.atan2(-2 * (xy - wz), w2 + x2 - y2 - z2),
      })
    case 'XZY':
      return this.create({
        pitch: Math.atan2(2 * (xz + wy), w2 + x2 - y2 - z2),
        roll: Math.atan2(2 * (yz + wx), w2 - x2 + y2 - z2),
        yaw: Math.asin(-2 * (xy - wz)),
      })
    case 'YXZ':
      return this.create({
        pitch: Math.atan2(2 * (xz + wy), w2 - x2 - y2 + z2),
        roll: Math.asin(-2 * (yz - wx)),
        yaw: Math.atan2(2 * (xy + wz), w2 - x2 + y2 - z2),
      })
    case 'YZX':
      return this.create({
        pitch: Math.atan2(-2 * (xz - wy), w2 + x2 - y2 - z2),
        roll: Math.atan2(-2 * (yz - wx), w2 - x2 + y2 - z2),
        yaw: Math.asin(2 * (xy + wz)),
      })
    case 'ZXY':
      return this.create({
        pitch: Math.atan2(-2 * (xz - wy), w2 - x2 - y2 + z2),
        roll: Math.asin(2 * (yz + wx)),
        yaw: Math.atan2(-2 * (xy - wz), w2 - x2 + y2 - z2),
      })
    case 'ZYX':
      return this.create({
        pitch: Math.asin(-2 * (xz - wy)),
        roll: Math.atan2(2 * (yz + wx), w2 - x2 - y2 + z2),
        yaw: Math.atan2(2 * (xy + wz), w2 + x2 - y2 - z2),
      })
  }
}

syngen.utility.euler.prototype = {
  /**
   * @instance
   */
  clone: function () {
    return syngen.utility.euler.create(this)
  },
  /**
   * @instance
   */
  construct: function ({
    pitch = 0,
    roll = 0,
    yaw = 0,
  } = {}) {
    this.pitch = pitch
    this.roll = roll
    this.yaw = yaw
    return this
  },
  /**
   * @instance
   */
  forward: function () {
    return syngen.utility.vector3d.unitX().rotateEuler(this)
  },
  /**
   * @instance
   */
  isZero: function () {
    return !this.pitch && !this.roll && !this.yaw
  },
  /**
   * @instance
   */
  right: function () {
    return syngen.utility.vector3d.unitY().rotateEuler(this)
  },
  /**
   * @instance
   */
  scale: function (scalar = 0) {
    return syngen.utility.euler.create({
      pitch: this.pitch * scalar,
      roll: this.roll * scalar,
      yaw: this.yaw * scalar,
    })
  },
  /**
   * @instance
   */
  set: function ({
    pitch = 0,
    roll = 0,
    yaw = 0,
  } = {}) {
    this.pitch = pitch
    this.roll = roll
    this.yaw = yaw
    return this
  },
  /**
   * @instance
   */
  up: function () {
    return syngen.utility.vector3d.unitZ().rotateEuler(this)
  },
}

/**
 * @interface
 */
syngen.utility.machine = {}

/**
 * @static
 */
syngen.utility.machine.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.utility.machine.prototype = {
  /**
   * @instance
   */
  change: function (state, data = {}) {
    if (this.is(state)) {
      return this
    }

    const exitPayload = {
      currentState: this.state,
      nextState: state,
      ...data,
    }

    this.pubsub.emit('exit', exitPayload)
    this.pubsub.emit(`exit-${this.state}`, exitPayload)

    const previousState = this.state
    this.state = state

    const enterPayload = {
      currentState: state,
      previousState,
      ...data,
    }

    this.pubsub.emit('enter', enterPayload)
    this.pubsub.emit(`enter-${this.state}`, enterPayload)

    return this
  },
  /**
   * @instance
   */
  construct: function ({state = 'none', transition = {}} = {}) {
    this.state = state
    this.transition = {...transition}

    syngen.utility.pubsub.decorate(this)

    return this
  },
  /**
   * @instance
   */
  destroy: function () {
    this.pubsub.destroy()
    return this
  },
  /**
   * @instance
   */
  dispatch: function (event, data = {}) {
    const actions = this.transition[this.state]

    if (!actions) {
      return this
    }

    const action = actions[event]

    if (action) {
      const state = this.state

      const beforePayload = {
        event,
        state,
        ...data,
      }

      this.pubsub.emit('before', beforePayload)
      this.pubsub.emit(`before-${event}`, beforePayload)
      this.pubsub.emit(`before-${state}-${event}`, beforePayload)

      action.call(this, data)

      const afterPayload = {
        currentState: this.state,
        event,
        previousState: state,
        ...data,
      }

      this.pubsub.emit('after', afterPayload)
      this.pubsub.emit(`after-${event}`, afterPayload)
      this.pubsub.emit(`after-${state}-${event}`, afterPayload)
    }

    return this
  },
  /**
   * @instance
   */
  getState: function () {
    return this.state
  },
  /**
   * @instance
   */
  is: function (state) {
    return this.state == state
  },
}

/**
 * @interface
 */
syngen.utility.octree = {}

/**
 * @static
 */
syngen.utility.octree.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

/**
 * @static
 */
syngen.utility.octree.from = function (items = [], options = {}) {
  const tree = this.create(options)

  for (const item of items) {
    tree.insert(item)
  }

  return tree
}

syngen.utility.octree.prototype = {
  /**
   * @instance
   */
  clear: function () {
    this.items.length = 0
    this.nodes.length = 0
    return this
  },
  /**
   * @instance
   */
  construct: function ({
    depth = syngen.const.maxSafeFloat * 2,
    height = syngen.const.maxSafeFloat * 2,
    maxItems = 12,
    width = syngen.const.maxSafeFloat * 2,
    x = -syngen.const.maxSafeFloat,
    y = -syngen.const.maxSafeFloat,
    z = -syngen.const.maxSafeFloat,
  } = {}) {
    this.depth = depth
    this.height = height
    this.items = []
    this.maxItems = maxItems
    this.nodes = []
    this.width = width
    this.x = x
    this.y = y
    this.z = z

    return this
  },
  /**
   * @instance
   */
  destroy: function () {
    return this.clear()
  },
  /**
   * @instance
   */
  find: function (query = {}, radius = Infinity) {
    // NOTE: Assumes query.x, query.y, and query.z exist

    if (
         isFinite(radius)
      && !this.intersects({
          depth: radius * 2,
          height: radius * 2,
          width: radius * 2,
          x: query.x - radius,
          y: query.y - radius,
          z: query.z - radius,
        })
    ) {
      return
    }

    const distance = ({x, y, z}) => ((x - query.x) ** 2) + ((y - query.y) ** 2) + ((z - query.z) ** 2),
      index = this.getIndex(query),
      radius3 = ((radius * (Math.sqrt(3) / 3)) ** 2) * 3

    if (index == -1) {
      let minDistance = radius3,
        result

      for (const item of this.items) {
        if (item === query) {
          continue
        }

        const d = distance(item)

        if (d < minDistance) {
          minDistance = d
          result = item
        }
      }

      return result
    }

    let result = this.nodes[index].find(query, radius)
    let minDistance = result ? distance(result) : radius3

    for (const node of this.nodes) {
      if (node === this.nodes[index]) {
        continue
      }

      const item = node.find(query, minDistance)

      if (!item || item === query) {
        continue
      }

      const d = distance(item)

      if (d < minDistance) {
        minDistance = d
        result = item
      }
    }

    return result
  },
  /**
   * @instance
   */
  getIndex: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    if (!this.nodes.length) {
      return -1
    }

    const midX = this.x + (this.width / 2),
      midY = this.y + (this.height / 2),
      midZ = this.z + (this.depth / 2)

    const underMidX = x <= midX,
      underMidY = y <= midY

    if (z <= midZ) {
      if (underMidX && underMidY) {
        return 0
      }

      if (!underMidX && underMidY) {
        return 1
      }

      if (underMidX && !underMidY) {
        return 2
      }

      return 3
    }

    if (underMidX && underMidY) {
      return 4
    }

    if (!underMidX && underMidY) {
      return 5
    }

    if (underMidX && !underMidY) {
      return 6
    }

    return 7
  },
  /**
   * @instance
   */
  insert: function (item = {}) {
    // XXX: Assumes item.x and item.y exist

    const index = this.getIndex(item)

    if (index != -1) {
      this.nodes[index].insert(item)
      return this
    }

    this.items.push(item)

    // TODO: Max depth constant to prevent call stack size exceeded
    if (this.items.length > this.maxItems) {
      this.split()
    }

    return this
  },
  /**
   * @instance
   */
  intersects: function (prism) {
    return syngen.utility.intersects(this, prism)
  },
  /**
   * @instance
   */
  retrieve: function ({
    depth = 0,
    height = 0,
    width = 0,
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    const items = []

    if (!this.intersects({depth, height, width, x, y, z})) {
      return items
    }

    for (const item of this.items) {
      if (
           item.x >= x
        && item.x <= x + width
        && item.y >= y
        && item.y <= y + height
        && item.z >= z
        && item.z <= z + depth
      ) {
        items.push(item)
      }
    }

    for (const node of this.nodes) {
      items.push(
        ...node.retrieve({
          depth,
          height,
          width,
          x,
          y,
          z,
        })
      )
    }

    return items
  },
  /**
   * @instance
   */
  remove: function (item) {
    if (this.nodes.length) {
      const index = this.getIndex(item)
      this.nodes[index].remove(item)
      return this
    }

    const index = this.items.indexOf(item)

    if (index != -1) {
      this.items.splice(index, 1)
    }

    return this
  },
  /**
   * @instance
   */
  split: function () {
    if (this.nodes.length) {
      return this
    }

    const depth = this.depth / 2,
      height = this.height / 2,
      width = this.width / 2

    this.nodes[0] = syngen.utility.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x,
      y: this.y,
      z: this.z,
    })

    this.nodes[1] = syngen.utility.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x + width,
      y: this.y,
      z: this.z,
    })

    this.nodes[2] = syngen.utility.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x,
      y: this.y + height,
      z: this.z,
    })

    this.nodes[3] = syngen.utility.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x + width,
      y: this.y + height,
      z: this.z,
    })

    this.nodes[4] = syngen.utility.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x,
      y: this.y,
      z: this.z + depth,
    })

    this.nodes[5] = syngen.utility.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x + width,
      y: this.y,
      z: this.z + depth,
    })

    this.nodes[6] = syngen.utility.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x,
      y: this.y + height,
      z: this.z + depth,
    })

    this.nodes[7] = syngen.utility.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x + width,
      y: this.y + height,
      z: this.z + depth,
    })

    for (const item of this.items) {
      const index = this.getIndex(item)
      this.nodes[index].insert(item)
    }

    this.items.length = 0

    return this
  },
}

/**
 * @interface
 * @property {Number} pruneThreshold=10**4
 */
syngen.utility.perlin1d = {}

/**
 * @static
 */
syngen.utility.perlin1d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.utility.perlin1d.prototype = {
  /**
   * @instance
   */
  construct: function (...seeds) {
    this.gradient = new Map()
    this.seed = seeds.join(syngen.const.seedSeparator)
    return this
  },
  /**
   * @instance
   */
  generateGradient: function (x) {
    const srand = syngen.utility.srand('perlin', this.seed, x)
    this.gradient.set(x, srand(0, 1))
    return this
  },
  /**
   * @instance
   */
  getGradient: function (x) {
    if (!this.hasGradient(x)) {
      this.generateGradient(x)
      this.requestPrune()
    }

    return this.gradient.get(x)
  },
  /**
   * @instance
   */
  hasGradient: function (x) {
    return this.gradient.has(x)
  },
  /**
   * @instance
   */
  prune: function () {
    if (this.gradient.size >= this.pruneThreshold) {
      this.gradient.clear()
    }

    return this
  },
  pruneThreshold: 10 ** 4,
  /**
   * @instance
   */
  requestPrune: function () {
    if (this.pruneRequest) {
      return this
    }

    this.pruneRequest = requestIdleCallback(() => {
      this.prune()
      delete this.pruneRequest
    })

    return this
  },
  /**
   * @instance
   */
  reset: function () {
    if (this.pruneRequest) {
      cancelIdleCallback(this.pruneRequest)
    }

    this.gradient.clear()

    return this
  },
  /**
   * @instance
   */
  value: function (x) {
    const x0 = Math.floor(x),
      x1 = x0 + 1

    const dx = x - x0,
      v0 = this.getGradient(x0),
      v1 = this.getGradient(x1)

    return syngen.utility.lerp(v0, v1, dx)
  },
}

/**
 * @interface
 * @property {Number} pruneThreshold=10**3
 * @property {Number} range=Math.sqrt(2/4)
 */
syngen.utility.perlin2d = {}

/**
 * @static
 */
syngen.utility.perlin2d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

// SEE: https://en.wikipedia.org/wiki/Perlin_noise
// SEE: https://gamedev.stackexchange.com/questions/23625/how-do-you-generate-tileable-perlin-noise
// SEE: https://github.com/josephg/noisejs
syngen.utility.perlin2d.prototype = {
  /**
   * @instance
   */
  construct: function (...seeds) {
    this.gradient = new Map()
    this.seed = seeds.join(syngen.const.seedSeparator)
    return this
  },
  /**
   * @instance
   */
  generateGradient: function (x, y) {
    const srand = syngen.utility.srand('perlin', this.seed, x, y)

    if (!this.gradient.has(x)) {
      this.gradient.set(x, new Map())
    }

    this.gradient.get(x).set(y, [
      srand(-1, 1),
      srand(-1, 1),
    ])

    return this
  },
  /**
   * @instance
   */
  getDotProduct: function (xi, yi, x, y) {
    const dx = x - xi,
      dy = y - yi

    return (dx * this.getGradient(xi, yi, 0)) + (dy * this.getGradient(xi, yi, 1))
  },
  /**
   * @instance
   */
  getGradient: function (x, y, i) {
    if (!this.hasGradient(x, y)) {
      this.generateGradient(x, y)
    }

    return this.gradient.get(x).get(y)[i]
  },
  /**
   * @instance
   */
  hasGradient: function (x, y) {
    const xMap = this.gradient.get(x)

    if (!xMap) {
      return false
    }

    return xMap.has(y)
  },
  /**
   * @instance
   */
  prune: function () {
    this.gradient.forEach((xMap, x) => {
      if (xMap.size >= this.pruneThreshold) {
        return this.gradient.delete(x)
      }

      xMap.forEach((yMap, y) => {
        if (yMap.size >= this.pruneThreshold) {
          return xMap.delete(y)
        }
      })
    })

    return this
  },
  pruneThreshold: 10 ** 3,
  /**
   * @instance
   */
  requestPrune: function () {
    if (this.pruneRequest) {
      return this
    }

    this.pruneRequest = requestIdleCallback(() => {
      this.prune()
      delete this.pruneRequest
    })

    return this
  },
  range: Math.sqrt(2/4),
  reset: function () {
    if (this.pruneRequest) {
      cancelIdleCallback(this.pruneRequest)
    }

    this.gradient.clear()

    return this
  },
  smooth: function (value) {
    // 6x^5 - 15x^4 + 10x^3
    return (value ** 3) * (value * ((value * 6) - 15) + 10)
  },
  value: function (x, y) {
    const x0 = Math.floor(x),
      x1 = x0 + 1,
      y0 = Math.floor(y),
      y1 = y0 + 1

    const dx = this.smooth(x - x0),
      dy = this.smooth(y - y0)

    const value = syngen.utility.lerp(
      syngen.utility.lerp(
        this.getDotProduct(x0, y0, x, y),
        this.getDotProduct(x1, y0, x, y),
        dx
      ),
      syngen.utility.lerp(
        this.getDotProduct(x0, y1, x, y),
        this.getDotProduct(x1, y1, x, y),
        dx
      ),
      dy
    )

    this.requestPrune()

    return syngen.utility.scale(value, -this.range, this.range, 0, 1)
  },
}

/**
 * @interface
 * @property {Number} pruneThreshold=10**2
 * @property {Number} range=Math.sqrt(3/4)
 */
syngen.utility.perlin3d = {}

/**
 * @static
 */
syngen.utility.perlin3d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

// SEE: https://en.wikipedia.org/wiki/Perlin_noise
// SEE: https://www.scratchapixel.com/lessons/procedural-generation-virtual-worlds/perlin-noise-part-2
syngen.utility.perlin3d.prototype = {
  /**
   * @instance
   */
  construct: function (...seeds) {
    this.gradient = new Map()
    this.seed = seeds.join(syngen.const.seedSeparator)
    return this
  },
  /**
   * @instance
   */
  generateGradient: function (x, y, z) {
    const srand = syngen.utility.srand('perlin', this.seed, x, y, z)

    if (!this.gradient.has(x)) {
      this.gradient.set(x, new Map())
    }

    const xMap = this.gradient.get(x)

    if (!xMap.has(y)) {
      xMap.set(y, new Map())
    }

    xMap.get(y).set(z, [
      srand(-1, 1),
      srand(-1, 1),
      srand(-1, 1),
    ])

    return this
  },
  /**
   * @instance
   */
  getDotProduct: function (xi, yi, zi, x, y, z) {
    const dx = x - xi,
      dy = y - yi,
      dz = z - zi

    return (dx * this.getGradient(xi, yi, zi, 0)) + (dy * this.getGradient(xi, yi, zi, 1)) + (dz * this.getGradient(xi, yi, zi, 2))
  },
  /**
   * @instance
   */
  getGradient: function (x, y, z, i) {
    if (!this.hasGradient(x, y, z)) {
      this.generateGradient(x, y, z)
      this.requestPrune(x, y, z)
    }

    return this.gradient.get(x).get(y).get(z)[i]
  },
  /**
   * @instance
   */
  hasGradient: function (x, y, z) {
    const xMap = this.gradient.get(x)

    if (!xMap) {
      return false
    }

    const yMap = xMap.get(y)

    if (!yMap) {
      return false
    }

    return yMap.has(z)
  },
  /**
   * @instance
   */
  prune: function () {
    this.gradient.forEach((xMap, x) => {
      if (xMap.size >= this.pruneThreshold) {
        return this.gradient.delete(x)
      }

      xMap.forEach((yMap, y) => {
        if (yMap.size >= this.pruneThreshold) {
          return xMap.delete(y)
        }

        yMap.forEach((zMap, z) => {
          if (zMap.size >= this.pruneThreshold) {
            return yMap.delete(z)
          }
        })
      })
    })

    return this
  },
  pruneThreshold: 10 ** 2,
  /**
   * @instance
   */
  requestPrune: function () {
    if (this.pruneRequest) {
      return this
    }

    this.pruneRequest = requestIdleCallback(() => {
      this.prune()
      delete this.pruneRequest
    })

    return this
  },
  range: Math.sqrt(3/4),
  /**
   * @instance
   */
  reset: function () {
    if (this.pruneRequest) {
      cancelIdleCallback(this.pruneRequest)
    }

    this.gradient.clear()

    return this
  },
  /**
   * @instance
   */
  smooth: function (value) {
    // 6x^5 - 15x^4 + 10x^3
    return (value ** 3) * (value * ((value * 6) - 15) + 10)
  },
  /**
   * @instance
   */
  value: function (x, y, z) {
    const x0 = Math.floor(x),
      x1 = x0 + 1,
      y0 = Math.floor(y),
      y1 = y0 + 1,
      z0 = Math.floor(z),
      z1 = z0 + 1

    const dx = this.smooth(x - x0),
      dy = this.smooth(y - y0),
      dz = this.smooth(z - z0)

    const value = syngen.utility.lerp(
      syngen.utility.lerp(
        syngen.utility.lerp(
          this.getDotProduct(x0, y0, z0, x, y, z),
          this.getDotProduct(x1, y0, z0, x, y, z),
          dx
        ),
        syngen.utility.lerp(
          this.getDotProduct(x0, y1, z0, x, y, z),
          this.getDotProduct(x1, y1, z0, x, y, z),
          dx
        ),
        dy
      ),
      syngen.utility.lerp(
        syngen.utility.lerp(
          this.getDotProduct(x0, y0, z1, x, y, z),
          this.getDotProduct(x1, y0, z1, x, y, z),
          dx
        ),
        syngen.utility.lerp(
          this.getDotProduct(x0, y1, z1, x, y, z),
          this.getDotProduct(x1, y1, z1, x, y, z),
          dx
        ),
        dy
      ),
      dz
    )

    return syngen.utility.scale(value, -this.range, this.range, 0, 1)
  },
}

/**
 * @interface
 * @property {Number} pruneThreshold=10**2
 * @property {Number} range=Math.sqrt(4/4)
 */
syngen.utility.perlin4d = {}

/**
 * @static
 */
syngen.utility.perlin4d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.utility.perlin4d.prototype = {
  /**
   * @instance
   */
  construct: function (...seeds) {
    this.gradient = new Map()
    this.seed = seeds.join(syngen.const.seedSeparator)
    return this
  },
  /**
   * @instance
   */
  generateGradient: function (x, y, z, t) {
    const srand = syngen.utility.srand('perlin', this.seed, x, y, z, t)

    if (!this.gradient.has(x)) {
      this.gradient.set(x, new Map())
    }

    const xMap = this.gradient.get(x)

    if (!xMap.has(y)) {
      xMap.set(y, new Map())
    }

    const yMap = xMap.get(y)

    if (!yMap.has(z)) {
      yMap.set(z, new Map())
    }

    yMap.get(z).set(t, [
      srand(-1, 1),
      srand(-1, 1),
      srand(-1, 1),
      srand(-1, 1),
    ])

    return this
  },
  /**
   * @instance
   */
  getDotProduct: function (xi, yi, zi, ti, x, y, z, t) {
    const dt = t - ti,
      dx = x - xi,
      dy = y - yi,
      dz = z - zi

    return (dt * this.getGradient(xi, yi, zi, ti, 3)) + (dx * this.getGradient(xi, yi, zi, ti, 0)) + (dy * this.getGradient(xi, yi, zi, ti, 1)) + (dz * this.getGradient(xi, yi, zi, ti, 2))
  },
  /**
   * @instance
   */
  getGradient: function (x, y, z, t, i) {
    if (!this.hasGradient(x, y, z, t)) {
      this.generateGradient(x, y, z, t)
      this.requestPrune(x, y, z, t)
    }

    return this.gradient.get(x).get(y).get(z).get(t)[i]
  },
  /**
   * @instance
   */
  hasGradient: function (x, y, z, t) {
    const xMap = this.gradient.get(x)

    if (!xMap) {
      return false
    }

    const yMap = xMap.get(y)

    if (!yMap) {
      return false
    }

    const zMap = yMap.get(z)

    if (!zMap) {
      return false
    }

    return zMap.has(t)
  },
  /**
   * @instance
   */
  prune: function () {
    this.gradient.forEach((xMap, x) => {
      if (xMap.size >= this.pruneThreshold) {
        return this.gradient.delete(x)
      }

      xMap.forEach((yMap, y) => {
        if (yMap.size >= this.pruneThreshold) {
          return xMap.delete(y)
        }

        yMap.forEach((zMap, z) => {
          if (zMap.size >= this.pruneThreshold) {
            return yMap.delete(z)
          }

          zMap.forEach((tMap, t) => {
            if (tMap.size >= this.pruneThreshold) {
              return zMap.delete(t)
            }
          })
        })
      })
    })

    return this
  },
  pruneThreshold: 10 ** 2,
  /**
   * @instance
   */
  requestPrune: function () {
    if (this.pruneRequest) {
      return this
    }

    this.pruneRequest = requestIdleCallback(() => {
      this.prune()
      delete this.pruneRequest
    })

    return this
  },
  range: Math.sqrt(4/4),
  /**
   * @instance
   */
  reset: function () {
    if (this.pruneRequest) {
      cancelIdleCallback(this.pruneRequest)
    }

    this.gradient.clear()

    return this
  },
  /**
   * @instance
   */
  smooth: function (value) {
    // 6x^5 - 15x^4 + 10x^3
    return (value ** 3) * (value * ((value * 6) - 15) + 10)
  },
  /**
   * @instance
   */
  value: function (x, y, z, t) {
    const t0 = Math.floor(t),
      t1 = t0 + 1,
      x0 = Math.floor(x),
      x1 = x0 + 1,
      y0 = Math.floor(y),
      y1 = y0 + 1,
      z0 = Math.floor(z),
      z1 = z0 + 1

    const dt = this.smooth(t - t0),
      dx = this.smooth(x - x0),
      dy = this.smooth(y - y0),
      dz = this.smooth(z - z0)

    const value = syngen.utility.lerp(
      syngen.utility.lerp(
        syngen.utility.lerp(
          syngen.utility.lerp(
            this.getDotProduct(x0, y0, z0, t0, x, y, z, t),
            this.getDotProduct(x1, y0, z0, t0, x, y, z, t),
            dx
          ),
          syngen.utility.lerp(
            this.getDotProduct(x0, y1, z0, t0, x, y, z, t),
            this.getDotProduct(x1, y1, z0, t0, x, y, z, t),
            dx
          ),
          dy
        ),
        syngen.utility.lerp(
          syngen.utility.lerp(
            this.getDotProduct(x0, y0, z1, t0, x, y, z, t),
            this.getDotProduct(x1, y0, z1, t0, x, y, z, t),
            dx
          ),
          syngen.utility.lerp(
            this.getDotProduct(x0, y1, z1, t0, x, y, z, t),
            this.getDotProduct(x1, y1, z1, t0, x, y, z, t),
            dx
          ),
          dy
        ),
        dz
      ),
      syngen.utility.lerp(
        syngen.utility.lerp(
          syngen.utility.lerp(
            this.getDotProduct(x0, y0, z0, t1, x, y, z, t),
            this.getDotProduct(x1, y0, z0, t1, x, y, z, t),
            dx
          ),
          syngen.utility.lerp(
            this.getDotProduct(x0, y1, z0, t1, x, y, z, t),
            this.getDotProduct(x1, y1, z0, t1, x, y, z, t),
            dx
          ),
          dy
        ),
        syngen.utility.lerp(
          syngen.utility.lerp(
            this.getDotProduct(x0, y0, z1, t1, x, y, z, t),
            this.getDotProduct(x1, y0, z1, t1, x, y, z, t),
            dx
          ),
          syngen.utility.lerp(
            this.getDotProduct(x0, y1, z1, t1, x, y, z, t),
            this.getDotProduct(x1, y1, z1, t1, x, y, z, t),
            dx
          ),
          dy
        ),
        dz
      ),
      dt
    )

    return syngen.utility.scale(value, -this.range, this.range, 0, 1)
  },
}

/**
 * Provides properties and methods to orient and move objects through three-dimensional space.
 * The static {@link syngen.utility.physical.decorate|decorate} method grants objects these qualities.
 * @mixin
 * @todo Improve clarity and proximity of documentation and source
 */
syngen.utility.physical = {}

/**
 * Decorates the `target` object with physical properties and methods.
 * @param {Object} target
 * @static
 */
syngen.utility.physical.decorate = function (target = {}) {
  if (!target.x) {
    target.x = 0
  }

  if (!target.y) {
    target.y = 0
  }

  if (!target.z) {
    target.z = 0
  }

  target.angularVelocity = syngen.utility.quaternion.create()
  target.quaternion = syngen.utility.quaternion.create()
  target.velocity = syngen.utility.vector3d.create()

  Object.keys(this.decoration).forEach((key) => {
    target[key] = this.decoration[key]
  })

  return target
}

/**
 * @lends syngen.utility.physical
 */
syngen.utility.physical.decoration = {
  /**
   * Returns the orientation as an Euler angle.
   * @instance
   * @returns {syngen.utility.euler}
   */
  euler: function () {
    return syngen.utility.euler.fromQuaternion(this.quaternion)
  },
  /**
   * Resets angular and lateral velocities to zero.
   * @instance
   */
  resetPhysics: function () {
    this.angularVelocity.set({w: 1})
    this.velocity.set()
    return this
  },
  /**
   * Updates the coordinates and orientation due to angular and lateral velocities.
   * @instance
   * @param {Number} [delta={@link syngen.loop.delta|syngen.loop.delta()}]
   */
  updatePhysics: function (delta = syngen.loop.delta()) {
    if (delta <= 0 || isNaN(delta) || !isFinite(delta)) {
      return this
    }

    if (!this.angularVelocity.isZero()) {
      this.quaternion = this.quaternion.multiply(
        this.angularVelocity.lerpFrom({w: 1}, delta)
      )
    }

    if (!this.velocity.isZero()) {
      this.x += this.velocity.x * delta
      this.y += this.velocity.y * delta
      this.z += this.velocity.z * delta
    }

    return this
  },
  /**
   * Returns the coordinates as a vector.
   * @instance
   * @returns {syngen.utility.vector3d}
   */
  vector: function () {
    return syngen.utility.vector3d.create(this)
  },
}

/**
 * Angular velocity, in radians per second.
 * @name syngen.utility.physical#angularVelocity
 * @type {syngen.utility.quaternion}
 */
/**
 * Orientation with respect to the coordinate system.
 * @name syngen.utility.physical#quaternion
 * @type {syngen.utility.quaternion}
 */
/**
 * Lateral velocity, in meters per second.
 * @name syngen.utility.physical#velocity
 * @type {syngen.utility.vector3d}
 */
/**
 * Position along the x-axis, in meters.
 * @name syngen.utility.physical#x
 * @type {Number}
 */
/**
 * Position along the y-axis, in meters.
 * @name syngen.utility.physical#y
 * @type {Number}
 */
/**
 * Position along the z-axis, in meters.
 * @name syngen.utility.physical#z
 * @type {Number}
 */

/**
 * @interface
 */
syngen.utility.pubsub = {}

/**
 * @static
 */
syngen.utility.pubsub.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

/**
 * @static
 */
syngen.utility.pubsub.decorate = function (target, instance) {
  if (!this.prototype.isPrototypeOf(instance)) {
    instance = this.create()
    target.pubsub = instance
  }

  ['emit', 'off', 'on', 'once'].forEach((method) => {
    target[method] = function (...args) {
      instance[method](...args)
      return this
    }
  })

  return target
}

syngen.utility.pubsub.prototype = {
  /**
   * @instance
   */
  construct: function() {
    this._handler = {}
    return this
  },
  /**
   * @instance
   */
  destroy: function() {
    this.off()
    return this
  },
  /**
   * @instance
   */
  emit: function (event, ...args) {
    if (!this._handler[event]) {
      return this
    }

    const execute = (handler) => handler(...args),
      handlers = [...this._handler[event]]

    handlers.forEach(execute)

    return this
  },
  /**
   * @instance
   */
  off: function (event, handler) {
    if (event === undefined) {
      this._handler = {}
      return this
    }

    if (handler === undefined) {
      delete this._handler[event]
      return this
    }

    if (!this._handler[event]) {
      return this
    }

    const handlers = this._handler[event],
      index = handlers.indexOf(handler)

    if (index != -1) {
      handlers.splice(index, 1)
    }

    return this
  },
  /**
   * @instance
   */
  on: function (event, handler) {
    if (!this._handler[event]) {
      this._handler[event] = []
    }

    this._handler[event].push(handler)

    return this
  },
  /**
   * @instance
   */
  once: function (event, handler) {
    const wrapper = (...args) => {
      this.off(event, wrapper)
      handler(...args)
    }

    return this.on(event, wrapper)
  },
}

/**
 * @interface
 */
syngen.utility.quadtree = {}

/**
 * @static
 */
syngen.utility.quadtree.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

/**
 * @static
 */
syngen.utility.quadtree.from = function (items = [], options = {}) {
  const tree = this.create(options)

  for (const item of items) {
    tree.insert(item)
  }

  return tree
}

syngen.utility.quadtree.prototype = {
  /**
   * @instance
   */
  clear: function () {
    this.items.length = 0
    this.nodes.length = 0
    return this
  },
  /**
   * @instance
   */
  construct: function ({
    height = syngen.const.maxSafeFloat * 2,
    maxItems = 12,
    width = syngen.const.maxSafeFloat * 2,
    x = -syngen.const.maxSafeFloat,
    y = -syngen.const.maxSafeFloat,
  } = {}) {
    this.height = height
    this.items = []
    this.maxItems = maxItems
    this.nodes = []
    this.width = width
    this.x = x
    this.y = y

    return this
  },
  /**
   * @instance
   */
  destroy: function () {
    return this.clear()
  },
  /**
   * @instance
   */
  find: function (query = {}, radius = Infinity) {
    // NOTE: Assumes query.x and query.y exist

    if (
         isFinite(radius)
      && !this.intersects({
          height: radius * 2,
          width: radius * 2,
          x: query.x - radius,
          y: query.y - radius,
        })
    ) {
      return
    }

    const distance = ({x, y}) => ((x - query.x) ** 2) + ((y - query.y) ** 2),
      index = this.getIndex(query),
      radius2 = ((radius * (Math.sqrt(2) / 2)) ** 2) * 2

    if (index == -1) {
      let minDistance = radius2,
        result

      for (const item of this.items) {
        if (item === query) {
          continue
        }

        const d = distance(item)

        if (d < minDistance) {
          minDistance = d
          result = item
        }
      }

      return result
    }

    let result = this.nodes[index].find(query, radius)
    let minDistance = result ? distance(result) : radius2

    for (const node of this.nodes) {
      if (node === this.nodes[index]) {
        continue
      }

      const item = node.find(query, minDistance)

      if (!item) {
        continue
      }

      const d = distance(item)

      if (d < minDistance) {
        minDistance = d
        result = item
      }
    }

    return result
  },
  /**
   * @instance
   */
  getIndex: function ({
    x = 0,
    y = 0,
  } = {}) {
    if (!this.nodes.length) {
      return -1
    }

    const xMid = this.x + (this.width / 2),
      yMid = this.y + (this.height / 2)

    if (x <= xMid && y <= yMid) {
      return 0
    }

    if (x >= xMid && y <= yMid) {
      return 1
    }

    if (x <= xMid && y >= yMid) {
      return 2
    }

    return 3
  },
  /**
   * @instance
   */
  insert: function (item = {}) {
    // XXX: Assumes item.x and item.y exist

    const index = this.getIndex(item)

    if (index != -1) {
      this.nodes[index].insert(item)
      return this
    }

    this.items.push(item)

    // TODO: Max depth constant to prevent call stack size exceeded
    if (this.items.length > this.maxItems) {
      this.split()
    }

    return this
  },
  /**
   * @instance
   */
  intersects: function (rect) {
    return syngen.utility.intersects(this, rect)
  },
  /**
   * @instance
   */
  remove: function (item) {
    if (this.nodes.length) {
      const index = this.getIndex(item)
      this.nodes[index].remove(item)
      return this
    }

    const index = this.items.indexOf(item)

    if (index != -1) {
      this.items.splice(index, 1)
    }

    return this
  },
  /**
   * @instance
   */
  retrieve: function ({
    height = 0,
    width = 0,
    x = 0,
    y = 0,
  } = {}) {
    const items = []

    if (!this.intersects({height, width, x, y})) {
      return items
    }

    for (const item of this.items) {
      if (
           item.x >= x
        && item.x <= x + width
        && item.y >= y
        && item.y <= y + height
      ) {
        items.push(item)
      }
    }

    for (const node of this.nodes) {
      items.push(
        ...node.retrieve({height, width, x, y})
      )
    }

    return items
  },
  /**
   * @instance
   */
  split: function () {
    if (this.nodes.length) {
      return this
    }

    const height = this.height / 2,
      width = this.width / 2

    this.nodes[0] = syngen.utility.quadtree.create({
      height,
      maxItems: this.maxItems,
      width,
      x: this.x,
      y: this.y,
    })

    this.nodes[1] = syngen.utility.quadtree.create({
      height,
      maxItems: this.maxItems,
      width,
      x: this.x + width,
      y: this.y,
    })

    this.nodes[2] = syngen.utility.quadtree.create({
      height,
      maxItems: this.maxItems,
      width,
      x: this.x,
      y: this.y + height,
    })

    this.nodes[3] = syngen.utility.quadtree.create({
      height,
      maxItems: this.maxItems,
      width,
      x: this.x + width,
      y: this.y + height,
    })

    for (const item of this.items) {
      const index = this.getIndex(item)
      this.nodes[index].insert(item)
    }

    this.items.length = 0

    return this
  },
}

/**
 * @interface
 * @property {Number} w
 * @property {Number} x
 * @property {Number} y
 * @property {Number} z
 */
syngen.utility.quaternion = {}

/**
 * @static
 */
syngen.utility.quaternion.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

/**
 * @static
 */
syngen.utility.quaternion.fromEuler = function ({
  pitch = 0,
  roll = 0,
  yaw = 0,
} = {}, sequence = syngen.const.eulerToQuaternion) {
  // SEE: https://github.com/infusion/Quaternion.js/blob/master/quaternion.js
  sequence = sequence.toUpperCase()

  const x = roll / 2,
    y = pitch / 2,
    z = yaw / 2

  const cx = Math.cos(x),
    cy = Math.cos(y),
    cz = Math.cos(z),
    sx = Math.sin(x),
    sy = Math.sin(y),
    sz = Math.sin(z)

  switch (sequence) {
    case 'XYZ':
      return this.create({
        w: (cx * cy * cz) - (sx * sy * sz),
        x: (sx * cy * cz) + (cx * sy * sz),
        y: (cx * sy * cz) - (sx * cy * sz),
        z: (cx * cy * sz) + (sx * sy * cz),
      })
    case 'XZY':
      return this.create({
        w: (cx * cy * cz) + (sx * sy * sz),
        x: (sx * cy * cz) - (cx * sy * sz),
        y: (cx * sy * cz) - (sx * cy * sz),
        z: (cx * cy * sz) + (sx * sy * cz),
      })
    case 'YXZ':
      return this.create({
        w: (cx * cy * cz) + (sx * sy * sz),
        x: (sx * cy * cz) + (cx * sy * sz),
        y: (cx * sy * cz) - (sx * cy * sz),
        z: (cx * cy * sz) - (sx * sy * cz),
      })
    case 'YZX':
      return this.create({
        w: (cx * cy * cz) - (sx * sy * sz),
        x: (sx * cy * cz) + (cx * sy * sz),
        y: (cx * sy * cz) + (sx * cy * sz),
        z: (cx * cy * sz) - (sx * sy * cz),
      })
    case 'ZXY':
      return this.create({
        w: (cx * cy * cz) - (sx * sy * sz),
        x: (sx * cy * cz) - (cx * sy * sz),
        y: (cx * sy * cz) + (sx * cy * sz),
        z: (cx * cy * sz) + (sx * sy * cz),
      })
    case 'ZYX':
      return this.create({
        w: (cx * cy * cz) + (sx * sy * sz),
        x: (sx * cy * cz) - (cx * sy * sz),
        y: (cx * sy * cz) + (sx * cy * sz),
        z: (cx * cy * sz) - (sx * sy * cz),
      })
  }
}

/**
 * @interface
 */
syngen.utility.quaternion.prototype = {
  /**
   * @instance
   */
  clone: function () {
    return syngen.utility.quaternion.create(this)
  },
  /**
   * @instance
   */
  conjugate: function () {
    return syngen.utility.quaternion.create({
      w: this.w,
      x: -this.x,
      y: -this.y,
      z: -this.z,
    })
  },
  /**
   * @instance
   */
  construct: function ({
    w = 1,
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    this.w = w
    this.x = x
    this.y = y
    this.z = z
    return this
  },
  /**
   * @instance
   */
  distance: function ({
    w = 0,
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return Math.sqrt(((this.w - w) ** 2) + ((this.x - x) ** 2) + ((this.y - y) ** 2) + ((this.z - z) ** 2))
  },
  /**
   * @instance
   */
  distance2: function ({
    w = 0,
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return ((this.w - w) ** 2) + ((this.x - x) ** 2) + ((this.y - y) ** 2) + ((this.z - z) ** 2)
  },
  /**
   * @instance
   */
  divide: function (divisor) {
    if (!syngen.utility.quaternion.prototype.isPrototypeOf(divisor)) {
      divisor = syngen.utility.quaternion.create(divisor)
    }

    return this.multiply(divisor.inverse())
  },
  /**
   * @instance
   */
  equals: function ({
    w = 0,
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return (this.w == w) && (this.x == x) && (this.y == y) && (this.z == z)
  },
  /**
   * @instance
   */
  forward: function () {
    return syngen.utility.vector3d.unitX().rotateQuaternion(this)
  },
  /**
   * @instance
   */
  inverse: function () {
    const scalar = 1 / this.distance2()

    if (!isFinite(scalar)) {
      return this.conjugate()
    }

    return this.conjugate().scale(scalar)
  },
  /**
   * @instance
   */
  isZero: function () {
    return !this.x && !this.y && !this.z
  },
  /**
   * @instance
   */
  lerpFrom: function ({
    w = 0,
    x = 0,
    y = 0,
    z = 0,
  } = {}, value = 0) {
    return syngen.utility.quaternion.create({
      w: syngen.utility.lerp(w, this.w, value),
      x: syngen.utility.lerp(x, this.x, value),
      y: syngen.utility.lerp(y, this.y, value),
      z: syngen.utility.lerp(z, this.z, value),
    })
  },
  /**
   * @instance
   */
  lerpTo: function ({
    w = 0,
    x = 0,
    y = 0,
    z = 0,
  } = {}, value = 0) {
    return syngen.utility.quaternion.create({
      w: syngen.utility.lerp(this.w, w, value),
      x: syngen.utility.lerp(this.x, x, value),
      y: syngen.utility.lerp(this.y, y, value),
      z: syngen.utility.lerp(this.z, z, value),
    })
  },
  /**
   * @instance
   */
  multiply: function ({
    w = 0,
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return syngen.utility.quaternion.create({
      w: (this.w * w) - (this.x * x) - (this.y * y) - (this.z * z),
      x: (this.w * x) + (this.x * w) + (this.y * z) - (this.z * y),
      y: (this.w * y) + (this.y * w) + (this.z * x) - (this.x * z),
      z: (this.w * z) + (this.z * w) + (this.x * y) - (this.y * x),
    })
  },
  /**
   * @instance
   */
  normalize: function () {
    const distance = this.distance()

    if (!distance) {
      return this.clone()
    }

    return this.scale(1 / distance)
  },
  /**
   * @instance
   */
  right: function () {
    return syngen.utility.vector3d.unitY().rotateQuaternion(this)
  },
  /**
   * @instance
   */
  scale: function (scalar = 0) {
    return syngen.utility.quaternion.create({
      w: this.w * scalar,
      x: this.x * scalar,
      y: this.y * scalar,
      z: this.z * scalar,
    })
  },
  /**
   * @instance
   */
  set: function ({
    w = 0,
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    this.w = w
    this.x = x
    this.y = y
    this.z = z
    return this
  },
  /**
   * @instance
   */
  up: function () {
    return syngen.utility.vector3d.unitZ().rotateQuaternion(this)
  },
}

/**
 * @static
 */
syngen.utility.quaternion.identity = function () {
  return Object.create(this.prototype).construct({
    w: 1,
  })
}

/**
 * Provides methods for producing random values.
 * @namespace
 */
syngen.utility.random = {}

/**
 * Returns a random float between `min` and `max`.
 * @param {Number} [min=0]
 * @param {Number} [max=1]
 * @returns {Number}
 * @static
 */
syngen.utility.random.float = (min = 0, max = 1) => {
  return min + (Math.random() * (max - min))
}

/**
 * Returns a random integer between `min` and `max`.
 * @param {Number} [min=0]
 * @param {Number} [max=1]
 * @returns {Number}
 * @static
 */
syngen.utility.random.integer = function (min = 0, max = 1) {
  return Math.round(
    this.float(min, max)
  )
}

/**
 * Returns a random sign as a positive or negative `1`.
 * @returns {Number}
 * @static
 */
syngen.utility.random.sign = () => Math.random() < 0.5 ? 1 : -1

/**
 * Returns a random key in `bag`.
 * @param {Array|Map|Object} bag
 * @returns {String}
 * @static
 */
syngen.utility.random.key = function (bag) {
  const keys = bag instanceof Map
    ? [...bag.keys()]
    : Object.keys(bag)

  return keys[
    this.integer(0, keys.length - 1)
  ]
}

/**
 * Returns a random value in `bag`.
 * @param {Array|Map|Object|Set} bag
 * @returns {*}
 * @static
 */
syngen.utility.random.value = function (bag) {
  if (bag instanceof Set) {
    bag = [...bag.values()]
  }

  const key = this.key(bag)

  if (bag instanceof Map) {
    return bag.get(key)
  }

  return bag[key]
}

/**
 * Provides methods that simplify working with timers.
 * @namespace
 */
syngen.utility.timing = {}

/**
 * Returns a cancelable promise that resolves after `duration` milliseconds.
 * @param {Number} duration
 * @returns {Promise}
 *   Has a `cancel` method that can reject itself prematurely.
 * @static
 */
syngen.utility.timing.cancelablePromise = (duration) => {
  const scope = {}

  const promise = new Promise((resolve, reject) => {
    scope.reject = reject
    scope.resolve = resolve
  })

  const timeout = setTimeout(scope.resolve, duration)

  promise.cancel = function () {
    scope.reject()
    clearTimeout(timeout)
    return this
  }

  promise.catch(() => {})

  return promise
}

/**
 * Returns a promise that resolves after `duration` milliseconds.
 * @param {Number} duration
 * @returns {Promise}
 * @static
 */
syngen.utility.timing.promise = (duration) => new Promise((resolve) => setTimeout(resolve, duration))

/**
 * @interface
 * @property {Number} x
 * @property {Number} y
 */
syngen.utility.vector2d = {}

/**
 * @static
 */
syngen.utility.vector2d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.utility.vector2d.prototype = {
  /**
   * @instance
   */
  add: function ({
    x = 0,
    y = 0,
  } = {}) {
    return syngen.utility.vector2d.create({
      x: this.x + x,
      y: this.y + y,
    })
  },
  /**
   * @instance
   */
  angle: function () {
    return Math.atan2(this.y, this.x)
  },
  /**
   * @instance
   */
  angleTo: function (vector, angle = 0) {
    let relative = syngen.utility.vector2d.prototype.isPrototypeOf(vector)
      ? vector
      : syngen.utility.vector2d.create(vector)

    relative = relative.subtract(this)

    if (angle) {
      relative = relative.rotate(angle)
    }

    return relative.angle()
  },
  /**
   * @instance
   */
  clone: function () {
    return syngen.utility.vector2d.create(this)
  },
  /**
   * @instance
   */
  construct: function ({
    x = 0,
    y = 0,
  } = {}) {
    this.x = x
    this.y = y
    return this
  },
  /**
   * @instance
   */
  crossProduct: function ({
    x = 0,
    y = 0,
  } = {}) {
    return (this.x * y) - (this.y * x)
  },
  /**
   * @instance
   */
  distance: function ({
    x = 0,
    y = 0,
  } = {}) {
    return Math.sqrt(((this.x - x) ** 2) + ((this.y - y) ** 2))
  },
  /**
   * @instance
   */
  distance2: function ({
    x = 0,
    y = 0,
  } = {}) {
    return ((this.x - x) ** 2) + ((this.y - y) ** 2)
  },
  /**
   * @instance
   */
  dotProduct: function ({
    x = 0,
    y = 0,
  } = {}) {
    return (this.x * x) + (this.y * y)
  },
  /**
   * @instance
   */
  equals: function ({
    x = 0,
    y = 0,
  } = {}) {
    return (this.x == x) && (this.y == y)
  },
  /**
   * @instance
   */
  inverse: function () {
    return syngen.utility.vector2d.create({
      x: -this.x,
      y: -this.y,
    })
  },
  /**
   * @instance
   */
  isZero: function () {
    return !this.x && !this.y
  },
  /**
   * @instance
   */
  normalize: function () {
    const distance = this.distance()

    if (!distance) {
      return this.clone()
    }

    return this.scale(1 / distance)
  },
  /**
   * @instance
   */
  rotate: function (angle = 0) {
    const cos = Math.cos(angle),
      sin = Math.sin(angle)

    return syngen.utility.vector2d.create({
      x: (this.x * cos) - (this.y * sin),
      y: (this.y * cos) + (this.x * sin),
    })
  },
  /**
   * @instance
   */
  scale: function (scalar = 0) {
    return syngen.utility.vector2d.create({
      x: this.x * scalar,
      y: this.y * scalar,
    })
  },
  /**
   * @instance
   */
  set: function ({
    x = 0,
    y = 0,
  } = {}) {
    this.x = x
    this.y = y
    return this
  },
  /**
   * @instance
   */
  subtract: function ({
    x = 0,
    y = 0,
  } = {}) {
    return syngen.utility.vector2d.create({
      x: this.x - x,
      y: this.y - y,
    })
  },
  /**
   * @instance
   */
  subtractRadius: function (radius = 0) {
    if (radius <= 0) {
      return syngen.utility.vector2d.create(this)
    }

    const distance = this.distance()

    if (radius >= distance) {
      return syngen.utility.vector2d.create()
    }

    return this.multiply(1 - (radius / distance))
  },
}

/**
 * @static
 */
syngen.utility.vector2d.unitX = function () {
  return Object.create(this.prototype).construct({
    x: 1,
  })
}

/**
 * @static
 */
syngen.utility.vector2d.unitY = function () {
  return Object.create(this.prototype).construct({
    y: 1,
  })
}

/**
 * @interface
 * @property {Number} x
 * @property {Number} y
 * @property {Number} z
 */
syngen.utility.vector3d = {}

/**
 * @static
 */
syngen.utility.vector3d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.utility.vector3d.prototype = {
  /**
   * @instance
   */
  add: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return syngen.utility.vector3d.create({
      x: this.x + x,
      y: this.y + y,
      z: this.z + z,
    })
  },
  /**
   * @instance
   */
  clone: function () {
    return syngen.utility.vector3d.create(this)
  },
  /**
   * @instance
   */
  construct: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    this.x = x
    this.y = y
    this.z = z
    return this
  },
  /**
   * @instance
   */
  crossProduct: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return syngen.utility.vector3d.create({
      x: (this.y * z) - (this.z * y),
      y: (this.z * x) - (this.x * z),
      z: (this.x * y) - (this.y * x),
    })
  },
  /**
   * @instance
   */
  distance: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return Math.sqrt(((this.x - x) ** 2) + ((this.y - y) ** 2) + ((this.z - z) ** 2))
  },
  /**
   * @instance
   */
  distance2: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return ((this.x - x) ** 2) + ((this.y - y) ** 2) + ((this.z - z) ** 2)
  },
  /**
   * @instance
   */
  dotProduct: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return (this.x * x) + (this.y * y) + (this.z * z)
  },
  /**
   * @instance
   */
  euler: function () {
    return syngen.utility.euler.create({
      pitch: this.z ? Math.atan2(this.z, Math.sqrt((this.x ** 2) + (this.y ** 2))) : 0,
      roll: 0,
      yaw: Math.atan2(this.y, this.x),
    })
  },
  /**
   * @instance
   */
  eulerTo: function (vector, euler = undefined) {
    let relative = syngen.utility.vector3d.prototype.isPrototypeOf(vector)
      ? vector
      : syngen.utility.vector3d.create(vector)

    relative = relative.subtract(this)

    if (euler) {
      relative = relative.rotateEuler(euler)
    }

    return relative.euler()
  },
  /**
   * @instance
   */
  equals: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return (this.x == x) && (this.y == y) && (this.z == z)
  },
  /**
   * @instance
   */
  inverse: function () {
    return syngen.utility.vector3d.create({
      x: -this.x,
      y: -this.y,
      z: -this.z,
    })
  },
  /**
   * @instance
   */
  isZero: function () {
    return !this.x && !this.y && !this.z
  },
  /**
   * @instance
   */
  normalize: function () {
    const distance = this.distance()

    if (!distance) {
      return this.clone()
    }

    return this.scale(1 / distance)
  },
  /**
   * @instance
   */
  rotateEuler: function (euler, sequence) {
    return this.rotateQuaternion(
      syngen.utility.quaternion.fromEuler(euler, sequence)
    )
  },
  /**
   * @instance
   */
  rotateQuaternion: function (quaternion) {
    if (!syngen.utility.quaternion.prototype.isPrototypeOf(quaternion)) {
      quaternion = syngen.utility.quaternion.create(quaternion)
    }

    if (quaternion.isZero()) {
      return this.clone()
    }

    return syngen.utility.vector3d.create(
      quaternion.multiply(
        syngen.utility.quaternion.create(this)
      ).multiply(
        quaternion.inverse()
      )
    )
  },
  /**
   * @instance
   */
  scale: function (scalar = 0) {
    return syngen.utility.vector3d.create({
      x: this.x * scalar,
      y: this.y * scalar,
      z: this.z * scalar,
    })
  },
  /**
   * @instance
   */
  set: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    this.x = x
    this.y = y
    this.z = z
    return this
  },
  /**
   * @instance
   */
  subtract: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return syngen.utility.vector3d.create({
      x: this.x - x,
      y: this.y - y,
      z: this.z - z,
    })
  },
  /**
   * @instance
   */
  subtractRadius: function (radius = 0) {
    if (radius <= 0) {
      return syngen.utility.vector3d.create(this)
    }

    const distance = this.distance()

    if (radius >= distance) {
      return syngen.utility.vector3d.create()
    }

    return this.scale(1 - (radius / distance))
  },
}

/**
 * @static
 */
syngen.utility.vector3d.unitX = function () {
  return Object.create(this.prototype).construct({
    x: 1,
  })
}

/**
 * @static
 */
syngen.utility.vector3d.unitY = function () {
  return Object.create(this.prototype).construct({
    y: 1,
  })
}

/**
 * @static
 */
syngen.utility.vector3d.unitZ = function () {
  return Object.create(this.prototype).construct({
    z: 1,
  })
}

/**
 * A collection of useful constants used throughout the library.
 * These can be overridden at runtime.
 * @namespace
 */
syngen.const = {
  /**
   * Lowpass frequency of the acoustic shadow, in Hertz.
   * Typically this value is the speed of sound divided by the width of the head.
   * @todo Move to syngen.audio.binaural.model
   * @type {Number}
  */
  acousticShadowFrequency: 343 / 0.1524, // speedOfSound / binauralHeadWidth
  /**
   * Latency added to calculated times, in seconds.
   * @todo Improve support for nonzero values
   * @type {Number}
  */
  audioLookaheadTime: 0,
  /**
   * Width of head, in meters.
   * @todo Move to syngen.audio.binaural.model
   * @type {Number}
  */
  binauralHeadWidth: 0.1524,
  /**
   * Offset that ears point away from +/- 90 degrees, in radians.
   * @todo Move to syngen.audio.binaural.model
   * @type {Number}
  */
  binauralShadowOffset: Math.PI / 4,
  /**
   * Upper bound where acoustic shadow gradually increases in strength, in meters.
   * @todo Move to syngen.audio.binaural.model
   * @type {Number}
  */
  binauralShadowRolloff: 1,
  /**
   * The rolloff applied to
   * Typically in physical space this value is derived from the distance-square law and is exactly two.
   * @todo Move to dedicated distance models
   * @type {Number}
  */
  distancePower: 2,
  /**
   * Whether to multiply calculated gains by the ratio between distance and the horizon defined by syngen.streamer.
   * This allows sounds to gradually fade out around the edges of the streamed area.
   * @todo Move to dedicated distance models
   * @type {Boolean}
  */
  distancePowerHorizon: false,
  /**
   * Speed of the gain dropoff applied when the horizon is enabled.
   * @todo Move to dedicated distance models
   * @type {Number}
  */
  distancePowerHorizonExponent: 0,
  /**
   * Rotation sequence when converting Euler angles to quaternions. Valid values include:
   * - XYZ
   * - XZY
   * - YXZ
   * - YZX
   * - ZXY
   * - ZYX
   * @type {String}
  */
  eulerToQuaternion: 'ZYX',
  /**
   * Acceleration due to gravity, in meters per second per second.
   * @type {Number}
  */
  gravity: 9.8,
  /**
   * Duration that the loop should ideally run when the window is blurred, in seconds.
   * @todo Move to syngen.loop
   * @type {Number}
  */
  idleDelta: 1/60,
  /**
   * Upper bound of perceptible frequencies, in Hertz.
   * @type {Number}
  */
  maxFrequency: 20000,
  /**
   * The largest float before precision loss becomes problematic.
   * This value is derived from `Number.MAX_SAFE_INTEGER / (2 ** 10)` to deliver about three decimal places of precision, which is suitable for most purposes.
   * @type {Number}
  */
  maxSafeFloat: (2 ** 43) - 1,
  /**
   * Frequency of the MIDI reference note, in Hertz.
   * @type {Number}
  */
  midiReferenceFrequency: 440,
  /**
   * Reference note number used when converting MIDI notes to frequencies.
   * @type {Number}
  */
  midiReferenceNote: 69,
  /**
   * Lower bound of perceptible frequencies, in Hertz.
   * @type {Number}
  */
  minFrequency: 20, // Hz
  /**
   * Radius of the observer, in meters.
   * @todo Move into syngen.position
   * @type {Number}
  */
  positionRadius: 0.25,
  /**
   * Duration, in seconds, that props fade in and out when instantiated and destroyed.
   * @todo Move into syngen.prop.base
   * @type {Number}
  */
  propFadeDuration: 0.005,
  /**
   * Separator used when joining array seeds.
   * @todo Move into syngen.seed
   * @type {String}
  */
  seedSeparator: '~',
  /**
   * The speed of sound, in meters per second.
   * @type {Number}
  */
  speedOfSound: 343,
  /**
   * Upper bound for sub-bass frequencies, in Hertz.
   * @type {Number}
  */
  subFrequency: 65.4064,
  /**
   * The circle constant, i.e. 2π.
   * @type {Number}
  */
  tau: Math.PI * 2,
  /**
   * Length that satisfies `x=y` for a 2D unit circle.
   * @type {Number}
  */
  unit2: Math.sqrt(2) / 2,
  /**
   * Length that satisfies `x=y=z` for a 3D unit sphere.
   * @type {Number}
  */
  unit3: Math.sqrt(3) / 3,
  /**
   * Length that satisfies `w=x=y=z` for a 4D unit hypersphere.
   * @type {Number}
  */
  unit4: Math.sqrt(4) / 4,
  /**
   * Close enough to zero for
   * @type {Number}
  */
  zero: 10 ** -32,
  /**
   * Value in decibels that, for most purposes, is perceptibly silent.
   * @type {Number}
  */
  zeroDb: -96,
  /**
   * Value in gain that, for most purposes, is perceptibly silent.
   * @type {Number}
  */
  zeroGain: syngen.utility.fromDb(-96), // syngen.utility.fromDb(zeroDb)
  /**
   * Length of time that, for most purposes, is perceptibly instantaneous.
   * @type {Number}
  */
  zeroTime: 0.005,
}

/**
 * Provides a helper for importing and exporting state.
 * Systems can subscribe to its events to persist and load their inner states.
 * @implements syngen.utility.pubsub
 * @namespace
 */
syngen.state = syngen.utility.pubsub.decorate({
  /**
   * Exports the state.
   * The inverse of {@link syngen.state.import}.
   * @fires syngen.state#event:export
   * @memberof syngen.state
   * @returns {Object}
   */
  export: function () {
    const state = {}

    /**
     * Fired when state is exported.
     * Subscribers should add an entry to the passed object with their exported state.
     * @event syngen.state#event:export
     * @type {Object}
     */
    this.emit('export', state)

    return state
  },
  /**
   * Imports the state.
   * The inverse of {@link syngen.state.export}.
   * @fires syngen.state#event:import
   * @memberof syngen.state
   * @param {Object} [state]
   */
  import: function (state = {}) {
    this.reset()

    /**
     * Fired when state is imported.
     * Subscribers should consume the entry they added during export, if one exists.
     * @event syngen.state#event:import
     * @type {Object}
     */
    this.emit('import', state)

    return this
  },
  /**
   * Resets to a blank state.
   * @fires syngen.state#event:import
   * @memberof syngen.state
   */
  reset: function () {
    /**
     * Fired when state is reset.
     * Subscribers should clear their internal state when fired.
     * @event syngen.state#event:reset
     */
    this.emit('reset')
    return this
  }
})

/**
 * Provides a wrapper for the seed value.
 * The seed primarily influences {@link syngen.utility.srand()} as well as any other systems and utilities that rely on it.
 * It can be randomized to deliver unique experiences.
 * @namespace
 */
syngen.seed = (() => {
  let seed

  return {
    /**
     * Returns the seed value.
     * @listens syngen.state#event.import
     * @memberof syngen.seed
     * @returns {String}
     */
    get: () => seed,
    /**
     * Sets the seed value.
     * @listens syngen.state#event:import
     * @listens syngen.state#event:reset
     * @memberof syngen.seed
     * @param {String} [value]
     */
    set: function (value) {
      seed = value
      return this
    },
    /**
     * @ignore
     */
    valueOf: () => seed,
  }
})()

syngen.state.on('export', (data = {}) => data.seed = syngen.seed.get())
syngen.state.on('import', (data = {}) => syngen.seed.set(data.seed))
syngen.state.on('reset', () => syngen.seed.set())

/**
 * Wrapper for the main [AudioContext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext) and umbrella for all [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)-related utilities.
 * @namespace
 */
syngen.audio = (() => {
  const context = new AudioContext()

  return {
    /**
     * A collection of programmatically generated [AudioBuffers](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer).
     * @namespace syngen.audio.buffer
     */
    buffer: {
      /**
       * Programatically generated reverb impulses intended for use with [ConvolverNodes](https://developer.mozilla.org/en-US/docs/Web/API/ConvolverNode).
       * @namespace syngen.audio.buffer.impulse
       */
      impulse: {},
      /**
       * Programmatically generated noise intended for use with [AudioBufferSourceNodes](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode).
       * @namespace syngen.audio.buffer.noise
       */
      noise: {},
    },
    /**
     * Returns the main `AudioContext`.
     * @memberof syngen.audio
     * @returns {AudioContext}
     */
    context: () => context,
    /**
     * Returns the Nyquist frequency for the current sample rate multiplied by an optional coefficient.
     * @memberof syngen.audio
     * @param {Number} [coefficient=1]
     * @returns {Number}
     * @see https://en.wikipedia.org/wiki/Nyquist_frequency
     */
    nyquist: (coefficient = 1) => coefficient * context.sampleRate / 2,
    /**
     * A collection of circuits that send signals to auxiliary sends.
     * @namespace syngen.audio.send
     * @todo Move to syngen.audio.mixer.send
     */
    send: {},
    /**
     * Resumes the main `AudioContext`.
     * Must be called after the first user gesture so playback works in all browsers.
     * @memberof syngen.audio
     */
    start: function () {
      context.resume()
      return this
    },
    /**
     * Suspends the main `AudioContext`.
     * @memberof syngen.audio
     */
    stop: function () {
      context.suspend()
      return this
    },
    /**
     * Returns the `currentTime` for the main `AudioContext` plus an optional duration and lookahead time.
     * @memberof syngen.audio
     * @param {Number} [duration=0]
     * @returns {Number}
     * @see syngen.const.audioLookaheadTime
     */
    time: (duration = 0) => context.currentTime + syngen.const.audioLookaheadTime + duration,
    /**
     * Returns the next appreciable timestamp.
     * @memberof syngen.audio
     * @returns {Number}
     * @see syngen.const.audioLookaheadTime
     * @see syngen.const.zeroTime
     */
    zeroTime: () => context.currentTime + syngen.const.audioLookaheadTime + syngen.const.zeroTime,
  }
})()

/**
 * @interface
 * @property {syngen.audio.binaural.monaural} left
 * @property {syngen.audio.binaural.monaural} right
 */
syngen.audio.binaural = {}

/**
 * @static
 */
syngen.audio.binaural.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.audio.binaural.prototype = {
  /**
   * @instance
   */
  construct: function () {
    const context = syngen.audio.context()

    this.left = syngen.audio.binaural.monaural.create({
      pan: -1,
    })

    this.right = syngen.audio.binaural.monaural.create({
      pan: 1,
    })

    this.merger = context.createChannelMerger()
    this.left.to(this.merger, 0, 0)
    this.right.to(this.merger, 0, 1)

    return this
  },
  /**
   * @instance
   */
  destroy: function () {
    this.left.destroy()
    this.right.destroy()
    this.merger.disconnect()
    return this
  },
  /**
   * @instance
   */
  from: function (input) {
    this.left.from(input)
    this.right.from(input)
    return this
  },
  /**
   * @instance
   */
  to: function (output) {
    this.merger.connect(output)
    return this
  },
  /**
   * @instance
   */
  update: function (...args) {
    this.left.update(...args)
    this.right.update(...args)
    return this
  },
}

/**
 * @namespace
 */
syngen.audio.circuit = {}

// Multiplies input by -scale
/**
 * @static
 */
syngen.audio.circuit.invert = ({
  from,
  scale = 1,
  to,
} = {}) => {
  const context = syngen.audio.context(),
    inverter = context.createGain()

  inverter.gain.value = -Math.abs(scale)

  if (from) {
    from.connect(inverter)
  }

  if (to) {
    inverter.connect(to)
  }

  return inverter
}

// Scales input [0,1] to [min,max], e.g. for controlling AudioParams via ConstantSourceNodes
/**
 * @static
 */
syngen.audio.circuit.lerp = ({
  chainStop, // syngen.audio.synth
  from, // ConstantSourceNode
  max: maxValue = 1,
  min: minValue = 0,
  to, // AudioParam
  when,
} = {}) => {
  const context = syngen.audio.context()

  const lerp = context.createGain(),
    max = context.createConstantSource(),
    min = context.createConstantSource()

  lerp.gain.value = 0
  max.offset.value = maxValue - minValue
  min.offset.value = minValue
  to.value = 0

  from.connect(lerp.gain)
  max.connect(lerp)
  lerp.connect(to)
  min.connect(to)

  max.start(when)
  min.start(when)

  const wrapper = {
    stop: (when = syngen.audio.time()) => {
      max.stop(when)
      min.stop(when)
      return this
    },
  }

  if (chainStop) {
    syngen.audio.synth.chainStop(chainStop, wrapper)
  }

  return wrapper
}

// Scales input [fromMin,fromMax] to [toMin,toMax], e.g. for controlling AudioParams via ConstantSourceNodes
/**
 * @static
 */
syngen.audio.circuit.scale = ({
  chainStop, // syngen.audio.synth
  from, // ConstantSourceNode
  fromMax = 1,
  fromMin = 0,
  to, // AudioParam
  toMax = 1,
  toMin = 0,
  when,
} = {}) => {
  const context = syngen.audio.context()

  const offset = context.createConstantSource(),
    scale = context.createGain()

  offset.offset.value = -fromMin // Translate to [0,fromMax-fromMin]
  scale.gain.value = 1 / (fromMax - fromMin) // Scale down to [0,1]

  offset.connect(scale)
  from.connect(scale)

  offset.start(when)

  // Leverage lerp to handle upscale
  const lerp = syngen.audio.circuit.lerp({
    from: scale,
    max: toMax,
    min: toMin,
    to,
    when,
  })

  const wrapper = {
    stop: (when = syngen.audio.time()) => {
      lerp.stop(when)
      offset.stop(when)
      return this
    },
  }

  if (chainStop) {
    syngen.audio.synth.chainStop(chainStop, wrapper)
  }

  return wrapper
}

/**
 * @namespace
 */
syngen.audio.effect = {}

/**
 * @static
 */
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

/**
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

/**
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
/**
 * @static
 */
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

/**
 * @static
 */
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

/**
 * @static
 */
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

/**
 * @static
 */
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

/**
 * Records the output of the provided input and exports it as a WebM file.
 * When no duration is passed, the [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) _must_ be stopped to complete the export.
 * @param {Object} [options]
 * @param {Number} [options.duration=0]
 * @param {AudioNode} [options.input=syngen.audio.mixer.master.output]
 * @param {String} [options.name=export.webm]
 * @returns {MediaRecorder}
 * @static
 */
syngen.audio.export = ({
  duration = 0,
  input = syngen.audio.mixer.master.output,
  name = 'export.webm',
} = {}) => {
  if (!(input instanceof AudioNode)) {
    throw new Error('Input must be an AudioNode')
  }

  const context = syngen.audio.context(),
    data = [],
    destination = context.createMediaStreamDestination(),
    recorder = new MediaRecorder(destination.stream)

  recorder.ondataavailable = (e) => data.push(e.data)

  recorder.onstop = () => {
    try {
      input.disconnect(destination)
    } catch (e) {}

    const blob = new Blob(data, {type: recorder.mimeType}),
      url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.download = name
    link.href = url

    link.click()
    link.remove()
  }

  input.connect(destination)
  recorder.start()

  if (duration > 0) {
    setTimeout(() => recorder.stop(), duration * 1000)
  }

  return recorder
}

// SEE: https://www.soundonsound.com/techniques/formant-synthesis
// SEE: https://www.researchgate.net/figure/Target-and-reproduced-vowel-formant-frequencies_tbl1_2561802
// SEE: https://www.reasonstudios.com/blog/thor-demystified-17-filters-pt-5-formant-filters
// SEE: http://www.ipachart.com

/**
 * @namespace
 */
syngen.audio.formant = {}

/**
 * @static
 */
syngen.audio.formant.blend = (a, b, mix = 0) => {
  const getFrequency = (array, index) => (array[index] && array[index].frequency) || syngen.const.zero
  const getGain = (array, index) => (array[index] && array[index].gain) || syngen.const.zeroGain
  const getQ = (array, index) => (array[index] && array[index].q) || 1

  return [...Array(Math.max(a.length, b.length))].map((_, i) => ({
    frequency: syngen.utility.lerp(getFrequency(a, i), getFrequency(b, i), mix),
    gain: syngen.utility.lerp(getGain(a, i), getGain(b, i), mix),
    q: syngen.utility.lerp(getQ(a, i), getQ(b, i), mix),
  }))
}

/**
 * @static
 */
syngen.audio.formant.create = (frequencies = []) => {
  const context = syngen.audio.context()

  const input = context.createGain(),
    output = context.createGain()

  const filters = frequencies.map(({frequency = 10, gain = 1, q = 1}) => {
    const filter = context.createBiquadFilter()
    filter.frequency.value = frequency
    filter.Q.value = q
    filter.type = 'bandpass'

    const gainNode = context.createGain()
    gainNode.gain.value = gain

    input.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(output)

    return {
      filter,
      gain: gainNode,
    }
  })

  return {
    filters,
    input,
    output,
  }
}

/**
 * @static
 */
syngen.audio.formant.createA = () => {
  return syngen.audio.formant.create(
    syngen.audio.formant.a()
  )
}

/**
 * @static
 */
syngen.audio.formant.createE = () => {
  return syngen.audio.formant.create(
    syngen.audio.formant.e()
  )
}

/**
 * @static
 */
syngen.audio.formant.createI = () => {
  return syngen.audio.formant.create(
    syngen.audio.formant.i()
  )
}

/**
 * @static
 */
syngen.audio.formant.createO = () => {
  return syngen.audio.formant.create(
    syngen.audio.formant.o()
  )
}

/**
 * @static
 */
syngen.audio.formant.createU = () => {
  return syngen.audio.formant.create(
    syngen.audio.formant.u()
  )
}

/**
 * @static
 */
syngen.audio.formant.transition = function(formant, frequencies = [], duration) {
  formant.filters.forEach((filter, i) => {
    if (!frequencies[i]) {
      syngen.audio.ramp.linear(filter.gain.gain, syngen.const.zeroGain, duration)
      return
    }

    const {frequency, gain, q} = frequencies[i]

    if (typeof frequency != 'undefined') {
      syngen.audio.ramp.exponential(filter.filter.frequency, frequency, duration)
    }

    if (typeof gain != 'undefined') {
      syngen.audio.ramp.linear(filter.gain.gain, gain, duration)
    }

    if (typeof q != 'undefined') {
      syngen.audio.ramp.exponential(filter.filter.Q, q, duration)
    }
  })

  return syngen.utility.timing.promise(duration * 1000)
}

/**
 * @static
 */
syngen.audio.formant.a = () => [
  {
    frequency: 599,
    gain: 1,
    q: 5,
  },
  {
    frequency: 1001,
    gain: 1,
    q: 20,
  },
  {
    frequency: 2045,
    gain: 1,
    q: 50,
  },
  {
    frequency: 2933,
    gain: 1,
    q: 80,
  },
]

/**
 * @static
 */
syngen.audio.formant.e = () => [
  {
    frequency: 469,
    gain: 1,
    q: 5,
  },
  {
    frequency: 2150,
    gain: 1,
    q: 20,
  },
  {
    frequency: 2836,
    gain: 1,
    q: 50,
  },
  {
    frequency: 3311,
    gain: 1,
    q: 80,
  },
]

/**
 * @static
 */
syngen.audio.formant.i = () => [
  {
    frequency: 274,
    gain: 1,
    q: 5,
  },
  {
    frequency: 1704,
    gain: 1,
    q: 20,
  },
  {
    frequency: 2719,
    gain: 1,
    q: 50,
  },
  {
    frequency: 3404,
    gain: 1,
    q: 80,
  },
]

/**
 * @static
 */
syngen.audio.formant.o = () => [
  {
    frequency: 411,
    gain: 1,
    q: 5,
  },
  {
    frequency: 784,
    gain: 1,
    q: 20,
  },
  {
    frequency: 2176,
    gain: 1,
    q: 50,
  },
  {
    frequency: 2987,
    gain: 1,
    q: 80,
  },
]

/**
 * @static
 */
syngen.audio.formant.u = () => [
  {
    frequency: 290,
    gain: 1,
    q: 5,
  },
  {
    frequency: 685,
    gain: 1,
    q: 20,
  },
  {
    frequency: 2190,
    gain: 1,
    q: 50,
  },
  {
    frequency: 3154,
    gain: 1,
    q: 80,
  },
]

/**
 * @namespace
 */
syngen.audio.mixer = (() => {
  const context = syngen.audio.context()

  const masterCompensator = context.createGain(),
    masterCompressor = context.createDynamicsCompressor(),
    masterInput = context.createGain(),
    masterOutput = context.createGain()

  let masterHighpass,
    masterLowpass

  masterCompressor.connect(masterCompensator)
  masterCompensator.connect(masterOutput)
  masterOutput.connect(context.destination)

  masterCompensator.gain.value = 1
  masterCompressor.attack.value = syngen.const.zeroTime
  masterCompressor.knee.value = 0
  masterCompressor.ratio.value = 20
  masterCompressor.release.value = syngen.const.zeroTime
  masterCompressor.threshold.value = 0

  createFilters()

  function createFilters() {
    masterHighpass = context.createBiquadFilter()
    masterHighpass.type = 'highpass'
    masterHighpass.frequency.value = syngen.const.minFrequency

    masterLowpass = context.createBiquadFilter()
    masterLowpass.type = 'lowpass'
    masterLowpass.frequency.value = syngen.const.maxFrequency

    masterInput.connect(masterHighpass)
    masterHighpass.connect(masterLowpass)
    masterLowpass.connect(masterCompressor)
  }

  function destroyFilters() {
    masterInput.disconnect()
    masterLowpass.disconnect()
    masterLowpass = null
    masterHighpass.disconnect()
    masterHighpass = null
  }

  return {
    auxiliary: {},
    /**
     * @memberof syngen.audio.mixer
     * @namespace
     */
    bus: {},
    /**
     * @memberof syngen.audio.mixer
     */
    createAuxiliary: () => {
      const input = context.createGain(),
        output = context.createGain()

      output.connect(masterInput)

      return {
        input,
        output,
      }
    },
    /**
     * @memberof syngen.audio.mixer
     */
    createBus: () => {
      const input = context.createGain()
      input.connect(masterInput)
      return input
    },
    /**
     * @memberof syngen.audio.mixer
     * @property {GainNode} input
     * @property {GainNode} output
     * @property {Object} param
     * @property {AudioParam} param.gain
     * @property {Object} param.highpass
     * @property {AudioParam} param.highpass.frequency
     * @property {Object} param.limiter
     * @property {AudioParam} param.limiter.attack
     * @property {AudioParam} param.limiter.gain
     * @property {AudioParam} param.limiter.knee
     * @property {AudioParam} param.limiter.ratio
     * @property {AudioParam} param.limiter.release
     * @property {AudioParam} param.limiter.threshold
     * @property {Object} param.lowpass
     * @property {AudioParam} param.lowpass.frequency
     */
    master: {
      input: masterInput,
      output: masterOutput,
      param: {
        gain: masterOutput.gain,
        highpass: {
          frequency: masterHighpass.frequency,
        },
        limiter: {
          attack: masterCompressor.attack,
          gain: masterCompensator.gain,
          knee: masterCompressor.knee,
          ratio: masterCompressor.ratio,
          release: masterCompressor.release,
          threshold: masterCompressor.threshold,
        },
        lowpass: {
          frequency: masterLowpass.frequency,
        },
      },
    },
    /**
     * @memberof syngen.audio.mixer
     */
    rebuildFilters: function () {
      destroyFilters()
      createFilters()

      this.master.param.highpass.frequency = masterHighpass.frequency
      this.master.param.lowpass.frequency = masterLowpass.frequency

      return this
    },
  }
})()

/**
 * @namespace
 */
syngen.audio.ramp = {}

/**
 * @static
 */
syngen.audio.ramp.createMachine = function (audioParam, rampFn) {
  let timeout,
    state = false

  const container = (value, duration) => {
    rampFn(audioParam, value, duration)

    state = true
    timeout = syngen.utility.timing.cancelablePromise(duration * 1000)

    timeout.then(() => {
      state = false
      timeout = null
    }, () => syngen.audio.ramp.hold(audioParam))

    return timeout
  }

  container.cancel = function () {
    if (timeout) {
      timeout.cancel()
    }
    return this
  }

  container.state = () => state

  return container
}

/**
 * @static
 */
syngen.audio.ramp.curve = function (audioParam, curve, duration = syngen.const.zeroTime) {
  audioParam.cancelScheduledValues(0)
  audioParam.setValueCurveAtTime(curve, syngen.audio.time(), syngen.audio.time(duration))
  return this
}

/**
 * @static
 */
syngen.audio.ramp.exponential = function (audioParam, value, duration = syngen.const.zeroTime) {
  syngen.audio.ramp.hold(audioParam)
  audioParam.exponentialRampToValueAtTime(value, syngen.audio.time(duration))
  return this
}

/**
 * @static
 */
syngen.audio.ramp.hold = function (audioParam) {
  audioParam.value = audioParam.value
  audioParam.cancelScheduledValues(0)
  return this
}

/**
 * @static
 */
syngen.audio.ramp.linear = function (audioParam, value, duration = syngen.const.zeroTime) {
  syngen.audio.ramp.hold(audioParam)
  audioParam.linearRampToValueAtTime(value, syngen.audio.time(duration))
  return this
}

/**
 * @static
 */
syngen.audio.ramp.set = function (audioParam, value) {
  syngen.audio.ramp.linear(audioParam, value, syngen.performance.delta())
  return this
}

/**
 * @namespace
 */
syngen.audio.shape = (() => {
  const crush6 = createBitcrush(6),
    crush8 = createBitcrush(8),
    crush12 = createBitcrush(12),
    distort = createSigmoid(Math.PI * 8),
    double = createTuple(2),
    doublePulse = createTuplePulse(2),
    equalFadeIn = new Float32Array(2 ** 16),
    hot = createSigmoid(Math.PI * 4),
    invert = new Float32Array([1, 0, -1]),
    linear = new Float32Array([-1, 0, 1]),
    noise = createNoise(1),
    noise2 = createNoise(syngen.utility.fromDb(-3)),
    noise4 = createNoise(syngen.utility.fromDb(-6)),
    noise8 = createNoise(syngen.utility.fromDb(-9)),
    noise16 = createNoise(syngen.utility.fromDb(-12)),
    noise32 = createNoise(syngen.utility.fromDb(-15)),
    noiseZero = createNoise(syngen.const.zeroGain),
    one = new Float32Array([1, 1]),
    pulse = new Float32Array([0, 0, 1]),
    rectify = new Float32Array([1, 0, 1]),
    square = new Float32Array(2 ** 7),
    triple = createTuple(3),
    triplePulse = createTuplePulse(3),
    warm = createSigmoid(Math.PI),
    zero = new Float32Array([0, 0])

  for (let i = 0; i < equalFadeIn.length; i += 1) {
    const t = (i / (equalFadeIn.length - 1) * 2) - 1
    equalFadeIn[i] = Math.sqrt(0.5 * (1 + t))
  }

  const equalFadeOut = equalFadeIn.slice().reverse()

  for (let i = 0; i < square.length; i += 1) {
    square[i] = i < square.length / 2 ? -1 : 1
  }

  /**
   * @memberof syngen.audio.shape
   */
  function createBitcrush(depth = 16, samples = 2 ** 16) {
    const factor = 2 ** (depth - 1),
      shape = new Float32Array(samples)

    for (let i = 0; i < shape.length; i += 1) {
      const x = (i * 2 / (samples - 1)) - 1
      shape[i] = Math.round(x * factor) / factor
    }

    shape[samples - 1] = 1

    return shape
  }

  /**
   * @memberof syngen.audio.shape
   */
  function createNoise(variance = 2, samples = 2 ** 16) {
    const shape = new Float32Array(samples),
      srand = syngen.utility.srand('syngen.audio.shape.createNoise')

    const noise = () => srand(-variance, variance),
      y = (x) => syngen.utility.wrapAlternate(x + noise(), 0, 2) - 1

    for (let i = 0; i < shape.length; i += 1) {
      const x = i * 2 / (samples - 1)
      shape[i] = y(x)
    }

    shape[samples - 1] = y(2)

    return shape
  }

  /**
   * @memberof syngen.audio.shape
   */
  function createRandom(samples = 2, seed = '') {
    const shape = new Float32Array(samples),
      srand = syngen.utility.srand('syngen.audio.shape.createRandom', seed)

    for (let i = 0; i < samples; i += 1) {
      shape[i] = srand(-1, 1)
    }

    return shape
  }

  // NOTE: amount should be in radians
  /**
   * @memberof syngen.audio.shape
   */
  function createSigmoid(amount = 0, samples = 2 ** 16) {
    const shape = new Float32Array(samples)

    for (let i = 0; i < samples; i += 1) {
      const x = (i * 2 / samples) - 1
      shape[i] = x * (Math.PI + amount) / (Math.PI + (amount * Math.abs(x)))
    }

    return shape
  }

  /**
   * @memberof syngen.audio.shape
   */
  function createTuple(times = 1) {
    const samples = (times * 4) - 1,
      shape = new Float32Array(samples)

    for (let i = 0; i < samples; i += 1) {
      if (i % 2) {
        shape[i] = 0
        continue
      }

      if (i < samples / 2) {
        shape[i] = -(2 ** -(i / 2))
        continue
      }

      shape[i] = 2 ** -Math.floor((samples - i) / 2)
    }

    return shape
  }

  /**
   * @memberof syngen.audio.shape
   */
  function createTuplePulse(times = 1) {
    const samples = times * 2,
      shape = new Float32Array(samples)

    for (let i = 0; i < samples; i += 1) {
      shape[i] = i % 2 ? 0 : 2 ** -(i / 2)
    }

    return shape
  }

  return {
    createBitcrush,
    createNoise,
    createRandom,
    createSigmoid,
    createTuple,
    createTuplePulse,
    crush12: () => crush12,
    /**
     * @memberof syngen.audio.shape
     */
    crush6: () => crush6,
    /**
     * @memberof syngen.audio.shape
     */
    crush8: () => crush8,
    /**
     * @memberof syngen.audio.shape
     */
    distort: () => distort,
    /**
     * @memberof syngen.audio.shape
     */
    double: () => double,
    /**
     * @memberof syngen.audio.shape
     */
    doublePulse: () => doublePulse,
    /**
     * @memberof syngen.audio.shape
     */
    equalFadeIn: () => equalFadeIn,
    /**
     * @memberof syngen.audio.shape
     */
    equalFadeOut: () => equalFadeOut,
    /**
     * @memberof syngen.audio.shape
     */
    hot: () => hot,
    /**
     * @memberof syngen.audio.shape
     */
    invert: () => invert,
    /**
     * @memberof syngen.audio.shape
     */
    invertShape: (shape) => new Float32Array([...shape].reverse()),
    /**
     * @memberof syngen.audio.shape
     */
    linear: () => linear,
    /**
     * @memberof syngen.audio.shape
     */
    noise: () => noise,
    /**
     * @memberof syngen.audio.shape
     */
    noise2: () => noise2,
    /**
     * @memberof syngen.audio.shape
     */
    noise4: () => noise4,
    /**
     * @memberof syngen.audio.shape
     */
    noise8: () => noise8,
    /**
     * @memberof syngen.audio.shape
     */
    noise16: () => noise16,
    /**
     * @memberof syngen.audio.shape
     */
    noise32: () => noise32,
    /**
     * @memberof syngen.audio.shape
     */
    noiseZero: () => noiseZero,
    /**
     * @memberof syngen.audio.shape
     */
    offset: (offset = syngen.const.zeroGain) => new Float32Array([offset, offset]),
    /**
     * @memberof syngen.audio.shape
     */
    offsetShape: (shape, offset = syngen.const.zeroGain) => shape.map((value) => value + offset),
    /**
     * @memberof syngen.audio.shape
     */
    one: () => one,
    /**
     * @memberof syngen.audio.shape
     */
    pulse: () => pulse,
    /**
     * @memberof syngen.audio.shape
     */
    rectify: () => rectify,
    /**
     * @memberof syngen.audio.shape
     */
    rectifyShape: (shape) => shape.map(Math.abs),
    /**
     * @memberof syngen.audio.shape
     */
    reverseShape: (shape) => shape.slice().reverse(),
    /**
     * @memberof syngen.audio.shape
     */
    square: () => square,
    /**
     * @memberof syngen.audio.shape
     */
    triple: () => triple,
    /**
     * @memberof syngen.audio.shape
     */
    triplePulse: () => triplePulse,
    /**
     * @memberof syngen.audio.shape
     */
    warm: () => warm,
    /**
     * @memberof syngen.audio.shape
     */
    zero: () => zero,
  }
})()

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

/**
 * Returns a large reverb impulse.
 * @method
 * @returns {AudioBuffer}
 */
syngen.audio.buffer.impulse.large = (() => {
  const context = syngen.audio.context()

  const sampleRate = context.sampleRate,
    size = 4 * sampleRate

  const buffer = context.createBuffer(1, size, sampleRate)

  for (let n = 0; n < buffer.numberOfChannels; n += 1) {
    const data = buffer.getChannelData(n)
    for (let i = 0; i < size; i += 1) {
      const factor = ((size - i) / size) ** 8
      data[i] = factor * ((2 * Math.random()) - 1)
    }
  }

  return () => buffer
})()

/**
 * Returns a medium reverb impulse.
 * @method
 * @returns {AudioBuffer}
 */
syngen.audio.buffer.impulse.medium = (() => {
  const context = syngen.audio.context()

  const sampleRate = context.sampleRate,
    size = 2 * sampleRate

  const buffer = context.createBuffer(1, size, sampleRate)

  for (let n = 0; n < buffer.numberOfChannels; n += 1) {
    const data = buffer.getChannelData(n)
    for (let i = 0; i < size; i += 1) {
      const factor = ((size - i) / size) ** 6
      data[i] = factor * ((2 * Math.random()) - 1)
    }
  }

  return () => buffer
})()

/**
 * Returns a small reverb impulse.
 * @method
 * @returns {AudioBuffer}
 */
syngen.audio.buffer.impulse.small = (() => {
  const context = syngen.audio.context()

  const sampleRate = context.sampleRate,
    size = 1 * sampleRate

  const buffer = context.createBuffer(1, size, sampleRate)

  for (let n = 0; n < buffer.numberOfChannels; n += 1) {
    const data = buffer.getChannelData(n)
    for (let i = 0; i < size; i += 1) {
      const factor = ((size - i) / size) ** 4
      data[i] = factor * ((2 * Math.random()) - 1)
    }
  }

  return () => buffer
})()

/**
 * Returns Brownian noise with intensity inversely proportional to the frequency squared.
 * @method
 * @returns {AudioBuffer}
 */
syngen.audio.buffer.noise.brown = (() => {
  const context = syngen.audio.context()

  const sampleRate = context.sampleRate,
    size = 5 * sampleRate

  const buffer = context.createBuffer(1, size, sampleRate),
    data = buffer.getChannelData(0)

  let lastBrown = 0

  // SEE: https://noisehack.com/generate-noise-web-audio-api
  // SEE: https://github.com/mohayonao/brown-noise-node
  for (let i = 0; i < size; i += 1) {
    const white = (2 * Math.random()) - 1
    const brown = (lastBrown + (0.02 * white)) / 1.02

    data[i] = brown * 3.5
    lastBrown = brown
  }

  return () => buffer
})()

/**
 * Returns pink noise with intensity inversely proportional to the frequency.
 * @method
 * @returns {AudioBuffer}
 */
syngen.audio.buffer.noise.pink = (() => {
  const context = syngen.audio.context()

  const sampleRate = context.sampleRate,
    size = 5 * sampleRate

  const buffer = context.createBuffer(1, size, sampleRate),
    data = buffer.getChannelData(0)

  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0

  // SEE: https://noisehack.com/generate-noise-web-audio-api
  // SEE: https://github.com/mohayonao/pink-noise-node
  for (let i = 0; i < size; i += 1) {
    const white = (2 * Math.random()) - 1

    b0 = (0.99886 * b0) + (white * 0.0555179)
    b1 = (0.99332 * b1) + (white * 0.0750759)
    b2 = (0.96900 * b2) + (white * 0.1538520)
    b3 = (0.86650 * b3) + (white * 0.3104856)
    b4 = (0.55000 * b4) + (white * 0.5329522)
    b5 = (-0.7616 * b5) - (white * 0.0168980)

    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + (white * 0.5362)) * 0.11
    b6 = white * 0.115926
  }

  return () => buffer
})()

/**
 * Returns brown noise with equal intensity at all frequencies.
 * @method
 * @returns {AudioBuffer}
 */
syngen.audio.buffer.noise.white = (() => {
  const context = syngen.audio.context()

  const sampleRate = context.sampleRate,
    size = 5 * sampleRate

  const buffer = context.createBuffer(1, size, sampleRate),
    data = buffer.getChannelData(0)

  for (let i = 0; i < size; i += 1) {
    data[i] = (2 * Math.random()) - 1
  }

  return () => buffer
})()

/**
 * @implements syngen.utility.pubsub
 * @namespace
 */
syngen.audio.mixer.auxiliary.reverb = (() => {
  const context = syngen.audio.context(),
    input = context.createGain(),
    output = syngen.audio.mixer.createBus(),
    pubsub = syngen.utility.pubsub.create()

  let active = true,
    convolver = context.createConvolver()

  if (active) {
    input.connect(convolver)
  }

  convolver.buffer = syngen.audio.buffer.impulse.large()
  convolver.connect(output)

  return syngen.utility.pubsub.decorate({
    /**
     * @memberof syngen.audio.mixer.auxiliary.reverb
     */
    createSend: () => {
      const gain = context.createGain()
      gain.connect(input)
      return gain
    },
    /**
     * @memberof syngen.audio.mixer.auxiliary.reverb
     */
    isActive: () => active,
    /**
     * @memberof syngen.audio.mixer.auxiliary.reverb
     */
    output: () => output,
    /**
     * @memberof syngen.audio.mixer.auxiliary.reverb
     */
    setActive: function (state) {
      if (active == state) {
        return this
      }

      active = Boolean(state)

      if (active) {
        input.connect(convolver)
        pubsub.emit('activate')
      } else {
        input.disconnect(convolver)
        pubsub.emit('deactivate')
      }

      return this
    },
    /**
     * @memberof syngen.audio.mixer.auxiliary.reverb
     */
    setGain: function (gain, duration) {
      syngen.audio.ramp.linear(output.gain, gain, duration)
      return this
    },
    /**
     * @memberof syngen.audio.mixer.auxiliary.reverb
     */
    setImpulse: function (buffer) {
      input.disconnect()

      convolver = context.createConvolver()
      convolver.buffer = buffer
      convolver.connect(output)

      if (active) {
        input.connect(convolver)
      }

      return this
    },
  }, pubsub)
})()

/**
 * @static
 */
syngen.audio.mixer.bus.props = (() => {
  const bus = syngen.audio.mixer.createBus()
  return () => bus
})()

/**
 * @interface
 */
syngen.audio.binaural.monaural = {}

/**
 * @static
 */
syngen.audio.binaural.monaural.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.audio.binaural.monaural.prototype = {
  /**
   * @instance
   */
  construct: function ({
    pan = 0,
  }) {
    const context = syngen.audio.context()

    this.panSign = syngen.utility.sign(pan)
    this.angleOffset = -this.panSign * Math.PI / 2

    this.filter = context.createBiquadFilter()
    this.gain = context.createGain()

    this.filter.frequency.value = syngen.const.maxFrequency
    this.gain.gain.value = syngen.const.zeroGain

    this.delay = context.createDelay()
    this.gain.connect(this.delay)
    this.delay.connect(this.filter)

    return this
  },
  /**
   * @instance
   */
  destroy: function () {
    this.filter.disconnect()
    return this
  },
  /**
   * @instance
   */
  from: function (input, ...args) {
    input.connect(this.gain, ...args)
    return this
  },
  /**
   * @instance
   */
  to: function (output, ...args) {
    this.filter.connect(output, ...args)
    return this
  },
  /**
   * @instance
   */
  update: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    // NOTE: Observer is facing 0° at (0, 0)
    const ear = syngen.utility.vector3d.create({
      x,
      y: y + (this.panSign * syngen.const.binauralHeadWidth / 2),
      z,
    }).rotateEuler({yaw: this.angleOffse})

    const distance = ear.distance(),
      distancePower = syngen.utility.distanceToPower(distance)

    const shadow = ear.rotateEuler({
      yaw: this.panSign * syngen.const.binauralShadowOffset,
    }).euler()

    // TODO: Simulate shadow as a 3D cone?
    const shadowCos = Math.cos(shadow.yaw)
    const isAhead = shadowCos > 0

    const shadowTarget = isAhead
      ? syngen.utility.lerp(0.75, 1, shadowCos)
      : syngen.utility.lerp(0, 0.75, 1 + shadowCos)

    const shadowRolloff = syngen.utility.clamp(syngen.utility.scale(distance, 0, syngen.const.binauralShadowRolloff, 0, 1), 0, 1),
      shadowStrength = syngen.utility.lerp(1, shadowTarget, shadowRolloff)

    const delayTime = Math.min(1, distance / syngen.const.speedOfSound),
      filterFrequency = syngen.utility.lerpExp(syngen.const.acousticShadowFrequency, syngen.const.maxFrequency, shadowStrength),
      inputGain = syngen.utility.clamp(distancePower, syngen.const.zeroGain, 1)

    syngen.audio.ramp.set(this.delay.delayTime, delayTime)
    syngen.audio.ramp.set(this.filter.frequency, filterFrequency)
    syngen.audio.ramp.set(this.gain.gain, inputGain)

    return this
  },
}

/**
 * @interface
 */
syngen.audio.send.reverb = {}

/**
 * @static
 */
syngen.audio.send.reverb.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.audio.send.reverb.prototype = {
  /**
   * @instance
   */
  construct: function () {
    const context = syngen.audio.context()

    this.input = context.createGain()
    this.delay = context.createDelay()
    this.send = syngen.audio.mixer.auxiliary.reverb.createSend()

    this.relative = syngen.utility.vector3d.create()

    this.onSendActivate = this.onSendActivate.bind(this)
    syngen.audio.mixer.auxiliary.reverb.on('activate', this.onSendActivate)

    this.onSendDeactivate = this.onSendDeactivate.bind(this)
    syngen.audio.mixer.auxiliary.reverb.on('deactivate', this.onSendDeactivate)

    if (syngen.audio.mixer.auxiliary.reverb.isActive()) {
      this.onSendActivate()
    } else {
      this.onSendDeactivate()
    }

    return this
  },
  /**
   * @instance
   */
  destroy: function () {
    syngen.audio.mixer.auxiliary.reverb.off('activate', this.onSendActivate)
    syngen.audio.mixer.auxiliary.reverb.off('deactivate', this.onSendDeactivate)
    this.send.disconnect()
    return this
  },
  /**
   * @instance
   */
  from: function (input) {
    input.connect(this.input)
    return this
  },
  /**
   * @instance
   */
  onSendActivate: function () {
    this.update(this.relative)
    this.input.connect(this.delay)
    this.delay.connect(this.send)
    return this
  },
  /**
   * @instance
   */
  onSendDeactivate: function () {
    this.input.disconnect()
    this.delay.disconnect()
    return this
  },
  /**
   * @instance
   */
  update: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    this.relative.set({
      x,
      y,
      z,
    })

    if (!syngen.audio.mixer.auxiliary.reverb.isActive()) {
      return this
    }

    // TODO: Consider a distance model that doesn't rely on syngen.streamer.getRadius()
    // e.g. a constant ratio that forces users to turn reverb send way down
    // BUT what's nice about this solution is close sounds are present and further are roomy

    const distance = this.relative.distance(),
      distancePower = syngen.utility.distanceToPower(distance),
      distanceRatio = 0.5 + (syngen.utility.clamp(distance / syngen.streamer.getRadius(), 0, 1) * 0.5)

    const delayTime = syngen.utility.clamp(distance / syngen.const.speedOfSound, syngen.const.zeroTime, 1),
      inputGain = syngen.utility.clamp(distancePower * distanceRatio, syngen.const.zeroGain, 1)

    syngen.audio.ramp.set(this.delay.delayTime, delayTime)
    syngen.audio.ramp.set(this.input.gain, inputGain)

    return this
  },
}

/**
 * Provides an event-driven main loop for the application.
 * Systems can subscribe to each frame and respond to state changes.
 * Beware that the loop remains running while paused, which they must choose to respect.
 * @implements syngen.utility.pubsub
 * @namespace
 */
syngen.loop = (() => {
  const pubsub = syngen.utility.pubsub.create()

  let activeRequest,
    delta = 0,
    frameCount = 0,
    idleRequest,
    isRunning = false,
    lastFrame = 0,
    time = 0

  function cancelFrame() {
    cancelAnimationFrame(activeRequest)
    clearTimeout(idleRequest)
  }

  function doActiveFrame() {
    const now = performance.now()

    delta = (now - lastFrame) / 1000
    lastFrame = now

    frame()
  }

  function doIdleFrame() {
    delta = syngen.const.idleDelta
    lastFrame = performance.now()

    frame()
  }

  function getNextIdleDelay() {
    const deltaTime = lastFrame ? performance.now() - lastFrame : 0
    return Math.max(0, (syngen.const.idleDelta * 1000) - deltaTime)
  }

  function frame() {
    frameCount += 1
    time += delta

    /**
     * Fired every loop frame.
     * @event syngen.loop#event:frame
     * @property {Number} delta - Time elapsed since last frame
     * @property {Number} frame - Current frame count of loop
     * @property {Boolean} paused - Whether the loop is paused
     * @property {Number} time - Total elapsed time of loop
     * @type {Object}
     */
    pubsub.emit('frame', {
      delta,
      frame: frameCount,
      paused: !isRunning,
      time,
    })

    scheduleFrame()
  }

  function scheduleFrame() {
    if (document.hidden) {
      idleRequest = setTimeout(doIdleFrame, getNextIdleDelay())
    } else {
      activeRequest = requestAnimationFrame(doActiveFrame)
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (!isRunning) {
      return
    }

    cancelFrame()
    scheduleFrame()
  })

  return syngen.utility.pubsub.decorate({
    /**
     * Returns the time elapsed since the previous frame.
     * @memberof syngen.loop
     * @returns {Number}
     */
    delta: () => delta,
    /**
     * Returns the current frame number since the loop began.
     * @memberof syngen.loop
     * @returns {Number}
     */
    frame: () => frameCount,
    /**
     * Returns whether the loop is currently paused.
     * @memberof syngen.loop
     * @returns {Boolean}
     */
    isPaused: () => !isRunning,
    /**
     * Returns whether the loop is currently running.
     * @memberof syngen.loop
     * @returns {Boolean}
     */
    isRunning: () => isRunning,
    /**
     * Pauses the loop.
     * @fires syngen.loop#event:pause
     * @memberof syngen.loop
     */
    pause: function () {
      if (!isRunning) {
        return this
      }

      isRunning = false

      /**
       * Fired when the loop is paused.
       * @event syngen.loop#event:pause
       */
      pubsub.emit('pause')

      return this
    },
    /**
     * Resumes the loop.
     * @fires syngen.loop#event:resume
     * @memberof syngen.loop
     */
    resume: function () {
      if (isRunning) {
        return this
      }

      isRunning = true

      /**
       * Fired when the loop is resumed.
       * @event syngen.loop#event:resume
       */
      pubsub.emit('resume')

      return this
    },
    /**
     * Starts the loop.
     * @fires syngen.loop#event:start
     * @memberof syngen.loop
     * @todo Deprecate and always leave running
     */
    start: function () {
      if (isRunning) {
        return this
      }

      isRunning = true
      lastFrame = performance.now()

      scheduleFrame()

      /**
       * Fired when the loop starts.
       * @event syngen.loop#event:start
       * @todo Deprecate
       */
      pubsub.emit('start')

      return this
    },
    /**
     * Stops the loop.
     * @fires syngen.loop#event:stop
     * @memberof syngen.loop
     * @todo Deprecate and always leave running
     */
    stop: function () {
      if (!isRunning) {
        return this
      }

      cancelFrame()

      delta = 0
      frameCount = 0
      isRunning = false
      lastFrame = 0
      time = 0

      /**
       * Fired when the loop stops.
       * @event syngen.loop#event:stop
       * @todo Deprecate
       */
      pubsub.emit('stop')

      return this
    },
    /**
     * Returns the time elapsed since the loop began.
     * @memberof syngen.loop
     * @returns {Number}
     */
    time: () => time,
  }, pubsub)
})()

/**
 * Queries gamepad input once per frame and exposes its state.
 * @namespace
 */
syngen.input.gamepad = (() => {
  let deadzone = 0.1875

  let state = {
    analog: {},
    axis: {},
    digital: {},
  }

  function applyDeadzone(value) {
    const ratio = (Math.abs(value) - deadzone) / (1 - deadzone)

    return ratio > 0
      ? syngen.utility.sign(value) * ratio
      : 0
  }

  return {
    /**
     * Returns the gamepad state.
     * @memberof syngen.input.gamepad
     * @returns {Object}
     */
    get: () => ({
      analog: {...state.analog},
      axis: {...state.axis},
      digital: {...state.digital},
    }),
    /**
     * Returns the analog input for `button`.
     * @memberof syngen.input.gamepad
     * @param {Number} button
     * @param {Boolean} [invert=false]
     * @returns {Number}
     */
    getAnalog: function (button, invert = false) {
      const value = state.analog[button] || 0

      if (invert && value) {
        return 1 - value
      }

      return value
    },
    /**
     * Returns the analog input for `axis`.
     * @memberof syngen.input.gamepad
     * @param {Number} axis
     * @param {Boolean} [invert=false]
     * @returns {Number}
     */
    getAxis: function (axis, invert = false) {
      const value = state.axis[axis] || 0

      if (invert && value) {
        return -1 * value
      }

      return value
    },
    /**
     * Returns whether one or more `axes` exist.
     * @memberof syngen.input.gamepad
     * @param {...Number} ...axes
     * @returns {Number}
     */
    hasAxis: function (...axes) {
      for (const axis of axes) {
        if (!(axis in state.axis)) {
          return false
        }
      }

      return true
    },
    /**
     * Returns whether `button` is pressed.
     * @memberof syngen.input.gamepad
     * @param {Number} button
     * @returns {Number}
     */
    isDigital: (button) => Boolean(state.digital[button]),
    /**
     * Resets the gamepad state.
     * @memberof syngen.input.gamepad
     */
    reset: function () {
      state = {
        analog: {},
        axis: {},
        digital: {},
      }

      return this
    },
    /**
     * Sets the deadzone for axis input under which smaller values are considered zero.
     * @memberof syngen.input.gamepad
     * @param {Number} [value=0]
     *   Float within `[0, 1]`.
     *   For best results use a small configurable value.
     */
    setDeadzone: function (value = 0) {
      deadzone = Number(value) || 0
      return this
    },
    /**
     * Queries the gamepad state.
     * @listens syngen.loop#event:frame
     * @memberof syngen.input.gamepad
     */
    update: function () {
      const gamepads = navigator.getGamepads()

      this.reset()

      for (const gamepad of gamepads) {
        if (!gamepad) {
          continue
        }

        gamepad.axes.forEach((value, i) => {
          value = applyDeadzone(value)

          if (!(i in state.axis)) {
            state.axis[i] = 0
          }

          state.axis[i] = syngen.utility.clamp(state.axis[i] + value, -1, 1) || 0
        })

        gamepad.buttons.forEach((button, i) => {
          if (!(i in state.analog)) {
            state.analog[i] = 0
          }

          state.analog[i] = Math.min(state.analog[i] + button.value, 1) || 0
          state.digital[i] |= button.pressed
        })
      }

      return this
    },
  }
})()

syngen.loop.on('frame', () => syngen.input.gamepad.update())

/**
 * Exposes keypresses by their codes.
 * @namespace
 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
 */
syngen.input.keyboard = (() => {
  let state = {}

  window.addEventListener('keydown', onKeydown)
  window.addEventListener('keyup', onKeyup)

  function onKeydown(e) {
    if (e.repeat) {
      return
    }

    state[e.code] = true
  }

  function onKeyup(e) {
    state[e.code] = false
  }

  return {
    /**
     * Returns a hash of all pressed keys, keyed by code.
     * For example, if <kbd>F</kbd> is pressed, then `KeyF` is `true`.
     * @memberof syngen.input.keyboard
     * @returns {Object}
     */
    get: () => ({...state}),
    /**
     * Returns whether the key with `code` is pressed.
     * @memberof syngen.input.keyboard
     * @param {String} code
     * @returns {Boolean}
     */
    is: (code) => state[code] || false,
    /**
     * Resets all pressed keys.
     * @memberof syngen.input.keyboard
     */
    reset: function () {
      state = {}
      return this
    },
  }
})()

/**
 * Exposes mouse movement, scrolling, and buttons pressed.
 * @namespace
 */
syngen.input.mouse = (() => {
  let state = {
    button: {},
    moveX: 0,
    moveY: 0,
    wheelX: 0,
    wheelY: 0,
    wheelZ: 0,
  }

  window.addEventListener('mousedown', onMousedown)
  window.addEventListener('mousemove', onMousemove)
  window.addEventListener('mouseup', onMouseup)
  window.addEventListener('wheel', onWheel)

  function onMousedown(e) {
    state.button[e.button] = true
  }

  function onMousemove(e) {
    state.moveX += e.movementX
    state.moveY += e.movementY
  }

  function onMouseup(e) {
    state.button[e.button] = false
  }

  function onWheel(e) {
    state.wheelX += e.deltaX
    state.wheelY += e.deltaY
    state.wheelZ += e.deltaZ
  }

  return {
    /**
     * Returns the mouse state.
     * @memberof syngen.input.mouse
     * @returns {Object}
     */
    get: () => ({
      ...state,
      button: {...state.button},
    }),
    /**
     * Returns any movement along the x-axis during the previous frame, in pixels.
     * @memberof syngen.input.mouse
     * @returns {Number}
     */
    getMoveX: () => state.moveX || 0,
    /**
     * Returns any movement along the y-axis during the previous frame, in pixels.
     * @memberof syngen.input.mouse
     * @returns {Number}
     */
    getMoveY: () => state.moveY || 0,
    /**
     * Returns any scrolling along the x-axis during the previous frame.
     * Beware that this is unitless.
     * @memberof syngen.input.mouse
     * @returns {Number}
     * @todo Consider {@link https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaMode|WheelEvent.deltaMode} to normalize values across devices
     */
    getWheelX: () => state.wheelX || 0,
    /**
     * Returns any scrolling along the y-axis during the previous frame.
     * Beware that this is unitless.
     * @memberof syngen.input.mouse
     * @returns {Number}
     * @todo Consider {@link https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaMode|WheelEvent.deltaMode} to normalize values across devices
     */
    getWheelY: () => state.wheelY || 0,
    /**
     * Returns any scrolling along the z-axis during the previous frame.
     * Beware that this is unitless.
     * @memberof syngen.input.mouse
     * @returns {Number}
     * @todo Consider {@link https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaMode|WheelEvent.deltaMode} to normalize values across devices
     */
    getWheelZ: () => state.wheelZ || 0,
    /**
     * Returns whether `button` is pressed.
     * @memberof syngen.input.mouse
     * @param {Number} button
     * @returns {boolean}
     * @see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
     */
    isButton: (button) => state.button[button] || false,
    /**
     * Resets the mouse state.
     * @memberof syngen.input.mouse
     */
    reset: function () {
      state = {
        button: {},
        moveX: 0,
        moveY: 0,
        wheelX: 0,
        wheelY: 0,
        wheelZ: 0,
      }

      return this
    },
    /**
     * Resets scrolling and movement at the next JavaScript event loop.
     * This allows {@link syngen.loop#event:frame} listeners to query these values before they reset between frames.
     * @listens syngen.loop#event:frame
     * @memberof syngen.input.mouse
     */
    update: function () {
      setTimeout(() => {
        state.moveX = 0
        state.moveY = 0

        state.wheelX = 0
        state.wheelY = 0
        state.wheelZ = 0
      })

      return this
    },
  }
})()

syngen.loop.on('frame', () => syngen.input.mouse.update())

/**
 * Calculates and exposes real-time performance metrics.
 * @namespace
 */
syngen.performance = (() => {
  const deltas = [],
    maxFrames = 30

  let index = 0,
    medianDelta = 0,
    medianFps = 0

  return {
    /**
     * Returns the median duration of frames.
     * @memberof syngen.performance
     * @returns {Number}
     */
    delta: () => medianDelta,
    /**
     * Returns the average number of frames per second.
     * @memberof syngen.performance
     * @returns {Number}
     */
    fps: () => medianFps,
    /**
     * Recalculates performance metrics.
     * @listens syngen.loop#event:frame
     * @memberof syngen.performance
     */
    update: function ({delta}) {
      deltas[index] = delta

      if (index < maxFrames - 1) {
        index += 1
      } else {
        index = 0
      }

      const sortedDeltas = deltas.slice().sort()

      medianDelta = syngen.utility.choose(sortedDeltas, 0.5)
      medianFps = 1 / medianDelta

      return this
    },
  }
})()

syngen.loop.on('frame', (e) => syngen.performance.update(e))

/**
 * Maintains the coordinates, orientation, and velocities of the observer.
 * The observer is a physical object that has volume and can be applied lateral and angular forces.
 * Its position affects the relative positioning of props and can be used to influence other systems.
 * @namespace
 */
syngen.position = (() => {
  const proxy = syngen.utility.physical.decorate({})

  return {
    /**
     * Returns the inner state.
     * The inverse of {@link syngen.position.import|import()}.
     * @listens syngen.state#event:export
     * @memberof syngen.position
     * @returns {Object}
     */
    export: () => ({
      quaternion: {
        w: proxy.quaternion.w,
        x: proxy.quaternion.x,
        y: proxy.quaternion.y,
        z: proxy.quaternion.z,
      },
      x: proxy.x,
      y: proxy.y,
      z: proxy.z,
    }),
    /**
     * Returns the angular velocity.
     * @memberof syngen.position
     * @returns {syngen.utility.quaternion}
     */
    getAngularVelocity: () => proxy.angularVelocity.clone(),
    /**
     * Returns the angular velocity.
     * Beware that this is less performant than using quaternions and can result in gimbal lock.
     * @memberof syngen.position
     * @returns {syngen.utility.euler}
     */
    getAngularVelocityEuler: () => syngen.utility.euler.fromQuaternion(proxy.angularVelocity),
    /**
     * Returns the orientation.
     * Beware that this is less performant than using quaternions and can result in gimbal lock.
     * @memberof syngen.position
     * @returns {syngen.utility.euler}
     */
    getEuler: () => proxy.euler(),
    /**
     * Returns the oriantation.
     * @memberof syngen.position
     * @returns {syngen.utility.quaternion}
     */
    getQuaternion: () => proxy.quaternion.clone(),
    /**
     * Returns the coordinates.
     * @memberof syngen.position
     * @returns {syngen.utility.vector3d}
     */
    getVector: () => proxy.vector(),
    /**
     * Returns the velocity.
     * @memberof syngen.position
     * @returns {syngen.utility.vector3d}
     */
    getVelocity: () => proxy.velocity.clone(),
    /**
     * Sets the inner state.
     * The inverse of {@link syngen.position.export|export()}.
     * @listens syngen.state#event:import
     * @memberof syngen.position
     * @param {Object} [options]
     * @param {syngen.utility.quaternion} [options.quaternion]
     * @param {Number} [options.x=0]
     * @param {Number} [options.y=0]
     * @param {Number} [options.z=0]
     */
    import: function ({
      quaternion = syngen.utility.quaternion.identity(),
      x = 0,
      y = 0,
      z = 0,
    } = {}) {
      proxy.x = x
      proxy.y = y
      proxy.z = z

      proxy.quaternion.set(quaternion)
      proxy.resetPhysics()

      return this
    },
    /**
     * Returns the rectangular prism surrounding the observer.
     * @memberof syngen.position
     * @returns {Object}
     */
    rect: () => ({
      depth: syngen.const.positionRadius * 2,
      height: syngen.const.positionRadius * 2,
      width: syngen.const.positionRadius * 2,
      x: proxy.x - syngen.const.positionRadius,
      y: proxy.y - syngen.const.positionRadius,
      z: proxy.z - syngen.const.positionRadius,
    }),
    /**
     * Resets all attributes to zero.
     * @listens syngen.state#event:reset
     * @memberof syngen.position
     */
    reset: function () {
      return this.import()
    },
    /**
     * Sets the angular velocity.
     * @memberof syngen.position
     * @param {syngen.utility.quaternion} [options]
     */
    setAngularVelocity: function ({
      w = 0,
      x = 0,
      y = 0,
      z = 0,
    } = syngen.utility.quaternion.identity()) {
      proxy.angularVelocity.set({
        w,
        x,
        y,
        z,
      })

      return this
    },
    /**
     * Sets the angular velocity.
     * Beware that this is less performant than using quaternions and can result in gimbal lock.
     * @memberof syngen.position
     * @param {syngen.utility.euler}
     */
    setAngularVelocityEuler: function ({
      pitch = 0,
      roll = 0,
      yaw = 0,
    } = {}) {
      proxy.angularVelocity.set(
        syngen.utility.quaternion.fromEuler({
          pitch,
          roll,
          yaw,
        })
      )

      return this
    },
    /**
     * Sets the orientation.
     * Beware that this is less performant than using quaternions and can result in gimbal lock.
     * @memberof syngen.position
     * @param {syngen.utility.euler} [options]
     */
    setEuler: function ({
      pitch = 0,
      roll = 0,
      yaw = 0,
    } = {}) {
      proxy.quaternion.set(
        syngen.utility.quaternion.fromEuler({
          pitch,
          roll,
          yaw,
        })
      )

      return this
    },
    /**
     * Sets the orientation
     * @memberof syngen.position
     * @param {syngen.utility.quaternion} [options]
     */
    setQuaternion: function ({
      w = 0,
      x = 0,
      y = 0,
      z = 0,
    } = syngen.utility.quaternion.identity()) {
      proxy.quaternion.set({
        w,
        x,
        y,
        z,
      })

      return this
    },
    /**
     * Sets the coordinates.
     * @memberof syngen.position
     * @param {syngen.utility.vector3d} [options]
     */
    setVector: function ({
      x = 0,
      y = 0,
      z = 0,
    } = {}) {
      proxy.x = x
      proxy.y = y
      proxy.z = z

      return this
    },
    /**
     * Sets the velocity.
     * @memberof syngen.position
     * @param {syngen.utility.vector3d} [options]
     */
    setVelocity: function ({
      x = 0,
      y = 0,
      z = 0,
    } = {}) {
      proxy.velocity.set({
        x,
        y,
        z,
      })

      return this
    },
    /**
     * Applies physics to the inner state.
     * @listens syngen.loop#event:frame
     * @memberof syngen.position
     */
    update: function () {
      proxy.updatePhysics()
      return this
    },
  }
})()

syngen.loop.on('frame', ({paused}) => {
  if (paused) {
    return
  }

  syngen.position.update()
})

syngen.state.on('export', (data = {}) => data.position = syngen.position.export())
syngen.state.on('import', (data = {}) => syngen.position.import(data.position))
syngen.state.on('reset', () => syngen.position.reset())

/**
 * The most basic prop that exists on the soundstage.
 * With its {@link syngen.prop.base.invent|invent} method, implementations can extend and create a hierarchy of prototypes with a variety of sounds and behaviors.
 * Instances must be created and destroyed via {@link syngen.props}.
 * @augments syngen.utility.physical
 * @interface
 * @todo Allow reverb to be optional with a flag on the prototype
 * @todo Move {@link syngen.const.propFadeDuration} to a static property
 * @todo Remove periodic methods as they are specific to example projects
 */
syngen.prop.base = {
  /**
   * Binaural processor for the prop.
   * @instance
   * @type {syngen.audio.binaural}
   */
  binaural: undefined,
  /**
   * Instantiates the prop with `options` and fades in its volume.
   * Derivative props are discouraged from overriding this method.
   * Instead they should define an {@link syngen.prop.base#onConstruct|onConstruct} method.
   * @instance
   * @param {Object} [options]
   * @param {AudioDestinationNode|GainNode} [options.destination={@link syngen.audio.mixer.bus.props|syngen.audio.mixer.bus.props()}]
   * @param {Number} [options.radius]
   *   Defaults to the prototype's radius.
   * @param {String} [options.token={@link syngen.utility.uuid|syngen.utility.uuid()}]
   * @param {Number} [options.x=0]
   * @param {Number} [options.y=0]
   * @param {Number} [options.z=0]
   * @see syngen.prop.base#onConstruct
   * @see syngen.props.create
   */
  construct: function ({
    destination = syngen.audio.mixer.bus.props(),
    radius = this.radius || 0,
    token = syngen.utility.uuid(),
    x = 0,
    y = 0,
    z = 0,
    ...options
  } = {}) {
    const context = syngen.audio.context()

    this.binaural = syngen.audio.binaural.create()
    this.instantiated = true
    this.periodic = {}
    this.output = context.createGain()
    this.radius = radius
    this.reverb = syngen.audio.send.reverb.create()
    this.token = token
    this.x = x
    this.y = y
    this.z = z

    this.binaural.from(this.output)
    this.binaural.to(destination)

    this.reverb.from(this.output)

    this.output.gain.value = syngen.const.zeroGain
    syngen.audio.ramp.linear(this.output.gain, 1, syngen.const.propFadeDuration)

    syngen.utility.physical.decorate(this)

    this.recalculate()
    this.onConstruct(options)

    return this
  },
  /**
   * Prepares the prop for garbage collection and fades out its volume.
   * Derivative props are discouraged from overriding this method.
   * Instead they should define an {@link syngen.prop.base#onConstruct|onDestroy} method.
   * @instance
   * @see syngen.prop.base#onDestroy
   * @see syngen.props.destroy
   */
  destroy: function () {
    syngen.audio.ramp.linear(this.output.gain, syngen.const.zeroGain, syngen.const.propFadeDuration)

    setTimeout(() => {
      this.output.disconnect()
      this.binaural.destroy()
      this.reverb.destroy()
      this.onDestroy()
    }, syngen.const.propFadeDuration * 1000)

    return this
  },
  /**
   * The distance of the prop relative to the observer's coordinates.
   * @instance
   * @type {Number}
   */
  distance: undefined,
  /**
   * @deprecated
   * @instance
   */
  handlePeriodic: function ({
    delay = () => 0,
    key = '',
    trigger = () => Promise.resolve(),
  } = {}) {
    if (!(key in this.periodic)) {
      this.periodic[key] = {
        active: false,
        timer: delay() * Math.random(),
      }
    }

    const periodic = this.periodic[key]

    if (periodic.active) {
      return this
    }

    if (periodic.timer < 0) {
      periodic.timer = delay()
    }

    periodic.timer -= syngen.loop.delta()

    if (periodic.timer <= 0) {
      const result = trigger() || Promise.resolve()
      periodic.active = true
      periodic.timer = -Infinity // XXX: Force delay() next inactive frame
      result.then(() => periodic.active = false)
    }

    return this
  },
  /**
   * @deprecated
   * @instance
   */
  hasPeriodic: function (key) {
    return key in this.periodic
  },
  /**
   * Indicates whether the prop has been instantiated.
   * @instance
   * @type {Boolean}
   */
  instantiated: false,
  /**
   * Invents a new prototype with `definition` that inherits the prototype from this prop.
   * @param {Object} definition
   * @returns {syngen.prop.base}
   * @static
   */
  invent: function (definition = {}) {
    if (typeof definition == 'function') {
      definition = definition(this)
    }

    return Object.setPrototypeOf({...definition}, this)
  },
  /**
   * @deprecated
   * @instance
   */
  isPeriodicActive: function (key) {
    return this.periodic[key] && this.periodic[key].active
  },
  /**
   * @deprecated
   * @instance
   */
  isPeriodicPending: function (key) {
    return this.periodic[key] && !this.periodic[key].active
  },
  /**
   * Identifier of the prop type.
   * Instances are discouraged from modifying this.
   * @type {String}
   */
  name: 'base',
  /**
   * Called after a prop is instantiated.
   * Props should define this method to perform setup tasks after being constructed.
   * @instance
   * @see syngen.prop.base#construct
   */
  onConstruct: () => {},
  /**
   * Called before a prop is destroyed.
   * Props should define this method to perform tear tasks before being destroyed.
   * @instance
   * @see syngen.prop.base#destroy
   */
  onDestroy: () => {},
  /**
   * Called when a prop is updated.
   * Props should define this method to perform tasks every frame.
   * @instance
   * @see syngen.prop.base#update
   */
  onUpdate: () => {},
  /**
   * Main output for audio synthesis and playback.
   * This is not connected directly to the main audio destination; rather, it's routed through the binaural and reverb sends.
   * On creation and destruction its gain is ramped to fade in and out per {@link syngen.const.propFadeDuration}.
   * It's not recommended to modify its gain directly.
   * @instance
   * @type {GainNode}
   */
  output: undefined,
  /**
   * Radius of the prop, in meters.
   * @instance
   * @type {Number}
   */
  radius: 0,
  /**
   * Recalculates the prop's relative coordinates and distance, binaural circuit, and reverb send.
   * @instance
   * @see syngen.prop.base#binaural
   * @see syngen.prop.base#distance
   * @see syngen.prop.base#relative
   * @see syngen.prop.base#reverb
   */
  recalculate: function () {
    const positionQuaternion = syngen.position.getQuaternion(),
      positionVector = syngen.position.getVector()

    this.relative = this.vector()
      .subtract(positionVector)
      .subtractRadius(this.radius)
      .rotateQuaternion(positionQuaternion.conjugate())

    this.distance = this.relative.distance()

    this.binaural.update({...this.relative})
    this.reverb.update({...this.relative})

    return this
  },
  /**
   * Returns the rectangular prism surrounding the prop.
   * @instance
   * @returns {Object}
   */
  rect: function () {
    return {
      depth: this.radius * 2,
      height: this.radius * 2,
      width: this.radius * 2,
      x: this.x - this.radius,
      y: this.y - this.radius,
      z: this.y - this.radius,
    }
  },
  /**
   * The coordinates of the prop relative to the observer's coordinates and orientation.
   * @instance
   * @type {syngen.utility.vector3d}
   */
  relative: undefined,
  /**
   * @deprecated
   * @instance
   */
  resetPeriodic: function (key) {
    delete this.periodic[key]
    return this
  },
  /**
   * Reverb send for the prop.
   * @instance
   * @type {syngen.audio.send.reverb}
   */
  reverb: undefined,
  /**
   * Universally unique identifier provided during instantiation.
   * @instance
   * @name syngen.prop.base#token
   * @type {String}
   */
   token: undefined,
  /**
   * Called every frame.
   * Derivative props are discouraged from overriding this method.
   * Instead they should define an {@link syngen.prop.base#onConstruct|onUpdate} method.
   * @instance
   * @see syngen.prop.base#onUpdate
   * @see syngen.props.update
   */
  update: function ({
    paused,
  } = {}) {
    this.onUpdate.apply(this, arguments)

    if (paused) {
      return this
    }

    this.updatePhysics()
    this.recalculate()

    return this
  },
}

/**
 * A null prop model for use in exceptional cases.
 * @implements syngen.prop.base
 * @interface
 */
syngen.prop.null = syngen.prop.base.invent({
  name: 'null',
})

/**
 * Provides a helper for instantiating, destroying, and updating all props each frame.
 * Implementations are encouraged to use this for handling these tasks.
 * @namespace
 */
syngen.props = (() => {
  const props = new Set()

  function isValidPrototype(prototype) {
    return syngen.prop.base.isPrototypeOf(prototype)
  }

  return {
    /**
     * Instantiates a prop of `prototype` with `options`.
     * @memberof syngen.props
     * @param {syngen.prop.base} prototype
     * @param {Object} [options]
     */
    create: function (prototype, options = {}) {
      if (!isValidPrototype(prototype)) {
        prototype = syngen.prop.null
      }

      const prop = Object.create(prototype).construct(options)
      props.add(prop)

      return prop
    },
    /**
     * Destroys the passed prop(s).
     * @memberof syngen.props
     * @param {...syngen.prop.base} ...props
     */
    destroy: function (...props) {
      for (const prop of props) {
        if (prop.destroy) {
          prop.destroy()
        }

        props.delete(prop)
      }

      return this
    },
    /**
     * Returns all props.
     * @memberof syngen.props
     * @returns {syngen.prop.base[]}
     */
    get: () => [...props],
    /**
     * Destroys all props.
     * @listens syngen.state#event:reset
     * @memberof syngen.props
     */
    reset: function () {
      props.forEach((prop) => prop.destroy())
      props.clear()
      return this
    },
    /**
     * Updates all props.
     * @listens syngen.loop#event:frame
     * @memberof syngen.props
     */
    update: function ({...options} = {}) {
      props.forEach((prop) => prop.update({...options}))
      return this
    },
  }
})()

syngen.loop.on('frame', (e) => syngen.props.update(e))
syngen.state.on('reset', () => syngen.props.reset())

/**
 * Provides a helper for conserving resources by only streaming eligible props.
 * Systems can register and deregister props for streaming.
 * Props are dynamically instantiated and destroyed based on their eligibility.
 * Eligibility is determined by a configurable maximum distance from the observer, sorting, and limits.
 * @namespace
 */
syngen.streamer = (() => {
  const registry = new Map(),
    registryTree = syngen.utility.octree.create(),
    streamed = new Map()

  let currentVector = syngen.utility.vector3d.create(),
    limit = Infinity,
    radius = syngen.const.speedOfSound,
    shouldForce = false,
    sort = (a, b) => a.distance - b.distance

  function createRegisteredProp(token) {
    if (!registry.has(token)) {
      return
    }

    const {options, prototype} = registry.get(token)
    const prop = syngen.props.create(prototype, options)

    streamed.set(token, prop)
  }

  function destroyStreamedProp(token) {
    if (!streamed.has(token)) {
      return
    }

    const prop = streamed.get(token)

    syngen.props.destroy(prop)
    streamed.delete(token)
  }

  function generateToken() {
    let token

    do {
      token = syngen.utility.uuid()
    } while (registry.has(token))

    return token
  }

  function getStreamableProps() {
    const props = [
      // Select nearby registered props and coerce into instances of prototype
      // so it's easier to sort and limit them (e.g. check prototype or options)
      // (the instantiated flag should indicate whether spawned)
      ...registryTree.retrieve({
        depth: radius * 2,
        height: radius * 2,
        width: radius * 2,
        x: currentVector.x - radius,
        y: currentVector.y - radius,
        z: currentVector.z - radius,
      }).filter(({token}) => !streamed.has(token)).map((registeredProp) => Object.setPrototypeOf({
        ...registeredProp.options,
        distance: currentVector.distance(registeredProp),
      }, registeredProp.prototype)),

      // Currently streamed props
      ...streamed.values(),
    ].filter((prop) => prop.distance <= radius)

    if (!isFinite(limit)) {
      return props
    }

    return props.sort(sort).slice(0, limit)
  }

  return {
    /**
     * Deregisters the streamed prop with `token`.
     * Beware that it isn't destroyed.
     * @memberof syngen.streamer
     * @param {String} token
     */
    deregisterProp: function(token) {
      const registeredProp = registry.get(token)

      if (!registeredProp) {
        return this
      }

      registry.delete(token)
      registryTree.remove(registeredProp)

      return this
    },
    /**
     * Destroys the streamed prop with `token`.
     * Beware that it isn't deregistered.
     * @memberof syngen.streamer
     * @param {String} token
     */
    destroyStreamedProp: function (token) {
      destroyStreamedProp(token)
      return this
    },
    /**
     * Returns the streaming prop limit, if any.
     * @memberof syngen.streamer
     * @returns {Number|Infinity}
     */
    getLimit: () => limit,
    /**
     * Returns the streaming radius, if any.
     * @memberof syngen.streamer
     * @returns {Number|Infinity}
     */
    getRadius: () => radius,
    /**
     * Returns the definition for the prop registered with `token`, if one exists.
     * @memberof syngen.streamer
     * @param {String} token
     * @returns {Object|undefined}
     */
    getRegisteredProp: (token) => registry.get(token),
    /**
     * Returns the definitions for all registered props.
     * @memberof syngen.streamer
     * @returns {Object[]}
     */
    getRegisteredProps: () => [...registry.values()],
    /**
     * Returns the prop with `token`, if one is streaming.
     * @memberof syngen.streamer
     * @param {String} token
     * @returns {syngen.prop.base|undefined}
     */
    getStreamedProp: (token) => streamed.get(token),
    /**
     * Returns all streaming props.
     * @memberof syngen.streamer
     * @returns {engine.prop.base[]}
     */
    getStreamedProps: () => [...streamed.values()],
    /**
     * Returns whether a prop is registered for `token`.
     * @memberof syngen.streamer
     * @param {String} token
     * @returns {Boolean}
     */
    hasRegisteredProp: (token) => registry.has(token),
    /**
     * Returns whether a prop is streaming with `token`.
     * @memberof syngen.streamer
     * @param {String} token
     * @returns {Boolean}
     */
    hasStreamedProp: (token) => streamed.has(token),
    /**
     * Registers a prop with `prototype` and `options` and returns its token.
     * @memberof syngen.streamer
     * @param {engine.prop.base} prototype
     * @param {Object} [options]
     * @returns {String}
     */
    registerProp: function(prototype, options = {}) {
      const token = generateToken()

      const registeredProp = {
        options: {
          ...options,
          token,
        },
        prototype,
        token,
        x: options.x,
        y: options.y,
        z: options.z,
      }

      registry.set(token, registeredProp)
      registryTree.insert(registeredProp)

      shouldForce = true

      return token
    },
    /**
     * Clears and destroys all registered and streaming props.
     * @listens syngen.state#event:reset
     * @memberof syngen.streamer
     */
    reset: function() {
      registry.clear()
      registryTree.clear()

      streamed.forEach((streamedProp) => streamedProp.destroy())
      streamed.clear()

      shouldForce = false

      return this
    },
    /**
     * Sets the streaming prop limit.
     * @memberof syngen.streamer
     * @param {Number} value
     */
    setLimit: function (value) {
      if (value > 0) {
        limit = Number(value) || Infinity
        shouldForce = true
      }
      return this
    },
    /**
     * Sets the streaming radius.
     * @memberof syngen.streamer
     * @param {Number} value
     */
    setRadius: function (value) {
      radius = Number(value) || 0
      shouldForce = true
      return this
    },
    /**
     * Sets the sorting method.
     * @memberof syngen.streamer
     * @param {Function} value
     */
    setSort: function (value) {
      if (typeof sort == 'function') {
        sort = value
        shouldForce = true
      }
      return this
    },
    /**
     * Updates the streamed props with respect to the observer's coordinates.
     * @listens syngen.loop#event:frame
     * @memberof syngen.streamer
     * @param {Boolean} [force=false]
     */
    update: function (force = false) {
      const positionVector = syngen.position.getVector()

      if (!force && !shouldForce && currentVector.equals(positionVector)) {
        return this
      }

      currentVector = positionVector
      shouldForce = false

      const nowStreaming = new Set(),
        streamable = getStreamableProps()

      for (const {token} of streamable) {
        if (!streamed.has(token)) {
          createRegisteredProp(token)
        }
        nowStreaming.add(token)
      }

      for (const token of streamed.keys()) {
        if (!nowStreaming.has(token)) {
          destroyStreamedProp(token)
        }
      }

      return this
    },
    /**
     * Updates the `options` for the prop registered with `token`.
     * To change its prototype, its token must be deregistered.
     * @memberof syngen.streamer
     * @param {String} token
     * @param {Object} [options]
     */
    updateRegisteredProp: function (token, options = {}) {
      const registeredProp = propRegistry.get(token)

      if (!registeredProp) {
        return this
      }

      registeredProp.options = {
        ...registeredProp.options,
        ...options,
        token,
      }

      return this
    },
  }
})()

syngen.loop.on('frame', ({paused}) => {
  if (paused) {
    return
  }

  syngen.streamer.update()
})

syngen.state.on('reset', () => syngen.streamer.reset())

if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = syngen
}

if (typeof define === 'function' && define.amd) {
	define('syngen', [], () => syngen)
}

if (typeof self !== 'undefined') {
  self.syngen = syngen
} else {
  this.syngen = syngen
}

return syngen
})()
