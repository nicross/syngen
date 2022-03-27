/**
 * Provides a quadtree interface for storing and querying objects in two-dimensional space.
 * @interface
 * @see syngen.tool.quadtree.create
 * @todo Document private members
 */
syngen.tool.quadtree = {}

/**
 * Instantiates a new quadtree.
 * @param {Object} [options={}]
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
 * @returns {syngen.tool.quadtree}
 * @static
 */
syngen.tool.quadtree.create = function (options = {}) {
  return Object.create(this.prototype).construct(options)
}

/**
 * Instantiates a new quadtree with `items` and `options`.
 * @param {Object[]} [items=[]]
 * @param {Object} [options={}]
 *   See {@link syngen.tool.quadree.create} for a full reference.
 * @returns {syngen.tool.quadtree}
 * @static
 */
syngen.tool.quadtree.from = function (items = [], options = {}) {
  const tree = this.create(options)

  for (const item of items) {
    tree.insert(item)
  }

  return tree
}

syngen.tool.quadtree.prototype = {
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
   * Prepares the instance for garbage collection.
   * @instance
   */
  destroy: function () {
    return this.clear()
  },
  /**
   * Finds the closest item to `query` within `radius`.
   * If `query` is contained within the tree, then the next closest item is returned.
   * If no result is found, then `undefined` is returned.
   * @instance
   * @param {Object} query
   * @param {Number} query.x
   * @param {Number} query.y
   * @param {Number} [radius=Infinity]
   * @returns {Object|undefined}
   */
  find: function (query = {}, radius = Infinity) {
    if (!('x' in query && 'y' in query)) {
      return
    }

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
   * Returns the node index for `item`.
   * @instance
   * @param {Object} item
   * @private
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
   * Inserts `item` into the tree.
   * @instance
   * @param {Object} item
   */
  insert: function (item = {}) {
    if (!('x' in item && 'y' in item)) {
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
   * Returns whether this node intersects the rectangle `rect`.
   * @instance
   * @param {Object} rect
   * @param {Number} [rect.height=0]
   * @param {Number} [rect.width=0]
   * @param {Number} [rect.x=0]
   * @param {Number} [rect.y=0]
   * @returns {Boolean}
   * @see syngen.fn.intersects
   * @todo Define a rectangular prism utility or type
   */
  intersects: function (rect) {
    return syngen.fn.intersects(this, rect)
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
   * Retrieves all items within the rectangle `rect`.
   * @instance
   * @param {Object} rect
   * @param {Number} [rect.height=0]
   * @param {Number} [rect.width=0]
   * @param {Number} [rect.x=0]
   * @param {Number} [rect.y=0]
   * @returns {Object[]}
   * @todo Define a rectangular prism utility or type
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
   * Splits this node into four child nodes.
   * @instance
   * @private
   */
  split: function () {
    if (this.nodes.length) {
      return this
    }

    const height = this.height / 2,
      width = this.width / 2

    this.nodes[0] = syngen.tool.quadtree.create({
      height,
      maxItems: this.maxItems,
      width,
      x: this.x,
      y: this.y,
    })

    this.nodes[1] = syngen.tool.quadtree.create({
      height,
      maxItems: this.maxItems,
      width,
      x: this.x + width,
      y: this.y,
    })

    this.nodes[2] = syngen.tool.quadtree.create({
      height,
      maxItems: this.maxItems,
      width,
      x: this.x,
      y: this.y + height,
    })

    this.nodes[3] = syngen.tool.quadtree.create({
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
