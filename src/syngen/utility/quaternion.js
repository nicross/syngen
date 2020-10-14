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
