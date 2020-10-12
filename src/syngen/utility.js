/**
 * @namespace
 */
syngen.utility = {}

/**
 * @static
 */
syngen.utility.addInterval = (frequency, interval) => frequency * (2 ** interval)

/**
 * @static
 */
syngen.utility.between = (value, min, max) => value >= min && value <= max

/**
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
 * @static
 */
syngen.utility.choose = (options = [], value = 0) => {
  value = syngen.utility.clamp(value, 0, 1)

  const index = Math.round(value * (options.length - 1))
  return options[index]
}

/**
 * @static
 */
syngen.utility.chooseSplice = (options = [], value = 0) => {
  // NOTE: Mutates options
  value = syngen.utility.clamp(value, 0, 1)

  const index = Math.round(value * (options.length - 1))
  return options.splice(index, 1)[0]
}

/**
 * @static
 */
syngen.utility.chooseWeighted = (options = [], value = 0) => {
  // SEE: https://medium.com/@peterkellyonline/weighted-random-selection-3ff222917eb6
  value = syngen.utility.clamp(value, 0, 1)

  const totalWeight = options.reduce((total, option) => {
    return total + option.weight
  }, 0)

  let weight = value * totalWeight

  for (const option of options) {
    weight -= option.weight

    if (weight <= 0) {
      return option
    }
  }
}

/**
 * @static
 */
syngen.utility.clamp = (x, min, max) => {
  if (x > max) {
    return max
  }

  if (x < min) {
    return min
  }

  return x
}

/**
 * @static
 */
syngen.utility.closer = (x, a, b) => {
  return Math.abs(x - a) <= Math.abs(x - b) ? a : b
}

/**
 * @static
 */
syngen.utility.closest = function (x, bag) {
  // TODO: This could be improved with a version for sorted arrays
  return bag.reduce((closest, value) => syngen.utility.closer(x, closest, value))
}

/**
 * @static
 */
