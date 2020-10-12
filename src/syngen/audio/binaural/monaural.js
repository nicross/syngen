/**
 * @interface
 */
syngen.audio.binaural.monaural = {}

/**
 * @static
 */
syngen.audio.binaural.monaural.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.audio.binaural.monaural.prototype = {
  /**
   * @instance
   */
  construct: function ({
    pan = 0,
  }) {
    const context = syngen.audio.context()

    this.panSign = syngen.utility.sign(pan)
    this.angleOffset = -this.panSign * Math.PI / 2

    this.filter = context.createBiquadFilter()
    this.gain = context.createGain()

    this.filter.frequency.value = syngen.const.maxFrequency
    this.gain.gain.value = syngen.const.zeroGain

    this.delay = context.createDelay()
    this.gain.connect(this.delay)
    this.delay.connect(this.filter)

    return this
  },
  /**
   * @instance
   */
  destroy: function () {
    this.filter.disconnect()
    return this
  },
  /**
   * @instance
   */
  from: function (input, ...args) {
    input.connect(this.gain, ...args)
    return this
  },
  /**
   * @instance
   */
  to: function (output, ...args) {
    this.filter.connect(output, ...args)
    return this
  },
  /**
   * @instance
   */
  update: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    // NOTE: Observer is facing 0° at (0, 0)
    const ear = syngen.utility.vector3d.create({
      x,
      y: y + (this.panSign * syngen.const.binauralHeadWidth / 2),
      z,
    }).rotateEuler({yaw: this.angleOffse})

    const distance = ear.distance(),
      distancePower = syngen.utility.distanceToPower(distance)

    const shadow = ear.rotateEuler({
      yaw: this.panSign * syngen.const.binauralShadowOffset,
    }).euler()

    // TODO: Simulate shadow as a 3D cone?
    const shadowCos = Math.cos(shadow.yaw)
    const isAhead = shadowCos > 0

    const shadowTarget = isAhead
      ? syngen.utility.lerp(0.75, 1, shadowCos)
      : syngen.utility.lerp(0, 0.75, 1 + shadowCos)

    const shadowRolloff = syngen.utility.clamp(syngen.utility.scale(distance, 0, syngen.const.binauralShadowRolloff, 0, 1), 0, 1),
      shadowStrength = syngen.utility.lerp(1, shadowTarget, shadowRolloff)

    const delayTime = Math.min(1, distance / syngen.const.speedOfSound),
      filterFrequency = syngen.utility.lerpExp(syngen.const.acousticShadowFrequency, syngen.const.maxFrequency, shadowStrength),
      inputGain = syngen.utility.clamp(distancePower, syngen.const.zeroGain, 1)

    syngen.audio.ramp.set(this.delay.delayTime, delayTime)
    syngen.audio.ramp.set(this.filter.frequency, filterFrequency)
    syngen.audio.ramp.set(this.gain.gain, inputGain)

    return this
  },
}
