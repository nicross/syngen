syngen.ear.gainModel.linear = syngen.ear.gainModel.base.extend({
  defaults: {
    maxDistance: 100,
    maxGain: 1,
    minDistance: 1,
    minGain: syngen.const.zeroGain,
  },
  calculate: function (distance) {
    return syngen.fn.lerp(
      this.options.minGain,
      this.options.maxGain,
      syngen.fn.clamp(
        syngen.fn.scale(distance, this.options.minDistance, this.options.maxDistance, 1, 0)
      )
    )
  },
})
