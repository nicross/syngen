/**
 * Provides an interface for generating seeded four-dimensional OpenSimplex noise.
 * @interface
 * @see syngen.utility.simplex4d.create
 * @todo Document private members
 */
syngen.utility.simplex4d = {}

/**
 * Instantiates a four-dimensional OpenSimplex noise generator.
 * @param {...String} [...seeds]
 * @returns {syngen.utility.simplex4d}
 * @static
 */
syngen.utility.simplex4d.create = function (...seeds) {
  return Object.create(this.prototype).construct(...seeds)
}

syngen.utility.simplex4d.prototype = {
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
   * Generates the gradient at `(x, y, z, w)` in simplex space.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @private
   */
  generateGradient: function (xin, yin, zin, win) {
    const srand = syngen.utility.srand('simplex', ...this.seed, xin, yin, zin, win)

    let x = srand(-1, 1),
      y = srand(-1, 1),
      z = srand(-1, 1),
      w = srand(-1, 1)

    const distance = Math.sqrt((x * x) + (y * y) + (z * z) + (w * w))

    if (distance > 1) {
      x /= distance
      y /= distance
      z /= distance
      w /= distance
    }

    return [
      x,
      y,
      z,
      w,
    ]
  },
  /**
   * Retrieves the gradient at `(x, y, z, w)` in simplex space.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {Number} w
   * @private
   * @returns {Number}
   */
  getGradient: function (x, y, z, w) {
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

    let gradient = zMap.get(w)

    if (!gradient) {
      gradient = this.generateGradient(x, y, z, w)
      zMap.set(w, gradient)
    }

    return gradient
  },
  /**
   * Range (plus and minus) to scale the output such that it's normalized to `[0, 1]`.
   * This magic number was derived from a brute-force method.
   * @instance
   * @private
   */
  range: 1/108,
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
   * Factor to skew input space into simplex space in four dimensions.
   * @instance
   * @private
   */
  skewFactor: (Math.sqrt(5) - 1) / 4,
  /**
   * Factor to skew simplex space into input space in four dimensions.
   * @instance
   * @private
   */
  unskewFactor: (5 - Math.sqrt(5)) / 20,
  /**
   * Calculates the value at `(x, y, z, w)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {Number} w
   * @returns {Number}
   */
  value: function (xin, yin, zin, win) {
    const F4 = this.skewFactor,
      G4 = this.unskewFactor

    // Skew input space
    const s = (xin + yin + zin + win) * F4,
      i = Math.floor(xin + s),
      j = Math.floor(yin + s),
      k = Math.floor(zin + s),
      l = Math.floor(win + s),
      t = (i + j + k + l) * G4

    // Unskew back to input space
    const X0 = i - t,
      Y0 = j - t,
      Z0 = k - t,
      W0 = l - t

    // Deltas within input space
    const x0 = xin - X0,
      y0 = yin - Y0,
      z0 = zin - Z0,
      w0 = win - W0

    // Rank coordinates
    let rankx = 0,
      ranky = 0,
      rankz = 0,
      rankw = 0

    if (x0 > y0) {
      rankx++
    } else {
      ranky++
    }

    if (x0 > z0) {
      rankx++
    } else {
      rankz++
    }

    if (x0 > w0) {
      rankx++
    } else {
      rankw++
    }

    if (y0 > z0) {
      ranky++
    } else {
      rankz++
    }

    if (y0 > w0) {
      ranky++
    } else {
      rankw++
    }

    if (z0 > w0) {
      rankz++
    } else {
      rankw++
    }

    // Offsets for corner 1 within skewed space
    const i1 = rankx >= 3 ? 1 : 0,
      j1 = ranky >= 3 ? 1 : 0,
      k1 = rankz >= 3 ? 1 : 0,
      l1 = rankw >= 3 ? 1 : 0

    // Offsets for corner 2 within skewed space
    const i2 = rankx >= 2 ? 1 : 0,
      j2 = ranky >= 2 ? 1 : 0,
      k2 = rankz >= 2 ? 1 : 0,
      l2 = rankw >= 2 ? 1 : 0

    // Offsets for corner 3 within skewed space
    const i3 = rankx >= 1 ? 1 : 0,
      j3 = ranky >= 1 ? 1 : 0,
      k3 = rankz >= 1 ? 1 : 0,
      l3 = rankw >= 1 ? 1 : 0

    // Offsets for corner 1 within input space
    const x1 = x0 - i1 + G4,
      y1 = y0 - j1 + G4,
      z1 = z0 - k1 + G4,
      w1 = w0 - l1 + G4

    // Offsets for corner 2 within input space
    const x2 = x0 - i2 + (2 * G4),
      y2 = y0 - j2 + (2 * G4),
      z2 = z0 - k2 + (2 * G4),
      w2 = w0 - l2 + (2 * G4)

    // Offsets for corner 3 within input space
    const x3 = x0 - i3 + (3 * G4),
      y3 = y0 - j3 + (3 * G4),
      z3 = z0 - k3 + (3 * G4),
      w3 = w0 - l3 + (3 * G4)

    // Offsets for corner 4 within input space
    const x4 = x0 - 1 + (4 * G4),
      y4 = y0 - 1 + (4 * G4),
      z4 = z0 - 1 + (4 * G4),
      w4 = w0 - 1 + (4 * G4)

    // Calculate contribution from corner 0
    const t0 = 0.5 - (x0 * x0) - (y0 * y0) - (z0 * z0) - (w0 * w0)
    let n0 = 0

    if (t0 >= 0) {
      const g0 = this.getGradient(i, j, k, l)
      // n = (t ** 4) * (g(i,j,k,l) dot (x,y,z,w))
      n0 = (t0 * t0 * t0 * t0) * ((g0[0] * x0) + (g0[1] * y0) + (g0[2] * z0) + (g0[3] * w0))
    }

    // Calculate contribution from corner 1
    const t1 = 0.5 - (x1 * x1) - (y1 * y1) - (z1 * z1) - (w1 * w1)
    let n1 = 0

    if (t1 >= 0) {
      const g1 = this.getGradient(i + i1, j + j1, k + k1, l + l1)
      n1 = (t1 * t1 * t1 * t1) * ((g1[0] * x1) + (g1[1] * y1) + (g1[2] * z1) + (g1[3] * w1))
    }

    // Calculate contribution from corner 2
    const t2 = 0.5 - (x2 * x2) - (y2 * y2) - (z2 * z2) - (w2 * w2)
    let n2 = 0

    if (t2 >= 0) {
      const g2 = this.getGradient(i + i2, j + j2, k + k2, l + l2)
      n2 = (t2 * t2 * t2 * t2) * ((g2[0] * x2) + (g2[1] * y2) + (g2[2] * z2) + (g2[3] * w2))
    }

    // Calculate contribution from corner 3
    const t3 = 0.5 - (x3 * x3) - (y3 * y3) - (z3 * z3) - (w3 * w3)
    let n3 = 0

    if (t3 >= 0) {
      const g3 = this.getGradient(i + i3, j + j3, k + k3, l + l3)
      n3 = (t3 * t3 * t3 * t3) * ((g3[0] * x3) + (g3[1] * y3) + (g3[2] * z3) + (g3[3] * w3))
    }

    // Calculate contribution from corner 4
    const t4 = 0.5 - (x4 * x4) - (y4 * y4) - (z4 * z4) - (w4 * w4)
    let n4 = 0

    if (t4 >= 0) {
      const g4 = this.getGradient(i + 1, j + 1, k + 1, l + 1)
      n4 = (t4 * t4 * t4 * t4) * ((g4[0] * x4) + (g4[1] * y4) + (g4[2] * z4) + (g4[3] * w4))
    }

    // Sum and scale contributions
    return syngen.utility.clamp(
      syngen.utility.scale(n0 + n1 + n2 + n3 + n4, -this.range, this.range, 0, 1),
      0,
      1
    )
  },
}
