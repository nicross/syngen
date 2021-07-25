/**
 * Provides an interface for generating seeded two-dimensional OpenSimplex noise.
 * @interface
 * @see syngen.utility.simplex2d.create
 * @todo Document private members
 */
syngen.utility.simplex2d = {}

/**
 * Instantiates a two-dimensional OpenSimplex noise generator.
 * @param {...String} [...seeds]
 * @returns {syngen.utility.simplex2d}
 * @static
 */
syngen.utility.simplex2d.create = function (...seeds) {
  return Object.create(this.prototype).construct(...seeds)
}

syngen.utility.simplex2d.prototype = {
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
   * Generates the gradient at `(x, y)` in simplex space.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @private
   */
  generateGradient: function (xin, yin) {
    const srand = syngen.utility.srand('simplex', ...this.seed, xin, yin)

    let x = srand(-1, 1),
      y = srand(-1, 1)

    const distance = Math.sqrt((x * x) + (y * y))

    if (distance > 1) {
      x /= distance
      y /= distance
    }

    return [
      x,
      y,
    ]
  },
  /**
   * Retrieves the gradient at `(x, y)` in simplex space.
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
   * This magic number was derived from a brute-force method.
   * @instance
   * @private
   */
  range: 1/99,
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
   * Factor to skew input space into simplex space in two dimensions.
   * @instance
   * @private
   */
  skewFactor: (Math.sqrt(3) - 1) / 2,
  /**
   * Factor to skew simplex space into input space in two dimensions.
   * @instance
   * @private
   */
  unskewFactor: (3 - Math.sqrt(3)) / 6,
  /**
   * Calculates the value at `(x, y)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @returns {Number}
   */
  value: function (xin, yin) {
    const F2 = this.skewFactor,
      G2 = this.unskewFactor

    // Skew input space
    const s = (xin + yin) * F2,
      i = Math.floor(xin + s),
      j = Math.floor(yin + s),
      t = (i + j) * G2

    // Unskew back to input space
    const X0 = i - t,
      Y0 = j - t

    // Deltas within input space
    const x0 = xin - X0,
      y0 = yin - Y0

    // Offsets for corner 1 within skewed space
    const i1 = x0 > y0 ? 1 : 0,
      j1 = x0 > y0 ? 0 : 1

    // Offsets for corner 1 within input space
    const x1 = x0 - i1 + G2,
      y1 = y0 - j1 + G2

    // Offsets for corner 2 within skewed space
    const x2 = x0 - 1 + (2 * G2),
      y2 = y0 - 1 + (2 * G2)

    // Calculate contribution from corner 0
    const t0 = 0.5 - (x0 * x0) - (y0 * y0)
    let n0 = 0

    if (t0 >= 0) {
      const g0 = this.getGradient(i, j)
      // n = (t ** 4) * (g(i,j) dot (x,y))
      n0 = (t0 * t0 * t0 * t0) * ((g0[0] * x0) + (g0[1] * y0))
    }

    // Calculate contribution from corner 1
    const t1 = 0.5 - x1 * x1 - y1 * y1
    let n1 = 0

    if (t1 >= 0) {
      const g1 = this.getGradient(i + i1, j + j1)
      n1 = (t1 * t1 * t1 * t1) * ((g1[0] * x1) + (g1[1] * y1))
    }

    // Calculate contribution from corner 2
    const t2 = 0.5 - x2 * x2 - y2 * y2
    let n2 = 0

    if (t2 >= 0) {
      const g2 = this.getGradient(i + 1, j + 1)
      n2 = (t2 * t2 * t2 * t2) * ((g2[0] * x2) + (g2[1] * y2))
    }

    // Sum and scale contributions
    return syngen.utility.clamp(
      syngen.utility.scale(n0 + n1 + n2, -this.range, this.range, 0, 1),
      0,
      1
    )
  },
}
