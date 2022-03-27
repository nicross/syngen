syngen.ear.filterModel.head = syngen.ear.filterModel.base.extend({
  defaults: {
    coneRadius: Math.PI / 4,
    power: 1,
    width: 0.1524,
  },
  calculate: function (dotProduct) {
    return syngen.fn.lerpExp(
      syngen.const.speedOfSound / this.options.width,
      syngen.const.maxFrequency,
      syngen.fn.clamp(syngen.fn.scale(dotProduct, -1, Math.sin(this.options.coneRadius), 0, 1)),
      this.options.power
    )
  },
})
