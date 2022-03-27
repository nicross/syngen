syngen.ear.gainModel.realistic = syngen.ear.gainModel.base.extend({
  defaults: {
    power: 2,
  },
  calculate: function (distance) {
    return 1 / (Math.max(1, distance) ** this.options.power)
  },
})
