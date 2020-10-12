/**
 * @namespace
 */
syngen.streamer = (() => {
  const registry = new Map(),
    registryTree = syngen.utility.octree.create(),
    streamed = new Map()

  let currentVector = syngen.utility.vector3d.create(),
    limit = Infinity,
    radius = syngen.const.speedOfSound,
    shouldForce = false,
    sort = (a, b) => a.distance - b.distance

  function createRegisteredProp(token) {
    if (!registry.has(token)) {
      return
    }

    const {options, prototype} = registry.get(token)
    const prop = syngen.props.create(prototype, options)

    streamed.set(token, prop)
  }

  function destroyStreamedProp(token) {
    if (!streamed.has(token)) {
      return
    }

    const prop = streamed.get(token)

    syngen.props.destroy(prop)
    streamed.delete(token)
  }

  function generateToken() {
    let token

    do {
      token = syngen.utility.uuid()
    } while (registry.has(token))

    return token
  }

  function getStreamableProps() {
    const props = [
      // Select nearby registered props and coerce into instances of prototype
      // so it's easier to sort and limit them (e.g. check prototype or options)
      // (the instantiated flag should indicate whether spawned)
      ...registryTree.retrieve({
        depth: radius * 2,
        height: radius * 2,
        width: radius * 2,
        x: currentVector.x - radius,
        y: currentVector.y - radius,
        z: currentVector.z - radius,
      }).filter(({token}) => !streamed.has(token)).map((registeredProp) => Object.setPrototypeOf({
        ...registeredProp.options,
        distance: currentVector.distance(registeredProp),
      }, registeredProp.prototype)),

      // Currently streamed props
      ...streamed.values(),
    ].filter((prop) => prop.distance <= radius)

    if (!isFinite(limit)) {
      return props
    }

    return props.sort(sort).slice(0, limit)
  }

  return {
    /**
     * @memberof syngen.streamer
     */
    deregisterProp: function(token) {
      const registeredProp = registry.get(token)

      if (!registeredProp) {
        return this
      }

      registry.delete(token)
      registryTree.remove(registeredProp)

      return this
    },
    /**
     * @memberof syngen.streamer
     */
    destroyStreamedProp: function (token) {
      destroyStreamedProp(token)
      return this
    },
    /**
     * @memberof syngen.streamer
     */
    getLimit: () => limit,
    /**
     * @memberof syngen.streamer
     */
    getRadius: () => radius,
    /**
     * @memberof syngen.streamer
     */
    getRegisteredProp: (token) => registry.get(token),
    /**
     * @memberof syngen.streamer
     */
    getRegisteredProps: () => [...registry.values()],
    /**
     * @memberof syngen.streamer
     */
    getStreamedProp: (token) => streamed.get(token),
    /**
     * @memberof syngen.streamer
     */
    getStreamedProps: () => [...streamed.values()],
    /**
     * @memberof syngen.streamer
     */
    hasRegisteredProp: (token) => registry.has(token),
    /**
     * @memberof syngen.streamer
     */
    hasStreamedProp: (token) => streamed.has(token),
    /**
     * @memberof syngen.streamer
     */
    registerProp: function(prototype, options = {}) {
      const token = generateToken()

      const registeredProp = {
        options: {
          ...options,
          token,
        },
        prototype,
        token,
        x: options.x,
        y: options.y,
        z: options.z,
      }

      registry.set(token, registeredProp)
      registryTree.insert(registeredProp)

      shouldForce = true

      return token
    },
    /**
     * @memberof syngen.streamer
     */
    reset: function() {
      registry.clear()
      registryTree.clear()

      streamed.forEach((streamedProp) => streamedProp.destroy())
      streamed.clear()

      shouldForce = false

      return this
    },
    /**
     * @memberof syngen.streamer
     */
    setLimit: function (value) {
      if (value > 0) {
        limit = Number(value) || Infinity
        shouldForce = true
      }
      return this
    },
    /**
     * @memberof syngen.streamer
     */
    setRadius: function (value) {
      radius = Number(value) || 0
      shouldForce = true
      return this
    },
    /**
     * @memberof syngen.streamer
     */
    setSort: function (value) {
      if (typeof sort == 'function') {
        sort = value
        shouldForce = true
      }
      return this
    },
    /**
     * @memberof syngen.streamer
     */
    update: function (force = false) {
      const positionVector = syngen.position.getVector()

      if (!force && !shouldForce && currentVector.equals(positionVector)) {
        return this
      }

      currentVector = positionVector
      shouldForce = false

      const nowStreaming = new Set(),
        streamable = getStreamableProps()

      for (const {token} of streamable) {
        if (!streamed.has(token)) {
          createRegisteredProp(token)
        }
        nowStreaming.add(token)
      }

      for (const token of streamed.keys()) {
        if (!nowStreaming.has(token)) {
          destroyStreamedProp(token)
        }
      }

      return this
    },
    /**
     * @memberof syngen.streamer
     */
    updateRegisteredProp: function (token, options = {}) {
      const registeredProp = propRegistry.get(token)

      if (!registeredProp) {
        return this
      }

      registeredProp.options = {
        ...registeredProp.options,
        ...options,
        token,
      }

      return this
    },
  }
})()

syngen.loop.on('frame', ({paused}) => {
  if (paused) {
    return
  }

  syngen.streamer.update()
})

syngen.state.on('reset', () => syngen.streamer.reset())
