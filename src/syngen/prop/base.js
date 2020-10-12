/**
 * @interface
 * @property {String} name
 * @property {Number} radius
 * @property {String} token
 * @property {Number} x
 * @property {Number} y
 * @property {Number} z
 */
syngen.prop.base = {
  name: 'base',
  radius: 0,
  /**
   * @method
   * @param {Object} [options]
   * @param {AudioDestinationNode|GainNode} [options.destination=syngen.audio.mixer.bus.props]
   * @param {Number} [options.radius=0]
   * @param {String} [options.token]
   * @param {Number} [options.x=0]
   * @param {Number} [options.y=0]
   * @param {Number} [options.z=0]
   */
  construct: function ({
    destination = syngen.audio.mixer.bus.props(),
    radius,
    token,
    x = 0,
    y = 0,
    z = 0,
    ...options
  } = {}) {
    const context = syngen.audio.context()

    this.instantiated = true
    this.periodic = {}
    this.radius = radius || this.radius || 0
    this.token = token
    this.x = x
    this.y = y
    this.z = z

    this.binaural = syngen.audio.binaural.create()
    this.output = context.createGain()
    this.reverb = syngen.audio.send.reverb.create()

    this.binaural.from(this.output)
    this.binaural.to(destination)

    this.reverb.from(this.output)

    this.output.gain.value = syngen.const.zeroGain
    syngen.audio.ramp.linear(this.output.gain, 1, syngen.const.propFadeDuration)

    syngen.utility.physical.decorate(this)

    this.recalculate()
    this.onConstruct(options)

    return this
  },
  /**
   * @method
   */
  destroy: function () {
    syngen.audio.ramp.linear(this.output.gain, syngen.const.zeroGain, syngen.const.propFadeDuration)

    setTimeout(() => {
      this.output.disconnect()
      this.binaural.destroy()
      this.reverb.destroy()
      this.onDestroy()
    }, syngen.const.propFadeDuration * 1000)

    return this
  },
  /**
   * @method
   */
  invent: function (definition = {}) {
    if (typeof definition == 'function') {
      definition = definition(this)
    }

    return Object.setPrototypeOf({...definition}, this)
  },
  /**
   * @method
   */
  handlePeriodic: function ({
    delay = () => 0,
    key = '',
    trigger = () => Promise.resolve(),
  } = {}) {
    if (!(key in this.periodic)) {
      this.periodic[key] = {
        active: false,
        timer: delay() * Math.random(),
      }
    }

    const periodic = this.periodic[key]

    if (periodic.active) {
      return this
    }

    if (periodic.timer < 0) {
      periodic.timer = delay()
    }

    periodic.timer -= syngen.loop.delta()

    if (periodic.timer <= 0) {
      const result = trigger() || Promise.resolve()
      periodic.active = true
      periodic.timer = -Infinity // XXX: Force delay() next inactive frame
      result.then(() => periodic.active = false)
    }

    return this
  },
  /**
   * @method
   */
  hasPeriodic: function (key) {
    return key in this.periodic
  },
  /**
   * @method
   */
  isPeriodicActive: function (key) {
    return this.periodic[key] && this.periodic[key].active
  },
  /**
   * @method
   */
  isPeriodicPending: function (key) {
    return this.periodic[key] && !this.periodic[key].active
  },
  /**
   * @method
   */
  onConstruct: () => {},
  /**
   * @method
   */
  onDestroy: () => {},
  /**
   * @method
   */
  onUpdate: () => {},
  /**
   * @method
   */
  recalculate: function () {
    const positionQuaternion = syngen.position.getQuaternion(),
      positionVector = syngen.position.getVector()

    this.updatePhysics()

    this.relative = this.vector()
      .subtract(positionVector)
      .subtractRadius(this.radius)
      .rotateQuaternion(positionQuaternion.conjugate())

    this.distance = this.relative.distance()

    this.binaural.update({...this.relative})
    this.reverb.update({...this.relative})

    return this
  },
  /**
   * @method
   */
  rect: function () {
    return {
      height: this.radius * 2,
      width: this.radius * 2,
      x: this.x - this.radius,
      y: this.y - this.radius,
    }
  },
  /**
   * @method
   */
  resetPeriodic: function (key) {
    delete this.periodic[key]
    return this
  },
  /**
   * @method
   */
  update: function ({
    paused,
  } = {}) {
    this.onUpdate.apply(this, arguments)

    if (paused) {
      return this
    }

    this.recalculate()

    return this
  },
}
