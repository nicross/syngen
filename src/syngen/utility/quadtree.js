/**
 * @interface
 */
syngen.utility.quadtree = {}

/**
 * @static
 */
syngen.utility.quadtree.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

/**
 * @static
 */
syngen.utility.quadtree.from = function (items = [], options = {}) {
  const tree = this.create(options)

  for (const item of items) {
    tree.insert(item)
  }

  return tree
}

syngen.utility.quadtree.prototype = {
  /**
   * @instance
   */
  clear: function () {
    this.items.length = 0
    this.nodes.length = 0
    return this
  },
  /**
   * @instance
   */
  construct: function ({
    height = syngen.const.maxSafeFloat * 2,
    maxItems = 12,
    width = syngen.const.maxSafeFloat * 2,
    x = -syngen.const.maxSafeFloat,
    y = -syngen.const.maxSafeFloat,
  } = {}) {
    this.height = height
    this.items = []
    this.maxItems = maxItems
    this.nodes = []
    this.width = width
    this.x = x
    this.y = y

    return this
  },
  /**
   * @instance
   */
  destroy: function () {
    return this.clear()
  },
  /**
   * @instance
   */
  find: function (query = {}, radius = Infinity) {
    // NOTE: Assumes query.x and query.y exist

    if (
         isFinite(radius)
      && !this.intersects({
          height: radius * 2,
          width: radius * 2,
          x: query.x - radius,
          y: query.y - radius,
        })
    ) {
      return
    }

    const distance = ({x, y}) => ((x - query.x) ** 2) + ((y - query.y) ** 2),
      index = this.getIndex(query),
      radius2 = ((radius * (Math.sqrt(2) / 2)) ** 2) * 2

    if (index == -1) {
      let minDistance = radius2,
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
    let minDistance = result ? distance(result) : radius2

    for (const node of this.nodes) {
      if (node === this.nodes[index]) {
        continue
      }

      const item = node.find(query, minDistance)

      if (!item) {
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
  /**
   * @instance
   */
  getIndex: function ({
    x = 0,
    y = 0,
  } = {}) {
    if (!this.nodes.length) {
      return -1
    }

    const xMid = this.x + (this.width / 2),
      yMid = this.y + (this.height / 2)

    if (x <= xMid && y <= yMid) {
      return 0
    }

    if (x >= xMid && y <= yMid) {
      return 1
    }

    if (x <= xMid && y >= yMid) {
      return 2
    }

    return 3
  },
  /**
   * @instance
   */
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
  /**
   * @instance
   */
  intersects: function (rect) {
    return syngen.utility.intersects(this, rect)
  },
  /**
   * @instance
   */
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
  /**
   * @instance
   */
  retrieve: function ({
    height = 0,
    width = 0,
    x = 0,
    y = 0,
  } = {}) {
    const items = []

    if (!this.intersects({height, width, x, y})) {
      return items
    }

    for (const item of this.items) {
      if (
           item.x >= x
        && item.x <= x + width
        && item.y >= y
        && item.y <= y + height
      ) {
        items.push(item)
      }
    }

    for (const node of this.nodes) {
      items.push(
        ...node.retrieve({height, width, x, y})
      )
    }

    return items
  },
  /**
   * @instance
   */
  split: function () {
    if (this.nodes.length) {
      return this
    }

    const height = this.height / 2,
      width = this.width / 2

    this.nodes[0] = syngen.utility.quadtree.create({
      height,
      maxItems: this.maxItems,
      width,
      x: this.x,
      y: this.y,
    })

    this.nodes[1] = syngen.utility.quadtree.create({
      height,
      maxItems: this.maxItems,
      width,
      x: this.x + width,
      y: this.y,
    })

    this.nodes[2] = syngen.utility.quadtree.create({
      height,
      maxItems: this.maxItems,
      width,
      x: this.x,
      y: this.y + height,
    })

    this.nodes[3] = syngen.utility.quadtree.create({
      height,
      maxItems: this.maxItems,
      width,
      x: this.x + width,
      y: this.y + height,
    })

    for (const item of this.items) {
      const index = this.getIndex(item)
      this.nodes[index].insert(item)
    }

    this.items.length = 0

    return this
  },
}
