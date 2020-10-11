syngen.utility.perlin3d = {}

syngen.utility.perlin3d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

// SEE: https://en.wikipedia.org/wiki/Perlin_noise
// SEE: https://www.scratchapixel.com/lessons/procedural-generation-virtual-worlds/perlin-noise-part-2
syngen.utility.perlin3d.prototype = {
  construct: function (...seeds) {
    this.gradient = new Map()
    this.seed = seeds.join(syngen.const.seedSeparator)
    return this
  },
  generateGradient: function (x, y, z) {
    const srand = syngen.utility.srand('perlin', this.seed, x, y, z)

    if (!this.gradient.has(x)) {
      this.gradient.set(x, new Map())
    }

    const xMap = this.gradient.get(x)

    if (!xMap.has(y)) {
      xMap.set(y, new Map())
    }

    xMap.get(y).set(z, [
      srand(-1, 1),
      srand(-1, 1),
      srand(-1, 1),
    ])

    return this
  },
  getDotProduct: function (xi, yi, zi, x, y, z) {
    const dx = x - xi,
      dy = y - yi,
      dz = z - zi

    return (dx * this.getGradient(xi, yi, zi, 0)) + (dy * this.getGradient(xi, yi, zi, 1)) + (dz * this.getGradient(xi, yi, zi, 2))
  },
  getGradient: function (x, y, z, i) {
    if (!this.hasGradient(x, y, z)) {
      this.generateGradient(x, y, z)
      this.requestPrune(x, y, z)
    }

    return this.gradient.get(x).get(y).get(z)[i]
  },
  hasGradient: function (x, y, z) {
    const xMap = this.gradient.get(x)

    if (!xMap) {
      return false
    }

    const yMap = xMap.get(y)

    if (!yMap) {
      return false
    }

    return yMap.has(z)
  },
  prune: function () {
    this.gradient.forEach((xMap, x) => {
      if (xMap.size >= this.pruneThreshold) {
        return this.gradient.delete(x)
      }

      xMap.forEach((yMap, y) => {
        if (yMap.size >= this.pruneThreshold) {
          return xMap.delete(y)
        }

        yMap.forEach((zMap, z) => {
          if (zMap.size >= this.pruneThreshold) {
            return yMap.delete(z)
          }
        })
      })
    })

    return this
  },
  pruneThreshold: 10 ** 1,
  requestPrune: function () {
    if (this.pruneRequest) {
      return this
    }

    this.pruneRequest = requestIdleCallback(() => {
      this.prune()
      delete this.pruneRequest
    })

    return this
  },
  range: Math.sqrt(3/4),
  reset: function () {
    if (this.pruneRequest) {
      cancelIdleCallback(this.pruneRequest)
    }

    this.gradient.clear()

    return this
  },
  smooth: function (value) {
    // 6x^5 - 15x^4 + 10x^3
    return (value ** 3) * (value * ((value * 6) - 15) + 10)
  },
  value: function (x, y, z) {
    const x0 = Math.floor(x),
      x1 = x0 + 1,
      y0 = Math.floor(y),
      y1 = y0 + 1,
      z0 = Math.floor(z),
      z1 = z0 + 1

    const dx = this.smooth(x - x0),
      dy = this.smooth(y - y0),
      dz = this.smooth(z - z0)

    const value = syngen.utility.lerp(
      syngen.utility.lerp(
        syngen.utility.lerp(
          this.getDotProduct(x0, y0, z0, x, y, z),
          this.getDotProduct(x1, y0, z0, x, y, z),
          dx
        ),
        syngen.utility.lerp(
          this.getDotProduct(x0, y1, z0, x, y, z),
          this.getDotProduct(x1, y1, z0, x, y, z),
          dx
        ),
        dy
      ),
      syngen.utility.lerp(
        syngen.utility.lerp(
          this.getDotProduct(x0, y0, z1, x, y, z),
          this.getDotProduct(x1, y0, z1, x, y, z),
          dx
        ),
        syngen.utility.lerp(
          this.getDotProduct(x0, y1, z1, x, y, z),
          this.getDotProduct(x1, y1, z1, x, y, z),
          dx
        ),
        dy
      ),
      dz
    )

    return syngen.utility.scale(value, -this.range, this.range, 0, 1)
  },
}
