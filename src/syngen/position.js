/**
 * Maintains the coordinates and orientation of the listener.
 * @namespace
 */
syngen.position = (() => {
  const quaternion = syngen.tool.quaternion.identity(),
    vector = syngen.tool.vector3d.create()

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
        w: quaternion.w,
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
      },
      x: vector.x,
      y: vector.y,
      z: vector.z,
    }),
    /**
     * Returns the orientation.
     * Beware that this is less performant than using quaternions and can result in gimbal lock.
     * @memberof syngen.position
     * @returns {syngen.utility.euler}
     */
    getEuler: () => syngen.tool.euler.fromQuaternion(quaternion),
    /**
     * Returns the oriantation.
     * @memberof syngen.position
     * @returns {syngen.utility.quaternion}
     */
    getQuaternion: () => quaternion.clone(),
    /**
     * Returns the coordinates.
     * @memberof syngen.position
     * @returns {syngen.utility.vector3d}
     */
    getVector: () => vector.clone(),
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
      quaternion: nextQuaternion = syngen.tool.quaternion.identity(),
      x = 0,
      y = 0,
      z = 0,
    } = {}) {
      vector.x = x
      vector.y = y
      vector.z = z

      quaternion.set(nextQuaternion)

      return this
    },
    /**
     * Resets all attributes to zero.
     * @listens syngen.state#event:reset
     * @memberof syngen.position
     */
    reset: function () {
      this.setQuaternion()
      this.setVector()

      return this.import()
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
      return this.setQuaternion(
        syngen.tool.quaternion.fromEuler({
          pitch,
          roll,
          yaw,
        })
      )
    },
    /**
     * Sets the orientation
     * @memberof syngen.position
     * @param {syngen.utility.quaternion} [options]
     */
    setQuaternion: function ({
      w = 1,
      x = 0,
      y = 0,
      z = 0,
    } = {}) {
      quaternion.w = w
      quaternion.x = x
      quaternion.y = y
      quaternion.z = z

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
      vector.x = x
      vector.y = y
      vector.z = z

      return this
    },
  }
})()

syngen.state.on('export', (data = {}) => data.position = syngen.position.export())
syngen.state.on('import', (data = {}) => syngen.position.import(data.position))
syngen.state.on('reset', () => syngen.position.reset())
