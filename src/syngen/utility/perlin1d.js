/**
 * @interface
 * @property {Number} pruneThreshold=10**4
 */
syngen.utility.perlin1d = {}

/**
 * @static
 */
syngen.utility.perlin1d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.utility.perlin1d.prototype = {
  /**
   * @instance
   */
  construct: function (...seeds) {
    this.gradient = new Map()
    this.seed = seeds.join(syngen.const.seedSeparator)
    return this
  },
  /**
   * @instance
   */
  generateGradient: function (x) {
    const srand = syngen.utility.srand('perlin', this.seed, x)
    this.gradient.set(x, srand(0, 1))
    return this
  },
  /**
   * @instance
   */
  getGradient: function (x) {
    if (!this.hasGradient(x)) {
      this.generateGradient(x)
      this.requestPrune()
    }

    return this.gradient.get(x)
  },
  /**
   * @instance
   */
  hasGradient: function (x) {
    return this.gradient.has(x)
  },
  /**
   * @instance
   */
  prune: function () {
    if (this.gradient.size >= this.pruneThreshold) {
      this.gradient.clear()
    }

    return this
  },
  pruneThreshold: 10 ** 4,
  /**
   * @instance
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
   * @instance
   */
  value: function (x) {
    const x0 = Math.floor(x),
      x1 = x0 + 1

    const dx = x - x0,
      v0 = this.getGradient(x0),
      v1 = this.getGradient(x1)

    return syngen.utility.lerp(v0, v1, dx)
  },
}
