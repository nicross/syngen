/**
 * Provides an interface for generating seeded one-dimensional noise.
 * Despite its name, it's not technically Perlin noise; rather, it interpolates between random values along the number line.
 * @interface
 * @see syngen.utility.perlin1d.create
 * @todo Document private members
 */
syngen.utility.perlin1d = {}

/**
 * Instantiates a one-dimensional noise generator.
 * @param {...String} [...seeds]
 * @returns {syngen.utility.perlin1d}
 * @static
 */
syngen.utility.perlin1d.create = function (...seeds) {
  return Object.create(this.prototype).construct(...seeds)
}

syngen.utility.perlin1d.prototype = {
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
   * Generates the value at `x`.
   * @instance
   * @param {Number} x
   * @private
   */
  generateGradient: function (x) {
    const srand = syngen.utility.srand('perlin', ...this.seed, x)

    return srand(0, 1)
  },
  /**
   * Retrieves the value at `x`.
   * @instance
   * @param {Number} x
   * @private
   * @returns {Number}
   */
  getGradient: function (x) {
    let gradient = this.gradient.get(x)

    if (!gradient) {
      gradient = this.generateGradient(x)
      this.gradient.set(x, gradient)
    }

    return gradient
  },
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
   * Calculates the value at `x`.
   * @instance
   * @param {Number} x
   * @returns {Number}
   */
  value: function (x) {
    const x0 = Math.floor(x),
      x1 = x0 + 1

    const dx = this.smooth(x - x0),
      v0 = this.getGradient(x0),
      v1 = this.getGradient(x1)

    return syngen.utility.lerp(v0, v1, dx)
  },
}
