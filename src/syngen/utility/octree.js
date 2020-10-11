syngen.utility.octree = {}

syngen.utility.octree.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.utility.octree.from = function (items = [], options = {}) {
  const tree = this.create(options)

  for (const item of items) {
    tree.insert(item)
  }

  return tree
}

syngen.utility.octree.prototype = {
  clear: function () {
    this.items.length = 0
    this.nodes.length = 0
    return this
  },
  construct: function ({
    depth = syngen.const.maxSafeFloat * 2,
    height = syngen.const.maxSafeFloat * 2,
    maxItems = 12,
    width = syngen.const.maxSafeFloat * 2,
    x = -syngen.const.maxSafeFloat,
    y = -syngen.const.maxSafeFloat,
    z = -syngen.const.maxSafeFloat,
  } = {}) {
    this.depth = depth
    this.height = height
    this.items = []
    this.maxItems = maxItems
    this.nodes = []
    this.width = width
    this.x = x
    this.y = y
    this.z = z

    return this
  },
  destroy: function () {
    return this.clear()
  },
  find: function (query = {}, radius = Infinity) {
    // NOTE: Assumes query.x, query.y, and query.z exist

    if (
         isFinite(radius)
      && !this.intersects({
          depth: radius * 2,
          height: radius * 2,
          width: radius * 2,
          x: query.x - radius,
          y: query.y - radius,
          z: query.z - radius,
        })
    ) {
      return
    }

    const distance = ({x, y, z}) => ((x - query.x) ** 2) + ((y - query.y) ** 2) + ((z - query.z) ** 2),
      index = this.getIndex(query),
      radius3 = ((radius * (Math.sqrt(3) / 3)) ** 2) * 3

    if (index == -1) {
      let minDistance = radius3,
        result

      for (const item of this.items) {
        if (item === query) {
          continue
        }

        const d = distance(item)

        if (d < minDistance) {
          minDistance = d
          result = item
        }
      }

      return result
    }

    let result = this.nodes[index].find(query, radius)
    let minDistance = result ? distance(result) : radius3

    for (const node of this.nodes) {
      if (node === this.nodes[index]) {
        continue
      }

      const item = node.find(query, minDistance)

      if (!item || item === query) {
        continue
      }

      const d = distance(item)

      if (d < minDistance) {
        minDistance = d
        result = item
      }
    }

    return result
  },
  getIndex: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    if (!this.nodes.length) {
      return -1
    }

    const midX = this.x + (this.width / 2),
      midY = this.y + (this.height / 2),
      midZ = this.z + (this.depth / 2)

    const underMidX = x <= midX,
      underMidY = y <= midY

    if (z <= midZ) {
      if (underMidX && underMidY) {
        return 0
      }

      if (!underMidX && underMidY) {
        return 1
      }

      if (underMidX && !underMidY) {
        return 2
      }

      return 3
    }

    if (underMidX && underMidY) {
      return 4
    }

    if (!underMidX && underMidY) {
      return 5
    }

    if (underMidX && !underMidY) {
      return 6
    }

    return 7
  },
  insert: function (item = {}) {
    // XXX: Assumes item.x and item.y exist

    const index = this.getIndex(item)

    if (index != -1) {
      this.nodes[index].insert(item)
      return this
    }

    this.items.push(item)

    // TODO: Max depth constant to prevent call stack size exceeded
    if (this.items.length > this.maxItems) {
      this.split()
    }

    return this
  },
  intersects: function (rect) {
    // TODO: Update syngen.utility.intersects with 3D
    const between = syngen.utility.between

    const xOverlap = between(this.x, rect.x, rect.x + rect.width)
      || between(rect.x, this.x, this.x + this.width)

    const yOverlap = between(this.y, rect.y, rect.y + rect.height)
      || between(rect.y, this.y, this.y + this.height)

    const zOverlap = between(this.z, rect.z, rect.z + rect.depth)
      || between(rect.z, this.z, this.z + this.depth)

    return xOverlap && yOverlap && zOverlap
  },
  retrieve: function ({
    depth = 0,
    height = 0,
    width = 0,
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    const items = []

    if (!this.intersects({depth, height, width, x, y, z})) {
      return items
    }

    for (const item of this.items) {
      if (
           item.x >= x
        && item.x <= x + width
        && item.y >= y
        && item.y <= y + height
        && item.z >= z
        && item.z <= z + depth
      ) {
        items.push(item)
      }
    }

    for (const node of this.nodes) {
      items.push(
        ...node.retrieve({
          depth,
          height,
          width,
          x,
          y,
          z,
        })
      )
    }

    return items
  },
  remove: function (item) {
    if (this.nodes.length) {
      const index = this.getIndex(item)
      this.nodes[index].remove(item)
      return this
    }

    const index = this.items.indexOf(item)

    if (index != -1) {
      this.items.splice(index, 1)
    }

    return this
  },
  split: function () {
    if (this.nodes.length) {
      return this
    }

    const depth = this.depth / 2,
      height = this.height / 2,
      width = this.width / 2

    this.nodes[0] = syngen.utility.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x,
      y: this.y,
      z: this.z,
    })

    this.nodes[1] = syngen.utility.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x + width,
      y: this.y,
      z: this.z,
    })

    this.nodes[2] = syngen.utility.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x,
      y: this.y + height,
      z: this.z,
    })

    this.nodes[3] = syngen.utility.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x + width,
      y: this.y + height,
      z: this.z,
    })

    this.nodes[4] = syngen.utility.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x,
      y: this.y,
      z: this.z + depth,
    })

    this.nodes[5] = syngen.utility.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x + width,
      y: this.y,
      z: this.z + depth,
    })

    this.nodes[6] = syngen.utility.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x,
      y: this.y + height,
      z: this.z + depth,
    })

    this.nodes[7] = syngen.utility.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x + width,
      y: this.y + height,
      z: this.z + depth,
    })

    for (const item of this.items) {
      const index = this.getIndex(item)
      this.nodes[index].insert(item)
    }

    this.items.length = 0

    return this
  },
}
