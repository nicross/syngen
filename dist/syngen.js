/*! syngen v0.1.0 */
(() => {
'use strict'

const syngen = (() => {
  const ready = new Promise((resolve) => {
    document.addEventListener('DOMContentLoaded', resolve)
  })

  return {
    input: {},
    prop: {},
    ready: (callback) => {
      return typeof callback == 'function'
        ? ready.then(callback)
        : ready
    },
    utility: {},
  }
})()

syngen.utility.addInterval = (frequency, interval) => frequency * (2 ** interval)

syngen.utility.between = (value, min, max) => value >= min && value <= max

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

  return {
    x: xSum / vectors.length,
    y: ySum / vectors.length,
    z: zSum / vectors.length,
  }
}

syngen.utility.choose = (options = [], value = 0) => {
  value = syngen.utility.clamp(value, 0, 1)

  const index = Math.round(value * (options.length - 1))
  return options[index]
}

syngen.utility.chooseSplice = (options = [], value = 0) => {
  // NOTE: Mutates options
  value = syngen.utility.clamp(value, 0, 1)

  const index = Math.round(value * (options.length - 1))
  return options.splice(index, 1)[0]
}

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

syngen.utility.clamp = (x, min, max) => {
  if (x > max) {
    return max
  }

  if (x < min) {
    return min
  }

  return x
}

syngen.utility.closer = (x, a, b) => {
  return Math.abs(x - a) <= Math.abs(x - b) ? a : b
}

syngen.utility.closest = function (x, bag) {
  // TODO: This could be improved with a version for sorted arrays
  return bag.reduce((closest, value) => syngen.utility.closer(x, closest, value))
}

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

syngen.utility.degreesToRadians = (degrees) => degrees * Math.PI / 180

syngen.utility.detune = (f, cents = 0) => f * (2 ** (cents / 1200))

syngen.utility.distance = (a, b) => Math.sqrt(syngen.utility.distance2(a, b))

syngen.utility.distance2 = ({
  x: x1 = 0,
  y: y1 = 0,
  z: z1 = 0,
} = {}, {
  x: x2 = 0,
  y: y2 = 0,
  z: z2 = 0,
} = {}) => ((x2 - x1) ** 2) + ((y2 - y1) ** 2) + ((z2 - z1) ** 2)

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

syngen.utility.frequencyToMidi = (frequency) => (Math.log2(frequency / syngen.const.midiReferenceFrequency) * 12) + syngen.const.midiReferenceNote

syngen.utility.fromDb = (value) => 10 ** (value / 10)

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

syngen.utility.humanize = (value = 1, amount = 0) => {
  return value + syngen.utility.random.float(-amount, amount)
}

syngen.utility.humanizeDb = (value = 1, db = 0) => {
  const gain = syngen.utility.fromDb(db)
  return value * syngen.utility.random.float(1 - gain, 1 + gain)
}

syngen.utility.intersects = (a, b) => {
  const between = syngen.utility.between

  const xOverlap = between(a.x, b.x, b.x + b.width)
    || between(b.x, a.x, a.x + a.width)

  const yOverlap = between(a.y, b.y, b.y + b.height)
    || between(b.y, a.y, a.y + a.height)

  return xOverlap && yOverlap
}

syngen.utility.lerp = (min, max, value) => (min * (1 - value)) + (max * value)

syngen.utility.lerpExp = (min, max, value, power = 2) => {
  return syngen.utility.lerp(min, max, value ** power)
}

syngen.utility.lerpExpRandom = ([lowMin, lowMax], [highMin, highMax], value, power) => {
  return syngen.utility.random.float(
    syngen.utility.lerpExp(lowMin, highMin, value, power),
    syngen.utility.lerpExp(lowMax, highMax, value, power),
  )
}

syngen.utility.lerpLog = (min, max, value, base = 2) => {
  value *= base - 1
  return syngen.utility.lerp(min, max, Math.log(1 + value) / Math.log(base))
}

syngen.utility.lerpLogRandom = ([lowMin, lowMax], [highMin, highMax], value) => {
  return syngen.utility.random.float(
    syngen.utility.lerpLog(lowMin, highMin, value),
    syngen.utility.lerpLog(lowMax, highMax, value),
  )
}

syngen.utility.lerpLogi = (min, max, value, base) => {
  // Equivalent to syngen.utility.lerpLog(min, max, value, 1 / base)
  return syngen.utility.lerpLog(max, min, 1 - value, base)
}

syngen.utility.lerpLogiRandom = ([lowMin, lowMax], [highMin, highMax], value) => {
  return syngen.utility.random.float(
    syngen.utility.lerpLogi(lowMin, highMin, value),
    syngen.utility.lerpLogi(lowMax, highMax, value),
  )
}

syngen.utility.lerpRandom = ([lowMin, lowMax], [highMin, highMax], value) => {
  return syngen.utility.random.float(
    syngen.utility.lerp(lowMin, highMin, value),
    syngen.utility.lerp(lowMax, highMax, value),
  )
}

syngen.utility.midiToFrequency = (note) => {
  return syngen.const.midiReferenceFrequency * Math.pow(2, (note - syngen.const.midiReferenceNote) / 12)
}

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

syngen.utility.quadratic = (a, b, c) => {
  return [
    (-1 * b + Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a),
    (-1 * b - Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a),
  ]
}

syngen.utility.radiansToDegrees = (radians) => radians * 180 / Math.PI

syngen.utility.regularPolygonInteriorAngle = (sides) => (sides - 2) * Math.PI / sides

syngen.utility.round = (x, precision = 0) => {
  precision = 10 ** precision
  return Math.round(x * precision) / precision
}

syngen.utility.rotatePoint = (x, y, theta) => ({
  x: (x * Math.cos(theta)) + (y * Math.sin(theta)),
  y: (y * Math.cos(theta)) - (x * Math.sin(theta)),
})

syngen.utility.scale = (value, min, max, a, b) => ((b - a) * (value - min) / (max - min)) + a

syngen.utility.shuffle = (array, random = Math.random) => {
  array = [].slice.call(array)

  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }

  return array
}

