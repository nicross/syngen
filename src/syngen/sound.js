syngen.sound = {
  // Attributes
  destination: syngen.mixer.input(),
  fadeInDuration: syngen.const.zeroTime,
  fadeOutDuration: syngen.const.zeroTime,
  filterModel: syngen.ear.filterModel.head,
  gainModel: syngen.ear.gainModel.exponential,
  radius: 0,
  relative: false, // whether coordinate space is relative (true) or global (false)
  reverb: false, // whether to use a reverb send
  reverbGainModel: syngen.mixer.reverb.gainModel.linearBell,
  // Static methods
  extend: function (definition) {
    return syngen.fn.extend(this, definition)
  },
  instantiate: function (options, ...args) {
    return Object.create(this).construct(options, ...args)
  },
  // Instance methods
  construct: function ({
    destination = this.destination,
    fadeInDuration = this.fadeInDuration,
    fadeOutDuration = this.fadeOutDuration,
    filterModel = this.filterModel,
    gainModel = this.gainModel,
    radius = this.radius,
    relative = this.relative,
    reverb = this.reverb,
    reverbGainModel = this.reverbGainModel,
    x = 0,
    y = 0,
    z = 0,
    ...options
  } = {}, ...args) {
    const context = syngen.context()

    // Allow instances to override inherited properties
    this.destination = destination
    this.fadeInDuration = fadeInDuration
    this.fadeOutDuration = fadeOutDuration
    this.filterModel = filterModel.instantiate()
    this.gainModel = gainModel.instantiate()
    this.radius = radius
    this.relative = relative
    this.reverb = reverb

    // Set position in space
    this.vector = syngen.tool.vector3d.create({
      x,
      y,
      z,
    })

    const relativeVector = this.getRelativeVector()

    // Routing
    this.output = context.createGain()

    this.binaural = syngen.ear.binaural.create({
      filterModel: this.filterModel,
      gainModel: this.gainModel,
      ...relativeVector,
    }).from(this.output).to(destination)

    if (this.reverb) {
      this.reverb = syngen.mixer.reverb.send.create({
        gainModel: reverbGainModel,
        ...relativeVector,
      }).from(this.output)
    }

    // Fade gain in
    this.output.gain.value = syngen.const.zeroGain
    syngen.fn.rampLinear(this.output.gain, 1, this.fadeInDuration)

    // Start updating each frame
    this.update = this.update.bind(this)
    syngen.loop.on('frame', this.update)

    // Tell extending sounds that we're done here
    this.onConstruct(options, ...args)

    return this
  },
  destroy: function () {
    // Stop update each frame
    syngen.loop.off('frame', this.update)

    // Fade gain out
    syngen.fn.rampLinear(this.output.gain, syngen.const.zeroGain, this.fadeOutDuration)

    // Teardown after fade
    syngen.fn.promise(this.fadeOutDuration * 1000).then(() => {
      this.output.disconnect()
      this.binaural.destroy()

      if (this.reverb) {
        this.reverb.destroy()
      }

      // Tell extending sounds that we're done here
      this.onDestroy()
    })

    return this
  },
  getRelativeVector: function () {
    // If coordinate space is already relative, just subtract the radius
    if (this.relative) {
      return this.vector.subtractRadius(this.radius)
    }

    // Otherwise transform global space to relative to syngen.position
    return this.vector
      .subtract(syngen.position.getVector())
      .subtractRadius(this.radius)
      .rotateQuaternion(syngen.position.getQuaternion().conjugate())
  },
  getVector: function () {
    return this.vector.clone()
  },
  setVector: function ({
    x = 0,
    y = 0,
    z = 0,
  }) {
    this.vector = syngen.tool.vector3d.create({
      x,
      y,
      z,
    })

    return this
  },
  update: function (...args) {
    // Allow user changes to vector before committing
    this.onUpdate(...args)

    // Update sends
    const relativeVector = this.getRelativeVector()

    this.binaural.update(relativeVector)

    if (this.reverb) {
      this.reverb.update(relativeVector)
    }

    return this
  },
  // Lifecycle hooks
  onConstruct: () => {},
  onDestroy: () => {},
  onUpdate: () => {},
}
