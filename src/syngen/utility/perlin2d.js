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
    this.seed = seeds
    return this
  },
  /**
   * Generates the gradient at `(x, y)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @private
   */
  generateGradient: function (x, y) {
    const srand = syngen.utility.srand('perlin', ...this.seed, x, y)

    return [
      srand(-1, 1),
      srand(-1, 1),
    ]
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
      dy = y - yi,
      gradient = this.getGradient(xi, yi)

    return (dx * gradient[0]) + (dy * gradient[1])
  },
  /**
   * Retrieves the gradient at `(x, y)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @private
   * @returns {Number}
   */
  getGradient: function (x, y) {
    let xMap = this.gradient.get(x)

    if (!xMap) {
      xMap = new Map()
      this.gradient.set(x, xMap)
    }

    let gradient = xMap.get(y)

    if (!gradient) {
      gradient = this.generateGradient(x, y)
      xMap.set(y, gradient)
    }

    return gradient
  },
  /**
   * Range (plus and minus) to scale the output such that it's normalized to `[0, 1]`.
   * @instance
   * @private
   */
  range: Math.sqrt(2/4),
  /**
   * Clears all generated values.
   * This is especially useful to call when {@link syngen.seed} is set.
   * @instance
   */
  reset: function () {
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

    return syngen.utility.clamp(
      syngen.utility.scale(value, -this.range, this.range, 0, 1),
      0,
      1
    )
  },
}
