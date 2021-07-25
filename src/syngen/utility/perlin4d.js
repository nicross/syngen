/**
 * Provides an interface for generating seeded four-dimensional Perlin noise.
 * @interface
 * @see syngen.utility.perlin4d.create
 * @todo Document private members
 */
syngen.utility.perlin4d = {}

/**
 * Instantiates a four-dimensional Perlin noise generator.
 * @param {...String} [...seeds]
 * @returns {syngen.utility.perlin4d}
 * @static
 */
syngen.utility.perlin4d.create = function (...seeds) {
  return Object.create(this.prototype).construct(...seeds)
}

syngen.utility.perlin4d.prototype = {
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
   * Generates the gradient at `(x, y, z, t)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {Number} t
   * @private
   */
  generateGradient: function (x, y, z, t) {
    const srand = syngen.utility.srand('perlin', ...this.seed, x, y, z, t)

    return [
      srand(-1, 1),
      srand(-1, 1),
      srand(-1, 1),
      srand(-1, 1),
    ]
  },
  /**
   * Calculates the dot product between `(dx, dy, dz, dt)` and the value at `(xi, yi, zi, ti)`.
   * @instance
   * @param {Number} xi
   * @param {Number} yi
   * @param {Number} zi
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @private
   */
  getDotProduct: function (xi, yi, zi, ti, x, y, z, t) {
    const dt = t - ti,
      dx = x - xi,
      dy = y - yi,
      dz = z - zi,
      gradient = this.getGradient(xi, yi, zi, ti)

    return (dx * gradient[0]) + (dy * gradient[1]) + (dz * gradient[2]) + (dt * gradient[3])
  },
  /**
   * Retrieves the gradient at `(x, y, z, t)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {Number} t
   * @private
   * @returns {Number}
   */
  getGradient: function (x, y, z, t) {
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

    let zMap = yMap.get(z)

    if (!zMap) {
      zMap = new Map()
      yMap.set(z, zMap)
    }

    let gradient = zMap.get(t)

    if (!gradient) {
      gradient = this.generateGradient(x, y, z, t)
      zMap.set(t, gradient)
    }

    return gradient
  },
  /**
   * Range (plus and minus) to scale the output such that it's normalized to `[0, 1]`.
   * @instance
   * @private
   */
  range: Math.sqrt(4/4),
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
   * Calculates the value at `(x, y, z, t)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {Number} t
   * @returns {Number}
   */
  value: function (x, y, z, t) {
    const t0 = Math.floor(t),
      t1 = t0 + 1,
      x0 = Math.floor(x),
      x1 = x0 + 1,
      y0 = Math.floor(y),
      y1 = y0 + 1,
      z0 = Math.floor(z),
      z1 = z0 + 1

    const dt = this.smooth(t - t0),
      dx = this.smooth(x - x0),
      dy = this.smooth(y - y0),
      dz = this.smooth(z - z0)

    const value = syngen.utility.lerp(
      syngen.utility.lerp(
        syngen.utility.lerp(
          syngen.utility.lerp(
            this.getDotProduct(x0, y0, z0, t0, x, y, z, t),
            this.getDotProduct(x1, y0, z0, t0, x, y, z, t),
            dx
          ),
          syngen.utility.lerp(
            this.getDotProduct(x0, y1, z0, t0, x, y, z, t),
            this.getDotProduct(x1, y1, z0, t0, x, y, z, t),
            dx
          ),
          dy
        ),
        syngen.utility.lerp(
          syngen.utility.lerp(
            this.getDotProduct(x0, y0, z1, t0, x, y, z, t),
            this.getDotProduct(x1, y0, z1, t0, x, y, z, t),
            dx
          ),
          syngen.utility.lerp(
            this.getDotProduct(x0, y1, z1, t0, x, y, z, t),
            this.getDotProduct(x1, y1, z1, t0, x, y, z, t),
            dx
          ),
          dy
        ),
        dz
      ),
      syngen.utility.lerp(
        syngen.utility.lerp(
          syngen.utility.lerp(
            this.getDotProduct(x0, y0, z0, t1, x, y, z, t),
            this.getDotProduct(x1, y0, z0, t1, x, y, z, t),
            dx
          ),
          syngen.utility.lerp(
            this.getDotProduct(x0, y1, z0, t1, x, y, z, t),
            this.getDotProduct(x1, y1, z0, t1, x, y, z, t),
            dx
          ),
          dy
        ),
        syngen.utility.lerp(
          syngen.utility.lerp(
            this.getDotProduct(x0, y0, z1, t1, x, y, z, t),
            this.getDotProduct(x1, y0, z1, t1, x, y, z, t),
            dx
          ),
          syngen.utility.lerp(
            this.getDotProduct(x0, y1, z1, t1, x, y, z, t),
            this.getDotProduct(x1, y1, z1, t1, x, y, z, t),
            dx
          ),
          dy
        ),
        dz
      ),
      dt
    )

    return syngen.utility.clamp(
      syngen.utility.scale(value, -this.range, this.range, 0, 1),
      0,
      1
    )
  },
}