syngen.utility.createPerlinWithOctaves = (type, seed, octaves = 2) => {
  const compensation = 1 / (1 - (2 ** -octaves)),
    perlins = []

  if (Array.isArray(seed)) {
    seed = seed.join(syngen.const.seedSeparator)
  }

  for (let i = 0; i < octaves; i += 1) {
    perlins.push(
      type.create(seed, 'octave', i)
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
 * @static
 */
syngen.utility.degreesToRadians = (degrees) => degrees * Math.PI / 180

/**
 * @static
 */
syngen.utility.detune = (f, cents = 0) => f * (2 ** (cents / 1200))

/**
 * @static
 */
syngen.utility.distance = (a, b) => Math.sqrt(syngen.utility.distance2(a, b))

/**
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
 * @static
 */
syngen.utility.distanceToPower = (distance) => {
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
 * @static
 */
syngen.utility.frequencyToMidi = (frequency) => (Math.log2(frequency / syngen.const.midiReferenceFrequency) * 12) + syngen.const.midiReferenceNote

/**
 * @static
 */
syngen.utility.fromDb = (value) => 10 ** (value / 10)

/**
 * @static
 */
syngen.utility.hash = (value) => {
  // SEE: https://en.wikipedia.org/wiki/Jenkins_hash_function
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
 * @static
 */
syngen.utility.humanize = (value = 1, amount = 0) => {
  return value + syngen.utility.random.float(-amount, amount)
}

/**
 * @static
 */
syngen.utility.humanizeDb = (value = 1, db = 0) => {
  const gain = syngen.utility.fromDb(db)
  return value * syngen.utility.random.float(1 - gain, 1 + gain)
}

/**
 * @static
 */
syngen.utility.intersects = (a, b) => {
  const between = syngen.utility.between

  const xOverlap = between(a.x, b.x, b.x + b.width)
    || between(b.x, a.x, a.x + a.width)

  const yOverlap = between(a.y, b.y, b.y + b.height)
    || between(b.y, a.y, a.y + a.height)

  const zOverlap = between(a.z, b.z, b.z + b.depth)
    || between(b.z, a.z, a.z + a.depth)

  return xOverlap && yOverlap && zOverlap
}

/**
 * @static
 */
syngen.utility.lerp = (min, max, value) => (min * (1 - value)) + (max * value)

/**
 * @static
 */
syngen.utility.lerpExp = (min, max, value, power = 2) => {
  return syngen.utility.lerp(min, max, value ** power)
}

/**
 * @static
 */
syngen.utility.lerpExpRandom = ([lowMin, lowMax], [highMin, highMax], value, power) => {
  return syngen.utility.random.float(
    syngen.utility.lerpExp(lowMin, highMin, value, power),
    syngen.utility.lerpExp(lowMax, highMax, value, power),
  )
}

/**
 * @static
 */
syngen.utility.lerpLog = (min, max, value, base = 2) => {
  value *= base - 1
  return syngen.utility.lerp(min, max, Math.log(1 + value) / Math.log(base))
}

/**
 * @static
 */
syngen.utility.lerpLogRandom = ([lowMin, lowMax], [highMin, highMax], value) => {
  return syngen.utility.random.float(
    syngen.utility.lerpLog(lowMin, highMin, value),
    syngen.utility.lerpLog(lowMax, highMax, value),
  )
}

/**
 * @static
 */
syngen.utility.lerpLogi = (min, max, value, base) => {
  // Equivalent to syngen.utility.lerpLog(min, max, value, 1 / base)
  return syngen.utility.lerpLog(max, min, 1 - value, base)
}

/**
 * @static
 */
syngen.utility.lerpLogiRandom = ([lowMin, lowMax], [highMin, highMax], value) => {
  return syngen.utility.random.float(
    syngen.utility.lerpLogi(lowMin, highMin, value),
    syngen.utility.lerpLogi(lowMax, highMax, value),
  )
}

/**
 * @static
 */
syngen.utility.lerpRandom = ([lowMin, lowMax], [highMin, highMax], value) => {
  return syngen.utility.random.float(
    syngen.utility.lerp(lowMin, highMin, value),
    syngen.utility.lerp(lowMax, highMax, value),
  )
}

/**
 * @static
 */
syngen.utility.midiToFrequency = (note) => {
  return syngen.const.midiReferenceFrequency * Math.pow(2, (note - syngen.const.midiReferenceNote) / 12)
}

/**
 * @static
 */
syngen.utility.normalizeAngle = (angle) => {
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
 * @static
 */
syngen.utility.quadratic = (a, b, c) => {
  return [
    (-1 * b + Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a),
    (-1 * b - Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a),
  ]
}

/**
 * @static
 */
syngen.utility.radiansToDegrees = (radians) => radians * 180 / Math.PI

/**
 * @static
 */
syngen.utility.regularPolygonInteriorAngle = (sides) => (sides - 2) * Math.PI / sides

/**
 * @static
 */
syngen.utility.round = (x, precision = 0) => {
  precision = 10 ** precision
  return Math.round(x * precision) / precision
}

syngen.utility.rotatePoint = (x, y, theta) => ({
  x: (x * Math.cos(theta)) + (y * Math.sin(theta)),
  y: (y * Math.cos(theta)) - (x * Math.sin(theta)),
})

/**
 * @static
 */
syngen.utility.scale = (value, min, max, a, b) => ((b - a) * (value - min) / (max - min)) + a

/**
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
 * @static
 */
syngen.utility.sign = (value) => value >= 0 ? 1 : -1

// SEE: https://stackoverflow.com/a/47593316
// SEE: https://github.com/micro-js/srand
// SEE: https://en.wikipedia.org/wiki/Linear_congruential_generator
/**
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

  return (min = 0, max = 1) => {
    seed = rotate(seed)
    return min + ((seed / modulus) * (max - min))
  }
}

/**
 * @static
 */
syngen.utility.toCents = (f1, f2) => (f2 - f1) / f1 * 1200

/**
 * @static
 */
syngen.utility.toDb = (value) => 10 * Math.log10(value)

/**
 * @static
 */
syngen.utility.toSubFrequency = (frequency, sub = syngen.const.subFrequency) => {
  while (frequency > sub) {
    frequency /= 2
  }

  while (frequency < syngen.const.minFrequency) {
    frequency *= 2
  }

  return frequency
}

/**
 * @static
 */
syngen.utility.uuid = () => {
  // SEE: https://stackoverflow.com/a/2117523
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}

/**
 * @static
 */
syngen.utility.wrap = (value, min = 0, max = 1) => {
  // Treats min and max as the same value, e.g. [min, max)
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
 * @static
 */
syngen.utility.wrapAlternate = (value, min = 0, max = 1) => {
  // Scales values to an oscillation between [min, max]
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
