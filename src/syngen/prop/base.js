syngen.prop.base = {
  name: 'base',
  radius: 0,
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
  invent: function (definition = {}) {
    if (typeof definition == 'function') {
      definition = definition(this)
    }

    return Object.setPrototypeOf({...definition}, this)
  },
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
  hasPeriodic: function (key) {
    return key in this.periodic
  },
  isPeriodicActive: function (key) {
    return this.periodic[key] && this.periodic[key].active
  },
  isPeriodicPending: function (key) {
    return this.periodic[key] && !this.periodic[key].active
  },
  onConstruct: () => {},
  onDestroy: () => {},
  onUpdate: () => {},
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
  rect: function () {
    return {
      height: this.radius * 2,
      width: this.radius * 2,
      x: this.x - this.radius,
      y: this.y - this.radius,
    }
  },
  resetPeriodic: function (key) {
    delete this.periodic[key]
    return this
  },
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
