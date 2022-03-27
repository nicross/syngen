/**
 * Provides an interface for routing audio to the global reverb auxiliary send.
 * Importantly, it models physical space to add pre-delay and attenuate based on distance.
 * @interface
 * @see syngen.mixer.reverb
 * @todo Document private members
 */
syngen.mixer.reverb.send = {}

/**
 * Creates a reverb send.
 * @param {Object} [options]
 * @param {Number} [options.x=0]
 * @param {Number} [options.y=0]
 * @param {Number} [options.z=0]
 * @returns {syngen.mixer.reverb.send}
 * @static
 */
syngen.mixer.reverb.send.create = function (options) {
  return Object.create(this.prototype).construct(options)
}

syngen.mixer.reverb.send.prototype = {
  /**
   * Initializes the instance.
   * @instance
   * @private
   */
  construct: function ({
    gainModel = syngen.mixer.reverb.gainModel.bell,
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    const context = syngen.context()

    this.delay = context.createDelay()
    this.gainModel = gainModel
    this.input = context.createGain()
    this.relative = syngen.tool.vector3d.create()
    this.send = syngen.mixer.reverb.createBus()

    this.send.gain.value = syngen.const.zeroGain

    this.onSendActivate = this.onSendActivate.bind(this)
    syngen.mixer.reverb.on('activate', this.onSendActivate)

    this.onSendDeactivate = this.onSendDeactivate.bind(this)
    syngen.mixer.reverb.on('deactivate', this.onSendDeactivate)

    if (syngen.mixer.reverb.isActive()) {
      this.onSendActivate()
    } else {
      this.onSendDeactivate()
    }

    this.update({
      x,
      y,
      z,
    })

    return this
  },
  /**
   * Prepares the instance for garbage collection.
   * Immediately disconnects from all inputs and outputs.
   * @instance
   */
  destroy: function () {
    syngen.mixer.reverb.off('activate', this.onSendActivate)
    syngen.mixer.reverb.off('deactivate', this.onSendDeactivate)
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
   * @listens syngen.mixer.reverb#event:activate
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
   * @listens syngen.mixer.reverb#event:activate
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

    if (!syngen.mixer.reverb.isActive()) {
      return this
    }

    const distance = this.relative.distance()

    const delayTime = syngen.fn.clamp(distance / syngen.const.speedOfSound, syngen.const.zeroTime, 1),
      gain = this.gainModel.calculate(distance)

    syngen.fn.setParam(this.delay.delayTime, delayTime)
    syngen.fn.setParam(this.send.gain, gain)

    return this
  },
}
