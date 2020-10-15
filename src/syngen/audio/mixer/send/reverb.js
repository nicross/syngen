/**
 * Provides an interface for routing audio to the global reverb auxiliary send.
 * Importantly, it models physical space to add pre-delay and attenuate based on distance.
 * @interface
 * @see syngen.audio.mixer.auxiliary.reverb
 * @todo Document private members
 */
syngen.audio.mixer.send.reverb = {}

/**
 * Creates a reverb send.
 * @returns {syngen.audio.mixer.send.reverb}
 * @static
 */
syngen.audio.mixer.send.reverb.create = function () {
  return Object.create(this.prototype).construct()
}

syngen.audio.mixer.send.reverb.prototype = {
  /**
   * Initializes the instance.
   * @instance
   * @private
   */
  construct: function () {
    const context = syngen.audio.context()

    this.delay = context.createDelay()
    this.input = context.createGain()
    this.relative = syngen.utility.vector3d.create()
    this.send = syngen.audio.mixer.auxiliary.reverb.createSend()

    this.input.gain.value = syngen.const.zeroGain

    this.onSendActivate = this.onSendActivate.bind(this)
    syngen.audio.mixer.auxiliary.reverb.on('activate', this.onSendActivate)

    this.onSendDeactivate = this.onSendDeactivate.bind(this)
    syngen.audio.mixer.auxiliary.reverb.on('deactivate', this.onSendDeactivate)

    if (syngen.audio.mixer.auxiliary.reverb.isActive()) {
      this.onSendActivate()
    } else {
      this.onSendDeactivate()
    }

    return this
  },
  /**
   * Prepares the instance for garbage collection.
   * Immediately disconnects from all inputs and outputs.
   * @instance
   */
  destroy: function () {
    syngen.audio.mixer.auxiliary.reverb.off('activate', this.onSendActivate)
    syngen.audio.mixer.auxiliary.reverb.off('deactivate', this.onSendDeactivate)
    this.send.disconnect()
    return this
  },
  /**
   * Connects `input` to this.
   * @instance
   */
  from: function (input) {
    input.connect(this.input)
    return this
  },
  /**
   * Handles whenever the auxiliary send activates.
   * @instance
   * @listens syngen.audio.mixer.auxiliary.reverb#event:activate
   * @private
   */
  onSendActivate: function () {
    this.update(this.relative)
    this.input.connect(this.delay)
    this.delay.connect(this.send)
    return this
  },
  /**
   * Handles whenever the auxiliary send deactivates.
   * @instance
   * @listens syngen.audio.mixer.auxiliary.reverb#event:activate
   * @private
   */
  onSendDeactivate: function () {
    this.input.disconnect()
    this.delay.disconnect()
    return this
  },
  /**
   * Updates the circuit with `options` relative to an observer at the origin.
   * @instance
   * @param {Object} [options={}]
   * @param {Number} [options.x=0]
   * @param {Number} [options.y=0]
   * @param {Number} [options.z=0]
   * @todo Assess whether it'd be better to simply pass the distance
   */
  update: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    this.relative.set({
      x,
      y,
      z,
    })

    if (!syngen.audio.mixer.auxiliary.reverb.isActive()) {
      return this
    }

    const distance = this.relative.distance(),
      power = syngen.utility.distanceToPower(distance)

    const delayTime = syngen.utility.clamp(distance / syngen.const.speedOfSound, syngen.const.zeroTime, 1),
      inputGain = syngen.utility.clamp((1 - (power ** 0.25)) * power, syngen.const.zeroGain, 1)

    syngen.audio.ramp.set(this.delay.delayTime, delayTime)
    syngen.audio.ramp.set(this.input.gain, inputGain)

    return this
  },
}
