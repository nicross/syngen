/**
 * Provides an octree interface for storing and querying objects in three-dimensional space.
 * @interface
 * @see syngen.tool.octree.create
 * @todo Document private members
 */
syngen.tool.octree = {}

/**
 * Instantiates a new octree.
 * @param {Object} [options={}]
 * @param {Number} [options.depth={@link syngen.const.maxSafeFloat|syngen.const.maxSafeFloat * 2}]
 *   Range of values along the z-axis.
 *   Typically this is set programmatically.
 * @param {Number} [options.height={@link syngen.const.maxSafeFloat|syngen.const.maxSafeFloat * 2}]
 *   Range of values along the y-axis.
 *   Typically this is set programmatically.
 * @param {Number} [options.maxItems=12]
 *   Number of items before the tree branches.
 *   This value is passed to child nodes.
 * @param {Number} [options.width={@link syngen.const.maxSafeFloat|syngen.const.maxSafeFloat * 2}]
 *   Range of values along the y-axis.
 *   Typically this is set programmatically.
 * @param {Number} [options.x={@link syngen.const.maxSafeFloat|-syngen.const.maxSafeFloat}]
 *   Lower bound for valeus along the x-axis.
 *   Typically this is set programmatically.
 * @param {Number} [options.y={@link syngen.const.maxSafeFloat|-syngen.const.maxSafeFloat}]
 *   Lower bound for valeus along the y-axis.
 *   Typically this is set programmatically.
 * @param {Number} [options.z={@link syngen.const.maxSafeFloat|-syngen.const.maxSafeFloat}]
 *   Lower bound for valeus along the z-axis.
 *   Typically this is set programmatically.
 * @returns {syngen.tool.octree}
 * @static
 */
syngen.tool.octree.create = function (options = {}) {
  return Object.create(this.prototype).construct(options)
}

/**
 * Instantiates a new octree with `items` and `options`.
 * @param {Object[]} [items=[]]
 * @param {Object} [options={}]
 *   See {@link syngen.tool.octree.create} for a full reference.
 * @returns {syngen.tool.octree}
 * @static
 */
syngen.tool.octree.from = function (items = [], options = {}) {
  const tree = this.create(options)

  for (const item of items) {
    tree.insert(item)
  }

  return tree
}

