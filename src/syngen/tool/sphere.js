syngen.tool.sphere = {}

syngen.tool.sphere.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.tool.sphere.prototype = {
  construct: function ({
    center,
    radius = 0,
  } = {}) {
    this.center = syngen.tool.vector3d.create(center)
    this.radius = radius

    return this
  },
  containsPoint: function (point) {
    return this.center.distance(point) <= this.radius
  },
  containsSphere: function (center, radius) {
    // XXX: Includes intersections
    return this.center.distance(center) <= (this.radius + radius)
  },
}
