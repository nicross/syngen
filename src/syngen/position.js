/**
 * @namespace
 */
syngen.position = (() => {
  const proxy = syngen.utility.physical.decorate({})

  return {
    /**
     * @memberof syngen.position
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
     * @memberof syngen.position
     */
    getAngularVelocity: () => proxy.angularVelocity.clone(),
    /**
     * @memberof syngen.position
     */
    getAngularVelocityEuler: () => syngen.utility.euler.fromQuaternion(proxy.angularVelocity),
    /**
     * @memberof syngen.position
     */
    getEuler: () => proxy.euler(),
    /**
     * @memberof syngen.position
     */
    getQuaternion: () => proxy.quaternion.clone(),
    /**
     * @memberof syngen.position
     */
    getVector: () => proxy.vector(),
    /**
     * @memberof syngen.position
     */
    getVelocity: () => proxy.velocity.clone(),
    /**
     * @memberof syngen.position
     */
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
    /**
     * @memberof syngen.position
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
     * @memberof syngen.position
     */
    reset: function () {
      return this.import()
    },
    /**
     * @memberof syngen.position
     */
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
    /**
     * @memberof syngen.position
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
     * @memberof syngen.position
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
     * @memberof syngen.position
     */
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
    /**
     * @memberof syngen.position
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
     * @memberof syngen.position
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
