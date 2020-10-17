/**
 * Provides an interface for binaural audio processing.
 * Typical use involves sending it a monophonic signal for processing and then routing its output to a bus.
 * This interface is actually a small wrapper for two {@link syngen.audio.binaural.monaural|monaural} processors.
 * @interface
 * @todo Document private members
 */
syngen.audio.binaural = {}

/**
 * Instantiates a new binaural processor.
 * @param {Object} [options]
 * @param {Number} [options.x=0]
 * @param {Number} [options.y=0]
 * @param {Number} [options.z=0]
 * @returns {syngen.audio.binaural}
 * @static
 */
syngen.audio.binaural.create = function (options) {
  return Object.create(this.prototype).construct(options)
}

syngen.audio.binaural.prototype = {
  /**
   * Initializes the binaural processor.
   * @instance
   * @private
   */
  construct: function (options) {
    const context = syngen.audio.context()

    this.left = syngen.audio.binaural.monaural.create({
      pan: -1,
    })

    this.right = syngen.audio.binaural.monaural.create({
      pan: 1,
    })

    this.merger = context.createChannelMerger()
    this.left.to(this.merger, 0, 0)
    this.right.to(this.merger, 0, 1)

    this.update(options)

    return this
  },
  /**
   * Prepares the instance for garbage collection.
   * Immediately disconnects from all inputs and outputs.
   * @instance
   */
  destroy: function () {
    this.left.destroy()
    this.right.destroy()
    this.merger.disconnect()
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
   * @see syngen.audio.binaural.monaural#update
   * @todo Calculate coordinates and orientation of monaural processors here
   */
  update: function (options) {
    this.left.update(options)
    this.right.update(options)
    return this
  },
}