syngen.utility.sign = (value) => value >= 0 ? 1 : -1

syngen.utility.toCents = (f1, f2) => (f2 - f1) / f1 * 1200

syngen.utility.toDb = (value) => 10 * Math.log10(value)

syngen.utility.toSubFrequency = (frequency, sub = syngen.const.subFrequency) => {
  while (frequency > sub) {
    frequency /= 2
  }

  while (frequency < syngen.const.minFrequency) {
    frequency *= 2
  }

  return frequency
}

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

syngen.utility.uuid = () => {
  // SEE: https://stackoverflow.com/a/2117523
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}

syngen.utility.bitree = {}

syngen.utility.bitree.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.utility.bitree.from = function (items = [], options = {}) {
  const tree = this.create(options)

  for (const item of items) {
    tree.insert(item)
  }

  return tree
}

syngen.utility.bitree.prototype = {
  clear: function () {
    this.items.length = 0
    this.nodes.length = 0
    return this
  },
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
  destroy: function () {
    return this.clear()
  },
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
  intersects: function (value, width) {
    return syngen.utility.between(this.value, value, value + width)
      || syngen.utility.between(value, this.value, this.value + this.width)
  },
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

syngen.utility.euler = {}

syngen.utility.euler.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

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
  clone: function () {
    return syngen.utility.euler.create(this)
  },
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
  forward: function () {
    return syngen.utility.vector3d.unitX().rotateEuler(this)
  },
  isZero: function () {
    return !this.pitch && !this.roll && !this.yaw
  },
  right: function () {
    return syngen.utility.vector3d.unitY().rotateEuler(this)
  },
  scale: function (scalar = 0) {
    return syngen.utility.euler.create({
      pitch: this.pitch * scalar,
      roll: this.roll * scalar,
      yaw: this.yaw * scalar,
    })
  },
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
  up: function () {
    return syngen.utility.vector3d.unitZ().rotateEuler(this)
  },
}

syngen.utility.machine = {}

syngen.utility.machine.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.utility.machine.is = function (x) {
  return this.prototype.isPrototypeOf(x)
}

syngen.utility.machine.prototype = {
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
  construct: function ({state = 'none', transition = {}} = {}) {
    this.state = state
    this.transition = {...transition}

    syngen.utility.pubsub.decorate(this)

    return this
  },
  destroy: function () {
    this.pubsub.destroy()
    return this
  },
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
  getState: function () {
    return this.state
  },
  is: function (state) {
    return this.state == state
  },
}

syngen.utility.octree = {}

syngen.utility.octree.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.utility.octree.from = function (items = [], options = {}) {
  const tree = this.create(options)

  for (const item of items) {
    tree.insert(item)
  }

  return tree
}

