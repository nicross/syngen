syngen.tool.plane = {}

syngen.tool.plane.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.tool.plane.prototype = {
  construct: function ({
    constant = 0,
    normal,
  } = {}) {
    this.constant = constant
    this.normal = syngen.tool.vector3d.create(normal)

    this.normalize()

    return this
  },
  distanceToPoint: function (point) {
    return this.normal.dotProduct(point) - this.constant
  },
  normalize: function () {
    const distance = this.normal.distance()

    if (!distance || distance == 1) {
      return this
    }

    const inverse = 1 / distance

    this.constant *= inverse
    this.normal = this.normal.scale(inverse)

    return this
  },
}
