syngen.ear.gainModel.logarithmic = syngen.ear.gainModel.base.extend({
  defaults: {
    base: 10,
    maxDistance: 100,
    maxGain: 1,
    minDistance: 1,
    minGain: syngen.const.zeroGain,
  },
  calculate: function (distance) {
    return syngen.fn.lerpLog(
      this.options.minGain,
      this.options.maxGain,
      syngen.fn.clamp(
        syngen.fn.scale(distance, this.options.minDistance, this.options.maxDistance, 1, 0)
      ),
      this.options.base
    )
  },
})
