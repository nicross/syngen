/**
 * Provides an interface for binaural audio processing.
 * Typical use involves sending it a monophonic signal for processing and then routing its output to a bus.
 * This interface is mainly a wrapper for two {@link syngen.ear.monaural|monaural} processors.
 * @interface
 * @todo Document private members
 */
syngen.ear.binaural = {}

/**
 * Instantiates a new binaural processor.
 * @param {Object} [options]
 * @param {Number} [options.x=0]
 * @param {Number} [options.y=0]
 * @param {Number} [options.z=0]
 * @returns {syngen.ear.binaural}
 * @static
 */
syngen.ear.binaural.create = function (options) {
  return Object.create(this.prototype).construct(options)
}

syngen.ear.binaural.prototype = {
  defaults: {
    headWidth: 0.1524, // meters
    stereoWidth: Math.PI / 4, // radians
  },
  /**
   * Initializes the binaural processor.
   * @instance
   * @private
   */
  construct: function ({
    filterModel = syngen.ear.filterModel.head,
    gainModel = syngen.ear.gainModel.exponential,
    headWidth = this.defaults.headWidth,
    stereoWidth = this.defaults.stereoWidth,
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    const context = syngen.context()

    this.options = {
      headWidth,
      stereoWidth,
    }

    this.left = syngen.ear.monaural.create({
      filterModel,
      gainModel,
    })

    this.right = syngen.ear.monaural.create({
      filterModel,
      gainModel,
    })

    this.merger = context.createChannelMerger()
    this.left.to(this.merger, 0, 0)
    this.right.to(this.merger, 0, 1)

    this.update({
      x,
      y,
      z,
    })

    return this
  },
  /**
   * Prepares the instance for garbage collection.
   * @instance
   */
  destroy: function () {
    this.left.destroy()
    this.right.destroy()
    return this
  },
  /**
   * Connects `input` to this.
   * @instance
   * @param {AudioNode} input
   */
  from: function (input) {
    this.left.from(input)
    this.right.from(input)
    return this
  },
  /**
   * Connects this to `output`.
   * @instance
   * @param {AudioNode}
   */
  to: function (output) {
    this.merger.connect(output)
    return this
  },
  /**
   * Updates its inner monaural processors with `options`.
   * @instance
   * @param {syngen.tool.vector3d} relative
   */
  update: function (relative = {}) {
    if (!syngen.tool.vector3d.prototype.isPrototypeOf(relative)) {
      relative = syngen.tool.vector3d.create(relative)
    }

    this.left.update({
      normal: syngen.tool.vector3d.create(
        syngen.tool.vector2d.unitX().rotate(
          this.options.stereoWidth
        )
      ),
      relative: relative.add({
        y: -this.options.headWidth / 2,
      }),
    })

    this.right.update({
      normal: syngen.tool.vector3d.create(
        syngen.tool.vector2d.unitX().rotate(
          -this.options.stereoWidth
        )
      ),
      relative: relative.add({
        y: this.options.headWidth / 2,
      }),
    })

    return this
  },
}
