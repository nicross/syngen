syngen.ear.gainModel.normalize = syngen.ear.gainModel.base.extend({
  defaults: {
    gain: 1,
  },
  calculate: function () {
    return this.options.gain
  },
})
