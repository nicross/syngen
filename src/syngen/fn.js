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
  audioParam.value = audioParam.value
  audioParam.cancelScheduledValues(0)
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