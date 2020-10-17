/**
 * Provides an interface for processing audio as an observer in a physical space.
 * Importantly, it models interaural intensity differences, interaural arrival time, and acoustic shadow.
 * Implementations are currently discouraged from using this directly.
 * @interface
 * @todo Document private members
 */
syngen.audio.binaural.monaural = {}

/**
 * Instantiates a monaural processor.
 * @param {Object} [options={}]
 * @param {Number} [options.pan=0]
 *   Between `[-1, 1]` representing hard-left to hard-right.
 * @returns {syngen.audio.binaural.monaural}
 * @static
 */
syngen.audio.binaural.monaural.create = function (options) {
  return Object.create(this.prototype).construct(options)
}

syngen.audio.binaural.monaural.prototype = {
  /**
   * Initializes the instance.
   * @instance
   * @private
   */
  construct: function ({
    pan = 0,
  }) {
    const context = syngen.audio.context()

    this.panSign = syngen.utility.sign(pan)
    this.angleOffset = -this.panSign * Math.PI / 2

    this.delay = context.createDelay()
    this.filter = context.createBiquadFilter()
    this.gain = context.createGain()

    this.filter.frequency.value = syngen.const.maxFrequency
    this.gain.gain.value = syngen.const.zeroGain

    this.delay.connect(this.filter)
    this.filter.connect(this.gain)

    return this
  },
  /**
   * Prepares the instance for garbage collection.
   * @instance
   */
  destroy: function () {
    return this
  },
  /**
   * Connects `input` to this with additional `...args`.
   * @instance
   * @param {AudioNode} input
   * @param {...*} [...args]
   */
  from: function (input, ...args) {
    input.connect(this.delay, ...args)
    return this
  },
  /**
   * Connects this to `output` with additional `...args`.
   * @instance
   * @param {AudioNode} output
   * @param {...*} [...args]
   */
  to: function (output, ...args) {
    this.gain.connect(output, ...args)
    return this
  },
  /**
   * Updates the internal circuit with `options` relative to an observer facing 0° at the origin.
   * @instance
   * @param {Object} [options={}]
   * @param {ONumber} [options.x=0]
   * @param {ONumber} [options.y=0]
   * @param {ONumber} [options.z=0]
   * @todo Model acoustic shadow as a three-dimensional cone or hemisphere
   * @todo Simplify so {@link syngen.audio.binaural#update} positions and orients each ear before calling
   */
  update: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
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
