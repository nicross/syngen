/**
 * The most basic prop that exists on the soundstage.
 * With its {@link syngen.prop.base.invent|invent} method, implementations can extend and create a hierarchy of prototypes with a variety of sounds and behaviors.
 * Instances _should_ be created and destroyed via {@link syngen.props}.
 * @augments syngen.utility.physical
 * @interface
 */
syngen.prop.base = {
  /**
   * Binaural processor for the prop.
   * @instance
   * @type {syngen.audio.binaural}
   */
  binaural: undefined,
  /**
   * Initializes the prop with `options` and fades in its volume.
   * Derivative props are discouraged from overriding this method.
   * Instead they should define an {@link syngen.prop.base#onConstruct|onConstruct} method.
   * @instance
   * @param {Object} [options={}]
   * @param {GainNode} [options.destination={@link syngen.audio.mixer.master.input|syngen.audio.mixer.master.input()}]
   * @param {Number} [options.radius]
   *   Defaults to the prototype's radius.
   * @param {String} [options.token={@link syngen.utility.uuid|syngen.utility.uuid()}]
   * @param {Number} [options.x=0]
   * @param {Number} [options.y=0]
   * @param {Number} [options.z=0]
   * @see syngen.prop.base#onConstruct
   * @see syngen.props.create
   */
  construct: function ({
    destination = syngen.audio.mixer.master.input(),
    radius = this.radius || 0,
    token = syngen.utility.uuid(),
    x = 0,
    y = 0,
    z = 0,
    ...options
  } = {}) {
    const context = syngen.audio.context()

    this.binaural = syngen.audio.binaural.create()
    this.instantiated = true
    this.output = context.createGain()
    this.radius = radius
    this.token = token
    this.x = x
    this.y = y
    this.z = z

    this.output.gain.value = syngen.const.zeroGain

    this.binaural.from(this.output)
    this.binaural.to(destination)

    if (this.reverb) {
      this.reverb = syngen.audio.mixer.send.reverb.create()
      this.reverb.from(this.output)
    }

    syngen.utility.physical.decorate(this)

    this.recalculate()
    this.onConstruct(options)

    syngen.audio.ramp.linear(this.output.gain, 1, this.fadeInDuration)

    return this
  },
  /**
   * Prepares the instance for garbage collection and fades out its volume.
   * Derivative props are discouraged from overriding this method.
   * Instead they should define an {@link syngen.prop.base#onConstruct|onDestroy} method.
   * @instance
   * @see syngen.prop.base#onDestroy
   * @see syngen.props.destroy
   */
  destroy: function () {
    syngen.audio.ramp.linear(this.output.gain, syngen.const.zeroGain, this.fadeOutDuration)

    setTimeout(() => {
      this.output.disconnect()
      this.binaural.destroy()

      if (this.reverb) {
        this.reverb.destroy()
      }

      this.onDestroy()
    }, (syngen.const.audioLookaheadTime + this.fadeOutDuration) * 1000)

    return this
  },
  /**
   * The distance of the prop relative to the observer's coordinates.
   * @instance
   * @type {Number}
   */
  distance: undefined,
  /**
   * Duration of fade in when instantiated.
   * @type {Number}
   */
  fadeInDuration: syngen.const.zeroTime,
  /**
   * Duration of fade out when destroyed.
   * @type {Number}
   */
  fadeOutDuration: syngen.const.zeroTime,
  /**
   * Indicates whether the prop has been instantiated.
   * @instance
   * @type {Boolean}
   */
  instantiated: false,
  /**
   * Invents a new prototype with `definition` that inherits the prototype from this prop.
   * @param {Object} definition
   * @returns {syngen.prop.base}
   * @static
   */
  invent: function (definition = {}) {
    if (typeof definition == 'function') {
      definition = definition(this)
    }

    return Object.setPrototypeOf({...definition}, this)
  },
  /**
   * Identifier of the prop type.
   * Instances are discouraged from modifying this.
   * @type {String}
   */
  name: 'base',
  /**
   * Called after a prop is instantiated.
   * Props should define this method to perform setup tasks after being constructed.
   * @instance
   * @see syngen.prop.base#construct
   */
  onConstruct: () => {},
  /**
   * Called before a prop is destroyed.
   * Props should define this method to perform tear tasks before being destroyed.
   * @instance
   * @see syngen.prop.base#destroy
   */
  onDestroy: () => {},
  /**
   * Called when a prop is updated.
   * Props should define this method to perform tasks every frame.
   * @instance
   * @see syngen.prop.base#update
   */
  onUpdate: () => {},
  /**
   * Main output for audio synthesis and playback.
   * This is not connected directly to the main audio destination; rather, it's routed through the binaural and reverb sends.
   * On creation and destruction its gain is ramped to fade in and out.
   * It's not recommended to modify its gain directly.
   * @instance
   * @type {GainNode}
   */
  output: undefined,
  /**
   * Radius of the prop, in meters.
   * @instance
   * @type {Number}
   */
  radius: 0,
  /**
   * Recalculates the prop's relative coordinates and distance, binaural circuit, and reverb send.
   * @instance
   * @see syngen.prop.base#binaural
   * @see syngen.prop.base#distance
   * @see syngen.prop.base#relative
   * @see syngen.prop.base#reverb
   */
  recalculate: function () {
    const positionQuaternion = syngen.position.getQuaternion(),
      positionVector = syngen.position.getVector()

    this.relative = this.vector()
      .subtract(positionVector)
      .subtractRadius(this.radius)
      .rotateQuaternion(positionQuaternion.conjugate())

    this.distance = this.relative.distance()

    this.binaural.update({...this.relative})

    if (this.reverb) {
      this.reverb.update({...this.relative})
    }

    return this
  },
  /**
   * Returns the rectangular prism surrounding the prop.
   * @instance
   * @returns {Object}
   */
  rect: function () {
    return {
      depth: this.radius * 2,
      height: this.radius * 2,
      width: this.radius * 2,
      x: this.x - this.radius,
      y: this.y - this.radius,
      z: this.y - this.radius,
    }
  },
  /**
   * The coordinates of the prop relative to the observer's coordinates and orientation.
   * @instance
   * @type {syngen.utility.vector3d}
   */
  relative: undefined,
  /**
   * Reverb send for the prop.
   * Implementations can disable reverb for certain prototypes by explicitly setting this to `false`.
   * @instance
   * @type {syngen.audio.mixer.send.reverb|Boolean}
   */
  reverb: true,
  /**
   * Universally unique identifier provided during instantiation.
   * @instance
   * @name syngen.prop.base#token
   * @type {String}
   */
   token: undefined,
  /**
   * Called every frame.
   * Derivative props are discouraged from overriding this method.
   * Instead they should define an {@link syngen.prop.base#onConstruct|onUpdate} method.
   * @instance
   * @see syngen.prop.base#onUpdate
   * @see syngen.props.update
   */
  update: function ({
    paused,
  } = {}) {
    this.onUpdate.apply(this, arguments)

    if (paused) {
      return this
    }

    this.updatePhysics()
    this.recalculate()

    return this
  },
}
