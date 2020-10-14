/**
 * Provides a helper for conserving resources by only streaming eligible props.
 * Systems can register and deregister props for streaming.
 * Props are dynamically instantiated and destroyed based on their eligibility.
 * Eligibility is determined by a configurable maximum distance from the observer, sorting, and limits.
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
     * Deregisters the streamed prop with `token`.
     * Beware that it isn't destroyed.
     * @memberof syngen.streamer
     * @param {String} token
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
     * Destroys the streamed prop with `token`.
     * Beware that it isn't deregistered.
     * @memberof syngen.streamer
     * @param {String} token
     */
    destroyStreamedProp: function (token) {
      destroyStreamedProp(token)
      return this
    },
    /**
     * Returns the streaming prop limit, if any.
     * @memberof syngen.streamer
     * @returns {Number|Infinity}
     */
    getLimit: () => limit,
    /**
     * Returns the streaming radius, if any.
     * @memberof syngen.streamer
     * @returns {Number|Infinity}
     */
    getRadius: () => radius,
    /**
     * Returns the definition for the prop registered with `token`, if one exists.
     * @memberof syngen.streamer
     * @param {String} token
     * @returns {Object|undefined}
     */
    getRegisteredProp: (token) => registry.get(token),
    /**
     * Returns the definitions for all registered props.
     * @memberof syngen.streamer
     * @returns {Object[]}
     */
    getRegisteredProps: () => [...registry.values()],
    /**
     * Returns the prop with `token`, if one is streaming.
     * @memberof syngen.streamer
     * @param {String} token
     * @returns {syngen.prop.base|undefined}
     */
    getStreamedProp: (token) => streamed.get(token),
    /**
     * Returns all streaming props.
     * @memberof syngen.streamer
     * @returns {engine.prop.base[]}
     */
    getStreamedProps: () => [...streamed.values()],
    /**
     * Returns whether a prop is registered for `token`.
     * @memberof syngen.streamer
     * @param {String} token
     * @returns {Boolean}
     */
    hasRegisteredProp: (token) => registry.has(token),
    /**
     * Returns whether a prop is streaming with `token`.
     * @memberof syngen.streamer
     * @param {String} token
     * @returns {Boolean}
     */
    hasStreamedProp: (token) => streamed.has(token),
    /**
     * Registers a prop with `prototype` and `options` and returns its token.
     * @memberof syngen.streamer
     * @param {engine.prop.base} prototype
     * @param {Object} [options]
     * @returns {String}
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
     * Clears and destroys all registered and streaming props.
     * @listens syngen.state#event:reset
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
     * Sets the streaming prop limit.
     * @memberof syngen.streamer
     * @param {Number} value
     */
    setLimit: function (value) {
      if (value > 0) {
        limit = Number(value) || Infinity
        shouldForce = true
      }
      return this
    },
    /**
     * Sets the streaming radius.
     * @memberof syngen.streamer
     * @param {Number} value
     */
    setRadius: function (value) {
      radius = Number(value) || 0
      shouldForce = true
      return this
    },
    /**
     * Sets the sorting method.
     * @memberof syngen.streamer
     * @param {Function} value
     */
    setSort: function (value) {
      if (typeof sort == 'function') {
        sort = value
        shouldForce = true
      }
      return this
    },
    /**
     * Updates the streamed props with respect to the observer's coordinates.
     * @listens syngen.loop#event:frame
     * @memberof syngen.streamer
     * @param {Boolean} [force=false]
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
     * Updates the `options` for the prop registered with `token`.
     * To change its prototype, its token must be deregistered.
     * @memberof syngen.streamer
     * @param {String} token
     * @param {Object} [options]
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
