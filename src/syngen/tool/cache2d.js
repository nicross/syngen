syngen.tool.cache2d = {}

syngen.tool.cache2d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.tool.cache2d.prototype = {
  construct: function () {
    this.map = new Map()

    return this
  },
  destroy: function () {
    this.map.clear()

    return this
  },
  has: function (x, y) {
    return Boolean(this.map.get(x)?.has(y))
  },
  get: function (x, y) {
    return this.map.get(x)?.get(y)
  },
  reset: function () {
    this.map.clear()

    return this
  },
  set: function (x, y, value) {
    let xMap = this.map.get(x)

    if (!xMap) {
      xMap = new Map()
      this.map.set(x, xMap)
    }

    xMap.set(y, value)

    return this
  },
}
