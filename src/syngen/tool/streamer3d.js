syngen.tool.streamer3d = {}

syngen.tool.streamer3d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.tool.streamer3d.prototype = {
  construct: function ({
    radius = 1,
  } = {}) {
    this.loaded = []
    this.radius = radius
    this.tree = syngen.tool.octree.create()

    syngen.tool.pubsub.decorate(this)

    return this
  },
  add: function (item) {
    this.tree.insert(item)

    return this
  },
  remove: function (item) {
    this.tree.remove(item)

    if (this.loaded.includes(item)) {
      this.loaded.splice(this.loaded.indexOf(item), 1)
      this.emit('unload', item)
    }

    return this
  },
  reset: function () {
    // Unload loaded items
    for (const item of this.loaded) {
      this.emit('unload', item)
    }

    this.loaded = []
    this.tree.clear()

    return this
  },
  update: function () {
    // Retrieve objects within radius of position
    const position = syngen.position.getVector()

    const streamed = this.tree.retrieve({
      depth: this.radius * 2,
      height: this.radius * 2,
      width: this.radius * 2,
      x: position.x - this.radius,
      y: position.y - this.radius,
      z: position.z - this.radius,
    })

    // Load and unload objects
    const loadedSet = new Set(this.loaded),
      streamedSet = new Set(streamed)

    const loaded = streamed.filter((item) => !loadedSet.has(item)),
      unloaded = this.loaded.filter((item) => !streamedSet.has(item))

    for (const item of loaded) {
      this.pubsub.emit('load', item)
    }

    for (const item of unloaded) {
      this.pubsub.emit('unload', item)
    }

    this.loaded = streamed

    return this
  },
}
