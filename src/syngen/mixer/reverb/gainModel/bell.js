syngen.mixer.reverb.gainModel.bell = syngen.mixer.reverb.gainModel.base.extend({
  defaults: {
    bellPower: 0.75,
    distancePower: 2,
  },
  calculate: function (distance) {
    const gain = Math.min(1 / (distance ** this.options.distancePower), syngen.fn.fromDb(-1))
    return syngen.fn.clamp((gain ** this.options.bellPower) * (1 - (gain ** this.options.bellPower)), syngen.const.zeroGain, 1)
  },
})
