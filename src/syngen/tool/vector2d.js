/**
 * Provides an interface for two-dimensional vectors with x-y coordinates.
 * @interface
 * @see syngen.tool.vector2d.create
 */
syngen.tool.vector2d = {}

/**
 * Instantiates a new two-dimensional vector.
 * @param {syngen.tool.vector2d|Object} [options={}]
 * @param {Number} [options.x=0]
 * @param {Number} [options.y=0]
 * @returns {syngen.tool.vector2d}
 * @static
 */
syngen.tool.vector2d.create = function (options = {}) {
  return Object.create(this.prototype).construct(options)
}

syngen.tool.vector2d.prototype = {
  /**
   * Adds `vector` to this and returns their sum as a new instance.
   * @instance
   * @param {syngen.tool.vector2d|Object} [vector]
   * @returns {syngen.tool.vector2d|Object}
   */
  add: function ({
    x = 0,
    y = 0,
  } = {}) {
    return syngen.tool.vector2d.create({
      x: this.x + x,
      y: this.y + y,
    })
  },
  /**
   * Calculates the angle between this and the positive x-axis, in radians.
   * @instance
   * @returns {Number}
   */
  angle: function () {
    return Math.atan2(this.y, this.x)
  },
  /**
   * Returns a new instance with the same properties.
   * @instance
   * @returns {syngen.tool.vector2d}
   */
  clone: function () {
    return syngen.tool.vector2d.create(this)
  },
  /**
   * Initializes the instance with `options`.
   * @instance
   * @param {syngen.tool.vector2d|Object} [options={}]
   * @private
   */
  construct: function ({
    x = 0,
    y = 0,
  } = {}) {
    this.x = x
    this.y = y
    return this
  },
  /**
   * Calculates the cross product with `vector`.
   * This operation is noncommunicative.
   * @instance
   * @param {syngen.tool.vector2d|Object} [vector]
   * @returns {Number}
   */
  crossProduct: function ({
    x = 0,
    y = 0,
  } = {}) {
    return (this.x * y) - (this.y * x)
  },
  /**
   * Calculates the Euclidean distance from `vector`.
   * @instance
   * @param {syngen.tool.vector2d|Object} [vector]
   * @returns {Number}
   */
  distance: function ({
    x = 0,
    y = 0,
  } = {}) {
    return Math.sqrt(((this.x - x) ** 2) + ((this.y - y) ** 2))
  },
  /**
   * Calculates the squared Euclidean distance from `vector`.
   * @instance
   * @param {syngen.tool.vector2d|Object} [vector]
   * @returns {Number}
   */
  distance2: function ({
    x = 0,
    y = 0,
  } = {}) {
    return ((this.x - x) ** 2) + ((this.y - y) ** 2)
  },
  /**
   * Calculates the dot product with `vector`.
   * @instance
   * @param {syngen.tool.vector2d|Object} [vector]
   * @returns {Number}
   */
  dotProduct: function ({
    x = 0,
    y = 0,
  } = {}) {
    return (this.x * x) + (this.y * y)
  },
  /**
   * Returns whether this is equal to `vector`.
   * @instance
   * @param {syngen.tool.vector2d|Object} [vector]
   * @returns {Boolean}
   */
  equals: function ({
    x = 0,
    y = 0,
  } = {}) {
    return (this.x == x) && (this.y == y)
  },
  /**
   * Returns the inverse vector as a new instance.
   * @instance
   * @returns {syngen.tool.vector2d}
   */
  inverse: function () {
    return syngen.tool.vector2d.create({
      x: -this.x,
      y: -this.y,
    })
  },
  /**
   * Returns whether this represents the origin.
   * @instance
   * @returns {Boolean}
   */
  isZero: function () {
    return !this.x && !this.y
  },
  /**
   * Scales this by its distance to return a unit vector as a new instance.
   * @instance
   * @returns {syngen.tool.vector2d}
   */
  normalize: function () {
    const distance = this.distance()

    if (!distance) {
      return this.clone()
    }

    return this.scale(1 / distance)
  },
  /**
   * Rotates by `angle`, in radians, and returns it as a new instance.
   * @instance
   * @param {Number} [angle=0]
   * @returns {syngen.tool.vector2d}
   */
  rotate: function (angle = 0) {
    if (angle == 0) {
      return this.clone()
    }

    const cos = Math.cos(angle),
      sin = Math.sin(angle)

    return syngen.tool.vector2d.create({
      x: (this.x * cos) - (this.y * sin),
      y: (this.y * cos) + (this.x * sin),
    })
  },
  /**
   * Multiplies this by `scalar` and returns it as a new instance.
   * @instance
   * @param {Number} [scalar=0]
   * @returns {syngen.tool.vector2d}
   */
  scale: function (scalar = 0) {
    return syngen.tool.vector2d.create({
      x: this.x * scalar,
      y: this.y * scalar,
    })
  },
  /**
   * Sets all properties with `options`.
   * @instance
   * @param {syngen.tool.vector2d|Object} [options]
   * @param {Number} [options.x=0]
   * @param {Number} [options.y=0]
   */
  set: function ({
    x = 0,
    y = 0,
  } = {}) {
    this.x = x
    this.y = y
    return this
  },
  /**
   * Subtracts `vector` from this and returns their difference as a new instance.
   * @instance
   * @param {syngen.tool.vector2d|Object} [vector]
   * @returns {syngen.tool.vector2d|Object}
   */
  subtract: function ({
    x = 0,
    y = 0,
  } = {}) {
    return syngen.tool.vector2d.create({
      x: this.x - x,
      y: this.y - y,
    })
  },
  /**
   * Subtracts a circular radius from this and returns it as a new instance.
   * @instance
   * @param {Number} [radius=0]
   * @returns {syngen.tool.vector2d}
   */
  subtractRadius: function (radius = 0) {
    if (radius <= 0) {
      return this.clone()
    }

    const distance = this.distance()

    if (radius >= distance) {
      return syngen.tool.vector2d.create()
    }

    return this.multiply(1 - (radius / distance))
  },
  /**
   * Position along the x-axis.
   * @instance
   * @type {Number}
   */
  x: 0,
  /**
   * Position along the y-axis.
   * @instance
   * @type {Number}
   */
  y: 0,
  /**
   * Returns a copy of the vector with the x-component removed.
   * @instance
   * @returns {syngen.tool.vector2d}
   */
  zeroX: function () {
    return syngen.tool.vector2d.create({
      y: this.y,
    })
  },
  /**
   * Returns a copy of the vector with the y-component removed.
   * @instance
   * @returns {syngen.tool.vector2d}
   */
  zeroY: function () {
    return syngen.tool.vector2d.create({
      x: this.x,
    })
  },
}

/**
 * Instantiates a unit vector along the x-axis.
 * @returns {syngen.tool.vector2d}
 * @static
 */
syngen.tool.vector2d.unitX = function () {
  return Object.create(this.prototype).construct({
    x: 1,
  })
}

/**
 * Instantiates a unit vector along the y-axis.
 * @returns {syngen.tool.vector2d}
 * @static
 */
syngen.tool.vector2d.unitY = function () {
  return Object.create(this.prototype).construct({
    y: 1,
  })
}
