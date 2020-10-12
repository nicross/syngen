/**
 * @mixin
 * @property {syngen.utility.quaternion} angularVelocity
 * @property {syngen.utility.quaternion} quaternion
 * @property {syngen.utility.vector3d} velocity
 * @property {Number} x
 * @property {Number} y
 * @property {Number} z
 */
syngen.utility.physical = {}

/**
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
   * @instance
   */
  euler: function () {
    return syngen.utility.euler.fromQuaternion(this.quaternion)
  },
  /**
   * @instance
   */
  resetPhysics: function () {
    this.angularVelocity.set({w: 1})
    this.velocity.set()
    return this
  },
  /**
   * @instance
   */
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
  /**
   * @instance
   */
  vector: function () {
    return syngen.utility.vector3d.create(this)
  },
}
