/**
 * Maintains the coordinates, orientation, and velocities of the observer.
 * The observer is a physical object that has volume and can be applied lateral and angular forces.
 * Its position affects the relative positioning of props and can be used to influence other systems.
 * @namespace
 */
syngen.position = (() => {
  const proxy = syngen.utility.physical.decorate({})

  return {
    /**
     * Returns the inner state.
     * The inverse of {@link syngen.position.import|import()}.
     * @listens syngen.state#event:export
     * @memberof syngen.position
     * @returns {Object}
     */
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
    /**
     * Returns the angular velocity.
     * @memberof syngen.position
     * @returns {syngen.utility.quaternion}
     */
    getAngularVelocity: () => proxy.angularVelocity.clone(),
    /**
     * Returns the angular velocity.
     * Beware that this is less performant than using quaternions and can result in gimbal lock.
     * @memberof syngen.position
     * @returns {syngen.utility.euler}
     */
    getAngularVelocityEuler: () => syngen.utility.euler.fromQuaternion(proxy.angularVelocity),
    /**
     * Returns the orientation.
     * Beware that this is less performant than using quaternions and can result in gimbal lock.
     * @memberof syngen.position
     * @returns {syngen.utility.euler}
     */
    getEuler: () => proxy.euler(),
    /**
     * Returns the oriantation.
     * @memberof syngen.position
     * @returns {syngen.utility.quaternion}
     */
    getQuaternion: () => proxy.quaternion.clone(),
    /**
     * Returns the coordinates.
     * @memberof syngen.position
     * @returns {syngen.utility.vector3d}
     */
    getVector: () => proxy.vector(),
    /**
     * Returns the velocity.
     * @memberof syngen.position
     * @returns {syngen.utility.vector3d}
     */
    getVelocity: () => proxy.velocity.clone(),
    /**
     * Sets the inner state.
     * The inverse of {@link syngen.position.export|export()}.
     * @listens syngen.state#event:import
     * @memberof syngen.position
     * @param {Object} [options]
     * @param {syngen.utility.quaternion} [options.quaternion]
     * @param {Number} [options.x=0]
     * @param {Number} [options.y=0]
     * @param {Number} [options.z=0]
     */
    import: function ({
      quaternion = syngen.utility.quaternion.identity(),
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
    /**
     * Returns the rectangular prism surrounding the observer.
     * @memberof syngen.position
     * @returns {Object}
     */
    rect: () => ({
      depth: syngen.const.positionRadius * 2,
      height: syngen.const.positionRadius * 2,
      width: syngen.const.positionRadius * 2,
      x: proxy.x - syngen.const.positionRadius,
      y: proxy.y - syngen.const.positionRadius,
      z: proxy.z - syngen.const.positionRadius,
    }),
    /**
     * Resets all attributes to zero.
     * @listens syngen.state#event:reset
     * @memberof syngen.position
     */
    reset: function () {
      return this.import()
    },
    /**
     * Sets the angular velocity.
     * @memberof syngen.position
     * @param {syngen.utility.quaternion} [options]
     */
    setAngularVelocity: function ({
      w = 0,
      x = 0,
      y = 0,
      z = 0,
    } = syngen.utility.quaternion.identity()) {
      proxy.angularVelocity.set({
        w,
        x,
        y,
        z,
      })

      return this
    },
    /**
     * Sets the angular velocity.
     * Beware that this is less performant than using quaternions and can result in gimbal lock.
     * @memberof syngen.position
     * @param {syngen.utility.euler}
     */
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
    /**
     * Sets the orientation.
     * Beware that this is less performant than using quaternions and can result in gimbal lock.
     * @memberof syngen.position
     * @param {syngen.utility.euler} [options]
     */
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
    /**
     * Sets the orientation
     * @memberof syngen.position
     * @param {syngen.utility.quaternion} [options]
     */
    setQuaternion: function ({
      w = 0,
      x = 0,
      y = 0,
      z = 0,
    } = syngen.utility.quaternion.identity()) {
      proxy.quaternion.set({
        w,
        x,
        y,
        z,
      })

      return this
    },
    /**
     * Sets the coordinates.
     * @memberof syngen.position
     * @param {syngen.utility.vector3d} [options]
     */
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
    /**
     * Sets the velocity.
     * @memberof syngen.position
     * @param {syngen.utility.vector3d} [options]
     */
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
    /**
     * Applies physics to the inner state.
     * @listens syngen.loop#event:frame
     * @memberof syngen.position
     */
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
