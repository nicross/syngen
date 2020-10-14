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
