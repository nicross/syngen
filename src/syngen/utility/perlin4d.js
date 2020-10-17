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
   * Generates the value at `(x, y, z, t)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {Number} t
   * @private
   */
  generateGradient: function (x, y, z, t) {
    const srand = syngen.utility.srand('perlin', ...this.seed, x, y, z, t)

    if (!this.gradient.has(x)) {
      this.gradient.set(x, new Map())
    }

    const xMap = this.gradient.get(x)

    if (!xMap.has(y)) {
      xMap.set(y, new Map())
    }

    const yMap = xMap.get(y)

    if (!yMap.has(z)) {
      yMap.set(z, new Map())
    }

    yMap.get(z).set(t, [
      srand(-1, 1),
      srand(-1, 1),
      srand(-1, 1),
      srand(-1, 1),
    ])

    return this
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
      dz = z - zi

    return (dt * this.getGradient(xi, yi, zi, ti, 3)) + (dx * this.getGradient(xi, yi, zi, ti, 0)) + (dy * this.getGradient(xi, yi, zi, ti, 1)) + (dz * this.getGradient(xi, yi, zi, ti, 2))
  },
  /**
   * Retrieves the value at `(x, y, z, t)` and index `i`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @private
   * @returns {Number}
   */
  getGradient: function (x, y, z, t, i) {
    if (!this.hasGradient(x, y, z, t)) {
      this.generateGradient(x, y, z, t)
      this.requestPrune(x, y, z, t)
    }

    return this.gradient.get(x).get(y).get(z).get(t)[i]
  },
  /**
   * Returns whether a value exists for `(x, y, z, t)`.
   * @instance
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {Number} t
   * @private
   * @returns {Boolean}
   */
  hasGradient: function (x, y, z, t) {
    const xMap = this.gradient.get(x)

    if (!xMap) {
      return false
    }

    const yMap = xMap.get(y)

    if (!yMap) {
      return false
    }

    const zMap = yMap.get(z)

    if (!zMap) {
      return false
    }

    return zMap.has(t)
  },
  /**
   * Frees memory when usage exceeds the prune threshold.
   * @instance
   * @private
   * @see syngen.utility.perlin4d#pruneThreshold
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

        yMap.forEach((zMap, z) => {
          if (zMap.size >= this.pruneThreshold) {
            return yMap.delete(z)
          }

          zMap.forEach((tMap, t) => {
            if (tMap.size >= this.pruneThreshold) {
              return zMap.delete(t)
            }
          })
        })
      })
    })

    return this
  },
  /**
   * The maximum vertex count before they must be pruned.
   * @instance
   * @private
   */
  pruneThreshold: 10 ** 2,
  /**
   * Range (plus and minus) to scale the output such that it's normalized to `[-1, 1]`.
   * @instance
   * @private
   */
  range: Math.sqrt(4/4),
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

    return syngen.utility.scale(value, -this.range, this.range, 0, 1)
  },
}
