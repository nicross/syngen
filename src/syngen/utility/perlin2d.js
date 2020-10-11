syngen.utility.perlin2d = {}

syngen.utility.perlin2d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

// SEE: https://en.wikipedia.org/wiki/Perlin_noise
// SEE: https://gamedev.stackexchange.com/questions/23625/how-do-you-generate-tileable-perlin-noise
// SEE: https://github.com/josephg/noisejs
syngen.utility.perlin2d.prototype = {
  construct: function (...seeds) {
    this.gradient = new Map()
    this.seed = seeds.join(syngen.const.seedSeparator)
    return this
  },
  generateGradient: function (x, y) {
    const srand = syngen.utility.srand('perlin', this.seed, x, y)

    if (!this.gradient.has(x)) {
      this.gradient.set(x, new Map())
    }

    this.gradient.get(x).set(y, [
      srand(-1, 1),
      srand(-1, 1),
    ])

    return this
  },
  getDotProduct: function (xi, yi, x, y) {
    const dx = x - xi,
      dy = y - yi

    return (dx * this.getGradient(xi, yi, 0)) + (dy * this.getGradient(xi, yi, 1))
  },
  getGradient: function (x, y, i) {
    if (!this.hasGradient(x, y)) {
      this.generateGradient(x, y)
    }

    return this.gradient.get(x).get(y)[i]
  },
  hasGradient: function (x, y) {
    const xMap = this.gradient.get(x)

    if (!xMap) {
      return false
    }

    return xMap.has(y)
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
      })
    })

    return this
  },
  pruneThreshold: 10 ** 2,
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
  range: Math.sqrt(2/4),
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
  value: function (x, y) {
    const x0 = Math.floor(x),
      x1 = x0 + 1,
      y0 = Math.floor(y),
      y1 = y0 + 1

    const dx = this.smooth(x - x0),
      dy = this.smooth(y - y0)

    const value = syngen.utility.lerp(
      syngen.utility.lerp(
        this.getDotProduct(x0, y0, x, y),
        this.getDotProduct(x1, y0, x, y),
        dx
      ),
      syngen.utility.lerp(
        this.getDotProduct(x0, y1, x, y),
        this.getDotProduct(x1, y1, x, y),
        dx
      ),
      dy
    )

    this.requestPrune()

    return syngen.utility.scale(value, -this.range, this.range, 0, 1)
  },
}
