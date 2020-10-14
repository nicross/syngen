/**
 * Provides a binary tree interface for storing and querying objects in one-dimensional space.
 * @interface
 * @see syngen.utility.bitree.create
 * @todo Document private members
 */
syngen.utility.bitree = {}

/**
 * Instantiates a new binary tree.
 * @param {Object} [options={}]
 * @param {String} [options.dimension=value]
 *   Key used to access items' values.
 *   Must be a member, not a method.
 * @param {Number} [options.maxItems=12]
 *   Number of items before the tree branches.
 *   This value is passed to child nodes.
 * @param {Number} [options.minValue={@link syngen.const.maxSafeFloat|-syngen.const.maxSafeFloat}]
 *   Lower bound of values for this node.
 *   Typically this is set programmatically.
 * @param {String} [options.range={@link syngen.const.maxSafeFloat|syngen.const.maxSafeFloat * 2}]
 *   Range of values for this node.
 *   Typically this is set programmatically.
 * @returns {syngen.utility.bitree}
 * @static
 */
syngen.utility.bitree.create = function (options = {}) {
  return Object.create(this.prototype).construct(options)
}

/**
 * Instantiates a new binary tree with `items` and `options`.
 * @param {Object[]} [items=[]]
 * @param {Object} [options={}]
 *   See {@link syngen.utility.bitree.create} for a full reference.
 * @returns {syngen.utility.bitree}
 * @static
 */
syngen.utility.bitree.from = function (items = [], options = {}) {
  const tree = this.create(options)

  for (const item of items) {
    tree.insert(item)
  }

  return tree
}

syngen.utility.bitree.prototype = {
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
    dimension = 'value',
    maxItems = 12,
    minValue = -syngen.const.maxSafeFloat,
    range = syngen.const.maxSafeFloat * 2,
  } = {}) {
    this.dimension = dimension
    this.items = []
    this.maxItems = maxItems
    this.minValue = minValue
    this.nodes = []
    this.range = range

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
   * The `query` must contain a member set to the configured dimension.
   * If `query` is contained within the tree, then the next closest item is returned.
   * If no result is found, then `undefined` is returned.
   * @instance
   * @param {Object} query
   * @param {Number} query.{dimension}
   * @param {Number} [radius=Infinity]
   * @returns {Object|undefined}
   */
  find: function (query, radius = Infinity) {
    if (!(this.dimension in query)) {
      return
    }

    if (isFinite(radius) && !this.intersects(query[this.dimension] - radius, radius * 2)) {
      return
    }

    const distance = (item) => Math.abs(item[this.dimension] - query[this.dimension]),
      index = this.getIndex(query)

    if (index == -1) {
      let minDistance = radius,
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
    let minDistance = result ? distance(result) : Infinity

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
  getIndex: function (item) {
    if (!this.nodes.length) {
      return -1
    }

    const middle = this.minValue + (this.range / 2)

    if (item[this.dimension] <= middle) {
      return 0
    }

    return 1
  },
  /**
   * Inserts `item` into the tree.
   * @instance
   * @param {Object} item
   */
  insert: function (item = {}) {
    if (!(this.dimension in item)) {
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
   * Returns whether this node intersects the line segment starting at `minValue` with length `range`.
   * @instance
   * @param {Number} minValue
   * @param {Number} range
   * @returns {Boolean}
   */
  intersects: function (minValue, range) {
    return syngen.utility.between(this.minValue, minValue, minValue + range)
      || syngen.utility.between(minValue, this.minValue, this.minValue + this.range)
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
   * Retrieves all items with values along the line segment starting at `minValue` with length `range`.
   * @instance
   * @param {Number} minValue
   * @param {Number} range
   * @returns {Object[]}
   */
  retrieve: function (minValue, range) {
    const items = []

    if (!this.intersects(minValue, range)) {
      return items
    }

    for (const item of this.items) {
      if (item[this.dimension] >= minValue && item[this.dimension] <= minValue + range) {
        items.push(item)
      }
    }

    for (const node of this.nodes) {
      items.push(
        ...node.retrieve(minValue, range)
      )
    }

    return items
  },
  /**
   * Splits this node into two child nodes.
   * @instance
   * @private
   */
  split: function () {
    if (this.nodes.length) {
      return this
    }

    const range = this.range / 2

    this.nodes[0] = syngen.utility.bitree.create({
      dimension: this.dimension,
      maxItems: this.maxItems,
      minValue: this.minValue,
      range,
    })

    this.nodes[1] = syngen.utility.bitree.create({
      dimension: this.dimension,
      maxItems: this.maxItems,
      minValue: this.minValue + range,
      range,
    })

    for (const item of this.items) {
      const index = this.getIndex(item)
      this.nodes[index].insert(item)
    }

    this.items.length = 0

    return this
  },
}
