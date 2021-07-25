/**
 * Provides an interface for generating seeded three-dimensional OpenSimplex noise.
 * @interface
 * @see syngen.utility.simplex3d.create
 * @todo Document private members
 */
syngen.utility.simplex3d = {}

/**
 * Instantiates a three-dimensional OpenSimplex noise generator.
 * @param {...String} [...seeds]
 * @returns {syngen.utility.simplex3d}
 * @static
 */
syngen.utility.simplex3d.create = function (...seeds) {
  return Object.create(this.prototype).construct(...seeds)
}

syngen.utility.simplex3d.prototype = {
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
   * Generates the gradient at `(x, y, z)` in simplex space.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @private
   */
  generateGradient: function (xin, yin, zin) {
    const srand = syngen.utility.srand('simplex', ...this.seed, xin, yin, zin)

    let x = srand(-1, 1),
      y = srand(-1, 1),
      z = srand(-1, 1)

    const distance = Math.sqrt((x * x) + (y * y) + (z * z))

    if (distance > 1) {
      x /= distance
      y /= distance
      z /= distance
    }

    return [
      x,
      y,
      z,
    ]
  },
  /**
   * Retrieves the gradient at `(x, y, z)` in simplex space.
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
   * This magic number was derived from a brute-force method.
   * @instance
   * @private
   */
  range: 1/107,
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
   * Factor to skew input space into simplex space in three dimensions.
   * @instance
   * @private
   */
  skewFactor: 1/3,
  /**
   * Factor to skew simplex space into input space in three dimensions.
   * @instance
   * @private
   */
  unskewFactor: 1/6,
  /**
   * Calculates the value at `(x, y, z)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @returns {Number}
   */
  value: function (xin, yin, zin) {
    const F3 = this.skewFactor,
      G3 = this.unskewFactor

    // Skew input space
    const s = (xin + yin + zin) * F3,
      i = Math.floor(xin + s),
      j = Math.floor(yin + s),
      k = Math.floor(zin + s),
      t = (i + j + k) * G3

    // Unskew back to input space
    const X0 = i - t,
      Y0 = j - t,
      Z0 = k - t

    // Deltas within input space
    const x0 = xin - X0,
      y0 = yin - Y0,
      z0 = zin - Z0

    // Offsets for corner 1 within skewed space
    let i1, j1, k1

    // Offsets for corner 2 within skewed space
    let i2, j2, k2

    if (x0 >= y0) {
      if (y0 >= z0) {
        i1 = 1
        j1 = 0
        k1 = 0
        i2 = 1
        j2 = 1
        k2 = 0
      } else if (x0 >= z0) {
        i1 = 1
        j1 = 0
        k1 = 0
        i2 = 1
        j2 = 0
        k2 = 1
      } else {
        i1 = 0
        j1 = 0
        k1 = 1
        i2 = 1
        j2 = 0
        k2 = 1
      }
    } else {
      if (y0 < z0) {
        i1 = 0
        j1 = 0
        k1 = 1
        i2 = 0
        j2 = 1
        k2 = 1
      } else if (x0 < z0) {
        i1 = 0
        j1 = 1
        k1 = 0
        i2 = 0
        j2 = 1
        k2 = 1
      } else {
        i1 = 0
        j1 = 1
        k1 = 0
        i2 = 1
        j2 = 1
        k2 = 0
      }
    }

    // Offsets for corner 1 within input space
    const x1 = x0 - i1 + G3,
      y1 = y0 - j1 + G3,
      z1 = z0 - k1 + G3

    // Offsets for corner 2 within input space
    const x2 = x0 - i2 + (2 * G3),
      y2 = y0 - j2 + (2 * G3),
      z2 = z0 - k2 + (2 * G3)

    // Offsets for corner 3 within input space
    const x3 = x0 - 1 + (3 * G3),
      y3 = y0 - 1 + (3 * G3),
      z3 = z0 - 1 + (3 * G3)

    // Calculate contribution from corner 0
    const t0 = 0.5 - (x0 * x0) - (y0 * y0) - (z0 * z0)
    let n0 = 0

    if (t0 >= 0) {
      const g0 = this.getGradient(i, j, k)
      // n = (t ** 4) * (g(i,j,k) dot (x,y,z))
      n0 = (t0 * t0 * t0 * t0) * ((g0[0] * x0) + (g0[1] * y0) + (g0[2] * z0))
    }

    // Calculate contribution from corner 1
    const t1 = 0.5 - (x1 * x1) - (y1 * y1) - (z1 * z1)
    let n1 = 0

    if (t1 >= 0) {
      const g1 = this.getGradient(i + i1, j + j1, k + k1)
      n1 = (t1 * t1 * t1 * t1) * ((g1[0] * x1) + (g1[1] * y1) + (g1[2] * z1))
    }

    // Calculate contribution from corner 2
    const t2 = 0.5 - (x2 * x2) - (y2 * y2) - (z2 * z2)
    let n2 = 0

    if (t2 >= 0) {
      const g2 = this.getGradient(i + i2, j + j2, k + k2)
      n2 = (t2 * t2 * t2 * t2) * ((g2[0] * x2) + (g2[1] * y2) + (g2[2] * z2))
    }

    // Calculate contribution from corner 3
    const t3 = 0.5 - (x3 * x3) - (y3 * y3) - (z3 * z3)
    let n3 = 0

    if (t3 >= 0) {
      const g3 = this.getGradient(i + 1, j + 1, k + 1)
      n3 = (t3 * t3 * t3 * t3) * ((g3[0] * x3) + (g3[1] * y3) + (g3[2] * z3))
    }

    // Sum and scale contributions
    return syngen.utility.clamp(
      syngen.utility.scale(n0 + n1 + n2 + n3, -this.range, this.range, 0, 1),
      0,
      1
    )
  },
}
