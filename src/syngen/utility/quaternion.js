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
