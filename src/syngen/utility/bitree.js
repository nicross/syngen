syngen.utility.bitree = {}

syngen.utility.bitree.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.utility.bitree.from = function (items = [], options = {}) {
  const tree = this.create(options)

  for (const item of items) {
    tree.insert(item)
  }

  return tree
}

syngen.utility.bitree.prototype = {
  clear: function () {
    this.items.length = 0
    this.nodes.length = 0
    return this
  },
  construct: function ({
    dimension = 'x',
    maxItems = 12,
    value = -syngen.const.maxSafeFloat,
    width = syngen.const.maxSafeFloat * 2,
  } = {}) {
    this.dimension = dimension
    this.items = []
    this.maxItems = maxItems
    this.nodes = []
    this.value = value
    this.width = width

    return this
  },
  destroy: function () {
    return this.clear()
  },
  find: function (query, radius = Infinity) {
    // XXX: Assumes query[this.dimension] exists

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
  getIndex: function (item) {
    if (!this.nodes.length) {
      return -1
    }

    const middle = this.value + (this.width / 2)

    if (item[this.dimension] <= middle) {
      return 0
    }

    return 1
  },
  insert: function (item = {}) {
    // XXX: Assumes item[this.dimension] exists

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
  intersects: function (value, width) {
    return syngen.utility.between(this.value, value, value + width)
      || syngen.utility.between(value, this.value, this.value + this.width)
  },
  retrieve: function (value, width) {
    const items = []

    if (!this.intersects(value, width)) {
      return items
    }

    for (const item of this.items) {
      if (item[this.dimension] >= value && item[this.dimension] <= value + width) {
        items.push(item)
      }
    }

    for (const node of this.nodes) {
      items.push(
        ...node.retrieve(value, width)
      )
    }

    return items
  },
  split: function () {
    if (this.nodes.length) {
      return this
    }

    const width = this.width / 2

    this.nodes[0] = syngen.utility.bitree.create({
      dimension: this.dimension,
      maxItems: this.maxItems,
      value: this.value,
      width,
    })

    this.nodes[1] = syngen.utility.bitree.create({
      dimension: this.dimension,
      maxItems: this.maxItems,
      value: this.value + width,
      width,
    })

    for (const item of this.items) {
      const index = this.getIndex(item)
      this.nodes[index].insert(item)
    }

    this.items.length = 0

    return this
  },
}
