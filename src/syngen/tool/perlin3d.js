/**
 * Provides an interface for generating seeded two-dimensional Perlin noise.
 * @interface
 * @see syngen.tool.perlin3d.create
 * @todo Document private members
 */
syngen.tool.perlin3d = {}

/**
 * Instantiates a three-dimensional Perlin noise generator.
 * @param {...String} [...seeds]
 * @returns {syngen.tool.perlin3d}
 * @static
 */
syngen.tool.perlin3d.create = function (...seeds) {
  return Object.create(this.prototype).construct(...seeds)
}

syngen.tool.perlin3d.prototype = {
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
   * Generates the gradient at `(x, y, z)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @private
   */
  generateGradient: function (x, y, z) {
    const srand = syngen.fn.srand('perlin', ...this.seed, x, y, z)

    return [
      srand(-1, 1),
      srand(-1, 1),
      srand(-1, 1),
    ]
  },
  /**
   * Calculates the dot product between `(dx, dy, dz)` and the value at `(xi, yi, zi)`.
   * @instance
   * @param {Number} xi
   * @param {Number} yi
   * @param {Number} zi
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @private
   */
  getDotProduct: function (xi, yi, zi, x, y, z) {
    const dx = x - xi,
      dy = y - yi,
      dz = z - zi,
      gradient = this.getGradient(xi, yi, zi)

    return (dx * gradient[0]) + (dy * gradient[1]) + (dz * gradient[2])
  },
  /**
   * Retrieves the gradient at `(x, y, z)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @private
   * @returns {Number}
   */
  getGradient: function (x, y, z) {
    let xMap = this.gradient.get(x)

    if (!xMap) {
      xMap = new Map()
      this.gradient.set(x, xMap)
    }

    let yMap = xMap.get(y)

    if (!yMap) {
      yMap = new Map()
      xMap.set(y, yMap)
    }

    let gradient = yMap.get(z)

    if (!gradient) {
      gradient = this.generateGradient(x, y, z)
      yMap.set(z, gradient)
    }

    return gradient
  },
  /**
   * Range (plus and minus) to scale the output such that it's normalized to `[0, 1]`.
   * @instance
   * @private
   */
  range: Math.sqrt(3/4),
  /**
   * Clears all generated values.
   * Implementations are encouraged to call this whenever {@link syngen.seed} is set, {@link syngen.state} is reset, or memory becomes an issue.
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
   * Calculates the value at `(x, y, z)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @returns {Number}
   */
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

    const value = syngen.fn.lerp(
      syngen.fn.lerp(
        syngen.fn.lerp(
          this.getDotProduct(x0, y0, z0, x, y, z),
          this.getDotProduct(x1, y0, z0, x, y, z),
          dx
        ),
        syngen.fn.lerp(
          this.getDotProduct(x0, y1, z0, x, y, z),
          this.getDotProduct(x1, y1, z0, x, y, z),
          dx
        ),
        dy
      ),
      syngen.fn.lerp(
        syngen.fn.lerp(
          this.getDotProduct(x0, y0, z1, x, y, z),
          this.getDotProduct(x1, y0, z1, x, y, z),
          dx
        ),
        syngen.fn.lerp(
          this.getDotProduct(x0, y1, z1, x, y, z),
          this.getDotProduct(x1, y1, z1, x, y, z),
          dx
        ),
        dy
      ),
      dz
    )

    return syngen.fn.clamp(
      syngen.fn.scale(value, -this.range, this.range, 0, 1),
      0,
      1
    )
  },
}
