syngen.tool.generator2d = {}

syngen.tool.generator2d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.tool.generator2d.prototype = {
  construct: function ({
    generator = () => {},
    radius = 1,
    scale = 1,
  } = {}) {
    this.cache = syngen.tool.cache2d.create()
    this.generate = generator.bind(this)
    this.loaded = []
    this.radius = radius
    this.scale = scale

    syngen.tool.pubsub.decorate(this)

    return this
  },
  reset: function () {
    // Unload loaded chunks
    for (const chunk of this.loaded) {
      this.emit('unload', chunk)
    }

    this.cache.reset()
    delete this.current
    this.loaded = []

    return this
  },
  update: function () {
    // Determine coordinates of chunk at position
    const position = syngen.position.getVector()

    const cx = Math.round(position.x / this.scale),
      cy = Math.round(position.y / this.scale)

    // Return early if nothing new to stream
    if (this.current && this.current.x == cx && this.current.y == cy) {
      return this
    }

    // Stream chunks in square around position
    const radius = this.radius,
      streamed = []

    const loaded = new Set(),
      unloaded = new Set(this.loaded)

    for (let x = cx - radius; x <= cx + radius; x += 1) {
      for (let y = cy - radius; y <= cy + radius; y += 1) {
        let chunk = this.cache.get(x, y)

        if (chunk) {
          unloaded.delete(chunk)
        } else {
          chunk = {
            x,
            y,
            ...(this.generate(x, y) || {}),
          }

          this.cache.set(x, y, chunk)
          loaded.add(chunk)
        }

        streamed.push(chunk)
      }
    }

    // Load and unload chunks
    for (const chunk of loaded) {
      this.pubsub.emit('load', chunk)
    }

    for (const chunk of unloaded) {
      this.pubsub.emit('unload', chunk)
    }

    this.loaded = streamed

    // Update current chunk
    this.current = this.cache.get(cx, cy)

    return this
  },
}
