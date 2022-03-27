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