syngen.utility.octree.prototype = {
  clear: function () {
    this.items.length = 0
    this.nodes.length = 0
    return this
  },
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
  destroy: function () {
    return this.clear()
  },
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
  intersects: function (rect) {
    // TODO: Update syngen.utility.intersects with 3D
    const between = syngen.utility.between

    const xOverlap = between(this.x, rect.x, rect.x + rect.width)
      || between(rect.x, this.x, this.x + this.width)

    const yOverlap = between(this.y, rect.y, rect.y + rect.height)
      || between(rect.y, this.y, this.y + this.height)

    const zOverlap = between(this.z, rect.z, rect.z + rect.depth)
      || between(rect.z, this.z, this.z + this.depth)

    return xOverlap && yOverlap && zOverlap
  },
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

syngen.utility.perlin1d = {}

syngen.utility.perlin1d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.utility.perlin1d.prototype = {
  construct: function (...seeds) {
    this.gradient = new Map()
    this.seed = seeds.join(syngen.const.seedSeparator)
    return this
  },
  generateGradient: function (x) {
    const srand = syngen.utility.srand('perlin', this.seed, x)
    this.gradient.set(x, srand(0, 1))
    return this
  },
  getGradient: function (x) {
    if (!this.hasGradient(x)) {
      this.generateGradient(x)
      this.requestPrune()
    }

    return this.gradient.get(x)
  },
  hasGradient: function (x) {
    return this.gradient.has(x)
  },
  prune: function () {
    if (this.gradient.size >= this.pruneThreshold) {
      this.gradient.clear()
    }

    return this
  },
  pruneThreshold: 10 ** 3,
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
  reset: function () {
    if (this.pruneRequest) {
      cancelIdleCallback(this.pruneRequest)
    }

    this.gradient.clear()

    return this
  },
  value: function (x) {
    const x0 = Math.floor(x),
      x1 = x0 + 1

    const dx = x - x0,
      v0 = this.getGradient(x0),
      v1 = this.getGradient(x1)

    return syngen.utility.lerp(v0, v1, dx)
  },
}

syngen.utility.perlin2d = {}

syngen.utility.perlin2d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

// SEE: https://en.wikipedia.org/wiki/Perlin_noise
// SEE: https://gamedev.stackexchange.com/questions/23625/how-do-you-generate-tileable-perlin-noise
// SEE: https://github.com/josephg/noisejs
syngen.utility.perlin2d.prototype = {
  construct: function (...seeds) {
    this.gradient = new Map()
    this.seed = seeds.join(syngen.const.seedSeparator)
    return this
  },
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
  getDotProduct: function (xi, yi, x, y) {
    const dx = x - xi,
      dy = y - yi

    return (dx * this.getGradient(xi, yi, 0)) + (dy * this.getGradient(xi, yi, 1))
  },
  getGradient: function (x, y, i) {
    if (!this.hasGradient(x, y)) {
      this.generateGradient(x, y)
    }

    return this.gradient.get(x).get(y)[i]
  },
  hasGradient: function (x, y) {
    const xMap = this.gradient.get(x)

    if (!xMap) {
      return false
    }

    return xMap.has(y)
  },
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
  pruneThreshold: 10 ** 2,
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

syngen.utility.perlin3d = {}

syngen.utility.perlin3d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

// SEE: https://en.wikipedia.org/wiki/Perlin_noise
// SEE: https://www.scratchapixel.com/lessons/procedural-generation-virtual-worlds/perlin-noise-part-2
syngen.utility.perlin3d.prototype = {
  construct: function (...seeds) {
    this.gradient = new Map()
    this.seed = seeds.join(syngen.const.seedSeparator)
    return this
  },
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
  getDotProduct: function (xi, yi, zi, x, y, z) {
    const dx = x - xi,
      dy = y - yi,
      dz = z - zi

    return (dx * this.getGradient(xi, yi, zi, 0)) + (dy * this.getGradient(xi, yi, zi, 1)) + (dz * this.getGradient(xi, yi, zi, 2))
  },
  getGradient: function (x, y, z, i) {
    if (!this.hasGradient(x, y, z)) {
      this.generateGradient(x, y, z)
      this.requestPrune(x, y, z)
    }

    return this.gradient.get(x).get(y).get(z)[i]
  },
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
  pruneThreshold: 10 ** 1,
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

syngen.utility.perlin4d = {}

syngen.utility.perlin4d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.utility.perlin4d.prototype = {
  construct: function (...seeds) {
    this.gradient = new Map()
    this.seed = seeds.join(syngen.const.seedSeparator)
    return this
  },
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
  getDotProduct: function (xi, yi, zi, ti, x, y, z, t) {
    const dt = t - ti,
      dx = x - xi,
      dy = y - yi,
      dz = z - zi

    return (dt * this.getGradient(xi, yi, zi, ti, 3)) + (dx * this.getGradient(xi, yi, zi, ti, 0)) + (dy * this.getGradient(xi, yi, zi, ti, 1)) + (dz * this.getGradient(xi, yi, zi, ti, 2))
  },
  getGradient: function (x, y, z, t, i) {
    if (!this.hasGradient(x, y, z, t)) {
      this.generateGradient(x, y, z, t)
      this.requestPrune(x, y, z, t)
    }

    return this.gradient.get(x).get(y).get(z).get(t)[i]
  },
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
  pruneThreshold: 10 ** 1,
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

syngen.utility.physical = {}

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

syngen.utility.physical.decoration = {
  euler: function () {
    return syngen.utility.euler.fromQuaternion(this.quaternion)
  },
  resetPhysics: function () {
    this.angularVelocity.set({w: 1})
    this.velocity.set()
    return this
  },
  updatePhysics: function () {
    const delta = syngen.loop.delta()

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
  },
  vector: function () {
    return syngen.utility.vector3d.create(this)
  },
}

syngen.utility.pubsub = {}

syngen.utility.pubsub.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.utility.pubsub.decorate = function (target, instance) {
  if (!this.is(instance)) {
    instance = this.create()
  }

  target.pubsub = instance;

  ['emit', 'off', 'on', 'once'].forEach((method) => {
    target[method] = function (...args) {
      instance[method](...args)
      return this
    }
  })

  return target
}

syngen.utility.pubsub.is = function (x) {
  return this.prototype.isPrototypeOf(x)
}

syngen.utility.pubsub.prototype = {
  construct: function() {
    this._handler = {}
    return this
  },
  destroy: function() {
    this.off()
    return this
  },
  emit: function (event, ...args) {
    if (!this._handler[event]) {
      return this
    }

    const execute = (handler) => handler(...args),
      handlers = [...this._handler[event]]

    handlers.forEach(execute)

    return this
  },
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
  on: function (event, handler) {
    if (!this._handler[event]) {
      this._handler[event] = []
    }

    this._handler[event].push(handler)

    return this
  },
  once: function (event, handler) {
    const wrapper = (...args) => {
      this.off(event, wrapper)
      handler(...args)
    }

    return this.on(event, wrapper)
  },
}

syngen.utility.quadtree = {}

syngen.utility.quadtree.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.utility.quadtree.from = function (items = [], options = {}) {
  const tree = this.create(options)

  for (const item of items) {
    tree.insert(item)
  }

  return tree
}

syngen.utility.quadtree.prototype = {
  clear: function () {
    this.items.length = 0
    this.nodes.length = 0
    return this
  },
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
  destroy: function () {
    return this.clear()
  },
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
  intersects: function (rect) {
    return syngen.utility.intersects(this, rect)
  },
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

syngen.utility.quaternion = {}

syngen.utility.quaternion.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

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
  add: function ({
    w = 0,
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return syngen.utility.quaternion.create({
      w: this.w + w,
      x: this.x + x,
      y: this.y + y,
      z: this.z + z,
    })
  },
  clone: function () {
    return syngen.utility.quaternion.create(this)
  },
  conjugate: function () {
    return syngen.utility.quaternion.create({
      w: this.w,
      x: -this.x,
      y: -this.y,
      z: -this.z,
    })
  },
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
  distance: function ({
    w = 0,
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return Math.sqrt(((this.w - w) ** 2) + ((this.x - x) ** 2) + ((this.y - y) ** 2) + ((this.z - z) ** 2))
  },
  distance2: function ({
    w = 0,
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return ((this.w - w) ** 2) + ((this.x - x) ** 2) + ((this.y - y) ** 2) + ((this.z - z) ** 2)
  },
  divide: function (divisor) {
    if (!syngen.utility.quaternion.prototype.isPrototypeOf(divisor)) {
      divisor = syngen.utility.quaternion.create(divisor)
    }

    return this.multiply(divisor.inverse())
  },
  equals: function ({
    w = 0,
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return (this.w == w) && (this.x == x) && (this.y == y) && (this.z == z)
  },
  forward: function () {
    return syngen.utility.vector3d.unitX().rotateQuaternion(this)
  },
  inverse: function () {
    const scalar = 1 / this.distance2()

    if (!isFinite(scalar)) {
      return this.conjugate()
    }

    return this.conjugate().scale(scalar)
  },
  isZero: function () {
    return !this.x && !this.y && !this.z
  },
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
  normalize: function () {
    const distance = this.distance()

    if (!distance) {
      return this.clone()
    }

    return this.scale(1 / distance)
  },
  right: function () {
    return syngen.utility.vector3d.unitY().rotateQuaternion(this)
  },
  scale: function (scalar = 0) {
    return syngen.utility.quaternion.create({
      w: this.w * scalar,
      x: this.x * scalar,
      y: this.y * scalar,
      z: this.z * scalar,
    })
  },
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
  subtract: function ({
    w = 0,
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return syngen.utility.quaternion.create({
      w: this.w - w,
      x: this.x - x,
      y: this.y - y,
      z: this.z - z,
    })
  },
  up: function () {
    return syngen.utility.vector3d.unitZ().rotateQuaternion(this)
  },
}

syngen.utility.quaternion.identity = function () {
  return Object.create(this.prototype).construct({
    w: 1,
  })
}

syngen.utility.random = {}

syngen.utility.random.float = (min = 0, max = 1) => {
  return min + (Math.random() * (max - min))
}

syngen.utility.random.integer = function (min = 0, max = 1) {
  return Math.round(
    this.float(min, max)
  )
}

syngen.utility.random.sign = (bias = 0.5) => Math.random() < bias ? 1 : -1

syngen.utility.random.key = function (bag) {
  const keys = Object.keys(bag)
  return keys[
    this.integer(0, keys.length - 1)
  ]
}

syngen.utility.random.value = function (bag) {
  return bag[
    this.key(bag)
  ]
}

// SEE: https://stackoverflow.com/a/47593316
// SEE: https://github.com/micro-js/srand
// SEE: https://en.wikipedia.org/wiki/Linear_congruential_generator
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

syngen.utility.timing = {}

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

syngen.utility.timing.promise = (duration) => new Promise((resolve) => setTimeout(resolve, duration))

syngen.utility.vector2d = {}

syngen.utility.vector2d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.utility.vector2d.prototype = {
  add: function ({
    x = 0,
    y = 0,
  } = {}) {
    return syngen.utility.vector2d.create({
      x: this.x + x,
      y: this.y + y,
    })
  },
  angle: function () {
    return Math.atan2(this.y, this.x)
  },
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
  clone: function () {
    return syngen.utility.vector2d.create(this)
  },
  construct: function ({
    x = 0,
    y = 0,
  } = {}) {
    this.x = x
    this.y = y
    return this
  },
  crossProduct: function ({
    x = 0,
    y = 0,
  } = {}) {
    return (this.x * y) - (this.y * x)
  },
  distance: function ({
    x = 0,
    y = 0,
  } = {}) {
    return Math.sqrt(((this.x - x) ** 2) + ((this.y - y) ** 2))
  },
  distance2: function ({
    x = 0,
    y = 0,
  } = {}) {
    return ((this.x - x) ** 2) + ((this.y - y) ** 2)
  },
  dotProduct: function ({
    x = 0,
    y = 0,
  } = {}) {
    return (this.x * x) + (this.y * y)
  },
  equals: function ({
    x = 0,
    y = 0,
  } = {}) {
    return (this.x == x) && (this.y == y)
  },
  inverse: function () {
    return syngen.utility.vector2d.create({
      x: -this.x,
      y: -this.y,
    })
  },
  isZero: function () {
    return !this.x && !this.y
  },
  normalize: function () {
    const distance = this.distance()

    if (!distance) {
      return this.clone()
    }

    return this.scale(1 / distance)
  },
  rotate: function (angle = 0) {
    const cos = Math.cos(angle),
      sin = Math.sin(angle)

    return syngen.utility.vector2d.create({
      x: (this.x * cos) - (this.y * sin),
      y: (this.y * cos) + (this.x * sin),
    })
  },
  scale: function (scalar = 0) {
    return syngen.utility.vector2d.create({
      x: this.x * scalar,
      y: this.y * scalar,
    })
  },
  set: function ({
    x = 0,
    y = 0,
  } = {}) {
    this.x = x
    this.y = y
    return this
  },
  subtract: function ({
    x = 0,
    y = 0,
  } = {}) {
    return syngen.utility.vector2d.create({
      x: this.x - x,
      y: this.y - y,
    })
  },
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

syngen.utility.vector2d.unitX = function () {
  return Object.create(this.prototype).construct({
    x: 1,
  })
}

syngen.utility.vector2d.unitY = function () {
  return Object.create(this.prototype).construct({
    y: 1,
  })
}

syngen.utility.vector3d = {}

syngen.utility.vector3d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.utility.vector3d.prototype = {
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
  clone: function () {
    return syngen.utility.vector3d.create(this)
  },
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
  distance: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return Math.sqrt(((this.x - x) ** 2) + ((this.y - y) ** 2) + ((this.z - z) ** 2))
  },
  distance2: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return ((this.x - x) ** 2) + ((this.y - y) ** 2) + ((this.z - z) ** 2)
  },
  dotProduct: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return (this.x * x) + (this.y * y) + (this.z * z)
  },
  euler: function () {
    return syngen.utility.euler.create({
      pitch: this.z ? Math.atan2(this.z, Math.sqrt((this.x ** 2) + (this.y ** 2))) : 0,
      roll: 0,
      yaw: Math.atan2(this.y, this.x),
    })
  },
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
  equals: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    return (this.x == x) && (this.y == y) && (this.z == z)
  },
  inverse: function () {
    return syngen.utility.vector3d.create({
      x: -this.x,
      y: -this.y,
      z: -this.z,
    })
  },
  isZero: function () {
    return !this.x && !this.y && !this.z
  },
  normalize: function () {
    const distance = this.distance()

    if (!distance) {
      return this.clone()
    }

    return this.scale(1 / distance)
  },
  rotateEuler: function (euler, sequence) {
    return this.rotateQuaternion(
      syngen.utility.quaternion.fromEuler(euler, sequence)
    )
  },
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
  scale: function (scalar = 0) {
    return syngen.utility.vector3d.create({
      x: this.x * scalar,
      y: this.y * scalar,
      z: this.z * scalar,
    })
  },
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

syngen.utility.vector3d.unitX = function () {
  return Object.create(this.prototype).construct({
    x: 1,
  })
}

syngen.utility.vector3d.unitY = function () {
  return Object.create(this.prototype).construct({
    y: 1,
  })
}

syngen.utility.vector3d.unitZ = function () {
  return Object.create(this.prototype).construct({
    z: 1,
  })
}

syngen.const = {
  acousticShadowFrequency: 343 / 0.1524, // speedOfSound / binauralHeadWidth
  audioLookaheadTime: 0, // TODO: Improve support for non-zero values
  binauralHeadWidth: 0.1524, // m
  binauralShadowOffset: Math.PI / 4, // radian offset of each ear from +/- 90 deg
  binauralShadowRolloff: 1, // m
  distancePower: 2, // 1 / (d ** distancePower)
  distancePowerHorizon: false, // Whether to dropoff power calculations as a ratio of streamer radius
  distancePowerHorizonExponent: 0, // Speed of the distance dropoff
  eulerToQuaternion: 'ZYX', // One of eight supported tuples, see syngen.utility.quaternion
  gravity: 9.8, // m/s
  idleDelta: 1/60, // s
  maxFrequency: 20000, // Hz
  maxSafeFloat: (2 ** 43) - 1, // Math.MAX_SAFE_INTEGER / (2 ** 10), or about 3 decimal places of precision
  midiReferenceFrequency: 440, // Hz
  midiReferenceNote: 69, // A4
  minFrequency: 20, // Hz
  positionRadius: 0.25, // m
  propFadeDuration: 0.005, // s
  seedSeparator: '~', // separator for arrays used as syngen.utility.srand() seeds
  speedOfSound: 343, // m/s
  subFrequency: 60, // Hz
  tau: Math.PI * 2, // circle constant
  unit: 1, // 1D line segment
  unit2: Math.sqrt(2) / 2, // 2D unit circle
  unit3: Math.sqrt(3) / 3, // 3D unit sphere
  unit4: Math.sqrt(4) / 4, // 4D unit hypersphere
  zero: 10 ** -32, // Close enough to zero
  zeroDb: -96, // dB, close enough to silence
  zeroGain: syngen.utility.fromDb(-96), // syngen.utility.fromDb(zeroDb)
  zeroTime: 0.005, // s, close enough to instantaneous
}

syngen.state = syngen.utility.pubsub.decorate({
  export: function () {
    const data = {}
    this.emit('export', data)
    return data
  },
  import: function (data = {}) {
    this.reset()
    this.emit('import', data)
    return this
  },
  reset: function () {
    this.emit('reset')
    return this
  }
})

syngen.seed = (() => {
  let seed

  return {
    get: () => seed,
    set: function (value) {
      seed = value
      return this
    },
    valueOf: () => seed,
  }
})()

syngen.state.on('export', (data = {}) => data.seed = syngen.seed.get())
syngen.state.on('import', (data = {}) => syngen.seed.set(data.seed))
syngen.state.on('reset', () => syngen.seed.set())

syngen.audio = (() => {
  const context = new AudioContext()

  return {
    buffer: {
      impulse: {},
      noise: {},
    },
    context: () => context,
    nyquist: (coefficient = 1) => coefficient * context.sampleRate / 2,
    send: {},
    start: function () {
      context.resume()
      return this
    },
    time: (duration = 0) => context.currentTime + syngen.const.audioLookaheadTime + duration,
    zeroTime: () => context.currentTime + syngen.const.audioLookaheadTime + syngen.const.zeroTime,
  }
})()

syngen.audio.binaural = {}

syngen.audio.binaural.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.audio.binaural.prototype = {
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
  destroy: function () {
    this.left.destroy()
    this.right.destroy()
    this.merger.disconnect()
    return this
  },
  from: function (input) {
    this.left.from(input)
    this.right.from(input)
    return this
  },
  to: function (output) {
    this.merger.connect(output)
    return this
  },
  update: function (...args) {
    this.left.update(...args)
    this.right.update(...args)
    return this
  },
}

syngen.audio.circuit = {}

// Multiplies input by -scale
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

syngen.audio.effect = {}

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

syngen.audio.formant = {}

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

syngen.audio.formant.createA = () => {
  return syngen.audio.formant.create(
    syngen.audio.formant.a()
  )
}

syngen.audio.formant.createE = () => {
  return syngen.audio.formant.create(
    syngen.audio.formant.e()
  )
}

syngen.audio.formant.createI = () => {
  return syngen.audio.formant.create(
    syngen.audio.formant.i()
  )
}

syngen.audio.formant.createO = () => {
  return syngen.audio.formant.create(
    syngen.audio.formant.o()
  )
}

syngen.audio.formant.createU = () => {
  return syngen.audio.formant.create(
    syngen.audio.formant.u()
  )
}

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
    bus: {},
    createAuxiliary: () => {
      const input = context.createGain(),
        output = context.createGain()

      output.connect(masterInput)

      return {
        input,
        output,
      }
    },
    createBus: () => {
      const input = context.createGain()
      input.connect(masterInput)
      return input
    },
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
    rebuildFilters: function () {
      destroyFilters()
      createFilters()

      this.master.param.highpass.frequency = masterHighpass.frequency
      this.master.param.lowpass.frequency = masterLowpass.frequency

      return this
    },
  }
})()

syngen.audio.ramp = {}

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

syngen.audio.ramp.curve = function (audioParam, curve, duration = syngen.const.zeroTime) {
  audioParam.cancelScheduledValues(0)
  audioParam.setValueCurveAtTime(curve, syngen.audio.time(), syngen.audio.time(duration))
  return this
}

syngen.audio.ramp.exponential = function (audioParam, value, duration = syngen.const.zeroTime) {
  syngen.audio.ramp.hold(audioParam)
  audioParam.exponentialRampToValueAtTime(value, syngen.audio.time(duration))
  return this
}

syngen.audio.ramp.hold = function (audioParam) {
  audioParam.value = audioParam.value
  audioParam.cancelScheduledValues(0)
  return this
}

syngen.audio.ramp.linear = function (audioParam, value, duration = syngen.const.zeroTime) {
  syngen.audio.ramp.hold(audioParam)
  audioParam.linearRampToValueAtTime(value, syngen.audio.time(duration))
  return this
}

syngen.audio.ramp.set = function (audioParam, value) {
  syngen.audio.ramp.linear(audioParam, value, syngen.performance.delta())
  return this
}

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

  function createRandom(samples = 2, seed = '') {
    const shape = new Float32Array(samples),
      srand = syngen.utility.srand('syngen.audio.shape.createRandom', seed)

    for (let i = 0; i < samples; i += 1) {
      shape[i] = srand(-1, 1)
    }

    return shape
  }

  // NOTE: amount should be in radians
  function createSigmoid(amount = 0, samples = 2 ** 16) {
    const shape = new Float32Array(samples)

    for (let i = 0; i < samples; i += 1) {
      const x = (i * 2 / samples) - 1
      shape[i] = x * (Math.PI + amount) / (Math.PI + (amount * Math.abs(x)))
    }

    return shape
  }

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
    crush6: () => crush6,
    crush8: () => crush8,
    distort: () => distort,
    double: () => double,
    doublePulse: () => doublePulse,
    equalFadeIn: () => equalFadeIn,
    equalFadeOut: () => equalFadeOut,
    hot: () => hot,
    invert: () => invert,
    invertShape: (shape) => new Float32Array([...shape].reverse()),
    linear: () => linear,
    noise: () => noise,
    noise2: () => noise2,
    noise4: () => noise4,
    noise8: () => noise8,
    noise16: () => noise16,
    noise32: () => noise32,
    noiseZero: () => noiseZero,
    offset: (offset = syngen.const.zeroGain) => new Float32Array([offset, offset]),
    offsetShape: (shape, offset = syngen.const.zeroGain) => shape.map((value) => value + offset),
    one: () => one,
    pulse: () => pulse,
    rectify: () => rectify,
    rectifyShape: (shape) => shape.map(Math.abs),
    reverseShape: (shape) => shape.slice().reverse(),
    square: () => square,
    triple: () => triple,
    triplePulse: () => triplePulse,
    warm: () => warm,
    zero: () => zero,
  }
})()

syngen.audio.synth = {}

syngen.audio.synth.assign = function (synth, key, plugin) {
  synth[key] = plugin
  synth.param = synth.param || {}
  synth.param[key] = plugin.param || {}
  return synth
}

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

syngen.audio.synth.chainAssign = function (synth, key, plugin) {
  this.assign(synth, key, plugin)
  return this.chain(synth, plugin)
}

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

syngen.audio.synth.decorate = (synth = {}) => {
  return Object.setPrototypeOf(synth, syngen.audio.synth.decoration)
}

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

syngen.audio.synth.shaped = function (synth, curve) {
  const shaper = syngen.audio.context().createWaveShaper()
  shaper.curve = curve
  return this.chainAssign(synth, 'shaper', shaper)
}

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
    createSend: () => {
      const gain = context.createGain()
      gain.connect(input)
      return gain
    },
    isActive: () => active,
    output: () => output,
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
    setGain: function (gain, duration) {
      syngen.audio.ramp.linear(output.gain, gain, duration)
      return this
    },
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

syngen.audio.mixer.bus.props = (() => {
  const bus = syngen.audio.mixer.createBus()
  return () => bus
})()

syngen.audio.binaural.monaural = {}

syngen.audio.binaural.monaural.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.audio.binaural.monaural.prototype = {
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
  destroy: function () {
    this.filter.disconnect()
    return this
  },
  from: function (input, ...args) {
    input.connect(this.gain, ...args)
    return this
  },
  to: function (output, ...args) {
    this.filter.connect(output, ...args)
    return this
  },
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

syngen.audio.send.reverb = {}

syngen.audio.send.reverb.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.audio.send.reverb.prototype = {
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
  destroy: function () {
    syngen.audio.mixer.auxiliary.reverb.off('activate', this.onSendActivate)
    syngen.audio.mixer.auxiliary.reverb.off('deactivate', this.onSendDeactivate)
    this.send.disconnect()
    return this
  },
  from: function (input) {
    input.connect(this.input)
    return this
  },
  onSendActivate: function () {
    this.update(this.relative)
    this.input.connect(this.delay)
    this.delay.connect(this.send)
    return this
  },
  onSendDeactivate: function () {
    this.input.disconnect()
    this.delay.disconnect()
    return this
  },
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

    pubsub.emit('frame', {
      delta,
      frame: frameCount,
      time,
      paused: isPaused,
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
    delta: () => delta,
    frame: () => frameCount,
    isPaused: () => isPaused,
    isRunning: () => isRunning,
    pause: function () {
      if (isPaused) {
        return this
      }

      isPaused = true
      pubsub.emit('pause')

      return this
    },
    resume: function () {
      if (!isPaused) {
        return this
      }

      isPaused = false
      pubsub.emit('resume')

      return this
    },
    start: function () {
      if (isRunning) {
        return this
      }

      isRunning = true
      lastFrame = performance.now()

      scheduleFrame()
      pubsub.emit('start')

      return this
    },
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

      pubsub.emit('stop')

      return this
    },
    time: () => time,
  }, pubsub)
})()

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
    get: () => ({...state}),
    getAnalog: function (key, invert = false) {
      const value = state.analog[key] || 0

      if (invert && value) {
        return -1 * value
      }

      return value
    },
    getAxis: function (key, invert = false) {
      const value = state.axis[key] || 0

      if (invert && value) {
        return -1 * value
      }

      return value
    },
    hasAxis: function (...keys) {
      for (const key of keys) {
        if (!(key in state.axis)) {
          return false
        }
      }

      return true
    },
    isDigital: (key) => Boolean(state.digital[key]),
    reset: function () {
      state = {
        analog: {},
        axis: {},
        digital: {},
      }

      return this
    },
    setDeadzone: function (value = 0) {
      deadzone = Number(value) || 0
      return this
    },
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
    get: () => ({...state}),
    is: (key) => state[key] || false,
    reset: function () {
      state = {}
      return this
    },
  }
})()

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
    get: () => ({...state}),
    getMoveX: state.moveX || 0,
    getMoveY: state.moveY || 0,
    getWheelX: state.wheelX || 0,
    getWheelY: state.wheelY || 0,
    getWheelZ: state.wheelZ || 0,
    isButton: (key) => state.button[key] || false,
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
    update: function () {
      // XXX: Reset between frames
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

syngen.performance = (() => {
  const deltas = [],
    maxFrames = 30

  let index = 0,
    medianDelta = 0,
    medianFps = 0

  return {
    delta: () => medianDelta,
    fps: () => medianFps,
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

syngen.position = (() => {
  const proxy = syngen.utility.physical.decorate({})

  return {
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
    getAngularVelocity: () => proxy.angularVelocity.clone(),
    getAngularVelocityEuler: () => syngen.utility.euler.fromQuaternion(proxy.angularVelocity),
    getEuler: () => proxy.euler(),
    getQuaternion: () => proxy.quaternion.clone(),
    getVector: () => proxy.vector(),
    getVelocity: () => proxy.velocity.clone(),
    import: function ({
      quaternion = {w: 1},
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
    rect: () => ({
      depth: syngen.const.positionRadius * 2,
      height: syngen.const.positionRadius * 2,
      width: syngen.const.positionRadius * 2,
      x: proxy.x - syngen.const.positionRadius,
      y: proxy.y - syngen.const.positionRadius,
      z: proxy.z - syngen.const.positionRadius,
    }),
    reset: function () {
      return this.import()
    },
    setAngularVelocity: function ({
      w = 0,
      x = 0,
      y = 0,
      z = 0,
    } = {}) {
      proxy.angularVelocity.set({
        w,
        x,
        y,
        z,
      })

      return this
    },
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
    setQuaternion: function ({
      w = 0,
      x = 0,
      y = 0,
      z = 0,
    } = {}) {
      proxy.quaternion.set({
        w,
        x,
        y,
        z,
      })

      return this
    },
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

syngen.prop.base = {
  name: 'base',
  radius: 0,
  construct: function ({
    destination = syngen.audio.mixer.bus.props(),
    radius,
    token,
    x = 0,
    y = 0,
    z = 0,
    ...options
  } = {}) {
    const context = syngen.audio.context()

    this.instantiated = true
    this.periodic = {}
    this.radius = radius || this.radius || 0
    this.token = token
    this.x = x
    this.y = y
    this.z = z

    this.binaural = syngen.audio.binaural.create()
    this.output = context.createGain()
    this.reverb = syngen.audio.send.reverb.create()

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
  invent: function (definition = {}) {
    if (typeof definition == 'function') {
      definition = definition(this)
    }

    return Object.setPrototypeOf({...definition}, this)
  },
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
  hasPeriodic: function (key) {
    return key in this.periodic
  },
  isPeriodicActive: function (key) {
    return this.periodic[key] && this.periodic[key].active
  },
  isPeriodicPending: function (key) {
    return this.periodic[key] && !this.periodic[key].active
  },
  onConstruct: () => {},
  onDestroy: () => {},
  onUpdate: () => {},
  recalculate: function () {
    const positionQuaternion = syngen.position.getQuaternion(),
      positionVector = syngen.position.getVector()

    this.updatePhysics()

    this.relative = this.vector()
      .subtract(positionVector)
      .subtractRadius(this.radius)
      .rotateQuaternion(positionQuaternion.conjugate())

    this.distance = this.relative.distance()

    this.binaural.update({...this.relative})
    this.reverb.update({...this.relative})

    return this
  },
  rect: function () {
    return {
      height: this.radius * 2,
      width: this.radius * 2,
      x: this.x - this.radius,
      y: this.y - this.radius,
    }
  },
  resetPeriodic: function (key) {
    delete this.periodic[key]
    return this
  },
  update: function ({
    paused,
  } = {}) {
    this.onUpdate.apply(this, arguments)

    if (paused) {
      return this
    }

    this.recalculate()

    return this
  },
}

syngen.prop.null = syngen.prop.base.invent({
  name: 'null',
})

syngen.props = (() => {
  const pool = new Set()

  function isValidPrototype(prototype) {
    return syngen.prop.base.isPrototypeOf(prototype)
  }

  return {
    add: function (...props) {
      for (const prop of props) {
        if (isValidPrototype(prop)) {
          pool.add(prop)
        }
      }

      return this
    },
    create: function (prototype, options) {
      if (!isValidPrototype(prototype)) {
        prototype = syngen.prop.null
      }

      const prop = Object.create(prototype).construct(options)
      pool.add(prop)

      return prop
    },
    destroy: function (...props) {
      for (const prop of props) {
        if (prop.destroy) {
          prop.destroy()
        }

        pool.delete(prop)
      }

      return this
    },
    get: () => [...pool],
    reset: function () {
      pool.forEach((prop) => prop.destroy())
      pool.clear()
      return this
    },
    update: function ({delta, paused}) {
      pool.forEach((prop) => prop.update({delta, paused}))
      return this
    },
  }
})()

syngen.loop.on('frame', (e) => syngen.props.update(e))
syngen.state.on('reset', () => syngen.props.reset())

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
    cullProp: function (token) {
      const prop = streamed.get(token)

      if (prop) {
        prop.willCull = true
      }

      return this
    },
    deregisterProp: function(token) {
      const registeredProp = registry.get(token)

      if (!registeredProp) {
        return this
      }

      registry.delete(token)
      registryTree.remove(registeredProp)

      return this
    },
    destroyStreamedProp: function (token) {
      destroyStreamedProp(token)
      return this
    },
    getLimit: () => limit,
    getRadius: () => radius,
    getRegisteredProp: (token) => registry.get(token),
    getRegisteredProps: () => registry.values(),
    getStreamedProp: (token) => streamed.get(token),
    getStreamedProps: () => streamed.values(),
    hasRegisteredProp: (token) => registry.has(token),
    hasStreamedProp: (token) => streamed.has(token),
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
    reset: function() {
      registry.clear()
      registryTree.clear()

      streamed.forEach((streamedProp) => streamedProp.destroy())
      streamed.clear()

      shouldForce = false

      return this
    },
    setLimit: function (value) {
      if (value > 0) {
        limit = Number(value) || Infinity
        shouldForce = true
      }
      return this
    },
    setRadius: function (value) {
      radius = Number(value) || 0
      shouldForce = true
      return this
    },
    setSort: function (value) {
      if (typeof sort == 'function') {
        sort = value
        shouldForce = true
      }
      return this
    },
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
