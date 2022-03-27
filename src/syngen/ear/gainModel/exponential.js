syngen.ear.gainModel.exponential = syngen.ear.gainModel.base.extend({
  defaults: {
    maxDistance: 100,
    maxGain: 1,
    minDistance: 1,
    minGain: syngen.const.zeroGain,
    power: 2,
  },
  calculate: function (distance) {
    return syngen.fn.lerpExp(
      this.options.minGain,
      this.options.maxGain,
      syngen.fn.clamp(
        syngen.fn.scale(distance, this.options.minDistance, this.options.maxDistance, 1, 0)
      ),
      this.options.power
    )
  },
})
