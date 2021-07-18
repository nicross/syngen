/**
 * Provides an interface for generating seeded two-dimensional Perlin noise.
 * @interface
 * @see syngen.utility.perlin3d.create
 * @todo Document private members
 */
syngen.utility.perlin3d = {}

/**
 * Instantiates a three-dimensional Perlin noise generator.
 * @param {...String} [...seeds]
 * @returns {syngen.utility.perlin3d}
 * @static
 */
syngen.utility.perlin3d.create = function (...seeds) {
  return Object.create(this.prototype).construct(...seeds)
}

syngen.utility.perlin3d.prototype = {
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
   * Generates the value at `(x, y, z)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @private
   */
  generateGradient: function (x, y, z) {
    const srand = syngen.utility.srand('perlin', ...this.seed, x, y, z)

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
      dz = z - zi

    return (dx * this.getGradient(xi, yi, zi, 0)) + (dy * this.getGradient(xi, yi, zi, 1)) + (dz * this.getGradient(xi, yi, zi, 2))
  },
  /**
   * Retrieves the value at `(x, y, z)` and index `i`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @private
   * @returns {Number}
   */
  getGradient: function (x, y, z, i) {
    if (!this.hasGradient(x, y, z)) {
      this.generateGradient(x, y, z)
    }

    return this.gradient.get(x).get(y).get(z)[i]
  },
  /**
   * Returns whether a value exists for `(x, y, z)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @private
   * @returns {Boolean}
   */
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
  /**
   * Range (plus and minus) to scale the output such that it's normalized to `[-1, 1]`.
   * @instance
   * @private
   */
  range: Math.sqrt(3/4),
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
