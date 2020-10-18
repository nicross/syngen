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
    syngen.seed.concat(...seeds)
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
 * Provides a binary tree interface for storing and querying objects in one-dimensional space.
 * @interface
 * @see syngen.utility.bitree.create
 * @todo Document private members
 */
syngen.utility.bitree = {}

/**
 * Instantiates a new binary tree.
 * @param {Object} [options={}]
 * @param {String} [options.dimension=value]
 *   Key used to access items' values.
 *   Must be a member, not a method.
 * @param {Number} [options.maxItems=12]
 *   Number of items before the tree branches.
 *   This value is passed to child nodes.
 * @param {Number} [options.minValue={@link syngen.const.maxSafeFloat|-syngen.const.maxSafeFloat}]
 *   Lower bound of values for this node.
 *   Typically this is set programmatically.
 * @param {String} [options.range={@link syngen.const.maxSafeFloat|syngen.const.maxSafeFloat * 2}]
 *   Range of values for this node.
 *   Typically this is set programmatically.
 * @returns {syngen.utility.bitree}
 * @static
 */
syngen.utility.bitree.create = function (options = {}) {
  return Object.create(this.prototype).construct(options)
}

/**
 * Instantiates a new binary tree with `items` and `options`.
 * @param {Object[]} [items=[]]
 * @param {Object} [options={}]
 *   See {@link syngen.utility.bitree.create} for a full reference.
 * @returns {syngen.utility.bitree}
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
   * Clears all nodes and items.
   * @instance
   */
  clear: function () {
    this.items.length = 0
    this.nodes.length = 0
    return this
  },
  /**
   * Initializes the instance with `options`.
   * @instance
   * @param {Object} [options={}]
   * @private
   */
  construct: function ({
    dimension = 'value',
    maxItems = 12,
    minValue = -syngen.const.maxSafeFloat,
    range = syngen.const.maxSafeFloat * 2,
  } = {}) {
    this.dimension = dimension
    this.items = []
    this.maxItems = maxItems
    this.minValue = minValue
    this.nodes = []
    this.range = range

    return this
  },
  /**
   * Prepares the instance for garbage collection.
   * @instance
   */
  destroy: function () {
    return this.clear()
  },
  /**
   * Finds the closest item to `query` within `radius`.
   * The `query` must contain a member set to the configured dimension.
   * If `query` is contained within the tree, then the next closest item is returned.
   * If no result is found, then `undefined` is returned.
   * @instance
   * @param {Object} query
   * @param {Number} query.{dimension}
   * @param {Number} [radius=Infinity]
   * @returns {Object|undefined}
   */
  find: function (query, radius = Infinity) {
    if (!(this.dimension in query)) {
      return
    }

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
   * Returns the node index for `item`.
   * @instance
   * @param {Object} item
   * @private
   */
  getIndex: function (item) {
    if (!this.nodes.length) {
      return -1
    }

    const middle = this.minValue + (this.range / 2)

    if (item[this.dimension] <= middle) {
      return 0
    }

    return 1
  },
  /**
   * Inserts `item` into the tree.
   * @instance
   * @param {Object} item
   */
  insert: function (item = {}) {
    if (!(this.dimension in item)) {
      return this
    }

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
   * Returns whether this node intersects the line segment starting at `minValue` with length `range`.
   * @instance
   * @param {Number} minValue
   * @param {Number} range
   * @returns {Boolean}
   */
  intersects: function (minValue, range) {
    return syngen.utility.between(this.minValue, minValue, minValue + range)
      || syngen.utility.between(minValue, this.minValue, this.minValue + this.range)
  },
  /**
   * Removes `item` from the tree, if it exists.
   * @instance
   * @param {Object} item
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
   * Retrieves all items with values along the line segment starting at `minValue` with length `range`.
   * @instance
   * @param {Number} minValue
   * @param {Number} range
   * @returns {Object[]}
   */
  retrieve: function (minValue, range) {
    const items = []

    if (!this.intersects(minValue, range)) {
      return items
    }

    for (const item of this.items) {
      if (item[this.dimension] >= minValue && item[this.dimension] <= minValue + range) {
        items.push(item)
      }
    }

    for (const node of this.nodes) {
      items.push(
        ...node.retrieve(minValue, range)
      )
    }

    return items
  },
  /**
   * Splits this node into two child nodes.
   * @instance
   * @private
   */
  split: function () {
    if (this.nodes.length) {
      return this
    }

    const range = this.range / 2

    this.nodes[0] = syngen.utility.bitree.create({
      dimension: this.dimension,
      maxItems: this.maxItems,
      minValue: this.minValue,
      range,
    })

    this.nodes[1] = syngen.utility.bitree.create({
      dimension: this.dimension,
      maxItems: this.maxItems,
      minValue: this.minValue + range,
      range,
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
 * Provides an interface for Euler angles.
 * They express 3D orientations in space with pitch, roll, and yaw.
 * Although they're explicitly easier to use, implementations should prefer {@linkplain syngen.utility.quaternion|quaternions} to avoid gimbal lock.
 * @interface
 * @see syngen.utility.euler.create
 */
syngen.utility.euler = {}

/**
 * Instantiates a new Euler angle.
 * @param {syngen.utility.euler|Object} [options={}]
 * @param {Number} [options.pitch=0]
 * @param {Number} [options.roll=0]
 * @param {Number} [options.yaw=0]
 * @returns {syngen.utility.euler}
 * @static
 */
syngen.utility.euler.create = function (options = {}) {
  return Object.create(this.prototype).construct(options)
}

/**
 * Converts a quaternion to an Euler angle.
 * @param {syngen.utility.quaternion} quaternion
 * @param {String} [sequence={@link syngen.const.eulerToQuaternion}]
 * @returns {syngen.utility.euler}
 * @see syngen.const.eulerToQuaternion
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
   * Returns a new instance with the same properties.
   * @instance
   * @returns {syngen.utility.euler}
   */
  clone: function () {
    return syngen.utility.euler.create(this)
  },
  /**
   * Initializes the instance with `options`.
   * @instance
   * @param {Object} [options={}]
   * @private
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
   * Returns whether this is equal to `euler`.
   * @instance
   * @param {syngen.utility.euler|Object} [euler]
   * @returns {Boolean}
   */
  equals: function ({
    pitch = 0,
    roll = 0,
    yaw = 0,
  } = {}) {
    return (this.pitch == pitch) && (this.roll == roll) && (this.yaw == yaw)
  },
  /**
   * Returns the unit vector that's ahead of the orientation.
   * The vector can be inverted to receive a vector behind.
   * @instance
   * @returns {syngen.utility.vector3d}
   */
  forward: function () {
    return syngen.utility.vector3d.unitX().rotateEuler(this)
  },
  /**
   * Returns whether all properties are zero.
   * @instance
   * @returns {Boolean}
   */
  isZero: function () {
    return !this.pitch && !this.roll && !this.yaw
  },
  /**
   * Rotation along the y-axis.
   * Normally within `[-π/2, π/2]`.
   * @instance
   * @type {Number}
   */
  pitch: 0,
  /**
   * Returns the unit vector that's to the right of the orientation.
   * The vector can be inverted to receive a vector to its left.
   * @instance
   * @returns {syngen.utility.vector3d}
   */
  right: function () {
    return syngen.utility.vector3d.unitY().rotateEuler(this)
  },
  /**
   * Rotation along the x-axis.
   * Normally within `[-π, π]`.
   * @instance
   * @type {Number}
   */
  roll: 0,
  /**
   * Multiplies this by `scalar` and returns it as a new instance.
   * @instance
   * @param {Number} [scalar=0]
   * @returns {syngen.utility.euler}
   */
  scale: function (scalar = 0) {
    return syngen.utility.euler.create({
      pitch: this.pitch * scalar,
      roll: this.roll * scalar,
      yaw: this.yaw * scalar,
    })
  },
  /**
   * Sets all properties to `options`.
   * @instance
   * @param {syngen.utility.euler|Object} [options]
   * @param {Number} [options.pitch=0]
   * @param {Number} [options.roll=0]
   * @param {Number} [options.yaw=0]
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
   * Returns the unit vector that's above of the orientation.
   * The vector can be inverted to receive a vector below.
   * @instance
   * @returns {syngen.utility.vector3d}
   */
  up: function () {
    return syngen.utility.vector3d.unitZ().rotateEuler(this)
  },
  /**
   * Rotation along the z-axis.
   * Normally within `[-π, π]`.
   * @instance
   * @type {Number}
   */
  yaw: 0,
}

/**
 * Provides an interface for finite-state machines.
 * Machines have defined finite states with actions that transition it to other states.
 * Implementations can leverage machines to handle state and subscribe to their events to respond to changes in state.
 * @augments syngen.utility.pubsub
 * @interface
 * @see syngen.utility.machine.create
 */
syngen.utility.machine = {}

/**
 * Instantiates a new finite-state machine.
 * @param {Object} options
 * @param {Object} [options={}]
 * @param {Object} [options.state=none]
 *   The initial state.
 * @param {Object} [options.transition={}]
 *   A hash of states and their actions.
 *   Each state is a hash of one or more actions.
 *   Each action is a function which _should_ call {@link syngen.utility.machine.change|this.change()} to change state.
 *   Actions _can_ have branching logic that results in multiple states.
 * @returns {syngen.utility.machine}
 * @static
 */
syngen.utility.machine.create = function (options = {}) {
  return Object.create(this.prototype).construct(options)
}

syngen.utility.machine.prototype = {
  /**
   * Changes to `state` with `data`.
   * @fires syngen.utility.machine#event:enter
   * @fires syngen.utility.machine#event:enter-{state}
   * @fires syngen.utility.machine#event:exit
   * @fires syngen.utility.machine#event:exit-{state}
   * @instance
   * @param {String} state
   * @param {Object} [data={}]
   */
  change: function (state, data = {}) {
    if (!(state in this.transition) || this.is(state)) {
      return this
    }

    const exitPayload = {
      currentState: this.state,
      nextState: state,
      ...data,
    }

    /**
     * Fired whenever states are exited.
     * @event syngen.utility.machine#event:exit
     * @type {Object}
     * @param {String} currentState
     * @param {String} nextState
     * @param {...*} ...data
     */
    this.pubsub.emit('exit', exitPayload)

    /**
     * Fired whenever a particular state is exited.
     * If the state is `foo`, then the event is named `exit-foo`.
     * @event syngen.utility.machine#event:exit-{state}
     * @type {Object}
     * @param {String} currentState
     * @param {String} nextState
     * @param {...*} ...data
     */
    this.pubsub.emit(`exit-${this.state}`, exitPayload)

    const enterPayload = {
      currentState: state,
      previousState: this.state,
      ...data,
    }

    this.setState(state)

    /**
     * Fired whenever states are entered.
     * @event syngen.utility.machine#event:enter
     * @type {Object}
     * @param {String} currentState
     * @param {String} previousState
     * @param {...*} ...data
     */
    this.pubsub.emit('enter', enterPayload)

    /**
     * Fired whenever a particular state is entered.
     * If the state is `foo`, then the event is named `enter-foo`.
     * @event syngen.utility.machine#event:enter-{state}
     * @type {Object}
     * @param {String} currentState
     * @param {String} previousState
     * @param {...*} ...data
     */
    this.pubsub.emit(`enter-${this.state}`, enterPayload)

    return this
  },
  /**
   * Initializes the instance with `options`.
   * @instance
   * @param {Object} options
   * @private
   */
  construct: function ({
    state = 'none',
    transition = {}
  } = {}) {
    this.transition = {...transition}
    this.setState(state)

    syngen.utility.pubsub.decorate(this)

    return this
  },
  /**
   * Prepares the instance for garbage collection.
   * @instance
   */
  destroy: function () {
    this.pubsub.destroy()
    return this
  },
  /**
   * Calls the function defined for `action` in the current state with `data`.
   * @fires syngen.utility.machine#event:after
   * @fires syngen.utility.machine#event:after-{event}
   * @fires syngen.utility.machine#event:after-{state}-{event}
   * @fires syngen.utility.machine#event:before
   * @fires syngen.utility.machine#event:before-{event}
   * @fires syngen.utility.machine#event:before-{state}-{event}
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

      /**
       * Fired before an event is dispatched.
       * @event syngen.utility.machine#event:before
       * @type {Object}
       * @param {String} event
       * @param {Object} state
       * @param {...*} ...data
       */
      this.pubsub.emit('before', beforePayload)

      /**
       * Fired before a particular event is dispatched.
       * If the event is `foo`, then the event is named `before-foo`.
       * @event syngen.utility.machine#event:before-{event}
       * @type {Object}
       * @param {String} event
       * @param {Object} state
       * @param {...*} ...data
       */
      this.pubsub.emit(`before-${event}`, beforePayload)

      /**
       * Fired before a particular event is dispatched in a particular state.
       * If the state is `foo` and the event is `bar`, then the event is named `before-foo-bar`.
       * @event syngen.utility.machine#event:before-{state}-{event}
       * @type {Object}
       * @param {String} event
       * @param {Object} state
       * @param {...*} ...data
       */
      this.pubsub.emit(`before-${state}-${event}`, beforePayload)

      action.call(this, data)

      const afterPayload = {
        currentState: this.state,
        event,
        previousState: state,
        ...data,
      }

      /**
       * Fired after an event is dispatched.
       * @event syngen.utility.machine#event:after
       * @type {Object}
       * @param {String} currentState
       * @param {String} event
       * @param {String} previousState
       * @param {Object} state
       * @param {...*} ...data
       */
      this.pubsub.emit('after', afterPayload)

      /**
       * Fired after a particular event is dispatched.
       * If the event is `foo`, then the event is named `before-foo`.
       * @event syngen.utility.machine#event:after-{event}
       * @type {Object}
       * @param {String} currentState
       * @param {String} event
       * @param {String} previousState
       * @param {Object} state
       * @param {...*} ...data
       */
      this.pubsub.emit(`after-${event}`, afterPayload)

      /**
       * Fired after a particular event is dispatched in a particular state.
       * If the state is `foo` and the event is `bar`, then the event is named `before-foo-bar`.
       * @event syngen.utility.machine#event:after-{state}-{event}
       * @type {Object}
       * @param {String} currentState
       * @param {String} event
       * @param {String} previousState
       * @param {Object} state
       * @param {...*} ...data
       */
      this.pubsub.emit(`after-${state}-${event}`, afterPayload)
    }

    return this
  },
  /**
   * Returns the current state.
   * @instance
   * @returns {String}
   */
  getState: function () {
    return this.state
  },
  /**
   * Returns whether `state` is the current state.
   * @instance
   * @param {String} state
   * @returns {Boolean}
   */
  is: function (state) {
    return this.state == state
  },
  /**
   * Sets the current state to `state` immediately.
   * @instance
   * @param {String} state
   * @returns {String}
   */
  setState: function (state) {
    if (state in this.transition) {
      this.state = state
    }

    return this
  },
  /**
   * The current state.
   * @instance
   * @type {String}
   */
  state: undefined,
}

/**
 * Provides an octree interface for storing and querying objects in three-dimensional space.
 * @interface
 * @see syngen.utility.octree.create
 * @todo Document private members
 */
syngen.utility.octree = {}

/**
 * Instantiates a new octree.
 * @param {Object} [options={}]
 * @param {Number} [options.depth={@link syngen.const.maxSafeFloat|syngen.const.maxSafeFloat * 2}]
 *   Range of values along the z-axis.
 *   Typically this is set programmatically.
 * @param {Number} [options.height={@link syngen.const.maxSafeFloat|syngen.const.maxSafeFloat * 2}]
 *   Range of values along the y-axis.
 *   Typically this is set programmatically.
 * @param {Number} [options.maxItems=12]
 *   Number of items before the tree branches.
 *   This value is passed to child nodes.
 * @param {Number} [options.width={@link syngen.const.maxSafeFloat|syngen.const.maxSafeFloat * 2}]
 *   Range of values along the y-axis.
 *   Typically this is set programmatically.
 * @param {Number} [options.x={@link syngen.const.maxSafeFloat|-syngen.const.maxSafeFloat}]
 *   Lower bound for valeus along the x-axis.
 *   Typically this is set programmatically.
 * @param {Number} [options.y={@link syngen.const.maxSafeFloat|-syngen.const.maxSafeFloat}]
 *   Lower bound for valeus along the y-axis.
 *   Typically this is set programmatically.
 * @param {Number} [options.z={@link syngen.const.maxSafeFloat|-syngen.const.maxSafeFloat}]
 *   Lower bound for valeus along the z-axis.
 *   Typically this is set programmatically.
 * @returns {syngen.utility.octree}
 * @static
 */
syngen.utility.octree.create = function (options = {}) {
  return Object.create(this.prototype).construct(options)
}

/**
 * Instantiates a new octree with `items` and `options`.
 * @param {Object[]} [items=[]]
 * @param {Object} [options={}]
 *   See {@link syngen.utility.octree.create} for a full reference.
 * @returns {syngen.utility.octree}
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
   * Clears all nodes and items.
   * @instance
   */
  clear: function () {
    this.items.length = 0
    this.nodes.length = 0
    return this
  },
  /**
   * Initializes the instance with `options`.
   * @instance
   * @param {Object} [options={}]
   * @private
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
   * Prepares the instance for garbage collection.
   * @instance
   */
  destroy: function () {
    return this.clear()
  },
  /**
   * Finds the closest item to `query` within `radius`.
   * If `query` is contained within the tree, then the next closest item is returned.
   * If no result is found, then `undefined` is returned.
   * @instance
   * @param {Object} query
   * @param {Number} query.depth
   * @param {Number} query.height
   * @param {Number} query.width
   * @param {Number} query.x
   * @param {Number} query.y
   * @param {Number} query.z
   * @param {Number} [radius=Infinity]
   * @returns {Object|undefined}
   */
  find: function (query = {}, radius = Infinity) {
    if (!('depth' in query && 'height' in query && 'width' in query && 'x' in query && 'y' in query && 'z' in query)) {
      return this
    }

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
   * Returns the node index for `item`.
   * @instance
   * @param {Object} item
   * @private
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
   * Inserts `item` into the tree.
   * @instance
   * @param {Object} item
   */
  insert: function (item = {}) {
    if (!('x' in item && 'y' in item && 'z' in item)) {
      return this
    }

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
   * Returns whether this node intersects the rectanglular prism `prism`.
   * @instance
   * @param {Object} prism
   * @param {Number} [prism.depth=0]
   * @param {Number} [prism.height=0]
   * @param {Number} [prism.width=0]
   * @param {Number} [prism.x=0]
   * @param {Number} [prism.y=0]
   * @param {Number} [prism.z=0]
   * @returns {Boolean}
   * @see syngen.utility.intersects
   * @todo Define a rectangular prism utility or type
   */
  intersects: function (prism) {
    return syngen.utility.intersects(this, prism)
  },
  /**
   * Removes `item` from the tree, if it exists.
   * @instance
   * @param {Object} item
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
   * Retrieves all items within the rectanglular prism `prism`.
   * @instance
   * @param {Object} prism
   * @param {Number} [prism.depth=0]
   * @param {Number} [prism.height=0]
   * @param {Number} [prism.width=0]
   * @param {Number} [prism.x=0]
   * @param {Number} [prism.y=0]
   * @param {Number} [prism.z=0]
   * @returns {Object[]}
   * @todo Define a rectangular prism utility or type
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
   * Splits this node into eight child nodes.
   * @instance
   * @private
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
 * Provides an interface for generating seeded one-dimensional noise.
 * Despite its name, it's not technically Perlin noise; rather, it interpolates between random values along the number line.
 * @interface
 * @see syngen.utility.perlin1d.create
 * @todo Document private members
 */
syngen.utility.perlin1d = {}

/**
 * Instantiates a one-dimensional noise generator.
 * @param {...String} [...seeds]
 * @returns {syngen.utility.perlin1d}
 * @static
 */
syngen.utility.perlin1d.create = function (...seeds) {
  return Object.create(this.prototype).construct(...seeds)
}

syngen.utility.perlin1d.prototype = {
  /**
   * Initializes the instance with `...seeds`.
   * @instance
   * @param {...String} [...seeds]
   * @private
   */
  construct: function (...seeds) {
    this.gradient = new Map()
    this.seed = seeds
    return this
  },
  /**
   * Generates the value at `x`.
   * @instance
   * @param {Number} x
   * @private
   */
  generateGradient: function (x) {
    const srand = syngen.utility.srand('perlin', ...this.seed, x)
    this.gradient.set(x, srand(0, 1))
    return this
  },
  /**
   * Retrieves the value at `x`.
   * @instance
   * @param {Number} x
   * @private
   * @returns {Number}
   */
  getGradient: function (x) {
    if (!this.hasGradient(x)) {
      this.generateGradient(x)
      this.requestPrune()
    }

    return this.gradient.get(x)
  },
  /**
   * Returns whether a value exists for `x`.
   * @instance
   * @param {Number} x
   * @private
   * @returns {Boolean}
   */
  hasGradient: function (x) {
    return this.gradient.has(x)
  },
  /**
   * Frees memory when usage exceeds the prune threshold.
   * @instance
   * @private
   * @see syngen.utility.perlin1d#pruneThreshold
   */
  prune: function () {
    if (this.gradient.size >= this.pruneThreshold) {
      this.gradient.clear()
    }

    return this
  },
  /**
   * The maximum vertex count before they must be pruned.
   * @instance
   * @private
   */
  pruneThreshold: 10 ** 4,
  /**
   * Requests a pruning.
   * @instance
   * @private
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
   * Clears all generated values.
   * This is especially useful to call when {@link syngen.seed} is set.
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
   * Calculates a smooth delta value for interpolation.
   * @instance
   * @param {Number} value
   * @private
   * @returns {Number}
   */
  smooth: function (value) {
    // 6x^5 - 15x^4 + 10x^3
    return (value ** 3) * (value * ((value * 6) - 15) + 10)
  },
  /**
   * Calculates the value at `x`.
   * @instance
   * @param {Number} x
   * @returns {Number}
   */
  value: function (x) {
    const x0 = Math.floor(x),
      x1 = x0 + 1

    const dx = this.smooth(x - x0),
      v0 = this.getGradient(x0),
      v1 = this.getGradient(x1)

    return syngen.utility.lerp(v0, v1, dx)
  },
}

/**
 * Provides an interface for generating seeded two-dimensional Perlin noise.
 * @interface
 * @see syngen.utility.perlin2d.create
 * @todo Document private members
 */
syngen.utility.perlin2d = {}

/**
 * Instantiates a two-dimensional Perlin noise generator.
 * @param {...String} [...seeds]
 * @returns {syngen.utility.perlin2d}
 * @static
 */
syngen.utility.perlin2d.create = function (...seeds) {
  return Object.create(this.prototype).construct(...seeds)
}

syngen.utility.perlin2d.prototype = {
  /**
   * Initializes the instance with `...seeds`.
   * @instance
   * @param {...String} [...seeds]
   * @private
   */
  construct: function (...seeds) {
    this.gradient = new Map()
    this.seed = seeds
    return this
  },
  /**
   * Generates the value at `(x, y)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @private
   */
  generateGradient: function (x, y) {
    const srand = syngen.utility.srand('perlin', ...this.seed, x, y)

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
   * Calculates the dot product between `(dx, dy)` and the value at `(xi, yi)`.
   * @instance
   * @param {Number} xi
   * @param {Number} yi
   * @param {Number} x
   * @param {Number} y
   * @private
   */
  getDotProduct: function (xi, yi, x, y) {
    const dx = x - xi,
      dy = y - yi

    return (dx * this.getGradient(xi, yi, 0)) + (dy * this.getGradient(xi, yi, 1))
  },
  /**
   * Retrieves the value at `(x, y)` and index `i`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @private
   * @returns {Number}
   */
  getGradient: function (x, y, i) {
    if (!this.hasGradient(x, y)) {
      this.generateGradient(x, y)
      this.requestPrune()
    }

    return this.gradient.get(x).get(y)[i]
  },
  /**
   * Returns whether a value exists for `(x, y)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @private
   * @returns {Boolean}
   */
  hasGradient: function (x, y) {
    const xMap = this.gradient.get(x)

    if (!xMap) {
      return false
    }

    return xMap.has(y)
  },
  /**
   * Frees memory when usage exceeds the prune threshold.
   * @instance
   * @private
   * @see syngen.utility.perlin2d#pruneThreshold
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
  /**
   * The maximum vertex count before they must be pruned.
   * @instance
   * @private
   */
  pruneThreshold: 10 ** 3,
  /**
   * Range (plus and minus) to scale the output such that it's normalized to `[-1, 1]`.
   * @instance
   * @private
   */
  range: Math.sqrt(2/4),
  /**
   * Requests a pruning.
   * @instance
   * @private
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
   * Clears all generated values.
   * This is especially useful to call when {@link syngen.seed} is set.
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
   * Calculates a smooth delta value for interpolation.
   * @instance
   * @param {Number} value
   * @private
   * @returns {Number}
   */
  smooth: function (value) {
    // 6x^5 - 15x^4 + 10x^3
    return (value ** 3) * (value * ((value * 6) - 15) + 10)
  },
  /**
   * Calculates the value at `(x, y)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @returns {Number}
   */
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

    return syngen.utility.scale(value, -this.range, this.range, 0, 1)
  },
}

/**
 * Provides an interface for generating seeded two-dimensional Perlin noise.
 * @interface
 * @see syngen.utility.perlin3d.create
 * @todo Document private members
 */
syngen.utility.perlin3d = {}

/**
 * Instantiates a three-dimensional Perlin noise generator.
 * @param {...String} [...seeds]
 * @returns {syngen.utility.perlin3d}
 * @static
 */
syngen.utility.perlin3d.create = function (...seeds) {
  return Object.create(this.prototype).construct(...seeds)
}

syngen.utility.perlin3d.prototype = {
  /**
   * Initializes the instance with `...seeds`.
   * @instance
   * @param {...String} [...seeds]
   * @private
   */
  construct: function (...seeds) {
    this.gradient = new Map()
    this.seed = seeds
    return this
  },
  /**
   * Generates the value at `(x, y, z)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @private
   */
  generateGradient: function (x, y, z) {
    const srand = syngen.utility.srand('perlin', ...this.seed, x, y, z)

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
   * Calculates the dot product between `(dx, dy, dz)` and the value at `(xi, yi, zi)`.
   * @instance
   * @param {Number} xi
   * @param {Number} yi
   * @param {Number} zi
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @private
   */
  getDotProduct: function (xi, yi, zi, x, y, z) {
    const dx = x - xi,
      dy = y - yi,
      dz = z - zi

    return (dx * this.getGradient(xi, yi, zi, 0)) + (dy * this.getGradient(xi, yi, zi, 1)) + (dz * this.getGradient(xi, yi, zi, 2))
  },
  /**
   * Retrieves the value at `(x, y, z)` and index `i`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @private
   * @returns {Number}
   */
  getGradient: function (x, y, z, i) {
    if (!this.hasGradient(x, y, z)) {
      this.generateGradient(x, y, z)
      this.requestPrune(x, y, z)
    }

    return this.gradient.get(x).get(y).get(z)[i]
  },
  /**
   * Returns whether a value exists for `(x, y, z)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @private
   * @returns {Boolean}
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
   * Frees memory when usage exceeds the prune threshold.
   * @instance
   * @private
   * @see syngen.utility.perlin3d#pruneThreshold
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
  /**
   * The maximum vertex count before they must be pruned.
   * @instance
   * @private
   */
  pruneThreshold: 10 ** 2,
  /**
   * Range (plus and minus) to scale the output such that it's normalized to `[-1, 1]`.
   * @instance
   * @private
   */
  range: Math.sqrt(3/4),
  /**
   * Requests a pruning.
   * @instance
   * @private
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
   * Clears all generated values.
   * This is especially useful to call when {@link syngen.seed} is set.
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
   * Calculates a smooth delta value for interpolation.
   * @instance
   * @param {Number} value
   * @private
   * @returns {Number}
   */
  smooth: function (value) {
    // 6x^5 - 15x^4 + 10x^3
    return (value ** 3) * (value * ((value * 6) - 15) + 10)
  },
  /**
   * Calculates the value at `(x, y, z)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @returns {Number}
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
 * Provides an interface for generating seeded four-dimensional Perlin noise.
 * @interface
 * @see syngen.utility.perlin4d.create
 * @todo Document private members
 */
syngen.utility.perlin4d = {}

/**
 * Instantiates a four-dimensional Perlin noise generator.
 * @param {...String} [...seeds]
 * @returns {syngen.utility.perlin4d}
 * @static
 */
syngen.utility.perlin4d.create = function (...seeds) {
  return Object.create(this.prototype).construct(...seeds)
}

syngen.utility.perlin4d.prototype = {
  /**
   * Initializes the instance with `...seeds`.
   * @instance
   * @param {...String} [...seeds]
   * @private
   */
  construct: function (...seeds) {
    this.gradient = new Map()
    this.seed = seeds
    return this
  },
  /**
   * Generates the value at `(x, y, z, t)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {Number} t
   * @private
   */
  generateGradient: function (x, y, z, t) {
    const srand = syngen.utility.srand('perlin', ...this.seed, x, y, z, t)

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
   * Calculates the dot product between `(dx, dy, dz, dt)` and the value at `(xi, yi, zi, ti)`.
   * @instance
   * @param {Number} xi
   * @param {Number} yi
   * @param {Number} zi
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @private
   */
  getDotProduct: function (xi, yi, zi, ti, x, y, z, t) {
    const dt = t - ti,
      dx = x - xi,
      dy = y - yi,
      dz = z - zi

    return (dt * this.getGradient(xi, yi, zi, ti, 3)) + (dx * this.getGradient(xi, yi, zi, ti, 0)) + (dy * this.getGradient(xi, yi, zi, ti, 1)) + (dz * this.getGradient(xi, yi, zi, ti, 2))
  },
  /**
   * Retrieves the value at `(x, y, z, t)` and index `i`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @private
   * @returns {Number}
   */
  getGradient: function (x, y, z, t, i) {
    if (!this.hasGradient(x, y, z, t)) {
      this.generateGradient(x, y, z, t)
      this.requestPrune(x, y, z, t)
    }

    return this.gradient.get(x).get(y).get(z).get(t)[i]
  },
  /**
   * Returns whether a value exists for `(x, y, z, t)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {Number} t
   * @private
   * @returns {Boolean}
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
   * Frees memory when usage exceeds the prune threshold.
   * @instance
   * @private
   * @see syngen.utility.perlin4d#pruneThreshold
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
  /**
   * The maximum vertex count before they must be pruned.
   * @instance
   * @private
   */
  pruneThreshold: 10 ** 2,
  /**
   * Range (plus and minus) to scale the output such that it's normalized to `[-1, 1]`.
   * @instance
   * @private
   */
  range: Math.sqrt(4/4),
  /**
   * Requests a pruning.
   * @instance
   * @private
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
   * Clears all generated values.
   * This is especially useful to call when {@link syngen.seed} is set.
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
   * Calculates a smooth delta value for interpolation.
   * @instance
   * @param {Number} value
   * @private
   * @returns {Number}
   */
  smooth: function (value) {
    // 6x^5 - 15x^4 + 10x^3
    return (value ** 3) * (value * ((value * 6) - 15) + 10)
  },
  /**
   * Calculates the value at `(x, y, z, t)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {Number} t
   * @returns {Number}
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
 * @see syngen.utility.physical.decorate
 * @todo Improve clarity and proximity of documentation and source
 */
syngen.utility.physical = {}

/**
 * Decorates `target` with physical properties and methods and returns it.
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
 * Provides an interface for a publish-subscribe messaging pattern.
 * Objects can be decorated with an existing or new instance with the static {@link syngen.utility.pubsub.decorate|decorate} method.
 * @interface
 * @see syngen.utility.pubsub.create
 * @see syngen.utility.pubsub.decorate
 */
syngen.utility.pubsub = {}

/**
 * Instantiates a new pubsub instance.
 * @returns {syngen.utility.pubsub}
 * @static
 */
syngen.utility.pubsub.create = function () {
  return Object.create(this.prototype).construct()
}

/**
 * Decorates `target` with a new or existing `instance` and returns it.
 * This exposes its methods on `target` as if they are its own.
 * @param {Object} target
 * @param {syngen.utility.pubsub} [instance]
 * @returns {Object}
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
   * Instantiates the instance.
   * @instance
   * @private
   */
  construct: function() {
    this._handler = {}
    return this
  },
  /**
   * Prepares the instance for garbage collection.
   * @instance
   */
  destroy: function() {
    this.off()
    return this
  },
  /**
   * Dispatches `event` to all subscribers with optional `...data`.
   * @instance
   * @param {String} event
   * @param {...*} [...data]
   */
  emit: function (event, ...data) {
    if (!this._handler[event]) {
      return this
    }

    const execute = (handler) => handler(...data),
      handlers = [...this._handler[event]]

    handlers.forEach(execute)

    return this
  },
  /**
   * Unsubscribes `handler` from the handlers listening for `event`.
   * If no `handler` is specified, then all handlers for `event` are removed.
   * If no `event` is specified, then all handlers for all events are removed.
   * @instance
   * @param {String} [event]
   * @param {Function} [handler]
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
   * Subscribes `handler` to listen for `event`.
   * @instance
   * @param {String} event
   * @param {Function} handler
   */
  on: function (event, handler) {
    if (!(handler instanceof Function)) {
      return this
    }

    if (!this._handler[event]) {
      this._handler[event] = []
    }

    this._handler[event].push(handler)

    return this
  },
  /**
   * Subscribed `handler` to listen for `event` once.
   * The `handler` is removed after its next dispatch.
   * @instance
   * @param {String} event
   * @param {Function} handler
   */
  once: function (event, handler) {
    const wrapper = (...data) => {
      this.off(event, wrapper)
      handler(...data)
    }

    return this.on(event, wrapper)
  },
}

/**
 * Provides a quadtree interface for storing and querying objects in two-dimensional space.
 * @interface
 * @see syngen.utility.quadtree.create
 * @todo Document private members
 */
syngen.utility.quadtree = {}

/**
 * Instantiates a new quadtree.
 * @param {Object} [options={}]
 * @param {Number} [options.height={@link syngen.const.maxSafeFloat|syngen.const.maxSafeFloat * 2}]
 *   Range of values along the y-axis.
 *   Typically this is set programmatically.
 * @param {Number} [options.maxItems=12]
 *   Number of items before the tree branches.
 *   This value is passed to child nodes.
 * @param {Number} [options.width={@link syngen.const.maxSafeFloat|syngen.const.maxSafeFloat * 2}]
 *   Range of values along the y-axis.
 *   Typically this is set programmatically.
 * @param {Number} [options.x={@link syngen.const.maxSafeFloat|-syngen.const.maxSafeFloat}]
 *   Lower bound for valeus along the x-axis.
 *   Typically this is set programmatically.
 * @param {Number} [options.y={@link syngen.const.maxSafeFloat|-syngen.const.maxSafeFloat}]
 *   Lower bound for valeus along the y-axis.
 *   Typically this is set programmatically.
 * @returns {syngen.utility.quadtree}
 * @static
 */
syngen.utility.quadtree.create = function (options = {}) {
  return Object.create(this.prototype).construct(options)
}

/**
 * Instantiates a new quadtree with `items` and `options`.
 * @param {Object[]} [items=[]]
 * @param {Object} [options={}]
 *   See {@link syngen.utility.quadree.create} for a full reference.
 * @returns {syngen.utility.quadtree}
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
   * Clears all nodes and items.
   * @instance
   */
  clear: function () {
    this.items.length = 0
    this.nodes.length = 0
    return this
  },
  /**
   * Initializes the instance with `options`.
   * @instance
   * @param {Object} [options={}]
   * @private
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
   * Prepares the instance for garbage collection.
   * @instance
   */
  destroy: function () {
    return this.clear()
  },
  /**
   * Finds the closest item to `query` within `radius`.
   * If `query` is contained within the tree, then the next closest item is returned.
   * If no result is found, then `undefined` is returned.
   * @instance
   * @param {Object} query
   * @param {Number} query.height
   * @param {Number} query.width
   * @param {Number} query.x
   * @param {Number} query.y
   * @param {Number} [radius=Infinity]
   * @returns {Object|undefined}
   */
  find: function (query = {}, radius = Infinity) {
    if (!('height' in query && 'width' in query && 'x' in query && 'y' in query)) {
      return this
    }

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
   * Returns the node index for `item`.
   * @instance
   * @param {Object} item
   * @private
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
   * Inserts `item` into the tree.
   * @instance
   * @param {Object} item
   */
  insert: function (item = {}) {
    if (!('x' in item && 'y' in item)) {
      return this
    }

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
   * Returns whether this node intersects the rectangle `rect`.
   * @instance
   * @param {Object} rect
   * @param {Number} [rect.height=0]
   * @param {Number} [rect.width=0]
   * @param {Number} [rect.x=0]
   * @param {Number} [rect.y=0]
   * @returns {Boolean}
   * @see syngen.utility.intersects
   * @todo Define a rectangular prism utility or type
   */
  intersects: function (rect) {
    return syngen.utility.intersects(this, rect)
  },
  /**
   * Removes `item` from the tree, if it exists.
   * @instance
   * @param {Object} item
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
   * Retrieves all items within the rectangle `rect`.
   * @instance
   * @param {Object} rect
   * @param {Number} [rect.height=0]
   * @param {Number} [rect.width=0]
   * @param {Number} [rect.x=0]
   * @param {Number} [rect.y=0]
   * @returns {Object[]}
   * @todo Define a rectangular prism utility or type
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
   * Splits this node into four child nodes.
   * @instance
   * @private
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
 * Provides an interface for quaternions.
 * They express 3D orientations in space with complex numbers.
 * These are preferred over {@linkplain syngen.utility.euler|euler angles} to avoid gimbal lock.
 * @interface
 * @see syngen.utility.quaternion.create
 */
syngen.utility.quaternion = {}

/**
 * Instantiates a new quaternion.
 * @param {syngen.utility.quaternion|Object} [options={}]
 * @param {Number} [options.w=1]
 * @param {Number} [options.x=0]
 * @param {Number} [options.y=0]
 * @param {Number} [options.z=0]
 * @returns {syngen.utility.quaternion}
 * @static
 */
syngen.utility.quaternion.create = function (options = {}) {
  return Object.create(this.prototype).construct(options)
}

/**
 * Converts an Euler angle to a quaternion.
 * @param {syngen.utility.euler} euler
 * @param {String} [sequence={@link syngen.const.eulerToQuaternion}]
 * @returns {syngen.utility.quaternion}
 * @see syngen.const.eulerToQuaternion
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

syngen.utility.quaternion.prototype = {
  /**
   * Returns a new instance with the same properties.
   * @instance
   * @returns {syngen.utility.quaternion}
   */
  clone: function () {
    return syngen.utility.quaternion.create(this)
  },
  /**
   * Returns the conjugate as a new instance.
   * This represents the reverse orientation.
   * @instance
   * @returns {syngen.utility.quaternion}
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
   * Initializes the instance with `options`.
   * These values are best derived from {@link syngen.utility.quaternion.fromEuler} or other quaternions.
   * @instance
   * @param {syngen.utility.quaternion|Object} [options={}]
   * @private
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
   * Calculates the magnitude (Euclidean distance).
   * @instance
   * @returns {Number}
   */
  distance: function () {
    return Math.sqrt((this.w ** 2) + (this.x ** 2) + (this.y ** 2) + (this.z ** 2))
  },
  /**
   * Calculates the norm (squared Euclidean distance).
   * @instance
   * @returns {Number}
   */
  distance2: function () {
    return (this.w ** 2) + (this.x ** 2) + (this.y ** 2) + (this.z ** 2)
  },
  /**
   * Multiplies this by the inverse of `quaternion` to return their difference as a new instance.
   * @instance
   * @param {syngen.utility.quaternion|Object} [quaternion]
   * @returns {syngen.utility.quaternion}
   */
  divide: function (divisor) {
    if (!syngen.utility.quaternion.prototype.isPrototypeOf(quaternion)) {
      quaternion = syngen.utility.quaternion.create(quaternion)
    }

    return this.multiply(quaternion.inverse())
  },
  /**
   * Returns whether this is equal to `quaternion`.
   * @instance
   * @param {syngen.utility.quaternion|Object} [quaternion]
   * @returns {Boolean}
   */
  equals: function ({
    w = 1,
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return (this.w == w) && (this.x == x) && (this.y == y) && (this.z == z)
  },
  /**
   * Returns the unit vector that's ahead of the orientation.
   * The vector can be inverted to receive a vector behind.
   * @instance
   * @returns {syngen.utility.vector3d}
   */
  forward: function () {
    return syngen.utility.vector3d.unitX().rotateQuaternion(this)
  },
  /**
   * Returns the multiplicative inverse as a new instance.
   * @instance
   * @returns {syngen.utility.quaternion}
   */
  inverse: function () {
    const scalar = 1 / this.distance2()

    if (!isFinite(scalar)) {
      return this.conjugate()
    }

    return this.conjugate().scale(scalar)
  },
  /**
   * Returns whether this is equal to the identity quaternion.
   * @instance
   * @returns {Boolean}
   */
  isZero: function () {
    return (this.w == 1) && !this.x && !this.y && !this.z
  },
  /**
   * Linearly interpolates `quaternion` to this and returns it as a new instance.
   * @instance
   * @param {syngen.utility.quaternion|Object} quaternion
   * @returns {syngen.utility.quaternion}
   * @todo Create syngen.utility.quaternion.slerpFrom for spherical interpolation
   */
  lerpFrom: function ({
    w = 1,
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
   * Linearly interpolates this to `quaternion` and returns it as a new instance.
   * @instance
   * @param {syngen.utility.quaternion|Object} quaternion
   * @returns {syngen.utility.quaternion}
   * @todo Create syngen.utility.quaternion.slerpTo for spherical interpolation
   */
  lerpTo: function ({
    w = 1,
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
   * Multiplies this by `quaternion` to return their sum as a new instance.
   * @instance
   * @param {syngen.utility.quaternion|Object} [quaternion]
   * @returns {syngen.utility.quaternion}
   */
  multiply: function ({
    w = 1,
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
   * Normalizes this and returns it as a new instance.
   * @instance
   * @returns {syngen.utility.quaternion}
   */
  normalize: function () {
    const distance = this.distance()

    if (!distance) {
      return this.clone()
    }

    return this.scale(1 / distance)
  },
  /**
   * Returns the unit vector that's to the right of the orientation.
   * The vector can be inverted to receive a vector to its left.
   * @instance
   * @returns {syngen.utility.vector3d}
   */
  right: function () {
    return syngen.utility.vector3d.unitY().rotateQuaternion(this)
  },
  /**
   * Multiplies this by `scalar` and returns it as a new instance.
   * Typically it's nonsensical to use this manually.
   * @instance
   * @param {Number} [scalar=0]
   * @returns {syngen.utility.quaternion}
   * @private
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
   * Sets all properties with `options`.
   * These values are best derived from {@link syngen.utility.quaternion.fromEuler} or other quaternions.
   * @instance
   * @param {syngen.utility.quaternion|Object} [options]
   * @param {Number} [options.w=1]
   * @param {Number} [options.x=0]
   * @param {Number} [options.y=0]
   * @param {Number} [options.z=0]
   */
  set: function ({
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
   * Returns the unit vector that's above of the orientation.
   * The vector can be inverted to receive a vector below.
   * @instance
   * @returns {syngen.utility.vector3d}
   */
  up: function () {
    return syngen.utility.vector3d.unitZ().rotateQuaternion(this)
  },
  /**
   * The real w-component of the quaternion.
   * Implementations are discouraged from modifying this directly.
   * @instance
   * @type {Number}
   */
  w: 1,
  /**
   * The imaginary x-component of the quaternion.
   * Implementations are discouraged from modifying this directly.
   * @instance
   * @type {Number}
   */
  x: 0,
  /**
   * The imaginary y-component of the quaternion.
   * Implementations are discouraged from modifying this directly.
   * @instance
   * @type {Number}
   */
  y: 0,
  /**
   * The imaginary z-component of the quaternion.
   * Implementations are discouraged from modifying this directly.
   * @instance
   * @type {Number}
   */
  z: 0,
}

/**
 * Instantiates an identity quaternion.
 * @returns {syngen.utility.quaternion}
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
 * Provides an interface for two-dimensional vectors with x-y coordinates.
 * @interface
 * @see syngen.utility.vector2d.create
 */
syngen.utility.vector2d = {}

/**
 * Instantiates a new two-dimensional vector.
 * @param {syngen.utility.vector2d|Object} [options={}]
 * @param {Number} [options.x=0]
 * @param {Number} [options.y=0]
 * @returns {syngen.utility.vector2d}
 * @static
 */
syngen.utility.vector2d.create = function (options = {}) {
  return Object.create(this.prototype).construct(options)
}

syngen.utility.vector2d.prototype = {
  /**
   * Adds `vector` to this and returns their sum as a new instance.
   * @instance
   * @param {syngen.utility.vector2d|Object} [vector]
   * @returns {syngen.utility.vector2d|Object}
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
   * Calculates the angle between this and the positive x-axis, in radians.
   * @instance
   * @returns {Number}
   */
  angle: function () {
    return Math.atan2(this.y, this.x)
  },
  /**
   * Returns a new instance with the same properties.
   * @instance
   * @returns {syngen.utility.vector2d}
   */
  clone: function () {
    return syngen.utility.vector2d.create(this)
  },
  /**
   * Initializes the instance with `options`.
   * @instance
   * @param {syngen.utility.vector2d|Object} [options={}]
   * @private
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
   * Calculates the cross product with `vector`.
   * This operation is noncommunicative.
   * @instance
   * @param {syngen.utility.vector2d|Object} [vector]
   * @returns {Number}
   */
  crossProduct: function ({
    x = 0,
    y = 0,
  } = {}) {
    return (this.x * y) - (this.y * x)
  },
  /**
   * Calculates the Euclidean distance from `vector`.
   * @instance
   * @param {syngen.utility.vector2d|Object} [vector]
   * @returns {Number}
   */
  distance: function ({
    x = 0,
    y = 0,
  } = {}) {
    return Math.sqrt(((this.x - x) ** 2) + ((this.y - y) ** 2))
  },
  /**
   * Calculates the squared Euclidean distance from `vector`.
   * @instance
   * @param {syngen.utility.vector2d|Object} [vector]
   * @returns {Number}
   */
  distance2: function ({
    x = 0,
    y = 0,
  } = {}) {
    return ((this.x - x) ** 2) + ((this.y - y) ** 2)
  },
  /**
   * Calculates the dot product with `vector`.
   * @instance
   * @param {syngen.utility.vector2d|Object} [vector]
   * @returns {Number}
   */
  dotProduct: function ({
    x = 0,
    y = 0,
  } = {}) {
    return (this.x * x) + (this.y * y)
  },
  /**
   * Returns whether this is equal to `vector`.
   * @instance
   * @param {syngen.utility.vector2d|Object} [vector]
   * @returns {Boolean}
   */
  equals: function ({
    x = 0,
    y = 0,
  } = {}) {
    return (this.x == x) && (this.y == y)
  },
  /**
   * Returns the inverse vector as a new instance.
   * @instance
   * @returns {syngen.utility.vector2d}
   */
  inverse: function () {
    return syngen.utility.vector2d.create({
      x: -this.x,
      y: -this.y,
    })
  },
  /**
   * Returns whether this represents the origin.
   * @instance
   * @returns {Boolean}
   */
  isZero: function () {
    return !this.x && !this.y
  },
  /**
   * Scales this by its distance to return a unit vector as a new instance.
   * @instance
   * @returns {syngen.utility.vector2d}
   */
  normalize: function () {
    const distance = this.distance()

    if (!distance) {
      return this.clone()
    }

    return this.scale(1 / distance)
  },
  /**
   * Rotates by `angle`, in radians, and returns it as a new instance.
   * @instance
   * @param {Number} [angle=0]
   * @returns {syngen.utility.vector2d}
   */
  rotate: function (angle = 0) {
    if (angle == 0) {
      return this.clone()
    }

    const cos = Math.cos(angle),
      sin = Math.sin(angle)

    return syngen.utility.vector2d.create({
      x: (this.x * cos) - (this.y * sin),
      y: (this.y * cos) + (this.x * sin),
    })
  },
  /**
   * Multiplies this by `scalar` and returns it as a new instance.
   * @instance
   * @param {Number} [scalar=0]
   * @returns {syngen.utility.vector2d}
   */
  scale: function (scalar = 0) {
    return syngen.utility.vector2d.create({
      x: this.x * scalar,
      y: this.y * scalar,
    })
  },
  /**
   * Sets all properties with `options`.
   * @instance
   * @param {syngen.utility.vector2d|Object} [options]
   * @param {Number} [options.x=0]
   * @param {Number} [options.y=0]
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
   * Subtracts `vector` from this and returns their difference as a new instance.
   * @instance
   * @param {syngen.utility.vector2d|Object} [vector]
   * @returns {syngen.utility.vector2d|Object}
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
   * Subtracts a circular radius from this and returns it as a new instance.
   * @instance
   * @param {Number} [radius=0]
   * @returns {syngen.utility.vector2d}
   */
  subtractRadius: function (radius = 0) {
    if (radius <= 0) {
      return this.clone()
    }

    const distance = this.distance()

    if (radius >= distance) {
      return syngen.utility.vector2d.create()
    }

    return this.multiply(1 - (radius / distance))
  },
  /**
   * Position along the x-axis.
   * @instance
   * @type {Number}
   */
  x: 0,
  /**
   * Position along the y-axis.
   * @instance
   * @type {Number}
   */
  y: 0,
}

/**
 * Instantiates a unit vector along the x-axis.
 * @returns {syngen.utility.vector2d}
 * @static
 */
syngen.utility.vector2d.unitX = function () {
  return Object.create(this.prototype).construct({
    x: 1,
  })
}

/**
 * Instantiates a unit vector along the y-axis.
 * @returns {syngen.utility.vector2d}
 * @static
 */
syngen.utility.vector2d.unitY = function () {
  return Object.create(this.prototype).construct({
    y: 1,
  })
}

/**
 * Provides an interface for two-dimensional vectors with x-y-z coordinates.
 * @interface
 * @see syngen.utility.vector3d.create
 */
syngen.utility.vector3d = {}

/**
 * Instantiates a new three-dimensional vector.
 * @param {syngen.utility.vector3d|Object} [options={}]
 * @param {Number} [options.x=0]
 * @param {Number} [options.y=0]
 * @param {Number} [options.z=0]
 * @returns {syngen.utility.vector3d}
 * @static
 */
syngen.utility.vector3d.create = function (options = {}) {
  return Object.create(this.prototype).construct(options)
}

syngen.utility.vector3d.prototype = {
  /**
   * Adds `vector` to this and returns their sum as a new instance.
   * @instance
   * @param {syngen.utility.vector3d|Object} [vector]
   * @returns {syngen.utility.vector3d|Object}
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
   * Returns a new instance with the same properties.
   * @instance
   * @returns {syngen.utility.vector3d}
   */
  clone: function () {
    return syngen.utility.vector3d.create(this)
  },
  /**
   * Initializes the instance with `options`.
   * @instance
   * @param {syngen.utility.vector3d|Object} [options={}]
   * @private
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
   * Calculates the cross product with `vector`.
   * This operation is noncommunicative.
   * @instance
   * @param {syngen.utility.vector3d|Object} [vector]
   * @returns {syngen.utility.vector3d}
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
   * Calculates the Euclidean distance from `vector`.
   * @instance
   * @param {syngen.utility.vector3d|Object} [vector]
   * @returns {Number}
   */
  distance: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return Math.sqrt(((this.x - x) ** 2) + ((this.y - y) ** 2) + ((this.z - z) ** 2))
  },
  /**
   * Calculates the squared Euclidean distance from `vector`.
   * @instance
   * @param {syngen.utility.vector3d|Object} [vector]
   * @returns {Number}
   */
  distance2: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return ((this.x - x) ** 2) + ((this.y - y) ** 2) + ((this.z - z) ** 2)
  },
  /**
   * Calculates the dot product with `vector`.
   * @instance
   * @param {syngen.utility.vector3d|Object} [vector]
   * @returns {Number}
   */
  dotProduct: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return (this.x * x) + (this.y * y) + (this.z * z)
  },
  /**
   * Returns whether this is equal to `vector`.
   * @instance
   * @param {syngen.utility.vector3d|Object} [vector]
   * @returns {Boolean}
   */
  equals: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return (this.x == x) && (this.y == y) && (this.z == z)
  },
  /**
   * Calculates the Euler angle between this and the positive x-axis.
   * @instance
   * @returns {syngen.utility.euler}
   */
  euler: function () {
    return syngen.utility.euler.create({
      pitch: this.z ? Math.atan2(this.z, Math.sqrt((this.x ** 2) + (this.y ** 2))) : 0,
      roll: 0,
      yaw: Math.atan2(this.y, this.x),
    })
  },
  /**
   * Returns the inverse vector as a new instance.
   * @instance
   * @returns {syngen.utility.vector3d}
   */
  inverse: function () {
    return syngen.utility.vector3d.create({
      x: -this.x,
      y: -this.y,
      z: -this.z,
    })
  },
  /**
   * Returns whether this represents the origin.
   * @instance
   * @returns {Boolean}
   */
  isZero: function () {
    return !this.x && !this.y && !this.z
  },
  /**
   * Scales this by its distance to return a unit vector as a new instance.
   * @instance
   * @returns {syngen.utility.vector3d}
   */
  normalize: function () {
    const distance = this.distance()

    if (!distance) {
      return this.clone()
    }

    return this.scale(1 / distance)
  },
  /**
   * Calculates the quaternion between this and the positive x-axis.
   * @instance
   * @returns {syngen.utility.quaternion}
   */
  quaternion: function () {
    return syngen.utility.quaternion.fromEuler(
      this.euler()
    )
  },
  /**
   * Rotates this by `euler` with `sequence` and returns it as a new instance.
   * Beware that this is less performant than using quaternions and can result in gimbal lock.
   * @instance
   * @param {syngen.utility.euler} euler
   * @param {String} [sequence]
   * @returns {syngen.utility.vector3d}
   */
  rotateEuler: function (euler, sequence) {
    return this.rotateQuaternion(
      syngen.utility.quaternion.fromEuler(euler, sequence)
    )
  },
  /**
   * Rotates this by `quaternion` and returns it as a new instance.
   * @instance
   * @param {syngen.utility.quaternion} quaternion
   * @returns {syngen.utility.vector3d}
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
   * Multiplies this by `scalar` and returns it as a new instance.
   * @instance
   * @param {Number} [scalar=0]
   * @returns {syngen.utility.vector3d}
   */
  scale: function (scalar = 0) {
    return syngen.utility.vector3d.create({
      x: this.x * scalar,
      y: this.y * scalar,
      z: this.z * scalar,
    })
  },
  /**
   * Sets all properties with `options`.
   * @instance
   * @param {syngen.utility.vector3d|Object} [options]
   * @param {Number} [options.x=0]
   * @param {Number} [options.y=0]
   * @param {Number} [options.z=0]
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
   * Subtracts `vector` from this and returns their difference as a new instance.
   * @instance
   * @param {syngen.utility.vector3d|Object} [vector]
   * @returns {syngen.utility.vector3d|Object}
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
   * Subtracts a spherical radius from this and returns it as a new instance.
   * @instance
   * @param {Number} [radius=0]
   * @returns {syngen.utility.vector3d}
   */
  subtractRadius: function (radius = 0) {
    if (radius <= 0) {
      return this.clone()
    }

    const distance = this.distance()

    if (radius >= distance) {
      return syngen.utility.vector3d.create()
    }

    return this.scale(1 - (radius / distance))
  },
  /**
   * Position along the x-axis.
   * @instance
   * @type {Number}
   */
  x: 0,
  /**
   * Position along the y-axis.
   * @instance
   * @type {Number}
   */
  y: 0,
  /**
   * Position along the y-axis.
   * @instance
   * @type {Number}
   */
  z: 0,
}

/**
 * Instantiates a unit vector along the x-axis.
 * @returns {syngen.utility.vector3d}
 * @static
 */
syngen.utility.vector3d.unitX = function () {
  return Object.create(this.prototype).construct({
    x: 1,
  })
}

/**
 * Instantiates a unit vector along the y-axis.
 * @returns {syngen.utility.vector3d}
 * @static
 */
syngen.utility.vector3d.unitY = function () {
  return Object.create(this.prototype).construct({
    y: 1,
  })
}

/**
 * Instantiates a unit vector along the z-axis.
 * @returns {syngen.utility.vector3d}
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
   * Close enough to zero for most calculations that can't use zero, like ramping `AudioParam`s exponentially to zero.
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
  let seed,
    separator = '~'

  return {
    /**
     * Concatenates variadic `seeds`
     * @memberof syngen.seed
     * @param {...String} [...seeds]
     * @returns {String}
     */
    concat: (...seeds) => {
      seeds.unshift(seed)
      return seeds.join(separator)
    },
    /**
     * Returns the seed value.
     * @listens syngen.state#event.import
     * @memberof syngen.seed
     * @returns {String}
     */
    get: () => seed,
    /**
     * Returns the separator value.
     * @memberof syngen.seed
     * @returns {String}
     */
    getSeparator: () => separator,
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
     * Sets the separator value.
     * @memberof syngen.seed
     * @param {String} value
     */
    setSeparator: function (value) {
      if (typeof value == 'string') {
        separator = value
      }

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
 * Provides an interface for binaural audio processing.
 * Typical use involves sending it a monophonic signal for processing and then routing its output to a bus.
 * This interface is actually a small wrapper for two {@link syngen.audio.binaural.monaural|monaural} processors.
 * @interface
 * @todo Document private members
 */
syngen.audio.binaural = {}

/**
 * Instantiates a new binaural processor.
 * @param {Object} [options]
 * @param {Number} [options.x=0]
 * @param {Number} [options.y=0]
 * @param {Number} [options.z=0]
 * @returns {syngen.audio.binaural}
 * @static
 */
syngen.audio.binaural.create = function (options) {
  return Object.create(this.prototype).construct(options)
}

syngen.audio.binaural.prototype = {
  /**
   * Initializes the binaural processor.
   * @instance
   * @private
   */
  construct: function (options) {
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

    this.update(options)

    return this
  },
  /**
   * Prepares the instance for garbage collection.
   * @instance
   */
  destroy: function () {
    this.left.destroy()
    this.right.destroy()
    return this
  },
  /**
   * Connects `input` to this.
   * @instance
   * @param {AudioNode} input
   */
  from: function (input) {
    this.left.from(input)
    this.right.from(input)
    return this
  },
  /**
   * Connects this to `output`.
   * @instance
   * @param {AudioNode}
   */
  to: function (output) {
    this.merger.connect(output)
    return this
  },
  /**
   * Updates its inner monaural processors with `options`.
   * @instance
   * @see syngen.audio.binaural.monaural#update
   * @todo Calculate coordinates and orientation of monaural processors here
   */
  update: function (options) {
    this.left.update(options)
    this.right.update(options)
    return this
  },
}

/**
 * Provides factories that create miscellaneous audio circuits with practical use cases.
 * @namespace
 */
syngen.audio.circuit = {}

/**
 * Creates a `GainNode` that inverts a signal with `scale`.
 * @param {Object} [options={}]
 * @param {AudioNode|AudioParam} [options.from]
 * @param {Number} [options.scale=1]
 * @param {AudioNode|AudioParam} [options.to]
 * @returns {GainNode}
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

/**
 * Creates a circuit that interpolates an input signal linearly within `[0, 1]` to `[min, max]`.
 * Beware that it leverages `ConstantSourceNode`s.
 * Pass a `chainStop` or call the returned `stop` method to free resources when no longer in use.
 * @param {Object} [options={}]
 * @param {syngen.audio.synth~Synth} [options.chainStop]
 * @param {AudioNode|AudioParam} [options.from]
 *  Typically a `ConstantSourceNode`.
 * @param {Number} [options.max=1]
 * @param {Number} [options.min=0]
 * @param {AudioNode|AudioParam} [options.to]
 *  Typically an `AudioParam`.
 * @returns {Object}
 * @static
 */
syngen.audio.circuit.lerp = ({
  chainStop,
  from,
  max: maxValue = 1,
  min: minValue = 0,
  to,
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

/**
 * Creates a circuit that scales an input signal linearly within `[fromMin, fromMax]` to `[toMin, toMax]`.
 * Beware that it leverages `ConstantSourceNode`s.
 * Pass a `chainStop` or call the returned `stop` method to free resources when no longer in use.
 * @param {Object} [options={}]
 * @param {syngen.audio.synth~Synth} [options.chainStop]
 * @param {AudioNode|AudioParam} [options.from]
 *  Typically a `ConstantSourceNode`.
 * @param {Number} [options.fromMax=1]
 * @param {Number} [options.fromMin=0]
 * @param {AudioNode|AudioParam} [options.to]
 *   Typically an `AudioParam`.
 * @param {Number} [options.toMax=1]
 * @param {Number} [options.toMin=0]
 * @returns {Object}
 * @static
 */
syngen.audio.circuit.scale = ({
  chainStop,
  from,
  fromMax = 1,
  fromMin = 0,
  to,
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

  if (from) {
    from.connect(scale)
  }

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
  input = syngen.audio.mixer.master.output(),
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

/**
 * Provides a mastering process and utilities for routing audio into it like a virtual mixing board.
 * Implementations are encouraged to leverage this instead of the main audio destination directly.
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

  function createFilters(highpassFrequency = syngen.const.minFrequency, lowpassFrequency = syngen.const.maxFrequency) {
    masterHighpass = context.createBiquadFilter()
    masterHighpass.type = 'highpass'
    masterHighpass.frequency.value = highpassFrequency

    masterLowpass = context.createBiquadFilter()
    masterLowpass.type = 'lowpass'
    masterLowpass.frequency.value = lowpassFrequency

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
    /**
     * A collection of auxiliary sends that provide optional parallel effects processing.
     * @memberof syngen.audio.mixer
     * @namespace
     */
    auxiliary: {},
    /**
     * Creates a `GainNode` that's connected to the master input.
     * Implementations can leverage buses to create submixes.
     * @memberof syngen.audio.mixer
     * @returns {GainNode}
     */
    createBus: () => {
      const input = context.createGain()
      input.connect(masterInput)
      return input
    },
    /**
     * Exposes the nodes and parameters associated with the mastering process.
     * Here's an overview of its routing:
     * - `GainNode` input
     * - `BiquadFilterNode` highpass
     * - `BiquadFilterNode` lowpass
     * - `DynamicsCompressorNode` limiter
     * - `GainNode` limiter makeup gain
     * - `GainNode` output
     * - `AudioDestinationNode` `{@link syngen.audio.context}().destination`
     * @memberof syngen.audio.mixer
     * @property {Function} input
     *   Returns the master input `GainNode`.
     * @property {Function} output
     *   Returns the master output `GainNode`.
     * @property {Object} param
     *   Useful parameters for tuning the mastering process.
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
      input: () => masterInput,
      output: () => masterOutput,
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
     * Occasionally the master filters can enter an unstable or bad state.
     * When this happens the entire mix can drop out to silence.
     * This provides a solution for replacing them with stable filters.
     * Implementations can proactively check for invalid states with an {@link https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode|AnalyserNode} or {@link https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletNode|AudioWorkletNode}.
     * Beware that the nodes that caused the issue may also need reset.
     * @memberof syngen.audio.mixer
     */
    rebuildFilters: function () {
      const highpassFrequency = masterHighpass.frequency.value,
        lowpassFrequency = masterLowpass.frequency.value

      this.auxiliary.reverb.rebuildFilters()

      destroyFilters()
      createFilters(highpassFrequency, lowpassFrequency)

      this.master.param.highpass.frequency = masterHighpass.frequency
      this.master.param.lowpass.frequency = masterLowpass.frequency

      return this
    },
    /**
     * A collection of circuits that route signals to auxiliary sends.
     * @namespace syngen.audio.mixer.send
     */
    send: {},
  }
})()

/**
 * Provides utility methods for ramping `AudioParam`s.
 * @namespace
 */
syngen.audio.ramp = {}

/**
 * Ramps `audioParam` to the values in `curve` over `duration` seconds.
 * @param {AudioParam} audioParam
 * @param {Number[]} curve
 * @param {Number} [duration={@link syngen.const.zeroTime}]
 * @static
 */
syngen.audio.ramp.curve = function (audioParam, curve, duration = syngen.const.zeroTime) {
  audioParam.cancelScheduledValues(0)
  audioParam.setValueCurveAtTime(curve, syngen.audio.time(), syngen.audio.time(duration))
  return this
}

/**
 * Exponentially ramps `audioParam` to `value` over `duration` seconds.
 * @param {AudioParam} audioParam
 * @param {Number} value
 * @param {Number} [duration={@link syngen.const.zeroTime}]
 * @static
 */
syngen.audio.ramp.exponential = function (audioParam, value, duration = syngen.const.zeroTime) {
  syngen.audio.ramp.hold(audioParam)
  audioParam.exponentialRampToValueAtTime(value, syngen.audio.time(duration))
  return this
}

/**
 * Holds `audioParam` at its current time and cancels future values.
 * This is a polyfill for {@link https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/cancelAndHoldAtTime|AudioParam.cancelAndHoldAtTime()}.
 * @param {AudioParam} audioParam
 * @static
 */
syngen.audio.ramp.hold = function (audioParam) {
  audioParam.value = audioParam.value
  audioParam.cancelScheduledValues(0)
  return this
}

/**
 * Linearly ramps `audioParam` to `value` over `duration` seconds.
 * @param {AudioParam} audioParam
 * @param {Number} value
 * @param {Number} [duration={@link syngen.const.zeroTime}]
 * @static
 */
syngen.audio.ramp.linear = function (audioParam, value, duration = syngen.const.zeroTime) {
  syngen.audio.ramp.hold(audioParam)
  audioParam.linearRampToValueAtTime(value, syngen.audio.time(duration))
  return this
}

/**
 * Sets `audioParam` to `value` without pops or clicks.
 * The duration depends on the average frame rate.
 * @param {AudioParam} audioParam
 * @param {Number} value
 * @see syngen.performance.delta
 * @static
 */
syngen.audio.ramp.set = function (audioParam, value) {
  syngen.audio.ramp.linear(audioParam, value, syngen.performance.delta())
  return this
}

/**
 * Provides a variety of curves and curve generators that can be used with `WaveShaperNode`s.
 * @namespace
 */
syngen.audio.shape = (() => {
  const crush4 = createBitcrush(4),
    crush6 = createBitcrush(6),
    crush8 = createBitcrush(8),
    crush12 = createBitcrush(12),
    distort = createSigmoid(Math.PI * 8),
    dither = createNoise(syngen.const.zeroGain),
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
   * Generates a linear curve of arbitrary bit `depth` of `samples` length.
   * @param {Number} [depth=16]
   * @param {Number} [samples=2**16]
   * @memberof syngen.audio.shape
   * @returns {Float32Array}
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
   * Generates a linear curve with noise at `gain` of `samples` length.
   * @memberof syngen.audio.shape
   * @param {Number} [gain=1]
   * @param {Number} [samples=2**16]
   * @returns {Float32Array}
   */
  function createNoise(gain = 1, samples = 2 ** 16) {
    const shape = new Float32Array(samples),
      srand = syngen.utility.srand('syngen.audio.shape.createNoise', gain)

    const noise = () => srand(-gain, gain),
      y = (x) => syngen.utility.wrapAlternate(x + noise(), 0, 2) - 1

    for (let i = 0; i < shape.length; i += 1) {
      const x = i * 2 / (samples - 1)
      shape[i] = y(x)
    }

    shape[samples - 1] = y(2)

    return shape
  }

  /**
   * Generates a curve having random `steps` with `seed`.
   * @memberof syngen.audio.shape
   * @param {Number} [steps=3]
   * @param {String} [seed]
   * @returns {Float32Array}
   */
  function createRandom(steps = 2, seed = '') {
    const shape = new Float32Array(samples),
      srand = syngen.utility.srand('syngen.audio.shape.createRandom', seed)

    for (let i = 0; i < steps; i += 1) {
      shape[i] = srand(-1, 1)
    }

    return shape
  }

  /**
   * Generates a sigmoid curve with `amount` in radians of `samples` length.
   * Smaller values tend to be warmer, whereas larger values tend to be more distorted.
   * @memberof syngen.audio.shape
   * @param {Number} [amount=0]
   * @param {Number} [samples=2**16]
   * @returns {Float32Array}
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
   * Generates a curve that bounces a number of `times` before its zero crossing.
   * This effectively adds `times` harmonics to a signal at decreasing amplitudes similar to a sawtooth wave.
   * @memberof syngen.audio.shape
   * @param [times=1]
   * @returns {Float32Array}
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
   * Generates a rectified curve that bounces a number of `times`.
   * @memberof syngen.audio.shape
   * @param [times=1]
   * @returns {Float32Array}
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
    /**
     * Generates a curve that applies constant `offset`.
     * @memberof syngen.audio.shape
     * @param {Number} [offset=0]
     * @returns {Float32Array}
     */
    constant: (offset = 0) => new Float32Array([offset, offset]),
    createBitcrush,
    createNoise,
    createRandom,
    createSigmoid,
    createTuple,
    createTuplePulse,
    /**
     * Applies a 12-bit resolution.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    crush12: () => crush12,
    /**
     * Applies a 4-bit resolution.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    crush4: () => crush4,
    /**
     * Applies a 6-bit resolution.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    crush6: () => crush6,
    /**
     * Applies an 8-bit resolution.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    crush8: () => crush8,
    /**
     * Applies a heavy overdrive.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    distort: () => distort,
    /**
     * Applies dither, or -96 decibels of noise.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    dither: () => dither,
    /**
     * A double tuple.
     * The result of `{@link syngen.audio.shape.createTuple|syngen.audio.shape.createTuple(2)}`
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    double: () => double,
    /**
     * A double pulse tuple.
     * The result of `{@link syngen.audio.shape.createTuplePulse|syngen.audio.shape.createTuplePulse(2)}`
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    doublePulse: () => doublePulse,
    /**
     * Returns an equal-power fade-in curve.
     * This is useful
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    equalFadeIn: () => equalFadeIn,
    /**
     * Returns an equal-power fade-out curve.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    equalFadeOut: () => equalFadeOut,
    /**
     * Applies a moderate overdrive.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    hot: () => hot,
    /**
     * Inverts a signal.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    invert: () => invert,
    /**
     * Returns an inverted copy of `shape`.
     * @memberof syngen.audio.shape
     * @param {}
     * @returns {Float32Array}
     */
    invertShape: (shape) => shape.map((value) => -value),
    /**
     * Identity curve resulting in no shaping.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    linear: () => linear,
    /**
     * Noise curve with 0 decibels of noise.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    noise: () => noise,
    /**
     * Applies -3 decibels of noise.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    noise2: () => noise2,
    /**
     * Applies -6 decibels of noise.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    noise4: () => noise4,
    /**
     * Applies -9 decibels of noise.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    noise8: () => noise8,
    /**
     * Applies -12 decibels of noise.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    noise16: () => noise16,
    /**
     * Applies -15 decibels of noise.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    noise32: () => noise32,
    /**
     * Applies a constant `offset` to a copy of `shape`.
     * @memberof syngen.audio.shape
     * @param {Float32Array} shape
     * @param {Number} [offset=0]
     * @returns {Float32Array}
     */
    offsetShape: (shape, offset = 0) => shape.map((value) => value + offset),
    /**
     * Always one.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    one: () => one,
    /**
     * Omits troughs so only positive values are audible.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    pulse: () => pulse,
    /**
     * Returns a copy of `shape` with troughs set to zero.
     * @memberof syngen.audio.shape
     * @param {Float32Array} shape
     * @returns {Float32Array}
     */
    pulseShape: (shape) => shape.map((value) => value > 0 ? value : 0),
    /**
     * Rectifies a signal so it's always positive.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    rectify: () => rectify,
    /**
     * Returns a rectified copy of `shape`.
     * @memberof syngen.audio.shape
     * @param {Float32Array} shape
     * @returns {Float32Array}
     */
    rectifyShape: (shape) => shape.map(Math.abs),
    /**
     * Returns a reversed copy of `shape`.
     * @memberof syngen.audio.shape
     * @param {Float32Array} shape
     * @returns {Float32Array}
     */
    reverseShape: (shape) => shape.slice().reverse(),
    /**
     * Applies a hard threshold where values round to -1 or 1.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    square: () => square,
    /**
     * A triple tuple.
     * The result of `{@link syngen.audio.shape.createTuple|syngen.audio.shape.createTuple(3)}`
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    triple: () => triple,
    /**
     * A triple pulse tuple.
     * The result of `{@link syngen.audio.shape.createTuplePulse|syngen.audio.shape.createTuplePulse(3)}`
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    triplePulse: () => triplePulse,
    /**
     * Applies a slight overdrive
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    warm: () => warm,
    /**
     * Always zero.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    zero: () => zero,
  }
})()

/**
 * Provides factories for building simple prefabricated synthesizers.
 * Importantly, these are _not_ the only way to generate audio with syngen.
 * Implementations can build their own synthesizers or use any external library that supports connecting to its audio graph.
 * @namespace
 */
syngen.audio.synth = {}

/**
 * Assigns `plugin` to `synth` at `key`, merges its parameters into `synth.param[key]`, and returns `synth`.
 * If `key` already exists, then those plugins will be wrapped in an array.
 * @param {syngen.audio.synth~Synth} synth
 * @param {String} key
 * @param {syngen.audio.synth~Plugin} plugin
 * @private
 * @returns {syngen.audio.synth~Synth}
 * @static
 */
syngen.audio.synth.assign = function (synth, key, plugin) {
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
 * @param {syngen.audio.synth~Synth} synth
 * @param {syngen.audio.synth~Plugin|AudioNode} plugin
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
 * @param {syngen.audio.synth~Plugin|AudioNode} plugin
 * @private
 * @returns {Object}
 * @see syngen.audio.synth.assign
 * @see syngen.audio.synth.chain
 * @static
 */
syngen.audio.synth.chainAssign = function (synth, key, plugin) {
  this.assign(synth, key, plugin)
  this.chain(synth, plugin)
  return synth
}

/**
 * Wraps `synth` such that `plugin` stops when it stops and returns `synth`.
 * @param {syngen.audio.synth~Synth} synth
 * @param {syngen.audio.synth~Plugin} plugin
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
 * @todo Leverage {@link syngen.audio.synth.createLfo} internally
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
 * @todo Leverage {@link syngen.audio.synth.createLfo} internally
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
 * @todo Leverage {@link syngen.audio.synth.createLfo} internally
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
 * @todo Leverage {@link syngen.audio.synth.createLfo} internally
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
 *   This is shorthand for calling both `chain()` and `assign()`.
 * @property {Function} chainStop
 *   Ensures `plugin` stops when the synth is stopped.
 *   This is called internally by `chain()`.
 *   Implementations should only call this manually if `plugin` is not part of its output chain.
 * @property {Function} connect
 *   Connects synth output to `node` with optional `...args`.
 * @property {Function} disconnect
 *   Disconnects synth output from `node` with optional `...args`.
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
 * @todo Improve documentation as an interface
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
    return syngen.audio.synth.filtered(this, ...args)
  },
  shaped: function (...args) {
    return syngen.audio.synth.shaped(this, ...args)
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

/**
 * A plugin compatible with synth chaining.
 * Typically returned from a {@link syngen.audio.effect} or {@link syngen.audio.formant} factory method.
 * Implementations can create their own plugins for synths as long as they have an `input` and `output`.
 * @property {AudioNode} input
 *   The plugin output.
 * @property {AudioNode} output
 *   The plugin output.
 * @property {Object} [param]
 *   Hash of all `AudioParam`s.
 * @property {Function} [stop]
 *   Stops the plugins.
 * @todo Improve documentation as an interface
 * @typedef {Object} syngen.audio.synth~Plugin
 */

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
 * Provides a auxiliary send for global reverb processing.
 * Because `ConvolverNode`s are quite intensive, implementations are encouraged to leverage this to provide a single global reverb.
 * @augments syngen.utility.pubsub
 * @namespace
 * @see syngen.audio.mixer.send.reverb
 */
syngen.audio.mixer.auxiliary.reverb = (() => {
  const context = syngen.audio.context(),
    delay = context.createDelay(),
    input = context.createGain(),
    output = syngen.audio.mixer.createBus(),
    pubsub = syngen.utility.pubsub.create()

  let active = true,
    convolver = context.createConvolver(),
    highpass,
    lowpass

  convolver.buffer = syngen.audio.buffer.impulse.small()
  delay.delayTime.value = 1/64

  input.connect(delay)
  createFilters()
  convolver.connect(output)

  function createFilters(highpassFrequency = syngen.const.minFrequency, lowpassFrequency = syngen.const.maxFrequency) {
    highpass = context.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = highpassFrequency

    lowpass = context.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = lowpassFrequency

    delay.connect(highpass)
    highpass.connect(lowpass)
    lowpass.connect(convolver)
  }

  function destroyFilters() {
    delay.disconnect()
    lowpass.disconnect()
    lowpass = null
    highpass.disconnect()
    highpass = null
  }

  return syngen.utility.pubsub.decorate({
    /**
     * Creates a `GainNode` that's connected to the reverb input.
     * @memberof syngen.audio.mixer.auxiliary.reverb
     * @returns {GainNode}
     */
    createSend: () => {
      const gain = context.createGain()
      gain.connect(input)
      return gain
    },
    /**
     * Returns whether the processing is active.
     * @memberof syngen.audio.mixer.auxiliary.reverb
     * @returns {Boolean}
     */
    isActive: () => active,
    /**
     * Returns the output node for the send.
     * @deprecated
     * @memberof syngen.audio.mixer.auxiliary.reverb
     * @returns {GainNode}
     */
    output: () => output,
    /**
     * Exposes the parameters associated with reverb processing.
     * @memberof syngen.audio.mixer.auxiliary.reverb
     * @property {AudioParam} delay
     * @property {AudioParam} gain
     * @property {Object} highpass
     * @property {AudioParam} highpass.frequency
     * @property {Object} lowpass
     * @property {AudioParam} lowpass.frequency
     */
    param: {
      delay: delay.delayTime,
      gain: output.gain,
      highpass: {
        frequency: highpass.frequency,
      },
      lowpass: {
        frequency: lowpass.frequency,
      },
    },
    /**
     * Occasionally the filters can enter an unstable or bad state.
     * This provides a solution for replacing them with stable filters.
     * @memberof syngen.audio.mixer.auxiliary.reverb
     * @see syngen.audio.mixer.rebuildFilters
     */
    rebuildFilters: function () {
      const highpassFrequency = highpass.frequency.value,
        lowpassFrequency = lowpass.frequency.value

      destroyFilters()
      createFilters(highpassFrequency, lowpassFrequency)

      this.param.highpass.frequency = highpass.frequency
      this.param.lowpass.frequency = lowpass.frequency

      return this
    },
    /**
     * Sets the active state.
     * Implementations can disable processing for a performance boost.
     * @fires syngen.audio.mixer.auxiliary.reverb#event:activate
     * @fires syngen.audio.mixer.auxiliary.reverb#event:deactivate
     * @memberof syngen.audio.mixer.auxiliary.reverb
     * @param {Boolean} state
     */
    setActive: function (state) {
      if (active == state) {
        return this
      }

      active = Boolean(state)

      if (active) {
        /**
         * Fired whenever the send is activated.
         * @event syngen.audio.mixer.auxiliary.reverb#event:activate
         */
        pubsub.emit('activate')
        input.connect(convolver)
      } else {
        /**
         * Fired whenever the send is deactivated.
         * @event syngen.audio.mixer.auxiliary.reverb#event:deactivate
         */
        pubsub.emit('deactivate')
        input.disconnect(convolver)
      }

      return this
    },
    /**
     * Sets the impulse buffer for the inner `ConvolverNode`.
     * To prevent pops and clicks, the tail of the previous buffer persists until it fades out.
     * @memberof syngen.audio.mixer.auxiliary.reverb
     * @param {BufferSource} buffer
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
 * Provides an interface for routing audio to the global reverb auxiliary send.
 * Importantly, it models physical space to add pre-delay and attenuate based on distance.
 * @interface
 * @see syngen.audio.mixer.auxiliary.reverb
 * @todo Document private members
 */
syngen.audio.mixer.send.reverb = {}

/**
 * Creates a reverb send.
 * @param {Object} [options]
 * @param {Number} [options.x=0]
 * @param {Number} [options.y=0]
 * @param {Number} [options.z=0]
 * @returns {syngen.audio.mixer.send.reverb}
 * @static
 */
syngen.audio.mixer.send.reverb.create = function (options) {
  return Object.create(this.prototype).construct(options)
}

syngen.audio.mixer.send.reverb.prototype = {
  /**
   * Initializes the instance.
   * @instance
   * @private
   */
  construct: function (options) {
    const context = syngen.audio.context()

    this.delay = context.createDelay()
    this.input = context.createGain()
    this.relative = syngen.utility.vector3d.create()
    this.send = syngen.audio.mixer.auxiliary.reverb.createSend()

    this.send.gain.value = syngen.const.zeroGain

    this.onSendActivate = this.onSendActivate.bind(this)
    syngen.audio.mixer.auxiliary.reverb.on('activate', this.onSendActivate)

    this.onSendDeactivate = this.onSendDeactivate.bind(this)
    syngen.audio.mixer.auxiliary.reverb.on('deactivate', this.onSendDeactivate)

    if (syngen.audio.mixer.auxiliary.reverb.isActive()) {
      this.onSendActivate()
    } else {
      this.onSendDeactivate()
    }

    this.update(options)

    return this
  },
  /**
   * Prepares the instance for garbage collection.
   * Immediately disconnects from all inputs and outputs.
   * @instance
   */
  destroy: function () {
    syngen.audio.mixer.auxiliary.reverb.off('activate', this.onSendActivate)
    syngen.audio.mixer.auxiliary.reverb.off('deactivate', this.onSendDeactivate)
    this.send.disconnect()
    return this
  },
  /**
   * Connects `input` to this.
   * @instance
   */
  from: function (input) {
    input.connect(this.input)
    return this
  },
  /**
   * Handles whenever the auxiliary send activates.
   * @instance
   * @listens syngen.audio.mixer.auxiliary.reverb#event:activate
   * @private
   */
  onSendActivate: function () {
    this.update(this.relative)
    this.input.connect(this.delay)
    this.delay.connect(this.send)
    return this
  },
  /**
   * Handles whenever the auxiliary send deactivates.
   * @instance
   * @listens syngen.audio.mixer.auxiliary.reverb#event:activate
   * @private
   */
  onSendDeactivate: function () {
    this.input.disconnect()
    this.delay.disconnect()
    return this
  },
  /**
   * Updates the circuit with `options` relative to an observer at the origin.
   * @instance
   * @param {Object} [options={}]
   * @param {Number} [options.x=0]
   * @param {Number} [options.y=0]
   * @param {Number} [options.z=0]
   * @todo Assess whether it'd be better to simply pass the distance
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

    const distance = this.relative.distance(),
      power = Math.min(syngen.utility.distanceToPower(distance), syngen.utility.fromDb(-1))

    const delayTime = syngen.utility.clamp(distance / syngen.const.speedOfSound, syngen.const.zeroTime, 1),
      gain = syngen.utility.clamp((power ** 0.75) * (1 - (power ** 0.75)), syngen.const.zeroGain, 1)

    syngen.audio.ramp.set(this.delay.delayTime, delayTime)
    syngen.audio.ramp.set(this.send.gain, gain)

    return this
  },
}

/**
 * Provides an interface for processing audio as an observer in a physical space.
 * Importantly, it models interaural intensity differences, interaural arrival time, and acoustic shadow.
 * Implementations are currently discouraged from using this directly.
 * @interface
 * @todo Document private members
 */
syngen.audio.binaural.monaural = {}

/**
 * Instantiates a monaural processor.
 * @param {Object} [options={}]
 * @param {Number} [options.pan=0]
 *   Between `[-1, 1]` representing hard-left to hard-right.
 * @returns {syngen.audio.binaural.monaural}
 * @static
 */
syngen.audio.binaural.monaural.create = function (options) {
  return Object.create(this.prototype).construct(options)
}

syngen.audio.binaural.monaural.prototype = {
  /**
   * Initializes the instance.
   * @instance
   * @private
   */
  construct: function ({
    pan = 0,
  }) {
    const context = syngen.audio.context()

    this.panSign = syngen.utility.sign(pan)
    this.angleOffset = -this.panSign * Math.PI / 2

    this.delay = context.createDelay()
    this.filter = context.createBiquadFilter()
    this.gain = context.createGain()

    this.filter.frequency.value = syngen.const.maxFrequency
    this.gain.gain.value = syngen.const.zeroGain

    this.delay.connect(this.filter)
    this.filter.connect(this.gain)

    return this
  },
  /**
   * Prepares the instance for garbage collection.
   * @instance
   */
  destroy: function () {
    return this
  },
  /**
   * Connects `input` to this with additional `...args`.
   * @instance
   * @param {AudioNode} input
   * @param {...*} [...args]
   */
  from: function (input, ...args) {
    input.connect(this.delay, ...args)
    return this
  },
  /**
   * Connects this to `output` with additional `...args`.
   * @instance
   * @param {AudioNode} output
   * @param {...*} [...args]
   */
  to: function (output, ...args) {
    this.gain.connect(output, ...args)
    return this
  },
  /**
   * Updates the internal circuit with `options` relative to an observer facing 0° at the origin.
   * @instance
   * @param {Object} [options={}]
   * @param {ONumber} [options.x=0]
   * @param {ONumber} [options.y=0]
   * @param {ONumber} [options.z=0]
   * @todo Model acoustic shadow as a three-dimensional cone or hemisphere
   * @todo Simplify so {@link syngen.audio.binaural#update} positions and orients each ear before calling
   */
  update: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
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
    isPaused = false,
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
      paused: isPaused,
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
    isPaused: () => isPaused,
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
      if (isPaused) {
        return this
      }

      isPaused = true

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
      if (!isPaused) {
        return this
      }

      isPaused = false

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
       */
      pubsub.emit('start')

      return this
    },
    /**
     * Stops the loop.
     * @fires syngen.loop#event:stop
     * @memberof syngen.loop
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
 * Instances _should_ be created and destroyed via {@link syngen.props}.
 * @augments syngen.utility.physical
 * @interface
 */
syngen.prop.base = {
  /**
   * Binaural processor for the prop.
   * @instance
   * @type {syngen.audio.binaural}
   */
  binaural: undefined,
  /**
   * Initializes the prop with `options` and fades in its volume.
   * Derivative props are discouraged from overriding this method.
   * Instead they should define an {@link syngen.prop.base#onConstruct|onConstruct} method.
   * @instance
   * @param {Object} [options={}]
   * @param {GainNode} [options.destination={@link syngen.audio.mixer.master.input|syngen.audio.mixer.master.input()}]
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
    destination = syngen.audio.mixer.master.input(),
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
    this.output = context.createGain()
    this.radius = radius
    this.token = token
    this.x = x
    this.y = y
    this.z = z

    this.output.gain.value = syngen.const.zeroGain

    this.binaural.from(this.output)
    this.binaural.to(destination)

    if (this.reverb) {
      this.reverb = syngen.audio.mixer.send.reverb.create()
      this.reverb.from(this.output)
    }

    syngen.utility.physical.decorate(this)

    this.recalculate()
    this.onConstruct(options)

    syngen.audio.ramp.linear(this.output.gain, 1, this.fadeInDuration)

    return this
  },
  /**
   * Prepares the instance for garbage collection and fades out its volume.
   * Derivative props are discouraged from overriding this method.
   * Instead they should define an {@link syngen.prop.base#onConstruct|onDestroy} method.
   * @instance
   * @see syngen.prop.base#onDestroy
   * @see syngen.props.destroy
   */
  destroy: function () {
    syngen.audio.ramp.linear(this.output.gain, syngen.const.zeroGain, this.fadeOutDuration)

    setTimeout(() => {
      this.output.disconnect()
      this.binaural.destroy()

      if (this.reverb) {
        this.reverb.destroy()
      }

      this.onDestroy()
    }, (syngen.const.audioLookaheadTime + this.fadeOutDuration) * 1000)

    return this
  },
  /**
   * The distance of the prop relative to the observer's coordinates.
   * @instance
   * @type {Number}
   */
  distance: undefined,
  /**
   * Duration of fade in when instantiated.
   * @type {Number}
   */
  fadeInDuration: syngen.const.zeroTime,
  /**
   * Duration of fade out when destroyed.
   * @type {Number}
   */
  fadeOutDuration: syngen.const.zeroTime,
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
   * On creation and destruction its gain is ramped to fade in and out.
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

    if (this.reverb) {
      this.reverb.update({...this.relative})
    }

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
   * Reverb send for the prop.
   * Implementations can disable reverb for certain prototypes by explicitly setting this to `false`.
   * @instance
   * @type {syngen.audio.mixer.send.reverb|Boolean}
   */
  reverb: true,
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
     * @param {...syngen.prop.base} ...values
     */
    destroy: function (...values) {
      for (const prop of values) {
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
