syngen.tool.cache3d = {}

syngen.tool.cache3d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.tool.cache3d.prototype = {
  construct: function () {
    this.map = new Map()

    return this
  },
  destroy: function () {
    this.map.clear()

    return this
  },
  has: function (x, y, z) {
    return Boolean(this.map.get(x)?.get(y)?.has(z))
  },
  get: function (x, y, z) {
    return this.map.get(x)?.get(y)?.get(z)
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

    let yMap = xMap.get(y)

    if (!yMap) {
      yMap = new Map()
      xMap.set(y, yMap)
    }

    yMap.set(z, value)

    return this
  },
}
