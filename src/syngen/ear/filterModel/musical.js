syngen.ear.filterModel.musical = syngen.ear.filterModel.base.extend({
  defaults: {
    coneRadius: Math.PI / 4,
    frequency: 440,
    maxColor: 8,
    minColor: 1,
    power: 2,
  },
  calculate: function (dotProduct) {
    return Math.min(syngen.fn.lerpExp(
      this.options.frequency * this.options.minColor,
      this.options.frequency * this.options.maxColor,
      syngen.fn.clamp(syngen.fn.scale(dotProduct, -1, Math.sin(this.options.coneRadius), 0, 1)),
      this.options.power
    ), syngen.const.maxFrequency)
  },
})
