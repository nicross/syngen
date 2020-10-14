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
