/* syngen v2.0.0-beta.2 */
(() => {
'use strict'
/**
 * The global point of entry and default export for the framework.
 * @namespace
 */
const syngen = (() => {
  const context = new AudioContext()

  const ready = new Promise((resolve) => {
    document.addEventListener('DOMContentLoaded', resolve)
  })

  return {
    /**
     * Useful functions for generating [AudioBuffers](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer).
     * @memberof syngen
     * @namespace
     */
    buffer: {},
    /**
     * Provides factories that create miscellaneous audio circuits with practical use cases.
     * @memberof syngen
     * @namespace
     */
     circuit: {},
    /**
     * Returns the main `AudioContext`.
     * @memberof syngen
     * @returns {AudioContext}
     */
    context: () => context,
    /**
     * Provides factories for aural processers.
     * @memberof syngen
     * @namespace
     */
     ear: {
       filterModel: {},
       gainModel: {},
     },
    /**
     * Provides factories that create circuits for effects processing.
     * Importantly, these are _not_ the only way to create effects for use with syngen.
     * Implementations can build their own effects or use any external library that supports connecting to its audio graph.
     * @memberof syngen
     * @namespace
     */
     effect: {},
    /**
     * Exposes input across various devices.
     * @memberof syngen
     * @namespace
     */
    input: {},
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
    /**
     * Returns the `currentTime` for the main `AudioContext` plus an optional `duration`.
     * @memberof syngen
     * @param {Number} [duration=0]
     * @returns {Number}
     */
    time: (duration = 0) => context.currentTime + duration,
    /**
     * A collection of reusable tools and data structures.
     * @memberof syngen
     * @namespace
     */
    tool: {},
  }
})()

/**
 * A collection of useful constants used throughout the library.
 * These can be overridden at runtime.
 * @namespace
 */
syngen.const = {}

/**
 * Default rotation sequence when converting Euler angles to quaternions. Valid values include:
 * - XYZ
 * - XZY
 * - YXZ
 * - YZX
 * - ZXY
 * - ZYX
 * @type {String}
*/
syngen.const.eulerToQuaternion = 'ZYX'

/**
 * The gravitational constant.
 * @type {Number}
 */
syngen.const.gravity = 6.6743E-11

/**
 * Upper bound of perceptible frequencies, in Hertz.
 * @type {Number}
*/
syngen.const.maxFrequency = 20000

/**
 * The largest float before precision loss becomes problematic.
 * This value is derived from `Number.MAX_SAFE_INTEGER / (2 ** 10)` to deliver about three decimal places of precision, which is suitable for most purposes.
 * @type {Number}
*/
syngen.const.maxSafeFloat = (2 ** 43) - 1

/**
 * Frequency of the MIDI reference note, in Hertz.
 * @type {Number}
*/
syngen.const.midiReferenceFrequency = 440

/**
 * Reference note number used when converting MIDI notes to frequencies.
 * @type {Number}
*/
syngen.const.midiReferenceNote = 69

/**
 * Lower bound of perceptible frequencies, in Hertz.
 * @type {Number}
*/
syngen.const.minFrequency = 20

/**
 * The speed of sound, in meters per second.
 * @type {Number}
*/
syngen.const.speedOfSound = 343

/**
 * The circle constant, i.e. 2π.
 * @type {Number}
*/
syngen.const.tau = Math.PI * 2

/**
 * Length that satisfies `x=y` for a 2D unit circle.
 * @type {Number}
*/
syngen.const.unit2 = Math.sqrt(2) / 2

/**
 * Length that satisfies `x=y=z` for a 3D unit sphere.
 * @type {Number}
*/
syngen.const.unit3 = Math.sqrt(3) / 3

/**
 * Length that satisfies `w=x=y=z` for a 4D unit hypersphere.
 * @type {Number}
*/
syngen.const.unit4 = Math.sqrt(4) / 4

/**
 * Close enough to zero for most calculations that can't use zero, like ramping `AudioParam`s exponentially to zero.
 * @type {Number}
*/
syngen.const.zero = 10 ** -32

/**
 * Value in decibels that, for most purposes, is perceptibly silent.
 * @type {Number}
*/
syngen.const.zeroDb = -96

/**
 * Value in gain that, for most purposes, is perceptibly silent.
 * @type {Number}
*/
syngen.const.zeroGain = 10 ** (-96 / 10) // syngen.fn.fromDb(syngen.const.zeroDb)

/**
 * Length of time that, for most purposes, is perceptibly instantaneous.
 * @type {Number}
*/
syngen.const.zeroTime = 0.005

/**
 * A collection of useful functions.
 * @namespace
 */
syngen.fn = {}

syngen.fn.accelerateValue = (current, target, acceleration, deceleration = undefined) => {
  if (typeof deceleration == 'undefined') {
    deceleration = acceleration
  }

  if (current == target) {
    return target
  }

  const deltaRate = syngen.loop.delta() * (
    Math.abs(target) >= Math.abs(current) && Math.sign(current) == Math.sign(target)
      ? acceleration
      : deceleration
  )

  if (syngen.fn.between(target, current - deltaRate, current + deltaRate)) {
    return target
  }

  return current > target
    ? current - deltaRate
    : current + deltaRate
}

syngen.fn.accelerateVector = (current, target, acceleration, deceleration = undefined) => {
  if (deceleration === undefined) {
    deceleration = acceleration
  }

  if (!syngen.tool.vector3d.prototype.isPrototypeOf(current)) {
    current = syngen.tool.vector3d.create(current)
  }

  if (!syngen.tool.vector3d.prototype.isPrototypeOf(target)) {
    target = syngen.tool.vector3d.create(target)
  }

  const next = current.clone()

  if (current.equals(target)) {
    return next
  }

  const normalized = target.subtract(current).normalize()

  for (const axis of ['x', 'y', 'z']) {
    next[axis] = syngen.fn.accelerateValue(
      current[axis],
      target[axis],
      acceleration * Math.abs(normalized[axis]),
      deceleration * Math.abs(normalized[axis])
    )
  }

  return next
}

/**
 * Adds a musical `interval` to a `frequency`, in Hertz.
 * @param {Number} frequency
 * @param {Number} interval
 *   Each integer multiple represents an octave.
 *   For example, `2` raises the frequency by two octaves.
 *   Likewise, `-1/12` lowers by one half-step, whereas `-1/100` lowers by one cent.
 * @static
 */
syngen.fn.addInterval = (frequency, interval) => frequency * (2 ** interval)

/**
 * Returns whether `value` is between `a` and `b` (inclusive).
 * @param {Number} value
 * @param {Number} a
 * @param {Number} b
 * @returns {Boolean}
 * @static
 */
syngen.fn.between = (value, a, b) => value >= Math.min(a, b) && value <= Math.max(a, b)

/**
 * Calculates the geometric center of variadic vectors or vector-likes.
 * @param {syngen.utility.vector3d[]|syngen.utility.vector2d[]|Object[]} ...ectors
 * @returns {syngen.utility.vector3d}
 * @static
 */
syngen.fn.centroid = (...vectors) => {
  if (!vectors.length) {
    return syngen.tool.vector3d.create()
  }

  let xSum = 0,
    ySum = 0,
    zSum = 0

  for (const vector of vectors) {
    xSum += vector.x || 0
    ySum += vector.y || 0
    zSum += vector.z || 0
  }

  return syngen.tool.vector3d.create({
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
syngen.fn.choose = (options = [], value = 0) => {
  value = syngen.fn.clamp(value, 0, 1)

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
syngen.fn.chooseSplice = (options = [], value = 0) => {
  value = syngen.fn.clamp(value, 0, 1)

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
syngen.fn.chooseWeighted = (options = [], value = 0) => {
  // SEE: https://medium.com/@peterkellyonline/weighted-random-selection-3ff222917eb6
  value = syngen.fn.clamp(value, 0, 1)

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
 * @param {Number} [min=0]
 * @param {Number} [max=1]
 * @returns {Number}
 * @static
 */
syngen.fn.clamp = (value, min = 0, max = 1) => {
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
syngen.fn.closer = (x, a, b) => {
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
syngen.fn.closest = function (x, values = []) {
  return values.reduce((closest, value) => syngen.fn.closer(x, closest, value), values[0])
}

/**
 * Instantiates `octaves` noise generators of `type` with `seed` and returns a wrapper object that calculates their combined values.
 * @param {Object} options
 * @param {Number} [options.noScale=[]]
 *   Indices of arguments to not scale by frequency for higher octaves.
 * @param {Number} [options.octaves=1]
 * @param {*} options.seed
 * @param {String} options.type
 *   Valid values include `1d`, `perlin2d`, `perlin3d`, `perlin4d`, `simplex2d`, `simplex3d`, `simplex4d`.
 * @returns {Object}
 * @static
 * @todo noScale option needs a better name?
 */
syngen.fn.createNoise = ({
  noScale = [],
  seed,
  octaves = 1,
  type,
} = {}) => {
  const types = {
    '1d': syngen.tool.noise,
    perlin2d: syngen.tool.perlin2d,
    perlin3d: syngen.tool.perlin3d,
    perlin4d: syngen.tool.perlin4d,
    simplex2d: syngen.tool.simplex2d,
    simplex3d: syngen.tool.simplex3d,
    simplex4d: syngen.tool.simplex4d,
  }

  type = types[type]

  if (!type) {
    throw new Error('Incorrect type.')
  }

  octaves = Math.max(1, Math.round(octaves))

  if (octaves == 1) {
    return type.create(seed)
  }

  const compensation = 1 / (1 - (2 ** -octaves)),
    layers = []

  if (!Array.isArray(seed)) {
    seed = [seed]
  }

  for (let i = 0; i < octaves; i += 1) {
    layers.push(
      type.create(...seed, 'octave', i)
    )
  }

  // Optimize for up to 4d
  const noScale0 = noScale.includes(0),
    noScale1 = noScale.includes(1),
    noScale2 = noScale.includes(2),
    noScale3 = noScale.includes(3)

  return {
    layer: layers,
    reset: function () {
      for (let layer of this.layer) {
        layer.reset()
      }
      return this
    },
    value: function (...args) {
      let amplitude = 1/2,
        frequency = 1,
        sum = 0

      for (let i in this.layer) {
        const layer = this.layer[i]

        sum += layer.value(
          noScale0 ? args[0] : args[0] * frequency,
          noScale1 ? args[1] : args[1] * frequency,
          noScale2 ? args[2] : args[2] * frequency,
          noScale3 ? args[3] : args[3] * frequency,
        ) * amplitude

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
syngen.fn.deg2rad = (degrees) => degrees * Math.PI / 180

/**
 * Returns a debounced version of `fn` that executes `timeout` milliseconds after its last execution.
 * @param {Function} fn
 * @param {Number} [timeout=0]
 * @returns {Function}
 */
syngen.fn.debounced = function (fn, timeout = 0) {
  let handler

  return (...args) => {
    clearTimeout(handler)
    handler = setTimeout(() => fn(...args), timeout)
  }
}

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
syngen.fn.detune = (frequency, cents = 0) => frequency * (2 ** (cents / 1200))

/**
 * Calculates the distance between two vectors or vector-likes.
 * @param {syngen.tool.vector2d|syngen.tool.vector3d|Object} a
 * @param {syngen.tool.vector2d|syngen.tool.vector3d|Object} b
 * @returns {Number}
 * @static
 */
syngen.fn.distance = (a, b) => Math.sqrt(syngen.fn.distance2(a, b))

/**
 * Calculates the squared distance between two vectors or vector-likes.
 * @param {syngen.tool.vector2d|syngen.tool.vector3d|Object} a
 * @param {syngen.tool.vector2d|syngen.tool.vector3d|Object} b
 * @returns {Number}
 * @static
 */
syngen.fn.distance2 = ({
  x: x1 = 0,
  y: y1 = 0,
  z: z1 = 0,
} = {}, {
  x: x2 = 0,
  y: y2 = 0,
  z: z2 = 0,
} = {}) => ((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1)) + ((z2 - z1) * (z2 - z1))

/**
 * Creates a shallow copy of `definition` which has `prototype`.
 * If `definition` is a function, it will be executed with `prototype` as its argument.
 * @param {Object} prototype
 * @param {Object|Function} definition
 * @returns {Object}
 * @static
 */
syngen.fn.extend = function (prototype = {}, definition = {}) {
  if (typeof definition == 'function') {
    definition = definition(prototype)
  }

  return Object.setPrototypeOf({...definition}, prototype)
}

/**
 * Converts `decibels` to its equivalent gain value.
 * @param {Number} decibels
 * @returns {Number}
 * @static
 */
syngen.fn.fromDb = (decibels) => 10 ** (decibels / 10)

/**
 * Converts a MIDI `note` number to its frequency, in Hertz.
 * @param {Number} note
 * @returns {Number}
 * @see syngen.const.midiReferenceFrequency
 * @see syngen.const.midiReferenceNote
 * @static
 */
syngen.fn.fromMidi = (midiNote) => {
  return syngen.const.midiReferenceFrequency * Math.pow(2, (midiNote - syngen.const.midiReferenceNote) / 12)
}

/**
 * Converts `value` to an integer via the Jenkins hash function.
 * @param {String} value
 * @returns {Number}
 * @static
 */
syngen.fn.hash = (value) => {
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
 * Holds `audioParam` at its current time and cancels future values.
 * This is a polyfill for {@link https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/cancelAndHoldAtTime|AudioParam.cancelAndHoldAtTime()}.
 * @param {AudioParam} audioParam
 * @static
 */
syngen.fn.holdParam = function (audioParam) {
  audioParam.cancelScheduledValues(0)
  audioParam.setValueAtTime(audioParam.value, syngen.time())
  return this
}

/**
 * Adds a random value to `baseValue` within the range of negative to positive `amount`.
 * @param {Number} baseValue
 * @param {Number} amount
 * @returns {Number}
 * @static
 */
syngen.fn.humanize = (baseValue = 1, amount = 0) => {
  return baseValue + syngen.fn.randomFloat(-amount, amount)
}

/**
 * Adds a random gain to `baseGain` within the range of negative to positive `decibels`, first converted to gain.
 * @param {Number} baseGain
 * @param {Number} decibels
 * @returns {Number}
 * @static
 */
syngen.fn.humanizeDb = (baseGain = 1, decibels = 0) => {
  const amount = syngen.fn.fromDb(decibels)
  return baseGain * syngen.fn.randomFloat(1 - amount, 1 + amount)
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
syngen.fn.intersects = ({
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
  const between = syngen.fn.between

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
syngen.fn.lerp = (min, max, value = 0) => (min * (1 - value)) + (max * value)

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
syngen.fn.lerpExp = (min, max, value = 0, power = 2) => {
  return syngen.fn.lerp(min, max, value ** power)
}

/**
 * Returns a random value within the range where the lower bound is the interpolated value within `[lowMin, highMin]`, the upper bound is the interpolated value within `[lowMax, highMax]`.
 * Values are interpolated with {@link syngen.fn.lerpExpRandom|lerpExpRandom}.
 * @param {Number[]} lowRange
 *   Expects `[lowMin, lowMax]`.
 * @param {Number[]} highRange
 *   Expects `[highMin, highMax]`.
 * @param {Number} [value]
 * @param {Number} [power]
 * @returns {Number}
 * @see syngen.fn.lerpExp
 * @static
 */
syngen.fn.lerpExpRandom = ([lowMin, lowMax], [highMin, highMax], value, power) => {
  return syngen.fn.randomFloat(
    syngen.fn.lerpExp(lowMin, highMin, value, power),
    syngen.fn.lerpExp(lowMax, highMax, value, power),
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
syngen.fn.lerpLog = (min, max, value = 0, base = 2) => {
  value *= base - 1
  return syngen.fn.lerp(min, max, Math.log(1 + value) / Math.log(base))
}

/**
 * Linearly interpolates between `min` and `max` with `value` logarithmically with `base`.
 * This function is shorthand for `{@link syngen.fn.lerpLog|lerpLog}(min, max, 1 - value, 1 / base)` which results in curve that inversely favors larger values.
 * This is similar to but distinct from {@link syngen.fn.lerpExp|lerpExp}.
 * @param {Number} min
 * @param {Number} max
 * @param {Number} [value=0]
 *   Float within `[0, 1]`.
 * @param {Number} [base=2]
 * @returns {Number}
 * @see syngen.fn.lerpLog
 * @static
 */
syngen.fn.lerpLogi = (min, max, value, base) => {
  return syngen.fn.lerpLog(max, min, 1 - value, base)
}

/**
 * Returns a random value within the range where the lower bound is the interpolated value within `[lowMin, highMin]`, the upper bound is the interpolated value within `[lowMax, highMax]`.
 * Values are interpolated with {@link syngen.fn.lerpLogi|lerpLogi}.
 * @param {Number[]} lowRange
 *   Expects `[lowMin, lowMax]`.
 * @param {Number[]} highRange
 *   Expects `[highMin, highMax]`.
 * @param {Number} [value]
 * @param {Number} [power]
 * @returns {Number}
 * @see syngen.fn.lerpLogi
 * @static
 */
syngen.fn.lerpLogiRandom = ([lowMin, lowMax], [highMin, highMax], value) => {
  return syngen.fn.randomFloat(
    syngen.fn.lerpLogi(lowMin, highMin, value),
    syngen.fn.lerpLogi(lowMax, highMax, value),
  )
}

/**
 * Returns a random value within the range where the lower bound is the interpolated value within `[lowMin, highMin]`, the upper bound is the interpolated value within `[lowMax, highMax]`.
 * Values are interpolated with {@link syngen.fn.lerpLog|lerpLog}.
 * @param {Number[]} lowRange
 *   Expects `[lowMin, lowMax]`.
 * @param {Number[]} highRange
 *   Expects `[highMin, highMax]`.
 * @param {Number} [value]
 * @param {Number} [base]
 * @returns {Number}
 * @see syngen.fn.lerpLog
 * @static
 */
syngen.fn.lerpLogRandom = ([lowMin, lowMax], [highMin, highMax], value, base) => {
  return syngen.fn.randomFloat(
    syngen.fn.lerpLog(lowMin, highMin, value, base),
    syngen.fn.lerpLog(lowMax, highMax, value, base),
  )
}

/**
 * Returns a random value within the range where the lower bound is the interpolated value within `[lowMin, highMin]`, the upper bound is the interpolated value within `[lowMax, highMax]`.
 * Values are interpolated with {@link syngen.fn.lerp|lerp}.
 * @param {Number[]} lowRange
 *   Expects `[lowMin, lowMax]`.
 * @param {Number[]} highRange
 *   Expects `[highMin, highMax]`.
 * @param {Number} [value]
 * @param {Number} [base]
 * @returns {Number}
 * @see syngen.fn.lerp
 * @static
 */
syngen.fn.lerpRandom = ([lowMin, lowMax], [highMin, highMax], value) => {
  return syngen.fn.randomFloat(
    syngen.fn.lerp(lowMin, highMin, value),
    syngen.fn.lerp(lowMax, highMax, value),
  )
}

/**
 * Normalizes `angle` within therange of `[0, 2π]`.
 * @param {Number} angle
 * @returns {Number}
 * @static
 */
syngen.fn.normalizeAngle = (angle = 0) => {
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
syngen.fn.normalizeAngleSigned = (angle) => {
  return syngen.fn.normalizeAngle(angle) - Math.PI
}

/**
 * Returns a cancelable promise that resolves after `duration` milliseconds.
 * @param {Number} [duration=0]
 * @returns {Promise}
 *   Has a `cancel` method that can reject itself prematurely.
 * @static
 */
syngen.fn.promise = (duration = 0) => {
  const scope = {}

  const promise = new Promise((resolve, reject) => {
    scope.reject = reject
    scope.resolve = resolve
  })

  const timeout = setTimeout(scope.resolve, duration)

  promise.reject = function (...args) {
    scope.reject(...args)
    clearTimeout(timeout)
    return this
  }

  promise.resolve = function (...args) {
    scope.resolve(...args)
    clearTimeout(timeout)
    return this
  }

  promise.catch(() => {})

  return promise
}

/**
 * Calculates the real solutions to the quadratic equation with coefficients `a`, `b`, and `c`.
 * @param {Number} a
 * @param {Number} b
 * @param {Number} c
 * @returns {Number[]}
 *   Contains only real solutions. May be empty.
 * @static
 */
syngen.fn.quadratic = (a, b, c) => {
  return [
    (-1 * b + Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a),
    (-1 * b - Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a),
  ].filter(isFinite)
}

/**
 * Converts `radians` to degrees.
 * @param {Number} radians
 * @returns {Number}
 * @static
 */
syngen.fn.rad2deg = (radians) => radians * 180 / Math.PI

/**
 * Ramps `audioParam` to the values in `curve` over `duration` seconds.
 * @param {AudioParam} audioParam
 * @param {Number[]} curve
 * @param {Number} [duration={@link syngen.const.zeroTime}]
 * @static
 */
syngen.fn.rampCurve = function (audioParam, curve, duration = syngen.const.zeroTime) {
  audioParam.cancelScheduledValues(0)
  audioParam.setValueCurveAtTime(curve, syngen.time(), syngen.time(duration))
  return this
}

/**
 * Exponentially ramps `audioParam` to `value` over `duration` seconds.
 * @param {AudioParam} audioParam
 * @param {Number} value
 * @param {Number} [duration={@link syngen.const.zeroTime}]
 * @static
 */
syngen.fn.rampExp = function (audioParam, value, duration = syngen.const.zeroTime) {
  syngen.fn.holdParam(audioParam)
  audioParam.exponentialRampToValueAtTime(value, syngen.time(duration))
  return this
}

/**
 * Linearly ramps `audioParam` to `value` over `duration` seconds.
 * @param {AudioParam} audioParam
 * @param {Number} value
 * @param {Number} [duration={@link syngen.const.zeroTime}]
 * @static
 */
syngen.fn.rampLinear = function (audioParam, value, duration = syngen.const.zeroTime) {
  syngen.fn.holdParam(audioParam)
  audioParam.linearRampToValueAtTime(value, syngen.time(duration))
  return this
}

/**
 * Returns a random float between `min` and `max`.
 * @param {Number} [min=0]
 * @param {Number} [max=1]
 * @returns {Number}
 * @static
 */
syngen.fn.randomFloat = (min = 0, max = 1) => {
  return min + (Math.random() * (max - min))
}

/**
 * Returns a random integer between `min` and `max`.
 * @param {Number} [min=0]
 * @param {Number} [max=1]
 * @returns {Number}
 * @static
 */
syngen.fn.randomInt = function (min = 0, max = 1) {
  return Math.round(
    this.randomFloat(min, max)
  )
}

/**
 * Returns a random sign as a positive or negative `1`.
 * @returns {Number}
 * @static
 */
syngen.fn.randomSign = () => Math.random() < 0.5 ? 1 : -1

/**
 * Returns a random key in `bag`.
 * @param {Array|Map|Object} bag
 * @returns {String}
 * @static
 */
syngen.fn.randomKey = function (bag) {
  const keys = bag instanceof Map
    ? [...bag.keys()]
    : Object.keys(bag)

  return keys[
    this.randomInt(0, keys.length - 1)
  ]
}

/**
 * Returns a random value in `bag`.
 * @param {Array|Map|Object|Set} bag
 * @returns {*}
 * @static
 */
syngen.fn.randomValue = function (bag) {
  if (bag instanceof Set) {
    bag = [...bag.values()]
  }

  const key = this.randomKey(bag)

  if (bag instanceof Map) {
    return bag.get(key)
  }

  return bag[key]
}

/**
 * Calculates the interior angle of a regular polygon with `sides`.
 * @param {Number} sides
 * @returns {Number}
 * @static
 */
syngen.fn.regularPolygonInteriorAngle = (sides) => (sides - 2) * Math.PI / sides

/**
 * Rounds `value` to `precision` places.
 * Beward that `precision` is an inverse power of ten.
 * For example, `3` rounds to the nearest thousandth, whereas `-3` rounds to the nearest thousand.
 * @param {Number} value
 * @param {Number} precision
 * @returns {Number}
 * @static
 */
syngen.fn.round = (value, precision = 0) => {
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
syngen.fn.scale = (value, min, max, a, b) => ((b - a) * (value - min) / (max - min)) + a

/**
 * Sets `audioParam` to `value` without pops or clicks.
 * The duration depends on the average frame rate.
 * @param {AudioParam} audioParam
 * @param {Number} value
 * @see syngen.performance.delta
 * @static
 */
syngen.fn.setParam = function (audioParam, value) {
  syngen.fn.rampLinear(audioParam, value, syngen.performance.delta())
  return this
}

/**
 * Returns a shuffled shallow copy of `array` using `random` algorithm.
 * For example, implementations could leverage {@link syngen.fn.srand|srand()} to produce the same results each time given the same seed value.
 * @param {Array} array
 * @param {Function} [random=Math.random]
 * @static
 */
syngen.fn.shuffle = (array, random = Math.random) => {
  array = [].slice.call(array)

  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }

  return array
}

/**
 * Implementation of the [generalized logistic function](https://en.wikipedia.org/wiki/Generalised_logistic_function) with configurable `slope`.
 * @param {Number} value
 * @param {Number} [slope=25]
 * @returns {Number}
 * @static
 */
syngen.fn.smooth = (value, slope = 10) => {
  // Generalized logistic function
  return 1 / (1 + (Math.E ** (-slope * (value - 0.5))))
}

/**
 * Returns a pseudo-random, linear congruential, seeded random number generator with variadic `seeds`.
 * Seeds are prepended with the global {@link syngen.seed} and concatenated with {@link syngen.const.seedSeparator}.
 * @param {...String} [...seeds]
 * @returns {syngen.fn.srandGenerator}
 * @static
 */
syngen.fn.srand = (...seeds) => {
  const increment = 1,
    modulus = 34359738337,
    multiplier = 185852,
    rotate = (seed) => ((seed * multiplier) + increment) % modulus

  let seed = syngen.fn.hash(
    syngen.seed.concat(...seeds)
  )

  seed = rotate(seed)

  /**
   * A pseudo-random, linear congruential, seeded random number generator that returns a value within `[min, max]`.
   * @param {Number} [min=0]
   * @param {Number} [max=1]
   * @returns {Number}
   * @see syngen.fn.srand
   * @type {Function}
   * @typedef syngen.fn.srandGenerator
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
syngen.fn.toCents = (a, b) => (b - a) / a * 1200

/**
 * Converts `gain` to its equivalent decibel value.
 * @param {Number} gain
 * @returns {Number}
 * @static
 */
syngen.fn.toDb = (gain) => 10 * Math.log10(gain)

/**
 * Converts `frequency`, in Hertz, to its corresponding MIDI note number.
 * The returned value is not rounded.
 * @param {Number} frequency
 * @returns {Number}
 * @see syngen.const.midiReferenceFrequency
 * @see syngen.const.midiReferenceNote
 * @static
 */
syngen.fn.toMidi = (frequency) => (Math.log2(frequency / syngen.const.midiReferenceFrequency) * 12) + syngen.const.midiReferenceNote

/**
 * Scales `frequency` by integer multiples so it's between `min` and `max`.
 * @param {Number} frequency
 * @param {Number} [min={@link syngen.const.minFrequency}]
 * @param {Number} [max={@link syngen.const.maxFrequency}]
 * @returns {Number}
 * @static
 */
syngen.fn.transpose = (frequency, min = syngen.const.minFrequency, max = syngen.const.maxFrequency) => {
  while (frequency > max) {
    frequency /= 2
  }

  while (frequency < min) {
    frequency *= 2
  }

  return frequency
}

/**
 * Generates a universally unique identifier.
 * @returns {String}
 * @static
 */
syngen.fn.uuid = () => {
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
syngen.fn.wrap = (value, min = 0, max = 1) => {
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
syngen.fn.wrapAlternate = (value, min = 0, max = 1) => {
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
 * @see syngen.tool.bitree.create
 * @todo Document private members
 */
syngen.tool.bitree = {}

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
 * @returns {syngen.tool.bitree}
 * @static
 */
syngen.tool.bitree.create = function (options = {}) {
  return Object.create(this.prototype).construct(options)
}

/**
 * Instantiates a new binary tree with `items` and `options`.
 * @param {Object[]} [items=[]]
 * @param {Object} [options={}]
 *   See {@link syngen.tool.bitree.create} for a full reference.
 * @returns {syngen.tool.bitree}
 * @static
 */
syngen.tool.bitree.from = function (items = [], options = {}) {
  const tree = this.create(options)

  for (const item of items) {
    tree.insert(item)
  }

  return tree
}

syngen.tool.bitree.prototype = {
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
    return syngen.fn.between(this.minValue, minValue, minValue + range)
      || syngen.fn.between(minValue, this.minValue, this.minValue + this.range)
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

    this.nodes[0] = syngen.tool.bitree.create({
      dimension: this.dimension,
      maxItems: this.maxItems,
      minValue: this.minValue,
      range,
    })

    this.nodes[1] = syngen.tool.bitree.create({
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

syngen.tool.cache2d = {}

syngen.tool.cache2d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.tool.cache2d.prototype = {
  construct: function () {
    this.map = new Map()

    return this
  },
  destroy: function () {
    this.map.clear()

    return this
  },
  has: function (x, y) {
    return Boolean(this.map.get(x)?.has(y))
  },
  get: function (x, y) {
    return this.map.get(x)?.get(y)
  },
  reset: function () {
    this.map.clear()

    return this
  },
  set: function (x, y, value) {
    let xMap = this.map.get(x)

    if (!xMap) {
      xMap = new Map()
      this.map.set(x, xMap)
    }

    xMap.set(y, value)

    return this
  },
}

syngen.tool.cache3d = {}

syngen.tool.cache3d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.tool.cache3d.prototype = {
  construct: function () {
    this.map = new Map()

    return this
  },
  destroy: function () {
    this.map.clear()

    return this
  },
  has: function (x, y, z) {
    return Boolean(this.map.get(x)?.get(y)?.has(z))
  },
  get: function (x, y, z) {
    return this.map.get(x)?.get(y)?.get(z)
  },
  reset: function () {
    this.map.clear()

    return this
  },
  set: function (x, y, value) {
    let xMap = this.map.get(x)

    if (!xMap) {
      xMap = new Map()
      this.map.set(x, xMap)
    }

    let yMap = xMap.get(y)

    if (!yMap) {
      yMap = new Map()
      xMap.set(y, yMap)
    }

    yMap.set(z, value)

    return this
  },
}

syngen.tool.cone = {}

syngen.tool.cone.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.tool.cone.prototype = {
  construct: function ({
    height = 0,
    normal,
    radius = 0,
    vertex,
  } = {}) {
    this.height = height
    this.normal = syngen.tool.vector3d.create(normal)
    this.radius = radius
    this.vertex = syngen.tool.vector3d.create(vertex)

    return this
  },
  containsPoint: function (point) {
    point = syngen.tool.vector3d.create(point)

    const relative = point.subtract(this.vertex),
      length = relative.dotProduct(this.normal)

    if (!syngen.fn.between(length, 0, this.height)) {
      return false
    }

    const coneRadius = (length / this.height) * this.radius,
      projected = this.vertex.add(this.normal.scale(length))

    const distance = point.distance(projected)

    return distance <= coneRadius
  },
  containsSphere: function (center, radius) {
    center = syngen.tool.vector3d.create(center)

    const relative = center.subtract(this.vertex),
      length = relative.dotProduct(this.normal)

    if (!syngen.fn.between(length, -radius, this.height + radius)) {
      return false
    }

    const coneRadius = (length / this.height) * this.radius,
      projected = this.vertex.add(this.normal.scale(length))

    const distance = center.distance(projected)

    return distance <= coneRadius + radius
  },
}

/**
 * Provides an interface for Euler angles.
 * They express 3D orientations in space with pitch, roll, and yaw.
 * Although they're explicitly easier to use, implementations should prefer {@linkplain syngen.tool.quaternion|quaternions} to avoid gimbal lock.
 * @interface
 * @see syngen.tool.euler.create
 */
syngen.tool.euler = {}

/**
 * Instantiates a new Euler angle.
 * @param {syngen.tool.euler|Object} [options={}]
 * @param {Number} [options.pitch=0]
 * @param {Number} [options.roll=0]
 * @param {Number} [options.yaw=0]
 * @returns {syngen.tool.euler}
 * @static
 */
syngen.tool.euler.create = function (options = {}) {
  return Object.create(this.prototype).construct(options)
}

/**
 * Converts a quaternion to an Euler angle.
 * @param {syngen.tool.quaternion} quaternion
 * @param {String} [sequence={@link syngen.const.eulerToQuaternion}]
 * @returns {syngen.tool.euler}
 * @see syngen.const.eulerToQuaternion
 * @static
 */
syngen.tool.euler.fromQuaternion = function ({
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

syngen.tool.euler.prototype = {
  /**
   * Returns a new instance with the same properties.
   * @instance
   * @returns {syngen.tool.euler}
   */
  clone: function () {
    return syngen.tool.euler.create(this)
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
   * @param {syngen.tool.euler|Object} [euler]
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
   * @returns {syngen.tool.vector3d}
   */
  forward: function () {
    return syngen.tool.vector3d.unitX().rotateEuler(this)
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
   * @returns {syngen.tool.vector3d}
   */
  right: function () {
    return syngen.tool.vector3d.unitY().rotateEuler(this)
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
   * @returns {syngen.tool.euler}
   */
  scale: function (scalar = 0) {
    return syngen.tool.euler.create({
      pitch: this.pitch * scalar,
      roll: this.roll * scalar,
      yaw: this.yaw * scalar,
    })
  },
  /**
   * Sets all properties to `options`.
   * @instance
   * @param {syngen.tool.euler|Object} [options]
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
   * @returns {syngen.tool.vector3d}
   */
  up: function () {
    return syngen.tool.vector3d.unitZ().rotateEuler(this)
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
 * @augments syngen.tool.pubsub
 * @interface
 * @see syngen.tool.fsm.create
 */
syngen.tool.fsm = {}

/**
 * Instantiates a new finite-state machine.
 * @param {Object} options
 * @param {Object} [options={}]
 * @param {Object} [options.state=none]
 *   The initial state.
 * @param {Object} [options.transition={}]
 *   A hash of states and their actions.
 *   Each state is a hash of one or more actions.
 *   Each action is a function which _should_ call {@link syngen.tool.fsm.change|this.change()} to change state.
 *   Actions _can_ have branching logic that results in multiple states.
 * @returns {syngen.tool.fsm}
 * @static
 */
syngen.tool.fsm.create = function (options = {}) {
  return Object.create(this.prototype).construct(options)
}

syngen.tool.fsm.prototype = {
  /**
   * Changes to `state` with `data`.
   * @fires syngen.tool.fsm#event:enter
   * @fires syngen.tool.fsm#event:enter-{state}
   * @fires syngen.tool.fsm#event:exit
   * @fires syngen.tool.fsm#event:exit-{state}
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
      event: this._lastEvent,
      nextState: state,
      ...data,
    }

    /**
     * Fired whenever states are exited.
     * @event syngen.tool.fsm#event:exit
     * @type {Object}
     * @param {String} currentState
     * @param {?String} event
     * @param {String} nextState
     * @param {...*} ...data
     */
    this.pubsub.emit('exit', exitPayload)

    /**
     * Fired whenever a particular state is exited.
     * If the state is `foo`, then the event is named `exit-foo`.
     * @event syngen.tool.fsm#event:exit-{state}
     * @type {Object}
     * @param {String} currentState
     * @param {?String} event
     * @param {String} nextState
     * @param {...*} ...data
     */
    this.pubsub.emit(`exit-${this.state}`, exitPayload)

    const enterPayload = {
      currentState: state,
      event: this._lastEvent,
      previousState: this.state,
      ...data,
    }

    this.setState(state)

    /**
     * Fired whenever states are entered.
     * @event syngen.tool.fsm#event:enter
     * @type {Object}
     * @param {String} currentState
     * @param {?String} event
     * @param {String} previousState
     * @param {...*} ...data
     */
    this.pubsub.emit('enter', enterPayload)

    /**
     * Fired whenever a particular state is entered.
     * If the state is `foo`, then the event is named `enter-foo`.
     * @event syngen.tool.fsm#event:enter-{state}
     * @type {Object}
     * @param {String} currentState
     * @param {?String} event
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

    syngen.tool.pubsub.decorate(this)

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
   * @fires syngen.tool.fsm#event:after
   * @fires syngen.tool.fsm#event:after-{event}
   * @fires syngen.tool.fsm#event:after-{state}-{event}
   * @fires syngen.tool.fsm#event:before
   * @fires syngen.tool.fsm#event:before-{event}
   * @fires syngen.tool.fsm#event:before-{state}-{event}
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
       * @event syngen.tool.fsm#event:before
       * @type {Object}
       * @param {String} event
       * @param {Object} state
       * @param {...*} ...data
       */
      this.pubsub.emit('before', beforePayload)

      /**
       * Fired before a particular event is dispatched.
       * If the event is `foo`, then the event is named `before-foo`.
       * @event syngen.tool.fsm#event:before-{event}
       * @type {Object}
       * @param {String} event
       * @param {Object} state
       * @param {...*} ...data
       */
      this.pubsub.emit(`before-${event}`, beforePayload)

      /**
       * Fired before a particular event is dispatched in a particular state.
       * If the state is `foo` and the event is `bar`, then the event is named `before-foo-bar`.
       * @event syngen.tool.fsm#event:before-{state}-{event}
       * @type {Object}
       * @param {String} event
       * @param {Object} state
       * @param {...*} ...data
       */
      this.pubsub.emit(`before-${state}-${event}`, beforePayload)

      this._lastEvent = event
      action.call(this, data)
      delete this._lastEvent

      const afterPayload = {
        currentState: this.state,
        event,
        previousState: state,
        ...data,
      }

      /**
       * Fired after an event is dispatched.
       * @event syngen.tool.fsm#event:after
       * @type {Object}
       * @param {String} currentState
       * @param {String} event
       * @param {String} previousState
       * @param {...*} ...data
       */
      this.pubsub.emit('after', afterPayload)

      /**
       * Fired after a particular event is dispatched.
       * If the event is `foo`, then the event is named `before-foo`.
       * @event syngen.tool.fsm#event:after-{event}
       * @type {Object}
       * @param {String} currentState
       * @param {String} event
       * @param {String} previousState
       * @param {...*} ...data
       */
      this.pubsub.emit(`after-${event}`, afterPayload)

      /**
       * Fired after a particular event is dispatched in a particular state.
       * If the state is `foo` and the event is `bar`, then the event is named `before-foo-bar`.
       * @event syngen.tool.fsm#event:after-{state}-{event}
       * @type {Object}
       * @param {String} currentState
       * @param {String} event
       * @param {String} previousState
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

syngen.tool.generator2d = {}

syngen.tool.generator2d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.tool.generator2d.prototype = {
  construct: function ({
    generator = () => {},
    radius = 1,
    scale = 1,
  } = {}) {
    this.cache = syngen.tool.cache2d.create()
    this.generate = generator.bind(this)
    this.loaded = []
    this.radius = radius
    this.scale = scale

    syngen.tool.pubsub.decorate(this)

    return this
  },
  reset: function () {
    // Unload loaded chunks
    for (const chunk of this.loaded) {
      this.emit('unload', chunk)
    }

    this.cache.reset()
    delete this.current
    this.loaded = []

    return this
  },
  update: function () {
    // Determine coordinates of chunk at position
    const position = syngen.position.getVector()

    const cx = Math.round(position.x / this.scale),
      cy = Math.round(position.y / this.scale)

    // Return early if nothing new to stream
    if (this.current && this.current.x == cx && this.current.y == cy) {
      return this
    }

    // Stream chunks in square around position
    const radius = this.radius,
      streamed = []

    const loaded = new Set(),
      unloaded = new Set(this.loaded)

    for (let x = cx - radius; x <= cx + radius; x += 1) {
      for (let y = cy - radius; y <= cy + radius; y += 1) {
        let chunk = this.cache.get(x, y)

        if (chunk) {
          unloaded.delete(chunk)
        } else {
          chunk = {
            x,
            y,
            ...(this.generate(x, y) || {}),
          }

          this.cache.set(x, y, chunk)
          loaded.add(chunk)
        }

        streamed.push(chunk)
      }
    }

    // Load and unload chunks
    for (const chunk of loaded) {
      this.pubsub.emit('load', chunk)
    }

    for (const chunk of unloaded) {
      this.pubsub.emit('unload', chunk)
    }

    this.loaded = streamed

    // Update current chunk
    this.current = this.cache.get(cx, cy)

    return this
  },
}

syngen.tool.generator3d = {}

syngen.tool.generator3d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.tool.generator3d.prototype = {
  construct: function ({
    generator = () => {},
    radius = 1,
    scale = 1,
  } = {}) {
    this.cache = syngen.tool.cache3d.create()
    this.generate = generator.bind(this)
    this.loaded = []
    this.radius = radius
    this.scale = scale

    syngen.tool.pubsub.decorate(this)

    return this
  },
  reset: function () {
    // Unload loaded chunks
    for (const chunk of this.loaded) {
      this.emit('unload', chunk)
    }

    this.cache.reset()
    delete this.current
    this.loaded = []

    return this
  },
  update: function () {
    // Determine coordinates of chunk at position
    const position = syngen.position.getVector()

    const cx = Math.round(position.x / this.scale),
      cy = Math.round(position.y / this.scale),
      cz = Math.round(position.z / this.scale)

    // Return early if nothing new to stream
    if (this.current && this.current.x == cx && this.current.y == cy && this.current.z == cz) {
      return this
    }

    // Stream chunks in square around position
    const radius = this.radius,
      streamed = []

    const loaded = new Set(),
      unloaded = new Set(this.loaded)

    for (let x = cx - radius; x <= cx + radius; x += 1) {
      for (let y = cy - radius; y <= cy + radius; y += 1) {
        for (let y = cy - radius; y <= cy + radius; y += 1) {
          let chunk = this.cache.get(x, y, z)

          if (chunk) {
            unloaded.delete(chunk)
          } else {
            chunk = {
              x,
              y,
              z,
              ...(this.generate(x, y, z) || {}),
            }

            this.cache.set(x, y, z, chunk)
            loaded.add(chunk)
          }

          streamed.push(chunk)
        }
      }
    }

    // Load and unload chunks
    for (const chunk of loaded) {
      this.pubsub.emit('load', chunk)
    }

    for (const chunk of unloaded) {
      this.pubsub.emit('unload', chunk)
    }

    this.loaded = streamed

    // Update current chunk
    this.current = this.cache.get(cx, cy, cz)

    return this
  },
}

syngen.tool.matrix4d = {}

syngen.tool.matrix4d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.tool.matrix4d.fromEuler = function ({
  pitch = 0,
  roll = 0,
  yaw = 0,
}, sequence = syngen.const.eulerToQuaternion) {
  const X = syngen.tool.matrix4d.create([
    1, 0, 0, 0,
    0, Math.cos(roll), Math.sin(roll), 0,
    0, -Math.sin(roll), Math.cos(roll), 0,
    0, 0, 0, 1,
  ])

  const Y = syngen.tool.matrix4d.create([
    Math.cos(pitch), 0, -Math.sin(pitch), 0,
    0, 1, 0, 0,
    Math.sin(pitch), 0, Math.cos(pitch), 0,
    0, 0, 0, 1,
  ])

  const Z = syngen.tool.matrix4d.create([
    Math.cos(yaw), -Math.sin(yaw), 0, 0,
    Math.sin(yaw), Math.cos(yaw), 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ])

  switch (sequence) {
    case 'XYZ':
      return Y.multiply(Y).multiply(X)
    case 'XZY':
      return Y.multiply(Z).multiply(X)
    case 'YXZ':
      return Z.multiply(X).multiply(X)
    case 'YZX':
      return X.multiply(Z).multiply(Y)
    case 'ZXY':
      return Y.multiply(X).multiply(X)
    case 'ZYX':
      return X.multiply(Y).multiply(Z)
  }
}

syngen.tool.matrix4d.fromQuaternion = function (quaternion, sequence = syngen.const.eulerToQuaternion) {
  return this.fromEuler(syngen.tool.euler.fromQuaternion(quaternion), sequence)
}

syngen.tool.matrix4d.identity = function (...args) {
  return this.create([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ])
}

syngen.tool.matrix4d.scale = function (value = 1) {
  const isNumber = typeof value == 'number'

  const x = isNumber ? value : ('x' in value ? value.x : 1),
    y = isNumber ? value : ('y' in value ? value.y : 1),
    z = isNumber ? value : ('z' in value ? value.z : 1)

  return this.create([
    x, 0, 0, 0,
    0, y, 0, 0,
    0, 0, z, 0,
    0, 0, 0, 1,
  ])
}

syngen.tool.matrix4d.translate = function ({
  x = 0,
  y = 0,
  z = 0,
} = {}) {
  return syngen.tool.matrix4d.create([
    1, 0, 0, x,
    0, 1, 0, y,
    0, 0, 1, z,
    0, 0, 0, 1,
  ])
}

syngen.tool.matrix4d.prototype = {
  construct: function (elements = []) {
    this.elements = [
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
    ]

    elements = elements.slice(0, 16)

    for (const index in elements) {
      this.elements[index] = elements[index]
    }

    return this
  },
  applyToVector3d: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    const w = 1

    const [
      e11, e21, e31, e41,
      e12, e22, e32, e42,
      e13, e23, e33, e43,
      e14, e24, e34, e44,
    ] = this.elements

    return syngen.tool.vector3d.create({
      x: (x * e11) + (y * e12) + (z * e13) + (w * e14),
      y: (x * e21) + (y * e22) + (z * e23) + (w * e24),
      z: (x * e31) + (y * e32) + (z * e33) + (w * e34),
    })
  },
  multiply: function (b = syngen.tool.matrix4d.identity()) {
    if (!syngen.tool.matrix4d.prototype.isPrototypeOf(b)) {
      b = syngen.tool.matrix4d.create(b)
    }

    const [
      a11, a21, a31, a41,
      a12, a22, a32, a42,
      a13, a23, a33, a43,
      a14, a24, a34, a44,
    ] = this.elements

    const [
      b11, b21, b31, b41,
      b12, b22, b32, b42,
      b13, b23, b33, b43,
      b14, b24, b34, b44,
    ] = b.elements

    const result = []

    result[0] = (a11 * b11) + (a12 * b21) + (a13 * b31) + (a14 * b41)
		result[4] = (a11 * b12) + (a12 * b22) + (a13 * b32) + (a14 * b42)
		result[8] = (a11 * b13) + (a12 * b23) + (a13 * b33) + (a14 * b43)
		result[12] = (a11 * b14) + (a12 * b24) + (a13 * b34) + (a14 * b44)

		result[1] = (a21 * b11) + (a22 * b21) + (a23 * b31) + (a24 * b41)
		result[5] = (a21 * b12) + (a22 * b22) + (a23 * b32) + (a24 * b42)
		result[9] = (a21 * b13) + (a22 * b23) + (a23 * b33) + (a24 * b43)
		result[13] = (a21 * b14) + (a22 * b24) + (a23 * b34) + (a24 * b44)

		result[2] = (a31 * b11) + (a32 * b21) + (a33 * b31) + (a34 * b41)
		result[6] = (a31 * b12) + (a32 * b22) + (a33 * b32) + (a34 * b42)
		result[10] = (a31 * b13) + (a32 * b23) + (a33 * b33) + (a34 * b43)
		result[14] = (a31 * b14) + (a32 * b24) + (a33 * b34) + (a34 * b44)

		result[3] = (a41 * b11) + (a42 * b21) + (a43 * b31) + (a44 * b41)
		result[7] = (a41 * b12) + (a42 * b22) + (a43 * b32) + (a44 * b42)
		result[11] = (a41 * b13) + (a42 * b23) + (a43 * b33) + (a44 * b43)
		result[15] = (a41 * b14) + (a42 * b24) + (a43 * b34) + (a44 * b44)

    return syngen.tool.matrix4d.create(result)
  },
  set: function (column, row, value) {
    const index = (row * 4) + column
    return this.setIndex(index, value)
  },
  setIndex: function (index, value) {
    this.elements[index] = value
    return this
  },
  transpose: function () {
    const [
      a11, a21, a31, a41,
      a12, a22, a32, a42,
      a13, a23, a33, a43,
      a14, a24, a34, a44,
    ] = this.elements

    return syngen.tool.matrix4d.create([
      a11, a12, a13, a14,
      a21, a22, a23, a24,
      a31, a32, a33, a34,
      a41, a42, a43, a44,
    ])
  },
}

/**
 * Provides an interface for generating seeded one-dimensional noise.
 * @interface
 * @see syngen.tool.noise.create
 * @todo Document private members
 */
syngen.tool.noise = {}

/**
 * Instantiates a one-dimensional noise generator.
 * @param {...String} [...seeds]
 * @returns {syngen.tool}
 * @static
 */
syngen.tool.noise.create = function (...seeds) {
  return Object.create(this.prototype).construct(...seeds)
}

syngen.tool.noise.prototype = {
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
    const srand = syngen.fn.srand('noise', ...this.seed, x)

    return srand(0, 1)
  },
  /**
   * Retrieves the value at `x`.
   * @instance
   * @param {Number} x
   * @private
   * @returns {Number}
   */
  getGradient: function (x) {
    let gradient = this.gradient.get(x)

    if (!gradient) {
      gradient = this.generateGradient(x)
      this.gradient.set(x, gradient)
    }

    return gradient
  },
  /**
   * Clears all generated values.
   * Implementations are encouraged to call this whenever {@link syngen.seed} is set, {@link syngen.state} is reset, or memory becomes an issue.
   * @instance
   */
  reset: function () {
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

    return syngen.fn.clamp(
      syngen.fn.lerp(v0, v1, dx),
      0,
      1
    )
  },
}

/**
 * Provides an octree interface for storing and querying objects in three-dimensional space.
 * @interface
 * @see syngen.tool.octree.create
 * @todo Document private members
 */
syngen.tool.octree = {}

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
 * @returns {syngen.tool.octree}
 * @static
 */
syngen.tool.octree.create = function (options = {}) {
  return Object.create(this.prototype).construct(options)
}

/**
 * Instantiates a new octree with `items` and `options`.
 * @param {Object[]} [items=[]]
 * @param {Object} [options={}]
 *   See {@link syngen.tool.octree.create} for a full reference.
 * @returns {syngen.tool.octree}
 * @static
 */
syngen.tool.octree.from = function (items = [], options = {}) {
  const tree = this.create(options)

  for (const item of items) {
    tree.insert(item)
  }

  return tree
}

syngen.tool.octree.prototype = {
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
    maxItems = 32,
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

    this.center = {
      x: this.x + (this.width / 2),
      y: this.y + (this.height / 2),
      z: this.z + (this.depth / 2),
    }

    this.radius = Math.max(this.height, this.width, this.depth) / syngen.const.unit3

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
   * Returns the items which satisfy `filterNode` and `filterItem`.
   * @param {Function} filterNode
   *   Returns `true` if the passed `center` and `radius` describing the node's bounding cube should be traversed.
   *   Use this as an optimization.
   * @param {Function} filterItem
   *   Returns whether the passed `item` is included in the result set.
   * @param {Array} [items=[]]
   *   Do not use. Used internally for performance.
   * @returns {Object[]}
   */
  filter: function (filterNode, filterItem, items = []) {
    if (!filterNode(this.center, this.radius)) {
      return items
    }

    if (this.items.length) {
      for (const item of this.items) {
        if (filterItem) {
          if (filterItem(item)) {
            items.push(item)
          }
        } else {
          items.push(item)
        }
      }
    } else if (this.nodes.length) {
      for (const node of this.nodes) {
        node.filter(filterNode, filterItem, items)
      }
    }

    return items
  },
  /**
   * Finds the closest item to `query` within `radius`.
   * If `query` is contained within the tree, then the next closest item is returned.
   * If no result is found, then `undefined` is returned.
   * @instance
   * @param {Object} query
   * @param {Number} query.x
   * @param {Number} query.y
   * @param {Number} query.z
   * @param {Number} [radius=Infinity]
   * @returns {Object|undefined}
   */
  find: function (query = {}, radius = Infinity) {
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

    const radius2 = radius * radius

    if (this.items.length) {
      let minDistance = radius2,
        result

      for (const item of this.items) {
        if (item === query) {
          continue
        }

        const d = syngen.fn.distance2(query, item)

        if (d < minDistance) {
          minDistance = d
          result = item
        }
      }

      return result
    }

    let minDistance = radius2,
      result

    for (const node of this.nodes) {
      const item = node.find(query, Math.sqrt(minDistance))

      if (!item || item === query) {
        continue
      }

      const d = syngen.fn.distance2(query, item)

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

    const midX = this.center.x,
      midY = this.center.y,
      midZ = this.center.z

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
   * @see syngen.fn.intersects
   * @todo Define a rectangular prism utility or type
   */
  intersects: function (prism) {
    return syngen.fn.intersects(this, prism)
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

    this.nodes[0] = syngen.tool.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x,
      y: this.y,
      z: this.z,
    })

    this.nodes[1] = syngen.tool.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x + width,
      y: this.y,
      z: this.z,
    })

    this.nodes[2] = syngen.tool.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x,
      y: this.y + height,
      z: this.z,
    })

    this.nodes[3] = syngen.tool.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x + width,
      y: this.y + height,
      z: this.z,
    })

    this.nodes[4] = syngen.tool.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x,
      y: this.y,
      z: this.z + depth,
    })

    this.nodes[5] = syngen.tool.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x + width,
      y: this.y,
      z: this.z + depth,
    })

    this.nodes[6] = syngen.tool.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x,
      y: this.y + height,
      z: this.z + depth,
    })

    this.nodes[7] = syngen.tool.octree.create({
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
 * Provides an interface for generating seeded two-dimensional Perlin noise.
 * @interface
 * @see syngen.tool.perlin2d.create
 * @todo Document private members
 */
syngen.tool.perlin2d = {}

/**
 * Instantiates a two-dimensional Perlin noise generator.
 * @param {...String} [...seeds]
 * @returns {syngen.tool.perlin2d}
 * @static
 */
syngen.tool.perlin2d.create = function (...seeds) {
  return Object.create(this.prototype).construct(...seeds)
}

syngen.tool.perlin2d.prototype = {
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
   * Generates the gradient at `(x, y)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @private
   */
  generateGradient: function (x, y) {
    const srand = syngen.fn.srand('perlin', ...this.seed, x, y)

    return [
      srand(-1, 1),
      srand(-1, 1),
    ]
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
      dy = y - yi,
      gradient = this.getGradient(xi, yi)

    return (dx * gradient[0]) + (dy * gradient[1])
  },
  /**
   * Retrieves the gradient at `(x, y)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @private
   * @returns {Number}
   */
  getGradient: function (x, y) {
    let xMap = this.gradient.get(x)

    if (!xMap) {
      xMap = new Map()
      this.gradient.set(x, xMap)
    }

    let gradient = xMap.get(y)

    if (!gradient) {
      gradient = this.generateGradient(x, y)
      xMap.set(y, gradient)
    }

    return gradient
  },
  /**
   * Range (plus and minus) to scale the output such that it's normalized to `[0, 1]`.
   * @instance
   * @private
   */
  range: Math.sqrt(2/4),
  /**
   * Clears all generated values.
   * Implementations are encouraged to call this whenever {@link syngen.seed} is set, {@link syngen.state} is reset, or memory becomes an issue.
   * @instance
   */
  reset: function () {
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

    const value = syngen.fn.lerp(
      syngen.fn.lerp(
        this.getDotProduct(x0, y0, x, y),
        this.getDotProduct(x1, y0, x, y),
        dx
      ),
      syngen.fn.lerp(
        this.getDotProduct(x0, y1, x, y),
        this.getDotProduct(x1, y1, x, y),
        dx
      ),
      dy
    )

    return syngen.fn.clamp(
      syngen.fn.scale(value, -this.range, this.range, 0, 1),
      0,
      1
    )
  },
}

/**
 * Provides an interface for generating seeded two-dimensional Perlin noise.
 * @interface
 * @see syngen.tool.perlin3d.create
 * @todo Document private members
 */
syngen.tool.perlin3d = {}

/**
 * Instantiates a three-dimensional Perlin noise generator.
 * @param {...String} [...seeds]
 * @returns {syngen.tool.perlin3d}
 * @static
 */
syngen.tool.perlin3d.create = function (...seeds) {
  return Object.create(this.prototype).construct(...seeds)
}

syngen.tool.perlin3d.prototype = {
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
   * Generates the gradient at `(x, y, z)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @private
   */
  generateGradient: function (x, y, z) {
    const srand = syngen.fn.srand('perlin', ...this.seed, x, y, z)

    return [
      srand(-1, 1),
      srand(-1, 1),
      srand(-1, 1),
    ]
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
      dz = z - zi,
      gradient = this.getGradient(xi, yi, zi)

    return (dx * gradient[0]) + (dy * gradient[1]) + (dz * gradient[2])
  },
  /**
   * Retrieves the gradient at `(x, y, z)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @private
   * @returns {Number}
   */
  getGradient: function (x, y, z) {
    let xMap = this.gradient.get(x)

    if (!xMap) {
      xMap = new Map()
      this.gradient.set(x, xMap)
    }

    let yMap = xMap.get(y)

    if (!yMap) {
      yMap = new Map()
      xMap.set(y, yMap)
    }

    let gradient = yMap.get(z)

    if (!gradient) {
      gradient = this.generateGradient(x, y, z)
      yMap.set(z, gradient)
    }

    return gradient
  },
  /**
   * Range (plus and minus) to scale the output such that it's normalized to `[0, 1]`.
   * @instance
   * @private
   */
  range: Math.sqrt(3/4),
  /**
   * Clears all generated values.
   * Implementations are encouraged to call this whenever {@link syngen.seed} is set, {@link syngen.state} is reset, or memory becomes an issue.
   * @instance
   */
  reset: function () {
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

    const value = syngen.fn.lerp(
      syngen.fn.lerp(
        syngen.fn.lerp(
          this.getDotProduct(x0, y0, z0, x, y, z),
          this.getDotProduct(x1, y0, z0, x, y, z),
          dx
        ),
        syngen.fn.lerp(
          this.getDotProduct(x0, y1, z0, x, y, z),
          this.getDotProduct(x1, y1, z0, x, y, z),
          dx
        ),
        dy
      ),
      syngen.fn.lerp(
        syngen.fn.lerp(
          this.getDotProduct(x0, y0, z1, x, y, z),
          this.getDotProduct(x1, y0, z1, x, y, z),
          dx
        ),
        syngen.fn.lerp(
          this.getDotProduct(x0, y1, z1, x, y, z),
          this.getDotProduct(x1, y1, z1, x, y, z),
          dx
        ),
        dy
      ),
      dz
    )

    return syngen.fn.clamp(
      syngen.fn.scale(value, -this.range, this.range, 0, 1),
      0,
      1
    )
  },
}

/**
 * Provides an interface for generating seeded four-dimensional Perlin noise.
 * @interface
 * @see syngen.tool.perlin4d.create
 * @todo Document private members
 */
syngen.tool.perlin4d = {}

/**
 * Instantiates a four-dimensional Perlin noise generator.
 * @param {...String} [...seeds]
 * @returns {syngen.tool.perlin4d}
 * @static
 */
syngen.tool.perlin4d.create = function (...seeds) {
  return Object.create(this.prototype).construct(...seeds)
}

syngen.tool.perlin4d.prototype = {
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
   * Generates the gradient at `(x, y, z, w)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {Number} t
   * @private
   */
  generateGradient: function (x, y, z, w) {
    const srand = syngen.fn.srand('perlin', ...this.seed, x, y, z, w)

    return [
      srand(-1, 1),
      srand(-1, 1),
      srand(-1, 1),
      srand(-1, 1),
    ]
  },
  /**
   * Calculates the dot product between `(dx, dy, dz, dw)` and the value at `(xi, yi, zi, wi)`.
   * @instance
   * @param {Number} xi
   * @param {Number} yi
   * @param {Number} zi
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @private
   */
  getDotProduct: function (xi, yi, zi, wi, x, y, z, w) {
    const dw = w - wi,
      dx = x - xi,
      dy = y - yi,
      dz = z - zi,
      gradient = this.getGradient(xi, yi, zi, wi)

    return (dx * gradient[0]) + (dy * gradient[1]) + (dz * gradient[2]) + (dw * gradient[3])
  },
  /**
   * Retrieves the gradient at `(x, y, z, w)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {Number} t
   * @private
   * @returns {Number}
   */
  getGradient: function (x, y, z, w) {
    let xMap = this.gradient.get(x)

    if (!xMap) {
      xMap = new Map()
      this.gradient.set(x, xMap)
    }

    let yMap = xMap.get(y)

    if (!yMap) {
      yMap = new Map()
      xMap.set(y, yMap)
    }

    let zMap = yMap.get(z)

    if (!zMap) {
      zMap = new Map()
      yMap.set(z, zMap)
    }

    let gradient = zMap.get(w)

    if (!gradient) {
      gradient = this.generateGradient(x, y, z, w)
      zMap.set(w, gradient)
    }

    return gradient
  },
  /**
   * Range (plus and minus) to scale the output such that it's normalized to `[0, 1]`.
   * @instance
   * @private
   */
  range: Math.sqrt(4/4),
  /**
   * Clears all generated values.
   * Implementations are encouraged to call this whenever {@link syngen.seed} is set, {@link syngen.state} is reset, or memory becomes an issue.
   * @instance
   */
  reset: function () {
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
   * Calculates the value at `(x, y, z, w)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {Number} t
   * @returns {Number}
   */
  value: function (x, y, z, w) {
    const w0 = Math.floor(w),
      w1 = w0 + 1,
      x0 = Math.floor(x),
      x1 = x0 + 1,
      y0 = Math.floor(y),
      y1 = y0 + 1,
      z0 = Math.floor(z),
      z1 = z0 + 1

    const dw = this.smooth(w - w0),
      dx = this.smooth(x - x0),
      dy = this.smooth(y - y0),
      dz = this.smooth(z - z0)

    const value = syngen.fn.lerp(
      syngen.fn.lerp(
        syngen.fn.lerp(
          syngen.fn.lerp(
            this.getDotProduct(x0, y0, z0, w0, x, y, z, w),
            this.getDotProduct(x1, y0, z0, w0, x, y, z, w),
            dx
          ),
          syngen.fn.lerp(
            this.getDotProduct(x0, y1, z0, w0, x, y, z, w),
            this.getDotProduct(x1, y1, z0, w0, x, y, z, w),
            dx
          ),
          dy
        ),
        syngen.fn.lerp(
          syngen.fn.lerp(
            this.getDotProduct(x0, y0, z1, w0, x, y, z, w),
            this.getDotProduct(x1, y0, z1, w0, x, y, z, w),
            dx
          ),
          syngen.fn.lerp(
            this.getDotProduct(x0, y1, z1, w0, x, y, z, w),
            this.getDotProduct(x1, y1, z1, w0, x, y, z, w),
            dx
          ),
          dy
        ),
        dz
      ),
      syngen.fn.lerp(
        syngen.fn.lerp(
          syngen.fn.lerp(
            this.getDotProduct(x0, y0, z0, w1, x, y, z, w),
            this.getDotProduct(x1, y0, z0, w1, x, y, z, w),
            dx
          ),
          syngen.fn.lerp(
            this.getDotProduct(x0, y1, z0, w1, x, y, z, w),
            this.getDotProduct(x1, y1, z0, w1, x, y, z, w),
            dx
          ),
          dy
        ),
        syngen.fn.lerp(
          syngen.fn.lerp(
            this.getDotProduct(x0, y0, z1, w1, x, y, z, w),
            this.getDotProduct(x1, y0, z1, w1, x, y, z, w),
            dx
          ),
          syngen.fn.lerp(
            this.getDotProduct(x0, y1, z1, w1, x, y, z, w),
            this.getDotProduct(x1, y1, z1, w1, x, y, z, w),
            dx
          ),
          dy
        ),
        dz
      ),
      dw
    )

    return syngen.fn.clamp(
      syngen.fn.scale(value, -this.range, this.range, 0, 1),
      0,
      1
    )
  },
}

syngen.tool.plane = {}

syngen.tool.plane.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.tool.plane.prototype = {
  construct: function ({
    constant = 0,
    normal,
  } = {}) {
    this.constant = constant
    this.normal = syngen.tool.vector3d.create(normal)

    this.normalize()

    return this
  },
  distanceToPoint: function (point) {
    return this.normal.dotProduct(point) - this.constant
  },
  normalize: function () {
    const distance = this.normal.distance()

    if (!distance || distance == 1) {
      return this
    }

    const inverse = 1 / distance

    this.constant *= inverse
    this.normal = this.normal.scale(inverse)

    return this
  },
}

/**
 * Provides an interface for a publish-subscribe messaging pattern.
 * Objects can be decorated with an existing or new instance with the static {@link syngen.tool.pubsub.decorate|decorate} method.
 * @interface
 * @see syngen.tool.pubsub.create
 * @see syngen.tool.pubsub.decorate
 */
syngen.tool.pubsub = {}

/**
 * Instantiates a new pubsub instance.
 * @returns {syngen.tool.pubsub}
 * @static
 */
syngen.tool.pubsub.create = function () {
  return Object.create(this.prototype).construct()
}

/**
 * Decorates `target` with a new or existing `instance` and returns it.
 * This exposes its methods on `target` as if they are its own.
 * @param {Object} target
 * @param {syngen.tool.pubsub} [instance]
 * @returns {Object}
 * @static
 */
syngen.tool.pubsub.decorate = function (target, instance) {
  if (!this.prototype.isPrototypeOf(instance)) {
    instance = this.create()
    target.pubsub = instance
  }

  instance.decorate(target)

  return target
}

syngen.tool.pubsub.prototype = {
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
   * Decorates `target` with methods from this instance so it can be used as an event emitter.
   * @instance
   * @param {Object} target
   */
  decorate: function (target) {
    const instance = this

    ;['emit', 'off', 'on', 'once'].forEach((method) => {
      target[method] = function (...args) {
        instance[method](...args)
        return this
      }
    })

    return target
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
 * @see syngen.tool.quadtree.create
 * @todo Document private members
 */
syngen.tool.quadtree = {}

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
 * @returns {syngen.tool.quadtree}
 * @static
 */
syngen.tool.quadtree.create = function (options = {}) {
  return Object.create(this.prototype).construct(options)
}

/**
 * Instantiates a new quadtree with `items` and `options`.
 * @param {Object[]} [items=[]]
 * @param {Object} [options={}]
 *   See {@link syngen.tool.quadree.create} for a full reference.
 * @returns {syngen.tool.quadtree}
 * @static
 */
syngen.tool.quadtree.from = function (items = [], options = {}) {
  const tree = this.create(options)

  for (const item of items) {
    tree.insert(item)
  }

  return tree
}

syngen.tool.quadtree.prototype = {
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
   * @param {Number} query.x
   * @param {Number} query.y
   * @param {Number} [radius=Infinity]
   * @returns {Object|undefined}
   */
  find: function (query = {}, radius = Infinity) {
    if (!('x' in query && 'y' in query)) {
      return
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
   * @see syngen.fn.intersects
   * @todo Define a rectangular prism utility or type
   */
  intersects: function (rect) {
    return syngen.fn.intersects(this, rect)
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

    this.nodes[0] = syngen.tool.quadtree.create({
      height,
      maxItems: this.maxItems,
      width,
      x: this.x,
      y: this.y,
    })

    this.nodes[1] = syngen.tool.quadtree.create({
      height,
      maxItems: this.maxItems,
      width,
      x: this.x + width,
      y: this.y,
    })

    this.nodes[2] = syngen.tool.quadtree.create({
      height,
      maxItems: this.maxItems,
      width,
      x: this.x,
      y: this.y + height,
    })

    this.nodes[3] = syngen.tool.quadtree.create({
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
 * These are preferred over {@linkplain syngen.tool.euler|euler angles} to avoid gimbal lock.
 * @interface
 * @see syngen.tool.quaternion.create
 */
syngen.tool.quaternion = {}

/**
 * Instantiates a new quaternion.
 * @param {syngen.tool.quaternion|Object} [options={}]
 * @param {Number} [options.w=1]
 * @param {Number} [options.x=0]
 * @param {Number} [options.y=0]
 * @param {Number} [options.z=0]
 * @returns {syngen.tool.quaternion}
 * @static
 */
syngen.tool.quaternion.create = function (options = {}) {
  return Object.create(this.prototype).construct(options)
}

/**
 * Converts an Euler angle to a quaternion.
 * @param {syngen.tool.euler} euler
 * @param {String} [sequence={@link syngen.const.eulerToQuaternion}]
 * @returns {syngen.tool.quaternion}
 * @see syngen.const.eulerToQuaternion
 * @static
 */
syngen.tool.quaternion.fromEuler = function ({
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

syngen.tool.quaternion.prototype = {
  /**
   * Returns a new instance with the same properties.
   * @instance
   * @returns {syngen.tool.quaternion}
   */
  clone: function () {
    return syngen.tool.quaternion.create(this)
  },
  /**
   * Returns the conjugate as a new instance.
   * This represents the reverse orientation.
   * @instance
   * @returns {syngen.tool.quaternion}
   */
  conjugate: function () {
    return syngen.tool.quaternion.create({
      w: this.w,
      x: -this.x,
      y: -this.y,
      z: -this.z,
    })
  },
  /**
   * Initializes the instance with `options`.
   * These values are best derived from {@link syngen.tool.quaternion.fromEuler} or other quaternions.
   * @instance
   * @param {syngen.tool.quaternion|Object} [options={}]
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
   * @param {syngen.tool.quaternion|Object} [quaternion]
   * @returns {syngen.tool.quaternion}
   */
  divide: function (divisor) {
    if (!syngen.tool.quaternion.prototype.isPrototypeOf(quaternion)) {
      quaternion = syngen.tool.quaternion.create(quaternion)
    }

    return this.multiply(quaternion.inverse())
  },
  /**
   * Returns whether this is equal to `quaternion`.
   * @instance
   * @param {syngen.tool.quaternion|Object} [quaternion]
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
   * @returns {syngen.tool.vector3d}
   */
  forward: function () {
    return syngen.tool.vector3d.unitX().rotateQuaternion(this)
  },
  /**
   * Returns the multiplicative inverse as a new instance.
   * @instance
   * @returns {syngen.tool.quaternion}
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
   * @param {syngen.tool.quaternion|Object} quaternion
   * @returns {syngen.tool.quaternion}
   * @todo Create syngen.tool.quaternion.slerpFrom for spherical interpolation
   */
  lerpFrom: function ({
    w = 1,
    x = 0,
    y = 0,
    z = 0,
  } = {}, value = 0) {
    return syngen.tool.quaternion.create({
      w: syngen.fn.lerp(w, this.w, value),
      x: syngen.fn.lerp(x, this.x, value),
      y: syngen.fn.lerp(y, this.y, value),
      z: syngen.fn.lerp(z, this.z, value),
    })
  },
  /**
   * Linearly interpolates this to `quaternion` and returns it as a new instance.
   * @instance
   * @param {syngen.tool.quaternion|Object} quaternion
   * @returns {syngen.tool.quaternion}
   * @todo Create syngen.tool.quaternion.slerpTo for spherical interpolation
   */
  lerpTo: function ({
    w = 1,
    x = 0,
    y = 0,
    z = 0,
  } = {}, value = 0) {
    return syngen.tool.quaternion.create({
      w: syngen.fn.lerp(this.w, w, value),
      x: syngen.fn.lerp(this.x, x, value),
      y: syngen.fn.lerp(this.y, y, value),
      z: syngen.fn.lerp(this.z, z, value),
    })
  },
  /**
   * Multiplies this by `quaternion` to return their sum as a new instance.
   * @instance
   * @param {syngen.tool.quaternion|Object} [quaternion]
   * @returns {syngen.tool.quaternion}
   */
  multiply: function ({
    w = 1,
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return syngen.tool.quaternion.create({
      w: (this.w * w) - (this.x * x) - (this.y * y) - (this.z * z),
      x: (this.w * x) + (this.x * w) + (this.y * z) - (this.z * y),
      y: (this.w * y) + (this.y * w) + (this.z * x) - (this.x * z),
      z: (this.w * z) + (this.z * w) + (this.x * y) - (this.y * x),
    })
  },
  /**
   * Normalizes this and returns it as a new instance.
   * @instance
   * @returns {syngen.tool.quaternion}
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
   * @returns {syngen.tool.vector3d}
   */
  right: function () {
    return syngen.tool.vector3d.unitY().rotateQuaternion(this)
  },
  /**
   * Multiplies this by `scalar` and returns it as a new instance.
   * Typically it's nonsensical to use this manually.
   * @instance
   * @param {Number} [scalar=0]
   * @returns {syngen.tool.quaternion}
   * @private
   */
  scale: function (scalar = 0) {
    return syngen.tool.quaternion.create({
      w: this.w * scalar,
      x: this.x * scalar,
      y: this.y * scalar,
      z: this.z * scalar,
    })
  },
  /**
   * Sets all properties with `options`.
   * These values are best derived from {@link syngen.tool.quaternion.fromEuler} or other quaternions.
   * @instance
   * @param {syngen.tool.quaternion|Object} [options]
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
   * @returns {syngen.tool.vector3d}
   */
  up: function () {
    return syngen.tool.vector3d.unitZ().rotateQuaternion(this)
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
 * @returns {syngen.tool.quaternion}
 * @static
 */
syngen.tool.quaternion.identity = function () {
  return Object.create(this.prototype).construct({
    w: 1,
  })
}

/**
 * Provides an interface for generating seeded two-dimensional OpenSimplex noise.
 * @interface
 * @see syngen.tool.simplex2d.create
 * @todo Document private members
 */
syngen.tool.simplex2d = {}

/**
 * Instantiates a two-dimensional OpenSimplex noise generator.
 * @param {...String} [...seeds]
 * @returns {syngen.tool.simplex2d}
 * @static
 */
syngen.tool.simplex2d.create = function (...seeds) {
  return Object.create(this.prototype).construct(...seeds)
}

syngen.tool.simplex2d.prototype = {
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
   * Generates the gradient at `(x, y)` in simplex space.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @private
   */
  generateGradient: function (xin, yin) {
    const srand = syngen.fn.srand('simplex', ...this.seed, xin, yin)

    let x = srand(-1, 1),
      y = srand(-1, 1)

    const distance = Math.sqrt((x * x) + (y * y))

    if (distance > 1) {
      x /= distance
      y /= distance
    }

    return [
      x,
      y,
    ]
  },
  /**
   * Retrieves the gradient at `(x, y)` in simplex space.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @private
   * @returns {Number}
   */
  getGradient: function (x, y) {
    let xMap = this.gradient.get(x)

    if (!xMap) {
      xMap = new Map()
      this.gradient.set(x, xMap)
    }

    let gradient = xMap.get(y)

    if (!gradient) {
      gradient = this.generateGradient(x, y)
      xMap.set(y, gradient)
    }

    return gradient
  },
  /**
   * Range (plus and minus) to scale the output such that it's normalized to `[0, 1]`.
   * This magic number was derived from a brute-force method.
   * @instance
   * @private
   */
  range: 1/99,
  /**
   * Clears all generated values.
   * Implementations are encouraged to call this whenever {@link syngen.seed} is set, {@link syngen.state} is reset, or memory becomes an issue.
   * @instance
   */
  reset: function () {
    this.gradient.clear()

    return this
  },
  /**
   * Factor to skew input space into simplex space in two dimensions.
   * @instance
   * @private
   */
  skewFactor: (Math.sqrt(3) - 1) / 2,
  /**
   * Factor to skew simplex space into input space in two dimensions.
   * @instance
   * @private
   */
  unskewFactor: (3 - Math.sqrt(3)) / 6,
  /**
   * Calculates the value at `(x, y)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @returns {Number}
   */
  value: function (xin, yin) {
    const F2 = this.skewFactor,
      G2 = this.unskewFactor

    // Skew input space
    const s = (xin + yin) * F2,
      i = Math.floor(xin + s),
      j = Math.floor(yin + s),
      t = (i + j) * G2

    // Unskew back to input space
    const X0 = i - t,
      Y0 = j - t

    // Deltas within input space
    const x0 = xin - X0,
      y0 = yin - Y0

    // Offsets for corner 1 within skewed space
    const i1 = x0 > y0 ? 1 : 0,
      j1 = x0 > y0 ? 0 : 1

    // Offsets for corner 1 within input space
    const x1 = x0 - i1 + G2,
      y1 = y0 - j1 + G2

    // Offsets for corner 2 within skewed space
    const x2 = x0 - 1 + (2 * G2),
      y2 = y0 - 1 + (2 * G2)

    // Calculate contribution from corner 0
    const t0 = 0.5 - (x0 * x0) - (y0 * y0)
    let n0 = 0

    if (t0 >= 0) {
      const g0 = this.getGradient(i, j)
      // n = (t ** 4) * (g(i,j) dot (x,y))
      n0 = (t0 * t0 * t0 * t0) * ((g0[0] * x0) + (g0[1] * y0))
    }

    // Calculate contribution from corner 1
    const t1 = 0.5 - x1 * x1 - y1 * y1
    let n1 = 0

    if (t1 >= 0) {
      const g1 = this.getGradient(i + i1, j + j1)
      n1 = (t1 * t1 * t1 * t1) * ((g1[0] * x1) + (g1[1] * y1))
    }

    // Calculate contribution from corner 2
    const t2 = 0.5 - x2 * x2 - y2 * y2
    let n2 = 0

    if (t2 >= 0) {
      const g2 = this.getGradient(i + 1, j + 1)
      n2 = (t2 * t2 * t2 * t2) * ((g2[0] * x2) + (g2[1] * y2))
    }

    // Sum and scale contributions
    return syngen.fn.clamp(
      syngen.fn.scale(n0 + n1 + n2, -this.range, this.range, 0, 1),
      0,
      1
    )
  },
}

/**
 * Provides an interface for generating seeded three-dimensional OpenSimplex noise.
 * @interface
 * @see syngen.tool.simplex3d.create
 * @todo Document private members
 */
syngen.tool.simplex3d = {}

/**
 * Instantiates a three-dimensional OpenSimplex noise generator.
 * @param {...String} [...seeds]
 * @returns {syngen.tool.simplex3d}
 * @static
 */
syngen.tool.simplex3d.create = function (...seeds) {
  return Object.create(this.prototype).construct(...seeds)
}

syngen.tool.simplex3d.prototype = {
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
   * Generates the gradient at `(x, y, z)` in simplex space.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @private
   */
  generateGradient: function (xin, yin, zin) {
    const srand = syngen.fn.srand('simplex', ...this.seed, xin, yin, zin)

    let x = srand(-1, 1),
      y = srand(-1, 1),
      z = srand(-1, 1)

    const distance = Math.sqrt((x * x) + (y * y) + (z * z))

    if (distance > 1) {
      x /= distance
      y /= distance
      z /= distance
    }

    return [
      x,
      y,
      z,
    ]
  },
  /**
   * Retrieves the gradient at `(x, y, z)` in simplex space.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @private
   * @returns {Number}
   */
  getGradient: function (x, y, z) {
    let xMap = this.gradient.get(x)

    if (!xMap) {
      xMap = new Map()
      this.gradient.set(x, xMap)
    }

    let yMap = xMap.get(y)

    if (!yMap) {
      yMap = new Map()
      xMap.set(y, yMap)
    }

    let gradient = yMap.get(z)

    if (!gradient) {
      gradient = this.generateGradient(x, y, z)
      yMap.set(z, gradient)
    }

    return gradient
  },
  /**
   * Range (plus and minus) to scale the output such that it's normalized to `[0, 1]`.
   * This magic number was derived from a brute-force method.
   * @instance
   * @private
   */
  range: 1/107,
  /**
   * Clears all generated values.
   * Implementations are encouraged to call this whenever {@link syngen.seed} is set, {@link syngen.state} is reset, or memory becomes an issue.
   * @instance
   */
  reset: function () {
    this.gradient.clear()

    return this
  },
  /**
   * Factor to skew input space into simplex space in three dimensions.
   * @instance
   * @private
   */
  skewFactor: 1/3,
  /**
   * Factor to skew simplex space into input space in three dimensions.
   * @instance
   * @private
   */
  unskewFactor: 1/6,
  /**
   * Calculates the value at `(x, y, z)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @returns {Number}
   */
  value: function (xin, yin, zin) {
    const F3 = this.skewFactor,
      G3 = this.unskewFactor

    // Skew input space
    const s = (xin + yin + zin) * F3,
      i = Math.floor(xin + s),
      j = Math.floor(yin + s),
      k = Math.floor(zin + s),
      t = (i + j + k) * G3

    // Unskew back to input space
    const X0 = i - t,
      Y0 = j - t,
      Z0 = k - t

    // Deltas within input space
    const x0 = xin - X0,
      y0 = yin - Y0,
      z0 = zin - Z0

    // Offsets for corner 1 within skewed space
    let i1, j1, k1

    // Offsets for corner 2 within skewed space
    let i2, j2, k2

    if (x0 >= y0) {
      if (y0 >= z0) {
        i1 = 1
        j1 = 0
        k1 = 0
        i2 = 1
        j2 = 1
        k2 = 0
      } else if (x0 >= z0) {
        i1 = 1
        j1 = 0
        k1 = 0
        i2 = 1
        j2 = 0
        k2 = 1
      } else {
        i1 = 0
        j1 = 0
        k1 = 1
        i2 = 1
        j2 = 0
        k2 = 1
      }
    } else {
      if (y0 < z0) {
        i1 = 0
        j1 = 0
        k1 = 1
        i2 = 0
        j2 = 1
        k2 = 1
      } else if (x0 < z0) {
        i1 = 0
        j1 = 1
        k1 = 0
        i2 = 0
        j2 = 1
        k2 = 1
      } else {
        i1 = 0
        j1 = 1
        k1 = 0
        i2 = 1
        j2 = 1
        k2 = 0
      }
    }

    // Offsets for corner 1 within input space
    const x1 = x0 - i1 + G3,
      y1 = y0 - j1 + G3,
      z1 = z0 - k1 + G3

    // Offsets for corner 2 within input space
    const x2 = x0 - i2 + (2 * G3),
      y2 = y0 - j2 + (2 * G3),
      z2 = z0 - k2 + (2 * G3)

    // Offsets for corner 3 within input space
    const x3 = x0 - 1 + (3 * G3),
      y3 = y0 - 1 + (3 * G3),
      z3 = z0 - 1 + (3 * G3)

    // Calculate contribution from corner 0
    const t0 = 0.5 - (x0 * x0) - (y0 * y0) - (z0 * z0)
    let n0 = 0

    if (t0 >= 0) {
      const g0 = this.getGradient(i, j, k)
      // n = (t ** 4) * (g(i,j,k) dot (x,y,z))
      n0 = (t0 * t0 * t0 * t0) * ((g0[0] * x0) + (g0[1] * y0) + (g0[2] * z0))
    }

    // Calculate contribution from corner 1
    const t1 = 0.5 - (x1 * x1) - (y1 * y1) - (z1 * z1)
    let n1 = 0

    if (t1 >= 0) {
      const g1 = this.getGradient(i + i1, j + j1, k + k1)
      n1 = (t1 * t1 * t1 * t1) * ((g1[0] * x1) + (g1[1] * y1) + (g1[2] * z1))
    }

    // Calculate contribution from corner 2
    const t2 = 0.5 - (x2 * x2) - (y2 * y2) - (z2 * z2)
    let n2 = 0

    if (t2 >= 0) {
      const g2 = this.getGradient(i + i2, j + j2, k + k2)
      n2 = (t2 * t2 * t2 * t2) * ((g2[0] * x2) + (g2[1] * y2) + (g2[2] * z2))
    }

    // Calculate contribution from corner 3
    const t3 = 0.5 - (x3 * x3) - (y3 * y3) - (z3 * z3)
    let n3 = 0

    if (t3 >= 0) {
      const g3 = this.getGradient(i + 1, j + 1, k + 1)
      n3 = (t3 * t3 * t3 * t3) * ((g3[0] * x3) + (g3[1] * y3) + (g3[2] * z3))
    }

    // Sum and scale contributions
    return syngen.fn.clamp(
      syngen.fn.scale(n0 + n1 + n2 + n3, -this.range, this.range, 0, 1),
      0,
      1
    )
  },
}

/**
 * Provides an interface for generating seeded four-dimensional OpenSimplex noise.
 * @interface
 * @see syngen.tool.simplex4d.create
 * @todo Document private members
 */
syngen.tool.simplex4d = {}

/**
 * Instantiates a four-dimensional OpenSimplex noise generator.
 * @param {...String} [...seeds]
 * @returns {syngen.tool.simplex4d}
 * @static
 */
syngen.tool.simplex4d.create = function (...seeds) {
  return Object.create(this.prototype).construct(...seeds)
}

syngen.tool.simplex4d.prototype = {
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
   * Generates the gradient at `(x, y, z, w)` in simplex space.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @private
   */
  generateGradient: function (xin, yin, zin, win) {
    const srand = syngen.fn.srand('simplex', ...this.seed, xin, yin, zin, win)

    let x = srand(-1, 1),
      y = srand(-1, 1),
      z = srand(-1, 1),
      w = srand(-1, 1)

    const distance = Math.sqrt((x * x) + (y * y) + (z * z) + (w * w))

    if (distance > 1) {
      x /= distance
      y /= distance
      z /= distance
      w /= distance
    }

    return [
      x,
      y,
      z,
      w,
    ]
  },
  /**
   * Retrieves the gradient at `(x, y, z, w)` in simplex space.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {Number} w
   * @private
   * @returns {Number}
   */
  getGradient: function (x, y, z, w) {
    let xMap = this.gradient.get(x)

    if (!xMap) {
      xMap = new Map()
      this.gradient.set(x, xMap)
    }

    let yMap = xMap.get(y)

    if (!yMap) {
      yMap = new Map()
      xMap.set(y, yMap)
    }

    let zMap = yMap.get(z)

    if (!zMap) {
      zMap = new Map()
      yMap.set(z, zMap)
    }

    let gradient = zMap.get(w)

    if (!gradient) {
      gradient = this.generateGradient(x, y, z, w)
      zMap.set(w, gradient)
    }

    return gradient
  },
  /**
   * Range (plus and minus) to scale the output such that it's normalized to `[0, 1]`.
   * This magic number was derived from a brute-force method.
   * @instance
   * @private
   */
  range: 1/108,
  /**
   * Clears all generated values.
   * Implementations are encouraged to call this whenever {@link syngen.seed} is set, {@link syngen.state} is reset, or memory becomes an issue.
   * @instance
   */
  reset: function () {
    this.gradient.clear()

    return this
  },
  /**
   * Factor to skew input space into simplex space in four dimensions.
   * @instance
   * @private
   */
  skewFactor: (Math.sqrt(5) - 1) / 4,
  /**
   * Factor to skew simplex space into input space in four dimensions.
   * @instance
   * @private
   */
  unskewFactor: (5 - Math.sqrt(5)) / 20,
  /**
   * Calculates the value at `(x, y, z, w)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {Number} w
   * @returns {Number}
   */
  value: function (xin, yin, zin, win) {
    const F4 = this.skewFactor,
      G4 = this.unskewFactor

    // Skew input space
    const s = (xin + yin + zin + win) * F4,
      i = Math.floor(xin + s),
      j = Math.floor(yin + s),
      k = Math.floor(zin + s),
      l = Math.floor(win + s),
      t = (i + j + k + l) * G4

    // Unskew back to input space
    const X0 = i - t,
      Y0 = j - t,
      Z0 = k - t,
      W0 = l - t

    // Deltas within input space
    const x0 = xin - X0,
      y0 = yin - Y0,
      z0 = zin - Z0,
      w0 = win - W0

    // Rank coordinates
    let rankx = 0,
      ranky = 0,
      rankz = 0,
      rankw = 0

    if (x0 > y0) {
      rankx++
    } else {
      ranky++
    }

    if (x0 > z0) {
      rankx++
    } else {
      rankz++
    }

    if (x0 > w0) {
      rankx++
    } else {
      rankw++
    }

    if (y0 > z0) {
      ranky++
    } else {
      rankz++
    }

    if (y0 > w0) {
      ranky++
    } else {
      rankw++
    }

    if (z0 > w0) {
      rankz++
    } else {
      rankw++
    }

    // Offsets for corner 1 within skewed space
    const i1 = rankx >= 3 ? 1 : 0,
      j1 = ranky >= 3 ? 1 : 0,
      k1 = rankz >= 3 ? 1 : 0,
      l1 = rankw >= 3 ? 1 : 0

    // Offsets for corner 2 within skewed space
    const i2 = rankx >= 2 ? 1 : 0,
      j2 = ranky >= 2 ? 1 : 0,
      k2 = rankz >= 2 ? 1 : 0,
      l2 = rankw >= 2 ? 1 : 0

    // Offsets for corner 3 within skewed space
    const i3 = rankx >= 1 ? 1 : 0,
      j3 = ranky >= 1 ? 1 : 0,
      k3 = rankz >= 1 ? 1 : 0,
      l3 = rankw >= 1 ? 1 : 0

    // Offsets for corner 1 within input space
    const x1 = x0 - i1 + G4,
      y1 = y0 - j1 + G4,
      z1 = z0 - k1 + G4,
      w1 = w0 - l1 + G4

    // Offsets for corner 2 within input space
    const x2 = x0 - i2 + (2 * G4),
      y2 = y0 - j2 + (2 * G4),
      z2 = z0 - k2 + (2 * G4),
      w2 = w0 - l2 + (2 * G4)

    // Offsets for corner 3 within input space
    const x3 = x0 - i3 + (3 * G4),
      y3 = y0 - j3 + (3 * G4),
      z3 = z0 - k3 + (3 * G4),
      w3 = w0 - l3 + (3 * G4)

    // Offsets for corner 4 within input space
    const x4 = x0 - 1 + (4 * G4),
      y4 = y0 - 1 + (4 * G4),
      z4 = z0 - 1 + (4 * G4),
      w4 = w0 - 1 + (4 * G4)

    // Calculate contribution from corner 0
    const t0 = 0.5 - (x0 * x0) - (y0 * y0) - (z0 * z0) - (w0 * w0)
    let n0 = 0

    if (t0 >= 0) {
      const g0 = this.getGradient(i, j, k, l)
      // n = (t ** 4) * (g(i,j,k,l) dot (x,y,z,w))
      n0 = (t0 * t0 * t0 * t0) * ((g0[0] * x0) + (g0[1] * y0) + (g0[2] * z0) + (g0[3] * w0))
    }

    // Calculate contribution from corner 1
    const t1 = 0.5 - (x1 * x1) - (y1 * y1) - (z1 * z1) - (w1 * w1)
    let n1 = 0

    if (t1 >= 0) {
      const g1 = this.getGradient(i + i1, j + j1, k + k1, l + l1)
      n1 = (t1 * t1 * t1 * t1) * ((g1[0] * x1) + (g1[1] * y1) + (g1[2] * z1) + (g1[3] * w1))
    }

    // Calculate contribution from corner 2
    const t2 = 0.5 - (x2 * x2) - (y2 * y2) - (z2 * z2) - (w2 * w2)
    let n2 = 0

    if (t2 >= 0) {
      const g2 = this.getGradient(i + i2, j + j2, k + k2, l + l2)
      n2 = (t2 * t2 * t2 * t2) * ((g2[0] * x2) + (g2[1] * y2) + (g2[2] * z2) + (g2[3] * w2))
    }

    // Calculate contribution from corner 3
    const t3 = 0.5 - (x3 * x3) - (y3 * y3) - (z3 * z3) - (w3 * w3)
    let n3 = 0

    if (t3 >= 0) {
      const g3 = this.getGradient(i + i3, j + j3, k + k3, l + l3)
      n3 = (t3 * t3 * t3 * t3) * ((g3[0] * x3) + (g3[1] * y3) + (g3[2] * z3) + (g3[3] * w3))
    }

    // Calculate contribution from corner 4
    const t4 = 0.5 - (x4 * x4) - (y4 * y4) - (z4 * z4) - (w4 * w4)
    let n4 = 0

    if (t4 >= 0) {
      const g4 = this.getGradient(i + 1, j + 1, k + 1, l + 1)
      n4 = (t4 * t4 * t4 * t4) * ((g4[0] * x4) + (g4[1] * y4) + (g4[2] * z4) + (g4[3] * w4))
    }

    // Sum and scale contributions
    return syngen.fn.clamp(
      syngen.fn.scale(n0 + n1 + n2 + n3 + n4, -this.range, this.range, 0, 1),
      0,
      1
    )
  },
}

syngen.tool.sphere = {}

syngen.tool.sphere.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.tool.sphere.prototype = {
  construct: function ({
    center,
    radius = 0,
  } = {}) {
    this.center = syngen.tool.vector3d.create(center)
    this.radius = radius

    return this
  },
  containsPoint: function (point) {
    return this.center.distance(point) <= this.radius
  },
  containsSphere: function (center, radius) {
    // XXX: Includes intersections
    return this.center.distance(center) <= (this.radius + radius)
  },
}

syngen.tool.streamer2d = {}

syngen.tool.streamer2d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.tool.streamer2d.prototype = {
  construct: function ({
    radius = 1,
  } = {}) {
    this.loaded = []
    this.radius = radius
    this.tree = syngen.tool.quadtree.create()

    syngen.tool.pubsub.decorate(this)

    return this
  },
  add: function (item) {
    this.tree.insert(item)

    return this
  },
  remove: function (item) {
    this.tree.remove(item)

    if (this.loaded.includes(item)) {
      this.loaded.splice(this.loaded.indexOf(item), 1)
      this.emit('unload', item)
    }

    return this
  },
  reset: function () {
    // Unload loaded items
    for (const item of this.loaded) {
      this.emit('unload', item)
    }

    this.loaded = []
    this.tree.clear()

    return this
  },
  update: function () {
    // Retrieve objects within radius of position
    const position = syngen.position.getVector()

    const streamed = this.tree.retrieve({
      height: this.radius * 2,
      width: this.radius * 2,
      x: position.x - this.radius,
      y: position.y - this.radius,
    }).filter((item) => position.distance(item) <= this.radius)

    // Load and unload objects
    const loadedSet = new Set(this.loaded),
      streamedSet = new Set(streamed)

    const loaded = streamed.filter((item) => !loadedSet.has(item)),
      unloaded = this.loaded.filter((item) => !streamedSet.has(item))

    for (const item of loaded) {
      this.pubsub.emit('load', item)
    }

    for (const item of unloaded) {
      this.pubsub.emit('unload', item)
    }

    this.loaded = streamed

    return this
  },
}

syngen.tool.streamer3d = {}

syngen.tool.streamer3d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.tool.streamer3d.prototype = {
  construct: function ({
    radius = 1,
  } = {}) {
    this.loaded = []
    this.radius = radius
    this.tree = syngen.tool.octree.create()

    syngen.tool.pubsub.decorate(this)

    return this
  },
  add: function (item) {
    this.tree.insert(item)

    return this
  },
  remove: function (item) {
    this.tree.remove(item)

    if (this.loaded.includes(item)) {
      this.loaded.splice(this.loaded.indexOf(item), 1)
      this.emit('unload', item)
    }

    return this
  },
  reset: function () {
    // Unload loaded items
    for (const item of this.loaded) {
      this.emit('unload', item)
    }

    this.loaded = []
    this.tree.clear()

    return this
  },
  update: function () {
    // Retrieve objects within radius of position
    const position = syngen.position.getVector()

    const streamed = this.tree.retrieve({
      depth: this.radius * 2,
      height: this.radius * 2,
      width: this.radius * 2,
      x: position.x - this.radius,
      y: position.y - this.radius,
      z: position.z - this.radius,
    }).filter((item) => position.distance(item) <= this.radius)

    // Load and unload objects
    const loadedSet = new Set(this.loaded),
      streamedSet = new Set(streamed)

    const loaded = streamed.filter((item) => !loadedSet.has(item)),
      unloaded = this.loaded.filter((item) => !streamedSet.has(item))

    for (const item of loaded) {
      this.pubsub.emit('load', item)
    }

    for (const item of unloaded) {
      this.pubsub.emit('unload', item)
    }

    this.loaded = streamed

    return this
  },
}

/**
 * Provides an interface for two-dimensional vectors with x-y coordinates.
 * @interface
 * @see syngen.tool.vector2d.create
 */
syngen.tool.vector2d = {}

/**
 * Instantiates a new two-dimensional vector.
 * @param {syngen.tool.vector2d|Object} [options={}]
 * @param {Number} [options.x=0]
 * @param {Number} [options.y=0]
 * @returns {syngen.tool.vector2d}
 * @static
 */
syngen.tool.vector2d.create = function (options = {}) {
  return Object.create(this.prototype).construct(options)
}

syngen.tool.vector2d.prototype = {
  /**
   * Adds `vector` to this and returns their sum as a new instance.
   * @instance
   * @param {syngen.tool.vector2d|Object} [vector]
   * @returns {syngen.tool.vector2d|Object}
   */
  add: function ({
    x = 0,
    y = 0,
  } = {}) {
    return syngen.tool.vector2d.create({
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
   * @returns {syngen.tool.vector2d}
   */
  clone: function () {
    return syngen.tool.vector2d.create(this)
  },
  /**
   * Initializes the instance with `options`.
   * @instance
   * @param {syngen.tool.vector2d|Object} [options={}]
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
   * @param {syngen.tool.vector2d|Object} [vector]
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
   * @param {syngen.tool.vector2d|Object} [vector]
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
   * @param {syngen.tool.vector2d|Object} [vector]
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
   * @param {syngen.tool.vector2d|Object} [vector]
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
   * @param {syngen.tool.vector2d|Object} [vector]
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
   * @returns {syngen.tool.vector2d}
   */
  inverse: function () {
    return syngen.tool.vector2d.create({
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
   * @returns {syngen.tool.vector2d}
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
   * @returns {syngen.tool.vector2d}
   */
  rotate: function (angle = 0) {
    if (angle == 0) {
      return this.clone()
    }

    const cos = Math.cos(angle),
      sin = Math.sin(angle)

    return syngen.tool.vector2d.create({
      x: (this.x * cos) - (this.y * sin),
      y: (this.y * cos) + (this.x * sin),
    })
  },
  /**
   * Multiplies this by `scalar` and returns it as a new instance.
   * @instance
   * @param {Number} [scalar=0]
   * @returns {syngen.tool.vector2d}
   */
  scale: function (scalar = 0) {
    return syngen.tool.vector2d.create({
      x: this.x * scalar,
      y: this.y * scalar,
    })
  },
  /**
   * Sets all properties with `options`.
   * @instance
   * @param {syngen.tool.vector2d|Object} [options]
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
   * @param {syngen.tool.vector2d|Object} [vector]
   * @returns {syngen.tool.vector2d|Object}
   */
  subtract: function ({
    x = 0,
    y = 0,
  } = {}) {
    return syngen.tool.vector2d.create({
      x: this.x - x,
      y: this.y - y,
    })
  },
  /**
   * Subtracts a circular radius from this and returns it as a new instance.
   * @instance
   * @param {Number} [radius=0]
   * @returns {syngen.tool.vector2d}
   */
  subtractRadius: function (radius = 0) {
    if (radius <= 0) {
      return this.clone()
    }

    const distance = this.distance()

    if (radius >= distance) {
      return syngen.tool.vector2d.create()
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
  /**
   * Returns a copy of the vector with the x-component removed.
   * @instance
   * @returns {syngen.tool.vector2d}
   */
  zeroX: function () {
    return syngen.tool.vector2d.create({
      y: this.y,
    })
  },
  /**
   * Returns a copy of the vector with the y-component removed.
   * @instance
   * @returns {syngen.tool.vector2d}
   */
  zeroY: function () {
    return syngen.tool.vector2d.create({
      x: this.x,
    })
  },
}

/**
 * Instantiates a unit vector along the x-axis.
 * @returns {syngen.tool.vector2d}
 * @static
 */
syngen.tool.vector2d.unitX = function () {
  return Object.create(this.prototype).construct({
    x: 1,
  })
}

/**
 * Instantiates a unit vector along the y-axis.
 * @returns {syngen.tool.vector2d}
 * @static
 */
syngen.tool.vector2d.unitY = function () {
  return Object.create(this.prototype).construct({
    y: 1,
  })
}

/**
 * Provides an interface for two-dimensional vectors with x-y-z coordinates.
 * @interface
 * @see syngen.tool.vector3d.create
 */
syngen.tool.vector3d = {}

/**
 * Instantiates a new three-dimensional vector.
 * @param {syngen.tool.vector3d|Object} [options={}]
 * @param {Number} [options.x=0]
 * @param {Number} [options.y=0]
 * @param {Number} [options.z=0]
 * @returns {syngen.tool.vector3d}
 * @static
 */
syngen.tool.vector3d.create = function (options = {}) {
  return Object.create(this.prototype).construct(options)
}

syngen.tool.vector3d.prototype = {
  /**
   * Adds `vector` to this and returns their sum as a new instance.
   * @instance
   * @param {syngen.tool.vector3d|Object} [vector]
   * @returns {syngen.tool.vector3d|Object}
   */
  add: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return syngen.tool.vector3d.create({
      x: this.x + x,
      y: this.y + y,
      z: this.z + z,
    })
  },
  /**
   * Returns a new instance with the same properties.
   * @instance
   * @returns {syngen.tool.vector3d}
   */
  clone: function () {
    return syngen.tool.vector3d.create(this)
  },
  /**
   * Initializes the instance with `options`.
   * @instance
   * @param {syngen.tool.vector3d|Object} [options={}]
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
   * @param {syngen.tool.vector3d|Object} [vector]
   * @returns {syngen.tool.vector3d}
   */
  crossProduct: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return syngen.tool.vector3d.create({
      x: (this.y * z) - (this.z * y),
      y: (this.z * x) - (this.x * z),
      z: (this.x * y) - (this.y * x),
    })
  },
  /**
   * Calculates the Euclidean distance from `vector`.
   * @instance
   * @param {syngen.tool.vector3d|Object} [vector]
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
   * @param {syngen.tool.vector3d|Object} [vector]
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
   * @param {syngen.tool.vector3d|Object} [vector]
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
   * @param {syngen.tool.vector3d|Object} [vector]
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
   * @returns {syngen.tool.euler}
   */
  euler: function () {
    return syngen.tool.euler.create({
      pitch: this.z ? -Math.atan2(this.z, Math.sqrt((this.x ** 2) + (this.y ** 2))) : 0,
      roll: 0,
      yaw: Math.atan2(this.y, this.x),
    })
  },
  /**
   * Returns the inverse vector as a new instance.
   * @instance
   * @returns {syngen.tool.vector3d}
   */
  inverse: function () {
    return syngen.tool.vector3d.create({
      x: -this.x,
      y: -this.y,
      z: -this.z,
    })
  },
  /**
   * Returns the vector with an inverted Z-component as a new instance.
   * @instance
   * @returns {syngen.tool.vector3d}
   */
  invertZ: function () {
    return syngen.tool.vector3d.create({
      x: this.x,
      y: this.y,
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
   * @returns {syngen.tool.vector3d}
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
   * @returns {syngen.tool.quaternion}
   */
  quaternion: function () {
    return syngen.tool.quaternion.fromEuler(
      this.euler()
    )
  },
  /**
   * Rotates this by `euler` with `sequence` and returns it as a new instance.
   * Beware that this is less performant than using quaternions and can result in gimbal lock.
   * @instance
   * @param {syngen.tool.euler} euler
   * @param {String} [sequence]
   * @returns {syngen.tool.vector3d}
   */
  rotateEuler: function (euler, sequence) {
    return this.rotateQuaternion(
      syngen.tool.quaternion.fromEuler(euler, sequence)
    )
  },
  /**
   * Rotates this by `quaternion` and returns it as a new instance.
   * @instance
   * @param {syngen.tool.quaternion} quaternion
   * @returns {syngen.tool.vector3d}
   */
  rotateQuaternion: function (quaternion) {
    if (!syngen.tool.quaternion.prototype.isPrototypeOf(quaternion)) {
      quaternion = syngen.tool.quaternion.create(quaternion)
    }

    if (quaternion.isZero()) {
      return this.clone()
    }

    return syngen.tool.vector3d.create(
      quaternion.multiply(
        syngen.tool.quaternion.create(this)
      ).multiply(
        quaternion.inverse()
      )
    ).invertZ() // XXX: Invert z-axis because quaternions use -pitch?
  },
  /**
   * Multiplies this by `scalar` and returns it as a new instance.
   * @instance
   * @param {Number} [scalar=0]
   * @returns {syngen.tool.vector3d}
   */
  scale: function (scalar = 0) {
    return syngen.tool.vector3d.create({
      x: this.x * scalar,
      y: this.y * scalar,
      z: this.z * scalar,
    })
  },
  /**
   * Sets all properties with `options`.
   * @instance
   * @param {syngen.tool.vector3d|Object} [options]
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
   * @param {syngen.tool.vector3d|Object} [vector]
   * @returns {syngen.tool.vector3d|Object}
   */
  subtract: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return syngen.tool.vector3d.create({
      x: this.x - x,
      y: this.y - y,
      z: this.z - z,
    })
  },
  /**
   * Subtracts a spherical radius from this and returns it as a new instance.
   * @instance
   * @param {Number} [radius=0]
   * @returns {syngen.tool.vector3d}
   */
  subtractRadius: function (radius = 0) {
    if (radius <= 0) {
      return this.clone()
    }

    const distance = this.distance()

    if (radius >= distance) {
      return syngen.tool.vector3d.create()
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

  /**
   * Returns a copy of the vector with the x-component removed.
   * @instance
   * @returns {syngen.tool.vector3d}
   */
  zeroX: function () {
    return syngen.tool.vector3d.create({
      y: this.y,
      z: this.z,
    })
  },
  /**
   * Returns a copy of the vector with the y-component removed.
   * @instance
   * @returns {syngen.tool.vector3d}
   */
  zeroY: function () {
    return syngen.tool.vector3d.create({
      x: this.x,
      z: this.z,
    })
  },
  /**
   * Returns a copy of the vector with the y-component removed.
   * @instance
   * @returns {syngen.tool.vector3d}
   */
  zeroZ: function () {
    return syngen.tool.vector3d.create({
      x: this.x,
      y: this.y,
    })
  },
}

/**
 * Instantiates a unit vector along the x-axis.
 * @returns {syngen.tool.vector3d}
 * @static
 */
syngen.tool.vector3d.unitX = function () {
  return Object.create(this.prototype).construct({
    x: 1,
  })
}

/**
 * Instantiates a unit vector along the y-axis.
 * @returns {syngen.tool.vector3d}
 * @static
 */
syngen.tool.vector3d.unitY = function () {
  return Object.create(this.prototype).construct({
    y: 1,
  })
}

/**
 * Instantiates a unit vector along the z-axis.
 * @returns {syngen.tool.vector3d}
 * @static
 */
syngen.tool.vector3d.unitZ = function () {
  return Object.create(this.prototype).construct({
    z: 1,
  })
}

/**
 * Provides an event-driven main loop for the application.
 * Systems can subscribe to each frame and respond to state changes.
 * Beware that the loop remains running while paused, which they must choose to respect.
 * @implements syngen.tool.pubsub
 * @namespace
 */
syngen.loop = (() => {
  const pubsub = syngen.tool.pubsub.create()

  let activeRequest,
    count = 0,
    delta = 0,
    idleRequest,
    isPaused = false,
    isRunning = false,
    lastFrame = 0,
    time = 0

  function cancel() {
    cancelAnimationFrame(activeRequest)
    clearTimeout(idleRequest)
  }

  function frame() {
    const now = performance.now()

    delta = lastFrame
      ? (now - lastFrame) / 1000
      : 0

    lastFrame = now

    count += 1
    time += delta

    /**
     * Fired every loop frame.
     * @event syngen.loop#event:frame
     * @property {Number} count - Current frame count of loop
     * @property {Number} delta - Time elapsed since last frame
     * @property {Boolean} paused - Whether the loop is paused
     * @property {Number} time - Total elapsed time of loop
     * @type {Object}
     */
    pubsub.emit('frame', {
      count,
      delta,
      paused: isPaused,
      time,
    })

    schedule()
  }

  function schedule() {
    if (document.hidden) {
      idleRequest = setTimeout(frame)
    } else {
      activeRequest = requestAnimationFrame(frame)
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (!isRunning) {
      return
    }

    cancel()
    schedule()
  })

  return pubsub.decorate({
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
    frame: () => count,
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

      schedule()

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

      cancel()

      count = 0
      delta = 0
      isPaused = false
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
  })
})()

/**
 * Provides a helper for importing and exporting state.
 * Systems can subscribe to its events to persist and load their inner states.
 * @implements syngen.tool.pubsub
 * @namespace
 */
syngen.state = syngen.tool.pubsub.decorate({
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

syngen.buffer.brownNoise = ({
  channels = 1,
  duration = 0,
} = {}) => {
  const context = syngen.context()

  const sampleRate = context.sampleRate,
    size = duration * sampleRate

  const buffer = context.createBuffer(channels, size, sampleRate)

  channels = Math.max(1, Math.round(channels))

  // SEE: https://noisehack.com/generate-noise-web-audio-api
  // SEE: https://github.com/mohayonao/brown-noise-node
  for (let channel = 0; channel < channels; channel += 1) {
    const data = buffer.getChannelData(channel)

    let lastBrown = 0

    for (let i = 0; i < size; i += 1) {
      const white = (2 * Math.random()) - 1
      const brown = (lastBrown + (0.02 * white)) / 1.02

      data[i] = brown * 3.5
      lastBrown = brown
    }
  }

  return buffer
}

syngen.buffer.impulse = ({
  buffer,
  power = 1,
}) => {
  if (!(buffer instanceof AudioBuffer)) {
    throw new Error('Invalid AudioBuffer.')
  }

  const size = buffer.length

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel)

    for (let i = 0; i < size; i += 1) {
      data[i] *= ((size - i) / size) ** power
    }
  }

  return buffer
}

syngen.buffer.pinkNoise = ({
  channels = 1,
  duration = 0,
} = {}) => {
  const context = syngen.context()

  const sampleRate = context.sampleRate,
    size = duration * sampleRate

  const buffer = context.createBuffer(channels, size, sampleRate)

  channels = Math.max(1, Math.round(channels))

  // SEE: https://noisehack.com/generate-noise-web-audio-api
  // SEE: https://github.com/mohayonao/pink-noise-node
  for (let channel = 0; channel < channels; channel += 1) {
    const data = buffer.getChannelData(channel)

    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0

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
  }

  return buffer
}

syngen.buffer.whiteNoise = ({
  channels = 1,
  duration = 0,
} = {}) => {
  const context = syngen.context()

  const sampleRate = context.sampleRate,
    size = duration * sampleRate

  const buffer = context.createBuffer(channels, size, sampleRate)

  channels = Math.max(1, Math.round(channels))

  for (let channel = 0; channel < channels; channel += 1) {
    const data = buffer.getChannelData(channel)

    for (let i = 0; i < size; i += 1) {
      data[i] = (2 * Math.random()) - 1
    }
  }

  return buffer
}

// TODO: Document
syngen.ear.filterModel.base = {
  defaults: {},
  options: {},
  calculate: function () {},
  extend: function (definition = {}) {
    definition = syngen.fn.extend(this, definition)
    definition.defaults = {...this.defaults, ...definition.defaults}
    definition.options = {...definition.defaults}
    return definition
  },
  instantiate: function (options = {}) {
    const instance = Object.create(this)
    instance.options = {...this.defaults, ...options}
    return instance
  },
}

syngen.ear.filterModel.head = syngen.ear.filterModel.base.extend({
  defaults: {
    coneRadius: Math.PI / 4,
    power: 1,
    width: 0.1524,
  },
  calculate: function (dotProduct) {
    return syngen.fn.lerpExp(
      syngen.const.speedOfSound / this.options.width,
      syngen.const.maxFrequency,
      syngen.fn.clamp(syngen.fn.scale(dotProduct, -1, Math.sin(this.options.coneRadius), 0, 1)),
      this.options.power
    )
  },
})

syngen.ear.filterModel.musical = syngen.ear.filterModel.base.extend({
  defaults: {
    coneRadius: Math.PI / 4,
    frequency: 440,
    maxColor: 8,
    minColor: 1,
    power: 2,
  },
  calculate: function (dotProduct) {
    return Math.min(syngen.fn.lerpExp(
      this.options.frequency * this.options.minColor,
      this.options.frequency * this.options.maxColor,
      syngen.fn.clamp(syngen.fn.scale(dotProduct, -1, Math.sin(this.options.coneRadius), 0, 1)),
      this.options.power
    ), syngen.const.maxFrequency)
  },
})

// TODO: Document
syngen.ear.gainModel.base = {
  defaults: {},
  options: {},
  calculate: function () {},
  extend: function (definition = {}) {
    definition = syngen.fn.extend(this, definition)
    definition.defaults = {...this.defaults, ...definition.defaults}
    definition.options = {...definition.defaults}
    return definition
  },
  instantiate: function (options = {}) {
    const instance = Object.create(this)
    instance.options = {...this.defaults, ...options}
    return instance
  },
}

syngen.ear.gainModel.exponential = syngen.ear.gainModel.base.extend({
  defaults: {
    maxDistance: 100,
    maxGain: 1,
    minDistance: 1,
    minGain: syngen.const.zeroGain,
    power: 2,
  },
  calculate: function (distance) {
    return syngen.fn.lerpExp(
      this.options.minGain,
      this.options.maxGain,
      syngen.fn.clamp(
        syngen.fn.scale(distance, this.options.minDistance, this.options.maxDistance, 1, 0)
      ),
      this.options.power
    )
  },
})

syngen.ear.gainModel.linear = syngen.ear.gainModel.base.extend({
  defaults: {
    maxDistance: 100,
    maxGain: 1,
    minDistance: 1,
    minGain: syngen.const.zeroGain,
  },
  calculate: function (distance) {
    return syngen.fn.lerp(
      this.options.minGain,
      this.options.maxGain,
      syngen.fn.clamp(
        syngen.fn.scale(distance, this.options.minDistance, this.options.maxDistance, 1, 0)
      )
    )
  },
})

syngen.ear.gainModel.logarithmic = syngen.ear.gainModel.base.extend({
  defaults: {
    base: 10,
    maxDistance: 100,
    maxGain: 1,
    minDistance: 1,
    minGain: syngen.const.zeroGain,
  },
  calculate: function (distance) {
    return syngen.fn.lerpLog(
      this.options.minGain,
      this.options.maxGain,
      syngen.fn.clamp(
        syngen.fn.scale(distance, this.options.minDistance, this.options.maxDistance, 1, 0)
      ),
      this.options.base
    )
  },
})

syngen.ear.gainModel.normalize = syngen.ear.gainModel.base.extend({
  defaults: {
    gain: 1,
  },
  calculate: function () {
    return this.options.gain
  },
})

syngen.ear.gainModel.realistic = syngen.ear.gainModel.base.extend({
  defaults: {
    power: 2,
  },
  calculate: function (distance) {
    return 1 / (Math.max(1, distance) ** this.options.power)
  },
})

syngen.ear.gainModel.realisticHorizon = syngen.ear.gainModel.base.extend({
  defaults: {
    horizonPower: 1/2,
    maxDistance: 100,
    minDistance: 1,
    power: 2,
  },
  calculate: function (distance) {
    const gain = 1 / (Math.max(this.options.minDistance, distance) ** this.options.power)

    const horizon = syngen.fn.clamp(
      syngen.fn.scale(distance, this.options.minDistance, this.options.maxDistance, 1, 0)
    ) ** this.options.horizonPower

    return gain * horizon
  },
})

/**
 * Provides a mastering process and utilities for routing audio into it like a virtual mixing board.
 * Implementations are encouraged to leverage this instead of the main audio destination directly.
 * @namespace
 */
syngen.mixer = (() => {
  const context = syngen.context()

  const mainCompensator = context.createGain(),
    mainCompressor = context.createDynamicsCompressor(),
    mainInput = context.createGain(),
    mainOutput = context.createGain()

  let mainHighpass,
    mainLowpass

  mainCompressor.connect(mainCompensator)
  mainCompensator.connect(mainOutput)
  mainOutput.connect(context.destination)

  mainCompensator.gain.value = 1
  mainCompressor.attack.value = syngen.const.zeroTime
  mainCompressor.knee.value = 0
  mainCompressor.ratio.value = 20
  mainCompressor.release.value = syngen.const.zeroTime
  mainCompressor.threshold.value = 0

  createFilters()

  function createFilters(highpassFrequency = syngen.const.minFrequency, lowpassFrequency = syngen.const.maxFrequency) {
    mainHighpass = context.createBiquadFilter()
    mainHighpass.type = 'highpass'
    mainHighpass.frequency.value = highpassFrequency

    mainLowpass = context.createBiquadFilter()
    mainLowpass.type = 'lowpass'
    mainLowpass.frequency.value = lowpassFrequency

    mainInput.connect(mainHighpass)
    mainHighpass.connect(mainLowpass)
    mainLowpass.connect(mainCompressor)
  }

  function destroyFilters() {
    mainInput.disconnect()
    mainLowpass.disconnect()
    mainLowpass = null
    mainHighpass.disconnect()
    mainHighpass = null
  }

  return {
    /**
     * Creates a `GainNode` that's connected to the main input.
     * Implementations can leverage buses to create submixes.
     * @memberof syngen.mixer
     * @returns {GainNode}
     */
    createBus: () => {
      const input = context.createGain()
      input.connect(mainInput)
      return input
    },
    /**
     * Returns the main input `GainNode`.
     * @memberof syngen.mixer
     * @returns {GainNode}
     */
    input: () => mainInput,
    /**
     * Returns the main output `GainNode`.
     * @memberof syngen.mixer
     * @returns {GainNode}
     */
    output: () => mainOutput,
    /**
     * Exposes the parameters associated with the mastering process.
     * Here's an overview of its routing:
     * - `GainNode` input
     * - `BiquadFilterNode` highpass
     * - `BiquadFilterNode` lowpass
     * - `DynamicsCompressorNode` limiter
     * - `GainNode` limiter makeup gain
     * - `GainNode` output
     * - `AudioDestinationNode` `{@link syngen.context}().destination`
     * @memberof syngen.mixer
     * @property {AudioParam} gain
     * @property {Object} highpass
     * @property {AudioParam} highpass.frequency
     * @property {Object} limiter
     * @property {AudioParam} limiter.attack
     * @property {AudioParam} limiter.gain
     * @property {AudioParam} limiter.knee
     * @property {AudioParam} limiter.ratio
     * @property {AudioParam} limiter.release
     * @property {AudioParam} limiter.threshold
     * @property {Object} lowpass
     * @property {AudioParam} lowpass.frequency
     * @property {AudioParam} preGain
     */
    param: {
      gain: mainOutput.gain,
      highpass: {
        frequency: mainHighpass.frequency,
      },
      limiter: {
        attack: mainCompressor.attack,
        gain: mainCompensator.gain,
        knee: mainCompressor.knee,
        ratio: mainCompressor.ratio,
        release: mainCompressor.release,
        threshold: mainCompressor.threshold,
      },
      lowpass: {
        frequency: mainLowpass.frequency,
      },
      preGain: mainInput.gain,
    },
    /**
     * Occasionally the main filters can enter an unstable or bad state.
     * When this happens the entire mix can drop out to silence.
     * This provides a solution for replacing them with stable filters.
     * Implementations can proactively check for invalid states with an {@link https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode|AnalyserNode} or {@link https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletNode|AudioWorkletNode}.
     * Beware that the nodes that caused the issue may also need reset.
     * @memberof syngen.mixer
     */
    rebuildFilters: function () {
      const highpassFrequency = mainHighpass.frequency.value,
        lowpassFrequency = mainLowpass.frequency.value

      this.auxiliary.reverb.rebuildFilters()

      destroyFilters()
      createFilters(highpassFrequency, lowpassFrequency)

      this.param.highpass.frequency = mainHighpass.frequency
      this.param.lowpass.frequency = mainLowpass.frequency

      return this
    },
  }
})()

/**
 * Provides a auxiliary send for global reverb processing.
 * Because `ConvolverNode`s are quite intensive, implementations are encouraged to leverage this to provide a single global reverb.
 * @augments syngen.tool.pubsub
 * @namespace
 * @see syngen.mixer.send.reverb
 */
syngen.mixer.reverb = (() => {
  const context = syngen.context(),
    delay = context.createDelay(),
    input = context.createGain(),
    output = syngen.mixer.createBus(),
    pubsub = syngen.tool.pubsub.create()

  let active = true,
    convolver = context.createConvolver(),
    highpass,
    lowpass

  convolver.buffer = syngen.buffer.impulse({
    buffer: syngen.buffer.whiteNoise({
      channels: 2,
      duration: 1,
    }),
    power: 4,
  })

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

  return pubsub.decorate({
    /**
     * Creates a `GainNode` that's connected to the reverb input.
     * @memberof syngen.mixer.reverb
     * @returns {GainNode}
     */
    createBus: () => {
      const gain = context.createGain()
      gain.connect(input)
      return gain
    },
    /**
     * Built-in gain models.
     * @namespace syngen.mixer.reverb.gainModel
     */
    gainModel: {},
    /**
     * Returns whether the processing is active.
     * @memberof syngen.mixer.reverb
     * @returns {Boolean}
     */
    isActive: () => active,
    /**
     * Returns the output node for the send.
     * @deprecated
     * @memberof syngen.mixer.reverb
     * @returns {GainNode}
     */
    output: () => output,
    /**
     * Exposes the parameters associated with reverb processing.
     * @memberof syngen.mixer.reverb
     * @property {AudioParam} delay
     * @property {AudioParam} gain
     * @property {Object} highpass
     * @property {AudioParam} highpass.frequency
     * @property {Object} lowpass
     * @property {AudioParam} lowpass.frequency
     * @property {AudioParam} preGain
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
      preGain: input.gain,
    },
    /**
     * Occasionally the filters can enter an unstable or bad state.
     * This provides a solution for replacing them with stable filters.
     * @memberof syngen.mixer.reverb
     * @see syngen.mixer.rebuildFilters
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
     * @fires syngen.mixer.reverb#event:activate
     * @fires syngen.mixer.reverb#event:deactivate
     * @memberof syngen.mixer.reverb
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
         * @event syngen.mixer.reverb#event:activate
         */
        pubsub.emit('activate')
        input.connect(delay)
      } else {
        /**
         * Fired whenever the send is deactivated.
         * @event syngen.mixer.reverb#event:deactivate
         */
        pubsub.emit('deactivate')
        input.disconnect(delay)
      }

      return this
    },
    /**
     * Sets the impulse buffer for the inner `ConvolverNode`.
     * To prevent pops and clicks, the tail of the previous buffer persists until it fades out.
     * @memberof syngen.mixer.reverb
     * @param {BufferSource} buffer
     */
    setImpulse: function (buffer) {
      input.disconnect()

      convolver = context.createConvolver()
      convolver.buffer = buffer
      convolver.connect(output)

      if (active) {
        input.connect(delay)
      }

      return this
    },
  })
})()

syngen.mixer.reverb.gainModel.base = {
  defaults: {},
  options: {},
  calculate: function () {},
  extend: function (definition = {}) {
    definition = syngen.fn.extend(this, definition)
    definition.defaults = {...this.defaults, ...definition.defaults}
    definition.options = {...definition.defaults}
    return definition
  },
  instantiate: function (options = {}) {
    const instance = Object.create(this)
    instance.options = {...this.defaults, ...options}
    return instance
  },
}

syngen.mixer.reverb.gainModel.bell = syngen.mixer.reverb.gainModel.base.extend({
  defaults: {
    bellPower: 0.75,
    distancePower: 2,
  },
  calculate: function (distance) {
    const gain = Math.min(1 / (distance ** this.options.distancePower), syngen.fn.fromDb(-1))
    return syngen.fn.clamp((gain ** this.options.bellPower) * (1 - (gain ** this.options.bellPower)), syngen.const.zeroGain, 1)
  },
})

syngen.mixer.reverb.gainModel.normalize = syngen.mixer.reverb.gainModel.base.extend({
  defaults: {
    gain: 1,
  },
  calculate: function () {
    return this.options.gain
  },
})

// TODO: Support prioritization / customizable intervals
syngen.ephemera = (() => {
  const ephemera = new Set(),
    interval = 60

  let timer

  resetTimer()

  function resetManaged() {
    for (const ephemeral of ephemera) {
      resetManagedItem(ephemera)
    }
  }

  function resetManagedItem(ephemeral) {
    if (ephemeral.clear) {
      ephemeral.clear()
    } else if (ephemeral.reset) {
      ephemeral.reset()
    }
  }

  function resetTimer() {
    timer = interval
  }

  return {
    add: function (ephemeral) {
      if (!ephemeral || (!ephemeral.clear && !ephemeral.reset)) {
        return this
      }

      ephemera.add(ephemeral)

      return this
    },
    remove: function (ephemeral, reset = true) {
      ephemera.delete(ephemeral)

      if (reset) {
        resetManagedItem(ephemeral)
      }

      return this
    },
    reset: function () {
      resetManaged()
      resetTimer()

      return this
    },
    update: function (delta) {
      timer -= delta

      if (timer <= 0) {
        this.reset()
      }

      return this
    },
  }
})()

syngen.loop.on('frame', ({delta, paused}) => {
  if (paused) {
    return
  }

  syngen.ephemera.update(delta)
})

syngen.state.on('reset', () => syngen.ephemera.reset())

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
    update: function ({
      delta
    } = {}) {
      deltas[index] = delta

      if (index < maxFrames - 1) {
        index += 1
      } else {
        index = 0
      }

      const sortedDeltas = deltas.slice().sort()

      medianDelta = syngen.fn.choose(sortedDeltas, 0.5)
      medianFps = 1 / medianDelta

      return this
    },
  }
})()

syngen.loop.on('frame', (e) => syngen.performance.update(e))

/**
 * Maintains the coordinates and orientation of the listener.
 * @namespace
 */
syngen.position = (() => {
  const quaternion = syngen.tool.quaternion.identity(),
    vector = syngen.tool.vector3d.create()

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
        w: quaternion.w,
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
      },
      x: vector.x,
      y: vector.y,
      z: vector.z,
    }),
    /**
     * Returns the orientation.
     * Beware that this is less performant than using quaternions and can result in gimbal lock.
     * @memberof syngen.position
     * @returns {syngen.utility.euler}
     */
    getEuler: () => syngen.tool.euler.fromQuaternion(quaternion),
    /**
     * Returns the oriantation.
     * @memberof syngen.position
     * @returns {syngen.utility.quaternion}
     */
    getQuaternion: () => quaternion.clone(),
    /**
     * Returns the coordinates.
     * @memberof syngen.position
     * @returns {syngen.utility.vector3d}
     */
    getVector: () => vector.clone(),
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
      quaternion: nextQuaternion = syngen.tool.quaternion.identity(),
      x = 0,
      y = 0,
      z = 0,
    } = {}) {
      vector.x = x
      vector.y = y
      vector.z = z

      quaternion.set(nextQuaternion)

      return this
    },
    /**
     * Resets all attributes to zero.
     * @listens syngen.state#event:reset
     * @memberof syngen.position
     */
    reset: function () {
      this.setQuaternion()
      this.setVector()

      return this.import()
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
      return this.setQuaternion(
        syngen.tool.quaternion.fromEuler({
          pitch,
          roll,
          yaw,
        })
      )
    },
    /**
     * Sets the orientation
     * @memberof syngen.position
     * @param {syngen.utility.quaternion} [options]
     */
    setQuaternion: function ({
      w = 1,
      x = 0,
      y = 0,
      z = 0,
    } = {}) {
      quaternion.w = w
      quaternion.x = x
      quaternion.y = y
      quaternion.z = z

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
      vector.x = x
      vector.y = y
      vector.z = z

      return this
    },
  }
})()

syngen.state.on('export', (data = {}) => data.position = syngen.position.export())
syngen.state.on('import', (data = {}) => syngen.position.import(data.position))
syngen.state.on('reset', () => syngen.position.reset())

/**
 * Provides a wrapper for the seed value.
 * The seed primarily influences {@link syngen.fn.srand()} as well as any other systems and utilities that rely on it.
 * It can be randomized to deliver unique experiences.
 * @namespace
 */
syngen.seed = (() => {
  const separator = '~'

  let seed

  return {
    /**
     * Concatenates variadic `seeds` with a separator.
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
 * Provides a variety of curves and curve generators that can be used with `WaveShaperNode`s.
 * @namespace
 */
syngen.shape = (() => {
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
    noise2 = createNoise(syngen.fn.fromDb(-3)),
    noise4 = createNoise(syngen.fn.fromDb(-6)),
    noise8 = createNoise(syngen.fn.fromDb(-9)),
    noise16 = createNoise(syngen.fn.fromDb(-12)),
    noise32 = createNoise(syngen.fn.fromDb(-15)),
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
   * @memberof syngen.shape
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
   * @memberof syngen.shape
   * @param {Number} [gain=1]
   * @param {Number} [samples=2**16]
   * @returns {Float32Array}
   */
  function createNoise(gain = 1, samples = 2 ** 16) {
    const shape = new Float32Array(samples),
      srand = syngen.fn.srand('syngen.shape.createNoise', gain)

    const noise = () => srand(-gain, gain),
      y = (x) => syngen.fn.wrapAlternate(x + noise(), 0, 2) - 1

    for (let i = 0; i < shape.length; i += 1) {
      const x = i * 2 / (samples - 1)
      shape[i] = y(x)
    }

    shape[samples - 1] = y(2)

    return shape
  }

  /**
   * Generates a curve having random `steps` with `seed`.
   * @memberof syngen.shape
   * @param {Number} [steps=3]
   * @param {String} [seed]
   * @returns {Float32Array}
   */
  function createRandom(steps = 2, seed = '') {
    const shape = new Float32Array(samples),
      srand = syngen.fn.srand('syngen.shape.createRandom', seed)

    for (let i = 0; i < steps; i += 1) {
      shape[i] = srand(-1, 1)
    }

    return shape
  }

  /**
   * Generates a sigmoid curve with `amount` in radians of `samples` length.
   * Smaller values tend to be warmer, whereas larger values tend to be more distorted.
   * @memberof syngen.shape
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
   * @memberof syngen.shape
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
   * @memberof syngen.shape
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
     * Generates a curve that applies `constant`.
     * @memberof syngen.shape
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
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    crush12: () => crush12,
    /**
     * Applies a 4-bit resolution.
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    crush4: () => crush4,
    /**
     * Applies a 6-bit resolution.
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    crush6: () => crush6,
    /**
     * Applies an 8-bit resolution.
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    crush8: () => crush8,
    /**
     * Applies a heavy overdrive.
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    distort: () => distort,
    /**
     * Applies dither, or -96 decibels of noise.
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    dither: () => dither,
    /**
     * A double tuple.
     * The result of `{@link syngen.shape.createTuple|syngen.shape.createTuple(2)}`
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    double: () => double,
    /**
     * A double pulse tuple.
     * The result of `{@link syngen.shape.createTuplePulse|syngen.shape.createTuplePulse(2)}`
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    doublePulse: () => doublePulse,
    /**
     * Returns an equal-power fade-in curve.
     * This is useful
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    equalFadeIn: () => equalFadeIn,
    /**
     * Returns an equal-power fade-out curve.
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    equalFadeOut: () => equalFadeOut,
    /**
     * Applies a moderate overdrive.
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    hot: () => hot,
    /**
     * Inverts a signal.
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    invert: () => invert,
    /**
     * Returns an inverted copy of `shape`.
     * @memberof syngen.shape
     * @param {}
     * @returns {Float32Array}
     */
    invertShape: (shape) => shape.map((value) => -value),
    /**
     * Identity curve resulting in no shaping.
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    linear: () => linear,
    /**
     * Noise curve with 0 decibels of noise.
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    noise: () => noise,
    /**
     * Applies -3 decibels of noise.
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    noise2: () => noise2,
    /**
     * Applies -6 decibels of noise.
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    noise4: () => noise4,
    /**
     * Applies -9 decibels of noise.
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    noise8: () => noise8,
    /**
     * Applies -12 decibels of noise.
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    noise16: () => noise16,
    /**
     * Applies -15 decibels of noise.
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    noise32: () => noise32,
    /**
     * Applies a constant `offset` to a copy of `shape`.
     * @memberof syngen.shape
     * @param {Float32Array} shape
     * @param {Number} [offset=0]
     * @returns {Float32Array}
     */
    offsetShape: (shape, offset = 0) => shape.map((value) => value + offset),
    /**
     * Always one.
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    one: () => one,
    /**
     * Omits troughs so only positive values are audible.
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    pulse: () => pulse,
    /**
     * Returns a copy of `shape` with troughs set to zero.
     * @memberof syngen.shape
     * @param {Float32Array} shape
     * @returns {Float32Array}
     */
    pulseShape: (shape) => shape.map((value) => value > 0 ? value : 0),
    /**
     * Rectifies a signal so it's always positive.
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    rectify: () => rectify,
    /**
     * Returns a rectified copy of `shape`.
     * @memberof syngen.shape
     * @param {Float32Array} shape
     * @returns {Float32Array}
     */
    rectifyShape: (shape) => shape.map(Math.abs),
    /**
     * Returns a reversed copy of `shape`.
     * @memberof syngen.shape
     * @param {Float32Array} shape
     * @returns {Float32Array}
     */
    reverseShape: (shape) => shape.slice().reverse(),
    /**
     * Applies a hard threshold where values round to -1 or 1.
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    square: () => square,
    /**
     * A triple tuple.
     * The result of `{@link syngen.shape.createTuple|syngen.shape.createTuple(3)}`
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    triple: () => triple,
    /**
     * A triple pulse tuple.
     * The result of `{@link syngen.shape.createTuplePulse|syngen.shape.createTuplePulse(3)}`
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    triplePulse: () => triplePulse,
    /**
     * Applies a slight overdrive
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    warm: () => warm,
    /**
     * Always zero.
     * @memberof syngen.shape
     * @returns {Float32Array}
     */
    zero: () => zero,
  }
})()

syngen.sound = {
  // Attributes
  destination: syngen.mixer.input(),
  fadeInDuration: syngen.const.zeroTime,
  fadeOutDuration: syngen.const.zeroTime,
  filterModel: syngen.ear.filterModel.head,
  gainModel: syngen.ear.gainModel.exponential,
  radius: 0,
  relative: false, // whether coordinate space is relative (true) or global (false)
  reverb: false, // whether to use a reverb send
  reverbGainModel: syngen.mixer.reverb.gainModel.bell,
  // Static methods
  extend: function (definition) {
    return syngen.fn.extend(this, definition)
  },
  instantiate: function (options, ...args) {
    return Object.create(this).construct(options, ...args)
  },
  // Instance methods
  construct: function ({
    destination = this.destination,
    fadeInDuration = this.fadeInDuration,
    fadeOutDuration = this.fadeOutDuration,
    filterModel = this.filterModel,
    gainModel = this.gainModel,
    radius = this.radius,
    relative = this.relative,
    reverb = this.reverb,
    reverbGainModel = this.reverbGainModel,
    x = 0,
    y = 0,
    z = 0,
    ...options
  } = {}, ...args) {
    const context = syngen.context()

    // Allow instances to override inherited properties
    this.destination = destination
    this.fadeInDuration = fadeInDuration
    this.fadeOutDuration = fadeOutDuration
    this.filterModel = filterModel.instantiate()
    this.gainModel = gainModel.instantiate()
    this.radius = radius
    this.relative = relative
    this.reverb = reverb

    // Set position in space
    this.vector = syngen.tool.vector3d.create({
      x,
      y,
      z,
    })

    const relativeVector = this.getRelativeVector()

    // Routing
    this.output = context.createGain()

    this.binaural = syngen.ear.binaural.create({
      filterModel: this.filterModel,
      gainModel: this.gainModel,
      ...relativeVector,
    }).from(this.output).to(destination)

    if (this.reverb) {
      this.reverb = syngen.mixer.reverb.send.create({
        gainModel: reverbGainModel,
        ...relativeVector,
      }).from(this.output)
    }

    // Fade gain in
    this.output.gain.value = syngen.const.zeroGain
    syngen.fn.rampLinear(this.output.gain, 1, this.fadeInDuration)

    // Start updating each frame
    this.update = this.update.bind(this)
    syngen.loop.on('frame', this.update)

    // Tell extending sounds that we're done here
    this.onConstruct(options, ...args)

    return this
  },
  destroy: function () {
    // Stop update each frame
    syngen.loop.off('frame', this.update)

    // Fade gain out
    syngen.fn.rampLinear(this.output.gain, syngen.const.zeroGain, this.fadeOutDuration)

    // Teardown after fade
    syngen.fn.promise(this.fadeOutDuration * 1000).then(() => {
      this.output.disconnect()
      this.binaural.destroy()

      if (this.reverb) {
        this.reverb.destroy()
      }

      // Tell extending sounds that we're done here
      this.onDestroy()
    })

    return this
  },
  getRelativeVector: function () {
    // If coordinate space is already relative, just subtract the radius
    if (this.relative) {
      return this.vector.subtractRadius(this.radius)
    }

    // Otherwise transform global space to relative to syngen.position
    return this.vector
      .subtract(syngen.position.getVector())
      .subtractRadius(this.radius)
      .rotateQuaternion(syngen.position.getQuaternion().conjugate())
  },
  getVector: function () {
    return this.vector.clone()
  },
  setVector: function ({
    x = 0,
    y = 0,
    z = 0,
  }) {
    this.vector = syngen.tool.vector3d.create({
      x,
      y,
      z,
    })

    return this
  },
  update: function (...args) {
    // Allow user changes to vector before committing
    this.onUpdate(...args)

    // Update sends
    const relativeVector = this.getRelativeVector()

    this.binaural.update(relativeVector)

    if (this.reverb) {
      this.reverb.update(relativeVector)
    }

    return this
  },
  // Lifecycle hooks
  onConstruct: () => {},
  onDestroy: () => {},
  onUpdate: () => {},
}

/**
 * Provides factories for building simple prefabricated synthesizers.
 * Importantly, these are _not_ the only way to generate audio with syngen.
 * Implementations can build their own synthesizers or use any external library that supports connecting to its audio graph.
 * @namespace
 */
syngen.synth = {}

/**
 * A prefabricated synth returned from a {@link syngen.synth} factory method.
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
 * @typedef {Object} syngen.synth~Synth
 */
syngen.synth.prototype = {
  assign: function (...args) {
    return syngen.synth.fn.assign(this, ...args)
  },
  chain: function (...args) {
    return syngen.synth.fn.chain(this, ...args)
  },
  chainAssign: function (...args) {
    return syngen.synth.fn.chainAssign(this, ...args)
  },
  chainStop: function (...args) {
    return syngen.synth.fn.chainStop(this, ...args)
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
    return syngen.synth.fn.filtered(this, ...args)
  },
  shaped: function (...args) {
    return syngen.synth.fn.shaped(this, ...args)
  },
}

/**
 * A plugin compatible with synth chaining.
 * Typically returned from a {@link syngen.effect} or {@link syngen.formant} factory method.
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
 * @typedef {Object} syngen.synth~Plugin
 */

/**
 * Creates a `GainNode` that inverts a signal with `scale`.
 * @param {Object} [options={}]
 * @param {AudioNode|AudioParam} [options.from]
 * @param {Number} [options.scale=1]
 * @param {AudioNode|AudioParam} [options.to]
 * @returns {GainNode}
 * @static
 */
syngen.circuit.invert = ({
  from,
  scale = 1,
  to,
} = {}) => {
  const context = syngen.context(),
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
 * @param {syngen.synth~Synth} [options.chainStop]
 * @param {AudioNode|AudioParam} [options.from]
 *  Typically a `ConstantSourceNode`.
 * @param {Number} [options.max=1]
 * @param {Number} [options.min=0]
 * @param {AudioNode|AudioParam} [options.to]
 *  Typically an `AudioParam`.
 * @returns {Object}
 * @static
 */
syngen.circuit.lerp = ({
  chainStop,
  from,
  max: maxValue = 1,
  min: minValue = 0,
  to,
  when,
} = {}) => {
  const context = syngen.context()

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
    stop: (when = syngen.time()) => {
      max.stop(when)
      min.stop(when)
      return this
    },
  }

  if (chainStop) {
    syngen.synth.chainStop(chainStop, wrapper)
  }

  return wrapper
}

/**
 * Creates a circuit that scales an input signal linearly within `[fromMin, fromMax]` to `[toMin, toMax]`.
 * Beware that it leverages `ConstantSourceNode`s.
 * Pass a `chainStop` or call the returned `stop` method to free resources when no longer in use.
 * @param {Object} [options={}]
 * @param {syngen.synth~Synth} [options.chainStop]
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
syngen.circuit.scale = ({
  chainStop,
  from,
  fromMax = 1,
  fromMin = 0,
  to,
  toMax = 1,
  toMin = 0,
  when,
} = {}) => {
  const context = syngen.context()

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
  const lerp = syngen.circuit.lerp({
    from: scale,
    max: toMax,
    min: toMin,
    to,
    when,
  })

  const wrapper = {
    stop: (when = syngen.time()) => {
      lerp.stop(when)
      offset.stop(when)
      return this
    },
  }

  if (chainStop) {
    syngen.synth.chainStop(chainStop, wrapper)
  }

  return wrapper
}

/**
 * Provides an interface for binaural audio processing.
 * Typical use involves sending it a monophonic signal for processing and then routing its output to a bus.
 * This interface is mainly a wrapper for two {@link syngen.ear.monaural|monaural} processors.
 * @interface
 * @todo Document private members
 */
syngen.ear.binaural = {}

/**
 * Instantiates a new binaural processor.
 * @param {Object} [options]
 * @param {Number} [options.x=0]
 * @param {Number} [options.y=0]
 * @param {Number} [options.z=0]
 * @returns {syngen.ear.binaural}
 * @static
 */
syngen.ear.binaural.create = function (options) {
  return Object.create(this.prototype).construct(options)
}

syngen.ear.binaural.prototype = {
  defaults: {
    headWidth: 0.1524, // meters
    stereoWidth: Math.PI / 4, // radians
  },
  /**
   * Initializes the binaural processor.
   * @instance
   * @private
   */
  construct: function ({
    filterModel = syngen.ear.filterModel.head,
    gainModel = syngen.ear.gainModel.exponential,
    headWidth = this.defaults.headWidth,
    stereoWidth = this.defaults.stereoWidth,
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    const context = syngen.context()

    this.options = {
      headWidth,
      stereoWidth,
    }

    this.left = syngen.ear.monaural.create({
      filterModel,
      gainModel,
    })

    this.right = syngen.ear.monaural.create({
      filterModel,
      gainModel,
    })

    this.merger = context.createChannelMerger()
    this.left.to(this.merger, 0, 0)
    this.right.to(this.merger, 0, 1)

    this.update({
      x,
      y,
      z,
    })

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
   * @param {syngen.tool.vector3d} relative
   */
  update: function (relative = {}) {
    if (!syngen.tool.vector3d.prototype.isPrototypeOf(relative)) {
      relative = syngen.tool.vector3d.create(relative)
    }

    this.left.update({
      normal: syngen.tool.vector3d.create(
        syngen.tool.vector2d.unitX().rotate(
          this.options.stereoWidth
        )
      ),
      relative: relative.add({
        y: -this.options.headWidth / 2,
      }),
    })

    this.right.update({
      normal: syngen.tool.vector3d.create(
        syngen.tool.vector2d.unitX().rotate(
          -this.options.stereoWidth
        )
      ),
      relative: relative.add({
        y: this.options.headWidth / 2,
      }),
    })

    return this
  },
}

/**
 * Provides an interface for processing audio as an observer in a physical space.
 * Importantly, it models interaural intensity differences, interaural arrival time, and acoustic shadow.
 * @interface
 * @todo Document private members
 */
syngen.ear.monaural = {}

/**
 * Instantiates a monaural processor.
 * @param {Object} [options={}]
 * @param {Number} [options.pan=0]
 *   Between `[-1, 1]` representing hard-left to hard-right.
 * @returns {syngen.ear.monaural}
 * @static
 */
syngen.ear.monaural.create = function (options) {
  return Object.create(this.prototype).construct(options)
}

syngen.ear.monaural.prototype = {
  defaults: {
    confusionRadius: 1,
  },
  /**
   * Initializes the instance.
   * @instance
   * @private
   */
  construct: function ({
    confusionRadius = this.defaults.confusionRadius,
    filterModel = syngen.ear.filterModel.head,
    gainModel = syngen.ear.gainModel.realistic,
  } = {}) {
    const context = syngen.context()

    this.options = {
      confusionRadius,
    }

    this.filterModel = filterModel
    this.gainModel = gainModel

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
   * @todo Document parameters
   */
  update: function ({
    normal = syngen.tool.vector3d.create(),
    relative = syngen.tool.vector3d.create(),
  } = {}) {
    const distance = relative.distance()

    if (distance > 1) {
      relative = relative.scale(1 / distance)
    }

    // Calculate dot product, with a unit sphere of confusion
    // Dot product of two normalized vectors is [-1, 1]
    const dotProduct = syngen.fn.lerp(1, relative.dotProduct(normal), syngen.fn.clamp(distance / this.options.confusionRadius))

    const delayTime = syngen.fn.clamp(distance / syngen.const.speedOfSound, syngen.const.zeroTime, 1),
      filterFrequency = this.filterModel.calculate(dotProduct),
      inputGain = this.gainModel.calculate(distance)

    syngen.fn.setParam(this.delay.delayTime, delayTime)
    syngen.fn.setParam(this.filter.frequency, filterFrequency)
    syngen.fn.setParam(this.gain.gain, inputGain)

    return this
  },
}

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
 * @returns {syngen.synth~Plugin}
 * @static
 */
syngen.effect.dubDelay = function ({
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
  const context = syngen.context()

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
 * @returns {syngen.synth~Plugin}
 * @static
 */
syngen.effect.feedbackDelay = ({
  delay: delayAmount = 0.5,
  dry: dryAmount = 1,
  feedback: feedbackAmount = 0.5,
  maxDelayTime = 1,
  wet: wetAmount = 0.5,
} = {}) => {
  const context = syngen.context()

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
 * @returns {syngen.synth~Plugin}
 * @static
 */
syngen.effect.multitapDelay = ({
  dry: dryAmount = 1,
  tap: tapParams = [],
  wet: wetAmount = 0.5,
} = {}) => {
  const context = syngen.context(),
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

/**
 * Creates a feedback delay line that bounces between stereo channels.
 * @param {Object} [options={}]
 * @param {Number} [options.delay=0.5]
 * @param {Number} [options.dry=1]
 * @param {Number} [options.feedback=0.5]
 * @param {Number} [options.maxDelayTime=1]
 * @param {Number} [options.wet=0.5]
 * @returns {syngen.synth~Plugin}
 * @static
 */
syngen.effect.pingPongDelay = function ({
  delay: delayAmount = 0.5,
  dry: dryAmount = 1,
  feedback: feedbackAmount = 0.5,
  maxDelayTime = 1,
  wet: wetAmount = 0.5,
} = {}) {
  const context = syngen.context()

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
 * @param {Float32Array} [options.curve={@link syngen.shape.warm|syngen.shape.warm()}]
 * @param {Number} [options.dry=1]
 * @param {Number} [options.preGain=1]
 * @param {Number} [options.wet=1]
 * @returns {syngen.synth~Plugin}
 * @see syngen.shape
 * @static
 */
syngen.effect.shaper = ({
  curve = syngen.shape.warm(),
  dry: dryAmount = 0,
  preGain: preGainAmount = 1,
  wet: wetAmount = 1,
} = {}) => {
  const context = syngen.context(),
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
 * @param {syngen.formant~Plugin} [options.format0={@link syngen.formant.createU|syngen.formant.createU()}]
 * @param {syngen.formant~Plugin} [options.format1={@link syngen.formant.createA|syngen.formant.createA()}]
 * @param {Number} [options.mix=0.5]
 * @param {Number} [options.wet=1]
 * @returns {syngen.synth~Plugin}
 * @static
 */
syngen.effect.talkbox = ({
  dry: dryAmount = 0,
  formant0 = syngen.formant.createU(),
  formant1 = syngen.formant.createA(),
  mix: mixAmount = 0.5,
  wet: wetAmount = 1,
} = {}) => {
  const context = syngen.context(),
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
    stop: function (when = syngen.time()) {
      mix.stop(when)
      return this
    },
  }
}

/**
 * Returns a formant definition for the vowel A.
 * @returns {syngen.formant~Definition}
 * @static
 */
syngen.formant.a = () => [
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
 * Creates a formant effect for the vowel A.
 * @returns {syngen.synth~Plugin}
 * @static
 */
syngen.formant.createA = () => {
  return syngen.formant.create(
    syngen.formant.a()
  )
}

/**
 * Returns a formant definition for the vowel E.
 * @returns {syngen.formant~Definition}
 * @static
 */
syngen.formant.e = () => [
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
 * Creates a formant effect for the vowel E.
 * @returns {syngen.synth~Plugin}
 * @static
 */
syngen.formant.createE = () => {
  return syngen.formant.create(
    syngen.formant.e()
  )
}

/**
 * Returns a formant definition for the vowel I.
 * @returns {syngen.formant~Definition}
 * @static
 */
syngen.formant.i = () => [
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
 * Creates a formant effect for the vowel I.
 * @returns {syngen.synth~Plugin}
 * @static
 */
syngen.formant.createI = () => {
  return syngen.formant.create(
    syngen.formant.i()
  )
}

/**
 * Returns a formant definition for the vowel O.
 * @returns {syngen.formant~Definition}
 * @static
 */
syngen.formant.o = () => [
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
 * Creates a formant effect for the vowel O.
 * @returns {syngen.synth~Plugin}
 * @static
 */
syngen.formant.createO = () => {
  return syngen.formant.create(
    syngen.formant.o()
  )
}

/**
 * Returns a formant definition for the vowel U.
 * @returns {syngen.formant~Definition}
 * @static
 */
syngen.formant.u = () => [
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
 * Creates a formant effect for the vowel U.
 * @returns {syngen.synth~Plugin}
 * @static
 */
syngen.formant.createU = () => {
  return syngen.formant.create(
    syngen.formant.u()
  )
}

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
      ? Math.sign(value) * ratio
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

          state.axis[i] = syngen.fn.clamp(state.axis[i] + value, -1, 1) || 0
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

window.addEventListener('blur', (e) => {
  if (e.target === window) {
    syngen.input.keyboard.reset()
  }
})

/**
 * Exposes mouse movement, scrolling, and buttons pressed.
 * @namespace
 */
syngen.input.mouse = (() => {
  let memory = {
    moveX: 0,
    moveY: 0,
    wheelX: 0,
    wheelY: 0,
    wheelZ: 0,
  }

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
      memory = {
        moveX: 0,
        moveY: 0,
        wheelX: 0,
        wheelY: 0,
        wheelZ: 0,
      }

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
     * Decrements previous from current state values so they reflect only changes since last frame.
     * @listens syngen.loop#event:frame
     * @memberof syngen.input.mouse
     */
    update: function () {
      state.moveX -= memory.moveX
      state.moveY -= memory.moveY
      state.wheelX -= memory.wheelX
      state.wheelY -= memory.wheelY
      state.wheelZ -= memory.wheelZ

      memory = {
        moveX: state.moveX,
        moveY: state.moveY,
        wheelX: state.wheelX,
        wheelY: state.wheelY,
        wheelZ: state.wheelZ,
      }

      return this
    },
  }
})()

syngen.loop.on('frame', () => syngen.input.mouse.update())

/**
 * Records the output of the provided input and exports it as a WebM file.
 * When no duration is passed, the [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) _must_ be stopped to complete the export.
 * @param {Object} [options]
 * @param {Number} [options.duration=0]
 * @param {AudioNode} [options.input=syngen.mixer.output]
 * @param {String} [options.name=export.webm]
 * @returns {MediaRecorder}
 * @static
 */
syngen.mixer.export = ({
  duration = 0,
  input = syngen.mixer.output(),
  name = 'export.webm',
} = {}) => {
  if (!(input instanceof AudioNode)) {
    throw new Error('Input must be an AudioNode')
  }

  const context = syngen.context(),
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
 * @param {Number} [options.when={@link syngen.time|syngen.time()}]
 * @returns {syngen.synth~Synth}
 * @static
 */
syngen.synth.additive = ({
  detune = 0,
  frequency,
  gain = syngen.const.zeroGain,
  harmonic: harmonicParams = [],
  when = syngen.time(),
} = {}) => {
  const context = syngen.context()

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

  syngen.synth.fn.setAudioParams(
    [detuneConstant.offset, detune, when],
    [frequencyConstant.offset, frequency, when],
    [output.gain, gain, when],
  )

  return syngen.synth.fn.decorate({
    _chain: sum,
    output,
    param: {
      detune: detuneConstant.offset,
      frequency: frequencyConstant.offset,
      gain: output.gain,
      harmonic: harmonics.map((synth) => synth.param),
    },
    stop: function (when = syngen.time()) {
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
 * @param {Number} [options.when={@link syngen.time|syngen.time()}]
 * @returns {syngen.synth~Synth}
 * @static
 * @todo Leverage {@link syngen.synth.createLfo} internally
 */
syngen.synth.am = ({
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
  when = syngen.time(),
} = {}) => {
  const context = syngen.context()

  const carrierGain = context.createGain(),
    carrierOscillator = context.createOscillator(),
    modDepth = context.createGain(),
    modOscillator = context.createOscillator(),
    output = context.createGain()

  modWhen = modWhen || when

  carrierGain.connect(output)

  carrierOscillator.connect(carrierGain)
  carrierOscillator.type = carrierType
  carrierOscillator.start(when)

  modDepth.connect(carrierGain.gain)
  modOscillator.connect(modDepth)
  modOscillator.type = modType
  modOscillator.start(modWhen)

  syngen.synth.fn.setAudioParams(
    [carrierGain.gain, carrierGainAmount, when],
    [carrierOscillator.detune, carrierDetune, when],
    [carrierOscillator.frequency, carrierFrequency, when],
    [modDepth.gain, modDepthAmount, modWhen],
    [modOscillator.detune, modDetune, modWhen],
    [modOscillator.frequency, modFrequency, modWhen],
    [output.gain, gain, when],
  )

  return syngen.synth.fn.decorate({
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
    stop: function (when = syngen.time()) {
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
 * @param {Number} [options.when={@link syngen.time|syngen.time()}]
 * @returns {syngen.synth~Synth}
 * @static
 * @todo Leverage {@link syngen.synth.createLfo} internally
 */
syngen.synth.amBuffer = ({
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
  when = syngen.time(),
} = {}) => {
  const context = syngen.context()

  const carrierGain = context.createGain(),
    modDepth = context.createGain(),
    modOscillator = context.createOscillator(),
    output = context.createGain(),
    source = context.createBufferSource()

  modWhen = modWhen || when

  carrierGain.connect(output)

  source.buffer = buffer
  source.loop = loop
  source.connect(carrierGain)
  source.start(when, syngen.fn.randomFloat(0, buffer.length))

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

  syngen.synth.fn.setAudioParams(
    [carrierGain.gain, carrierGainAmount, when],
    [source.detune, detune, when],
    [source.playbackRate, playbackRate, when],
    [modDepth.gain, modDepthAmount, modWhen],
    [modOscillator.detune, modDetune, modWhen],
    [modOscillator.frequency, modFrequency, modWhen],
    [output.gain, gain, when],
  )

  return syngen.synth.fn.decorate({
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
    stop: function (when = syngen.time()) {
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
 * @param {Number} [options.when={@link syngen.time|syngen.time()}]
 * @returns {syngen.synth~Synth}
 * @static
 */
syngen.synth.buffer = ({
  buffer,
  detune = 0,
  gain = syngen.const.zeroGain,
  loop = true,
  loopEnd,
  loopStart,
  playbackRate = 1,
  when = syngen.time(),
} = {}) => {
  const context = syngen.context()

  const output = context.createGain(),
    source = context.createBufferSource()

  source.buffer = buffer
  source.loop = loop
  source.connect(output)
  source.start(when, syngen.fn.randomFloat(0, buffer.length))

  if (loop && loopEnd !== undefined) {
    source.loopEnd = loopEnd
  }

  if (loop && loopStart !== undefined) {
    source.loopStart = loopStart
  }

  syngen.synth.fn.setAudioParams(
    [source.detune, detune, when],
    [source.playbackRate, playbackRate, when],
    [output.gain, gain, when],
  )

  return syngen.synth.fn.decorate({
    _chain: source,
    output,
    param: {
      detune: source.detune,
      gain: output.gain,
      playbackRate: source.playbackRate,
    },
    source,
    stop: function (when = syngen.time()) {
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
 * @param {Number} [options.when={@link syngen.time|syngen.time()}]
 * @returns {syngen.synth~Synth}
 * @static
 * @todo Leverage {@link syngen.synth.createLfo} internally
 */
syngen.synth.fm = ({
  carrierDetune = 0,
  carrierFrequency,
  carrierType = 'sine',
  gain = syngen.const.zeroGain,
  modDepth: modDepthAmount = syngen.const.zeroGain,
  modDetune = 0,
  modFrequency,
  modType = 'sine',
  modWhen,
  when = syngen.time(),
} = {}) => {
  const context = syngen.context()

  const carrierOscillator = context.createOscillator(),
    modDepth = context.createGain(),
    modOscillator = context.createOscillator(),
    output = context.createGain()

  modWhen = modWhen || when

  carrierOscillator.connect(output)
  carrierOscillator.type = carrierType
  carrierOscillator.start(when)

  modDepth.connect(carrierOscillator.frequency)
  modOscillator.connect(modDepth)
  modOscillator.type = modType
  modOscillator.start(modWhen || when)

  syngen.synth.fn.setAudioParams(
    [carrierOscillator.detune, carrierDetune, when],
    [carrierOscillator.frequency, carrierFrequency, when],
    [modDepth.gain, modDepthAmount, modWhen],
    [modOscillator.detune, modDetune, modWhen],
    [modOscillator.frequency, modFrequency, modWhen],
    [output.gain, gain, when],
  )

  return syngen.synth.fn.decorate({
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
    stop: function (when = syngen.time()) {
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

/**
 * Creates a simple low-frequency oscillator intended for modulation.
 * This is identical to {@link |createSimple()} except with different terminology.
 * @param {Object} [options={}]
 * @param {Number} [options.depth={@link syngen.const.zeroGain}]
 * @param {Number} [options.detune=0]
 * @param {Number} [options.frequency=0]
 * @param {String} [options.type=sine]
 * @param {Number} [options.when={@link syngen.time|syngen.time()}]
 * @returns {syngen.synth~Synth}
 * @static
 */
syngen.synth.lfo = ({
  depth: depthAmount = syngen.const.zeroGain,
  detune = 0,
  frequency = 0,
  type = 'sine',
  when = syngen.time(),
} = {}) => {
  const context = syngen.context()

  const depth = context.createGain(),
    oscillator = context.createOscillator()

  oscillator.type = type
  oscillator.connect(depth)
  oscillator.start(when)

  syngen.synth.fn.setAudioParams(
    [depth.gain, depthAmount, when],
    [oscillator.detune, detune, when],
    [oscillator.frequency, frequency, when],
  )

  return syngen.synth.fn.decorate({
    _chain: oscillator,
    param: {
      depth: depth.gain,
      detune: oscillator.detune,
      frequency: oscillator.frequency,
    },
    output: depth,
    stop: function (when = syngen.time()) {
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
 * @param {Number} [options.when={@link syngen.time|syngen.time()}]
 * @returns {syngen.synth~Synth}
 * @static
 * @todo Leverage {@link syngen.synth.createLfo} internally
 */
syngen.synth.mod = ({
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
  when = syngen.time(),
} = {}) => {
  const context = syngen.context()

  const amodDepth = context.createGain(),
    amodOscillator = context.createOscillator(),
    carrierGain = context.createGain(),
    carrierOscillator = context.createOscillator(),
    fmodDepth = context.createGain(),
    fmodOscillator = context.createOscillator(),
    output = context.createGain()

  amodWhen = amodWhen || when
  fmodWhen = fmodWhen || when

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

  syngen.synth.fn.setAudioParams(
    [amodDepth.gain, amodDepthAmount, amodWhen],
    [amodOscillator.detune, amodDetune, amodWhen],
    [amodOscillator.frequency, amodFrequency, amodWhen],
    [carrierGain.gain, carrierGainAmount, when],
    [carrierOscillator.detune, carrierDetune, when],
    [carrierOscillator.frequency, carrierFrequency, when],
    [fmodDepth.gain, fmodDepthAmount, fmodWhen],
    [fmodOscillator.detune, fmodDetune, fmodWhen],
    [fmodOscillator.frequency, fmodFrequency, fmodWhen],
    [output.gain, gain, when],
  )

  return syngen.synth.fn.decorate({
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
    stop: function (when = syngen.time()) {
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
 * @param {Number} [options.when={@link syngen.time|syngen.time()}]
 * @param {Number} [options.width=0]
 * @returns {syngen.synth~Synth}
 * @static
 */
syngen.synth.pwm = ({
  detune = 0,
  frequency,
  gain = syngen.const.zeroGain,
  type = 'sine',
  when = syngen.time(),
  width: widthAmount = 0,
} = {}) => {
  const context = syngen.context(),
    facade = context.createGain(),
    oscillator = context.createOscillator(),
    output = context.createGain(),
    shaperOne = context.createWaveShaper(),
    shaperPulse = context.createWaveShaper(),
    width = context.createGain()

  oscillator.type = type
  shaperOne.curve = syngen.shape.one()
  shaperPulse.curve = syngen.shape.square()

  facade.connect(output)
  oscillator.connect(shaperOne)
  oscillator.connect(shaperPulse)
  shaperOne.connect(width)
  shaperPulse.connect(facade)
  width.connect(shaperPulse)

  oscillator.start(when)

  syngen.synth.fn.setAudioParams(
    [oscillator.detune, detune, when],
    [oscillator.frequency, frequency, when],
    [output.gain, gain, when],
    [width.gain, widthAmount, when],
  )

  return syngen.synth.fn.decorate({
    _chain: facade,
    output,
    param: {
      detune: oscillator.detune,
      frequency: oscillator.frequency,
      gain: output.gain,
      width: width.gain,
    },
    stop: function (when = syngen.time()) {
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
 * @param {Number} [options.when={@link syngen.time|syngen.time()}]
 * @returns {syngen.synth~Synth}
 * @static
 */
syngen.synth.simple = ({
  detune = 0,
  frequency,
  gain = syngen.const.zeroGain,
  type = 'sine',
  when = syngen.time(),
} = {}) => {
  const context = syngen.context()

  const oscillator = context.createOscillator(),
    output = context.createGain()

  oscillator.connect(output)
  oscillator.type = type
  oscillator.start(when)

  syngen.synth.fn.setAudioParams(
    [oscillator.detune, detune, when],
    [oscillator.frequency, frequency, when],
    [output.gain, gain, when],
  )

  return syngen.synth.fn.decorate({
    _chain: oscillator,
    output,
    param: {
      detune: oscillator.detune,
      frequency: oscillator.frequency,
      gain: output.gain,
    },
    stop: function (when = syngen.time()) {
      oscillator.onended = () => {
        output.disconnect()
      }

      oscillator.stop(when)

      return this
    },
  })
}

/**
 * Provides an interface for routing audio to the global reverb auxiliary send.
 * Importantly, it models physical space to add pre-delay and attenuate based on distance.
 * @interface
 * @see syngen.mixer.reverb
 * @todo Document private members
 */
syngen.mixer.reverb.send = {}

/**
 * Creates a reverb send.
 * @param {Object} [options]
 * @param {Number} [options.x=0]
 * @param {Number} [options.y=0]
 * @param {Number} [options.z=0]
 * @returns {syngen.mixer.reverb.send}
 * @static
 */
syngen.mixer.reverb.send.create = function (options) {
  return Object.create(this.prototype).construct(options)
}

syngen.mixer.reverb.send.prototype = {
  /**
   * Initializes the instance.
   * @instance
   * @private
   */
  construct: function ({
    gainModel = syngen.mixer.reverb.gainModel.bell,
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    const context = syngen.context()

    this.delay = context.createDelay()
    this.gainModel = gainModel
    this.input = context.createGain()
    this.relative = syngen.tool.vector3d.create()
    this.send = syngen.mixer.reverb.createBus()

    this.send.gain.value = syngen.const.zeroGain

    this.onSendActivate = this.onSendActivate.bind(this)
    syngen.mixer.reverb.on('activate', this.onSendActivate)

    this.onSendDeactivate = this.onSendDeactivate.bind(this)
    syngen.mixer.reverb.on('deactivate', this.onSendDeactivate)

    if (syngen.mixer.reverb.isActive()) {
      this.onSendActivate()
    } else {
      this.onSendDeactivate()
    }

    this.update({
      x,
      y,
      z,
    })

    return this
  },
  /**
   * Prepares the instance for garbage collection.
   * Immediately disconnects from all inputs and outputs.
   * @instance
   */
  destroy: function () {
    syngen.mixer.reverb.off('activate', this.onSendActivate)
    syngen.mixer.reverb.off('deactivate', this.onSendDeactivate)
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
   * @listens syngen.mixer.reverb#event:activate
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
   * @listens syngen.mixer.reverb#event:activate
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

    if (!syngen.mixer.reverb.isActive()) {
      return this
    }

    const distance = this.relative.distance()

    const delayTime = syngen.fn.clamp(distance / syngen.const.speedOfSound, syngen.const.zeroTime, 1),
      gain = this.gainModel.calculate(distance)

    syngen.fn.setParam(this.delay.delayTime, delayTime)
    syngen.fn.setParam(this.send.gain, gain)

    return this
  },
}
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
