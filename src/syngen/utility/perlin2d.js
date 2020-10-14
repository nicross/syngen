/**
 * Provides an interface for generating seeded two-dimensional Perlin noise.
 * @interface
 * @see syngen.utility.perlin2d.create
 * @todo Document private members
 */
syngen.utility.perlin2d = {}

/**
 * Instantiates a two-dimensional Perlin noise generator.
 * @param {...String} [...seeds]
 * @returns {syngen.utility.perlin2d}
 * @static
 */
syngen.utility.perlin2d.create = function (...seeds) {
  return Object.create(this.prototype).construct(...seeds)
}

syngen.utility.perlin2d.prototype = {
  /**
   * Initializes the instance with `...seeds`.
   * @instance
   * @param {...String} [...seeds]
   * @private
   */
  construct: function (...seeds) {
    this.gradient = new Map()
    this.seed = seeds.join(syngen.const.seedSeparator)
    return this
  },
  /**
   * Generates the value at `(x, y)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @private
   */
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
  /**
   * Calculates the dot product between `(dx, dy)` and the value at `(xi, yi)`.
   * @instance
   * @param {Number} xi
   * @param {Number} yi
   * @param {Number} x
   * @param {Number} y
   * @private
   */
  getDotProduct: function (xi, yi, x, y) {
    const dx = x - xi,
      dy = y - yi

    return (dx * this.getGradient(xi, yi, 0)) + (dy * this.getGradient(xi, yi, 1))
  },
  /**
   * Retrieves the value at `(x, y)` and index `i`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @private
   * @returns {Number}
   */
  getGradient: function (x, y, i) {
    if (!this.hasGradient(x, y)) {
      this.generateGradient(x, y)
      this.requestPrune()
    }

    return this.gradient.get(x).get(y)[i]
  },
  /**
   * Returns whether a value exists for `(x, y)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @private
   * @returns {Boolean}
   */
  hasGradient: function (x, y) {
    const xMap = this.gradient.get(x)

    if (!xMap) {
      return false
    }

    return xMap.has(y)
  },
  /**
   * Frees memory when usage exceeds the prune threshold.
   * @instance
   * @private
   * @see syngen.utility.perlin2d#pruneThreshold
   */
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
  /**
   * The maximum vertex count before they must be pruned.
   * @instance
   * @private
   */
  pruneThreshold: 10 ** 3,
  /**
   * Range (plus and minus) to scale the output such that it's normalized to `[-1, 1]`.
   * @instance
   * @private
   */
  range: Math.sqrt(2/4),
  /**
   * Requests a pruning.
   * @instance
   * @private
   */
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
  /**
   * Clears all generated values.
   * This is especially useful to call when {@link syngen.seed} is set.
   * @instance
   */
  reset: function () {
    if (this.pruneRequest) {
      cancelIdleCallback(this.pruneRequest)
    }

    this.gradient.clear()

    return this
  },
  /**
   * Calculates a smooth delta value for interpolation.
   * @instance
   * @param {Number} value
   * @private
   * @returns {Number}
   */
  smooth: function (value) {
    // 6x^5 - 15x^4 + 10x^3
    return (value ** 3) * (value * ((value * 6) - 15) + 10)
  },
  /**
   * Calculates the value at `(x, y)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @returns {Number}
   */
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

    return syngen.utility.scale(value, -this.range, this.range, 0, 1)
  },
}
