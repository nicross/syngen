syngen.mixer.reverb.gainModel.normalize = syngen.mixer.reverb.gainModel.base.extend({
  defaults: {
    gain: 1,
  },
  calculate: function () {
    return this.options.gain
  },
})
