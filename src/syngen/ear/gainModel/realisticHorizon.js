syngen.ear.gainModel.realisticHorizon = syngen.ear.gainModel.base.extend({
  defaults: {
    horizonPower: 1/2,
    maxDistance: 100,
    minDistance: 1,
    power: 2,
  },
  calculate: function (distance) {
    const gain = 1 / (Math.max(this.options.minDistance, distance) ** this.options.power)

    const horizon = syngen.fn.clamp(
      syngen.fn.scale(distance, this.options.minDistance, this.options.maxDistance, 1, 0)
    ) ** this.options.horizonPower

    return gain * horizon
  },
})
