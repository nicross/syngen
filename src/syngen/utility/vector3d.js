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