syngen.tool.octree.prototype = {
  /**
   * Clears all nodes and items.
   * @instance
   */
  clear: function () {
    this.items.length = 0
    this.nodes.length = 0
    return this
  },
  /**
   * Initializes the instance with `options`.
   * @instance
   * @param {Object} [options={}]
   * @private
   */
  construct: function ({
    depth = syngen.const.maxSafeFloat * 2,
    height = syngen.const.maxSafeFloat * 2,
    maxItems = 32,
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

    this.center = {
      x: this.x + (this.width / 2),
      y: this.y + (this.height / 2),
      z: this.z + (this.depth / 2),
    }

    this.radius = Math.max(this.height, this.width, this.depth) / syngen.const.unit3

    return this
  },
  /**
   * Prepares the instance for garbage collection.
   * @instance
   */
  destroy: function () {
    return this.clear()
  },
  /**
   * Returns the items which satisfy `filterNode` and `filterItem`.
   * @param {Function} filterNode
   *   Returns `true` if the passed `center` and `radius` describing the node's bounding cube should be traversed.
   *   Use this as an optimization.
   * @param {Function} filterItem
   *   Returns whether the passed `item` is included in the result set.
   * @param {Array} [items=[]]
   *   Do not use. Used internally for performance.
   * @returns {Object[]}
   */
  filter: function (filterNode, filterItem, items = []) {
    if (!filterNode(this.center, this.radius)) {
      return items
    }

    if (this.items.length) {
      for (const item of this.items) {
        if (filterItem) {
          if (filterItem(item)) {
            items.push(item)
          }
        } else {
          items.push(item)
        }
      }
    } else if (this.nodes.length) {
      for (const node of this.nodes) {
        node.filter(filterNode, filterItem, items)
      }
    }

    return items
  },
  /**
   * Finds the closest item to `query` within `radius`.
   * If `query` is contained within the tree, then the next closest item is returned.
   * If no result is found, then `undefined` is returned.
   * @instance
   * @param {Object} query
   * @param {Number} query.x
   * @param {Number} query.y
   * @param {Number} query.z
   * @param {Number} [radius=Infinity]
   * @returns {Object|undefined}
   */
  find: function (query = {}, radius = Infinity) {
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

    const radius2 = radius * radius

    if (this.items.length) {
      let minDistance = radius2,
        result

      for (const item of this.items) {
        if (item === query) {
          continue
        }

        const d = syngen.fn.distance2(query, item)

        if (d < minDistance) {
          minDistance = d
          result = item
        }
      }

      return result
    }

    let minDistance = radius2,
      result

    for (const node of this.nodes) {
      const item = node.find(query, Math.sqrt(minDistance))

      if (!item || item === query) {
        continue
      }

      const d = syngen.fn.distance2(query, item)

      if (d < minDistance) {
        minDistance = d
        result = item
      }
    }

    return result
  },
  /**
   * Returns the node index for `item`.
   * @instance
   * @param {Object} item
   * @private
   */
  getIndex: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    if (!this.nodes.length) {
      return -1
    }

    const midX = this.center.x,
      midY = this.center.y,
      midZ = this.center.z

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
  /**
   * Inserts `item` into the tree.
   * @instance
   * @param {Object} item
   */
  insert: function (item = {}) {
    if (!('x' in item && 'y' in item && 'z' in item)) {
      return this
    }

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
   * Returns whether this node intersects the rectanglular prism `prism`.
   * @instance
   * @param {Object} prism
   * @param {Number} [prism.depth=0]
   * @param {Number} [prism.height=0]
   * @param {Number} [prism.width=0]
   * @param {Number} [prism.x=0]
   * @param {Number} [prism.y=0]
   * @param {Number} [prism.z=0]
   * @returns {Boolean}
   * @see syngen.fn.intersects
   * @todo Define a rectangular prism utility or type
   */
  intersects: function (prism) {
    return syngen.fn.intersects(this, prism)
  },
  /**
   * Removes `item` from the tree, if it exists.
   * @instance
   * @param {Object} item
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
   * Retrieves all items within the rectanglular prism `prism`.
   * @instance
   * @param {Object} prism
   * @param {Number} [prism.depth=0]
   * @param {Number} [prism.height=0]
   * @param {Number} [prism.width=0]
   * @param {Number} [prism.x=0]
   * @param {Number} [prism.y=0]
   * @param {Number} [prism.z=0]
   * @returns {Object[]}
   * @todo Define a rectangular prism utility or type
   */
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
  /**
   * Splits this node into eight child nodes.
   * @instance
   * @private
   */
  split: function () {
    if (this.nodes.length) {
      return this
    }

    const depth = this.depth / 2,
      height = this.height / 2,
      width = this.width / 2

    this.nodes[0] = syngen.tool.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x,
      y: this.y,
      z: this.z,
    })

    this.nodes[1] = syngen.tool.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x + width,
      y: this.y,
      z: this.z,
    })

    this.nodes[2] = syngen.tool.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x,
      y: this.y + height,
      z: this.z,
    })

    this.nodes[3] = syngen.tool.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x + width,
      y: this.y + height,
      z: this.z,
    })

    this.nodes[4] = syngen.tool.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x,
      y: this.y,
      z: this.z + depth,
    })

    this.nodes[5] = syngen.tool.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x + width,
      y: this.y,
      z: this.z + depth,
    })

    this.nodes[6] = syngen.tool.octree.create({
      depth,
      height,
      maxItems: this.maxItems,
      width,
      x: this.x,
      y: this.y + height,
      z: this.z + depth,
    })

    this.nodes[7] = syngen.tool.octree.create({
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
